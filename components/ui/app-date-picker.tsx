'use client';

import React from 'react';
import { Calendar } from 'primereact/calendar';

interface AppDatePickerProps {
  id?: string;
  name?: string;
  value?: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  hasError?: boolean;
}

/**
 * Parses date string in either YYYY-MM-DD, DD-MM-YYYY, or ISO format into a Date object.
 */
export function parseDateString(str?: string | null): Date | null {
  if (!str || !str.trim()) return null;
  const clean = str.trim().split(' ')[0];
  const parts = clean.split('-');

  if (parts.length === 3) {
    // Format: YYYY-MM-DD
    if (parts[0].length === 4) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return isNaN(d.getTime()) ? null : d;
    }
    // Format: DD-MM-YYYY
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

export const AppDatePicker: React.FC<AppDatePickerProps> = ({
  id,
  name,
  value,
  onChange,
  placeholder = 'dd-mm-yyyy',
  required = false,
  disabled = false,
  className = '',
  hasError = false,
}) => {
  const dateObj = parseDateString(value);

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

  return (
    <div className={`relative w-full ${className}`}>
      <Calendar
        id={id}
        name={name}
        value={dateObj}
        onChange={handleChange}
        dateFormat="dd-mm-yy"
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className="w-full"
        inputClassName={`w-full h-11 px-4 pr-10 py-2.5 bg-white border ${
          hasError
            ? 'border-red-500 focus:ring-1 focus:ring-red-500 focus:border-red-500 text-red-900'
            : 'border-gray-200 focus:ring-1 focus:ring-[#175C46] focus:border-[#175C46] text-gray-900'
        } rounded-xl text-sm placeholder-gray-400 focus:outline-none transition-all font-sans`}
        panelClassName="rounded-xl shadow-lg border border-gray-100 font-sans"
      />
      <svg
        className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    </div>
  );
};
