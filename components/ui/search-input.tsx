'use client';

import React, { forwardRef } from 'react';

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'onChange' | 'value'> {
  value: string;
  onChange: (value: string, e?: React.ChangeEvent<HTMLInputElement>) => void;
  onClear?: () => void;
  label?: string;
  containerClassName?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      value,
      onChange,
      onClear,
      label,
      placeholder = 'Search...',
      size = 'md',
      containerClassName = '',
      className = '',
      disabled = false,
      id,
      onKeyDown,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    const handleClear = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      if (onClear) {
        onClear();
      } else {
        onChange('');
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape' && value) {
        e.preventDefault();
        if (onClear) {
          onClear();
        } else {
          onChange('');
        }
      }
      onKeyDown?.(e);
    };

    const sizeClass =
      size === 'sm'
        ? 'h-9 text-xs pl-9 pr-7'
        : size === 'lg'
        ? 'h-12 text-sm pl-11 pr-9'
        : 'h-11 text-xs sm:text-sm pl-10 pr-8';

    const iconLeftClass =
      size === 'sm'
        ? 'left-3 w-3.5 h-3.5'
        : size === 'lg'
        ? 'left-4 w-4.5 h-4.5'
        : 'left-3.5 w-4 h-4';

    return (
      <div className={`space-y-1.5 w-full ${containerClassName}`}>
        {label && (
          <label htmlFor={inputId} className="text-xs font-normal text-gray-500 block">
            {label}
          </label>
        )}
        <div className="relative w-full">
          <input
            ref={ref}
            id={inputId}
            type="text"
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value, e)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`w-full py-2 bg-white rounded-xl border border-gray-200/90 hover:border-gray-300 text-gray-800 placeholder-gray-400 outline-none focus:border-[#175C46] focus:ring-1 focus:ring-[#175C46] transition-all shadow-2xs ${sizeClass} ${
              disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200' : ''
            } ${className}`}
            {...props}
          />

          {/* Search Magnifying Glass Icon */}
          <svg
            className={`text-gray-400 absolute top-1/2 -translate-y-1/2 pointer-events-none stroke-current ${iconLeftClass}`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>

          {/* Clear Button (Visible only when text is entered) */}
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 font-bold text-sm w-4 h-4 flex items-center justify-center cursor-pointer transition-colors"
            >
              &times;
            </button>
          )}
        </div>
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';

