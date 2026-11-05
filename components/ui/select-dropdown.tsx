'use client';

import React from 'react';

export interface DropdownOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export interface DropdownProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  required?: boolean;
  options?: DropdownOption[];
  placeholder?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
  rightBadge?: React.ReactNode;
}

export const Dropdown = React.forwardRef<HTMLSelectElement, DropdownProps>(
  (
    {
      label,
      required = false,
      options,
      placeholder,
      error,
      helperText,
      containerClassName = '',
      className = '',
      children,
      disabled,
      id,
      value,
      rightBadge,
      ...props
    },
    ref
  ) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    const isPlaceholderSelected = placeholder && (value === '' || value === undefined);

    return (
      <div className={`space-y-1.5 w-full ${containerClassName}`}>
        {/* Label & Optional Right Badge */}
        {(label || rightBadge) && (
          <div className="flex items-center justify-between">
            {label && (
              <label
                htmlFor={selectId}
                className="text-xs sm:text-sm font-semibold text-gray-800 block"
              >
                {label} {required && <span className="text-[#175C46]">*</span>}
              </label>
            )}
            {rightBadge && <div>{rightBadge}</div>}
          </div>
        )}

        {/* Relative Select Wrapper with Custom Chevron */}
        <div className="relative w-full">
          <select
            ref={ref}
            id={selectId}
            value={value}
            disabled={disabled}
            className={`w-full h-11 pl-4 pr-10 py-2.5 rounded-xl border text-xs sm:text-sm transition-all shadow-2xs font-sans appearance-none cursor-pointer outline-none ${
              isPlaceholderSelected ? 'text-gray-400' : 'text-gray-800'
            } ${
              disabled
                ? 'bg-gray-50/80 border-gray-200/80 text-gray-400 cursor-not-allowed select-none'
                : error
                ? 'bg-white border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                : 'bg-white border-gray-200/90 hover:border-gray-300 focus:border-[#175C46] focus:ring-1 focus:ring-[#175C46]'
            } ${className}`}
            {...props}
          >
            {placeholder && (
              <option value="" disabled className="text-gray-400">
                {placeholder}
              </option>
            )}

            {/* Render options from props if provided */}
            {options
              ? options.map((opt) => (
                  <option
                    key={String(opt.value)}
                    value={opt.value}
                    disabled={opt.disabled}
                    className="text-gray-800 bg-white py-1"
                  >
                    {opt.label}
                  </option>
                ))
              : children}
          </select>

          {/* Styled Chevron Icon */}
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center text-gray-400">
            <svg
              className="w-4 h-4 stroke-current transition-transform duration-200"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Validation Error Message */}
        {error && <p className="text-[11px] text-rose-500 mt-1">{error}</p>}

        {/* Helper Text */}
        {!error && helperText && (
          <p className="text-[11px] text-gray-400 mt-1">{helperText}</p>
        )}
      </div>
    );
  }
);

Dropdown.displayName = 'Dropdown';

export const SelectDropdown = Dropdown;

