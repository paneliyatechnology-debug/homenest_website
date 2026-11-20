'use client';

import React from 'react';
import { Calendar } from 'primereact/calendar';

export interface AppDatePickerProps {
  id?: string;
  name?: string;
  value?: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  dateFormat?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  hasError?: boolean;
  appendTo?: 'self' | HTMLElement | undefined | null | (() => HTMLElement);
}

/**
 * Parses date string in either YYYY-MM-DD, DD-MM-YYYY, DD/MM/YYYY, or ISO format into a Date object.
 */
export function parseDateString(str?: string | null): Date | null {
  if (!str || !str.trim()) return null;
  const clean = str.trim().split(' ')[0];
  const parts = clean.includes('/') ? clean.split('/') : clean.split('-');

  if (parts.length === 3) {
    // Format: YYYY-MM-DD or YYYY/MM/DD
    if (parts[0].length === 4) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return isNaN(d.getTime()) ? null : d;
    }
    // Format: DD-MM-YYYY or DD/MM/YYYY
    if (parts[2].length === 4) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return isNaN(d.getTime()) ? null : d;
    }
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Formats a Date object to YYYY-MM-DD for backend API transport.
 */
export function formatDateForApi(d: Date | null): string {
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Formats any date string or Date object to DD/MM/YYYY
 */
export function formatDateToDDMMYYYY(dateInput?: string | Date | null): string {
  if (!dateInput) return '—';

  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return '—';
    const day = String(dateInput.getDate()).padStart(2, '0');
    const month = String(dateInput.getMonth() + 1).padStart(2, '0');
    const year = dateInput.getFullYear();
    return `${day}/${month}/${year}`;
  }

  const clean = String(dateInput).trim();
  if (!clean) return '—';

  // DD-MM-YYYY or DD/MM/YYYY with optional time
  const ddmmyyyyMatch = clean.match(/^(\d{2})[-/](\d{2})[-/](\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (ddmmyyyyMatch) {
    const day = ddmmyyyyMatch[1];
    const month = ddmmyyyyMatch[2];
    const year = ddmmyyyyMatch[3];
    const time = ddmmyyyyMatch[4] && ddmmyyyyMatch[5] ? ` ${ddmmyyyyMatch[4]}:${ddmmyyyyMatch[5]}` : '';
    return `${day}/${month}/${year}${time}`;
  }

  // YYYY-MM-DD or YYYY/MM/DD with optional time
  const yyyymmddMatch = clean.match(/^(\d{4})[-/](\d{2})[-/](\d{2})(?:[T\s](\d{1,2}):(\d{2}))?/);
  if (yyyymmddMatch) {
    const year = yyyymmddMatch[1];
    const month = yyyymmddMatch[2];
    const day = yyyymmddMatch[3];
    const time = yyyymmddMatch[4] && yyyymmddMatch[5] ? ` ${yyyymmddMatch[4]}:${yyyymmddMatch[5]}` : '';
    return `${day}/${month}/${year}${time}`;
  }

  const d = new Date(clean);
  if (!isNaN(d.getTime())) {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  return clean;
}

export const AppDatePicker: React.FC<AppDatePickerProps> = ({
  id,
  name,
  value,
  onChange,
  placeholder = 'dd/mm/yyyy',
  dateFormat = 'dd/mm/yy',
  required = false,
  disabled = false,
  className = '',
  hasError = false,
  appendTo,
}) => {
  const calendarRef = React.useRef<Calendar>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const dateObj = parseDateString(value);
  const resolvedAppendTo =
    appendTo !== undefined
      ? appendTo
      : typeof document !== 'undefined'
      ? document.body
      : undefined;

  const handleChange = (e: { value?: unknown }) => {
    if (!e.value) {
      onChange('');
      return;
    }
    if (e.value instanceof Date) {
      onChange(formatDateForApi(e.value));
      return;
    }
    if (typeof e.value === 'string') {
      const parsed = parseDateString(e.value);
      onChange(formatDateForApi(parsed));
    }
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    if (disabled) return;

    // Guard against React portal event bubbling from inside the datepicker panel
    if (!containerRef.current?.contains(e.target as Node)) {
      return;
    }

    const overlay = calendarRef.current?.getOverlay();
    const isOpen = Boolean(
      overlay &&
      document.body.contains(overlay) &&
      !overlay.classList.contains('p-connected-overlay-exit') &&
      !overlay.classList.contains('p-connected-overlay-exit-active')
    );

    if (isOpen) {
      calendarRef.current?.hide();
    } else {
      calendarRef.current?.show();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      calendarRef.current?.show();
    } else if (e.key === 'Escape') {
      calendarRef.current?.hide();
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full group ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${className}`}
      onClick={handleContainerClick}
      onKeyDown={handleKeyDown}
    >
      <Calendar
        ref={calendarRef}
        id={id ? `${id}-container` : undefined}
        inputId={id}
        name={name}
        value={dateObj}
        onChange={handleChange}
        onFocus={() => {
          if (!disabled) {
            calendarRef.current?.show();
          }
        }}
        dateFormat={dateFormat}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        readOnlyInput={true}
        className="w-full"
        appendTo={resolvedAppendTo}
        touchUI={false}
        showOnFocus={false}
        baseZIndex={100000}
        panelStyle={{ zIndex: 100000 }}
        inputClassName={`w-full h-11 px-4 pr-10 py-2.5 bg-white border ${
          hasError
            ? 'border-rose-400 focus:ring-1 focus:ring-rose-500 focus:border-rose-500 text-rose-900'
            : 'border-gray-200/90 hover:border-gray-300 focus:ring-1 focus:ring-[#175C46] focus:border-[#175C46] text-gray-800'
        } rounded-xl text-xs sm:text-sm placeholder-gray-400 focus:outline-none transition-all shadow-2xs cursor-pointer font-sans select-none`}
        panelClassName="rounded-xl shadow-lg border border-gray-100 font-sans !z-[100000]"
      />
      <div
        className="w-8 h-8 flex items-center justify-center text-gray-400 group-hover:text-[#175C46] absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none select-none transition-colors"
        aria-hidden="true"
      >
        <svg
          className="w-4 h-4 stroke-current"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    </div>
  );
};
