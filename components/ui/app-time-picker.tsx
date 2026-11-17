'use client';

import React from 'react';
import { Calendar } from 'primereact/calendar';

export interface AppTimePickerProps {
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

export function parseTimeString(timeStr?: string | null): Date | null {
  if (!timeStr || !timeStr.trim()) return null;
  const clean = timeStr.trim();
  const match = clean.match(/^(\d{1,2}):(\d{2})(?::\d{2})?(?:\s*([AP]M))?$/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3] ? match[3].toUpperCase() : null;

  if (ampm === 'PM' && hours < 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;

  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return isNaN(d.getTime()) ? null : d;
}

export function formatTimeToString(date: Date | null): string {
  if (!date || isNaN(date.getTime())) return '';
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
}

export const AppTimePicker: React.FC<AppTimePickerProps> = ({
  id,
  name,
  value,
  onChange,
  placeholder = 'Select Entry time',
  required = false,
  disabled = false,
  className = '',
  hasError = false,
}) => {
  const timeObj = parseTimeString(value);

  const handleChange = (e: { value?: unknown }) => {
    if (!e.value) {
      onChange('');
      return;
    }
    if (e.value instanceof Date) {
      onChange(formatTimeToString(e.value));
      return;
    }
    if (typeof e.value === 'string') {
      const parsed = parseTimeString(e.value);
      onChange(formatTimeToString(parsed));
    }
  };

  return (
    <div className={`relative w-full ${className}`}>
      <Calendar
        id={id}
        name={name}
        value={timeObj}
        onChange={handleChange}
        timeOnly
        hourFormat="12"
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className="w-full"
        inputClassName={`w-full h-11 px-4 pr-10 py-2.5 bg-white border ${
          hasError
            ? 'border-rose-400 focus:ring-1 focus:ring-rose-500 focus:border-rose-500 text-rose-900'
            : 'border-gray-200/90 hover:border-gray-300 focus:ring-1 focus:ring-[#175C46] focus:border-[#175C46] text-gray-800'
        } rounded-xl text-xs sm:text-sm placeholder-gray-400 focus:outline-none transition-all shadow-2xs cursor-pointer font-sans`}
        panelClassName="rounded-xl shadow-lg border border-gray-100 font-sans p-2"
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
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </div>
  );
};
