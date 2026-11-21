'use client';

import React from 'react';
import { Calendar } from 'primereact/calendar';
import {
  parseDateString,
  formatDateForApi,
  formatDateToDDMMYYYY,
  toInputDate,
  isDateValid,
} from '@/lib/date-utils';

export {
  parseDateString,
  formatDateForApi,
  formatDateToDDMMYYYY,
  toInputDate,
  isDateValid,
};

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
  maxDate?: Date | null;
  minDate?: Date | null;
  disabledDates?: Date[];
  yearNavigator?: boolean;
  yearRange?: string;
  clearable?: boolean;
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
  maxDate,
  minDate,
  disabledDates,
  yearNavigator,
  yearRange,
  clearable = true,
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

  const showClearIcon = clearable && !disabled && Boolean(value && String(value).trim() !== '');

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onChange('');
    calendarRef.current?.hide();
  };

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

    // Guard against clicks that originate inside the calendar overlay panel
    const overlay = calendarRef.current?.getOverlay();
    if (overlay && overlay.contains(e.target as Node)) {
      return;
    }

    // Always ensure the calendar is shown on click; never prematurely toggle hide
    calendarRef.current?.show();
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
        dateFormat={dateFormat}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        maxDate={maxDate || undefined}
        minDate={minDate || undefined}
        disabledDates={disabledDates}
        yearNavigator={yearNavigator}
        yearRange={yearRange}
        readOnlyInput={true}
        className="w-full"
        appendTo={resolvedAppendTo}
        touchUI={false}
        showOnFocus={true}
        baseZIndex={100000}
        panelStyle={{ zIndex: 100000 }}
        inputClassName={`w-full h-11 px-4 ${showClearIcon ? 'pr-14' : 'pr-10'} py-2.5 bg-white border ${
          hasError
            ? 'border-rose-400 focus:ring-1 focus:ring-rose-500 focus:border-rose-500 text-rose-900'
            : 'border-gray-200/90 hover:border-gray-300 focus:ring-1 focus:ring-[#175C46] focus:border-[#175C46] text-gray-800'
        } rounded-xl text-xs sm:text-sm placeholder-gray-400 focus:outline-none transition-all shadow-2xs cursor-pointer font-sans select-none`}
        panelClassName="rounded-xl shadow-lg border border-gray-100 font-sans !z-[100000]"
      />
      {showClearIcon && (
        <button
          type="button"
          onClick={handleClear}
          title="Clear date"
          aria-label="Clear date"
          className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full absolute right-8 top-1/2 -translate-y-1/2 cursor-pointer transition-colors z-10"
        >
          <svg
            className="w-3.5 h-3.5 stroke-current"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2.5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
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
