'use client';

import React from 'react';

export interface TextInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  containerClassName?: string;
}

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  (
    {
      label,
      required = false,
      error,
      helperText,
      containerClassName = '',
      className = '',
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className={`space-y-1.5 w-full ${containerClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs sm:text-sm font-semibold text-gray-800 block"
          >
            {label} {required && <span className="text-[#175C46]">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          className={`w-full h-11 px-4 py-2.5 rounded-xl border text-xs sm:text-sm transition-all shadow-2xs font-sans placeholder-gray-400 focus:outline-none ${
            disabled
              ? 'bg-gray-50/80 border-gray-200/80 text-gray-500 cursor-not-allowed select-none'
              : error
              ? 'bg-white border-rose-400 text-gray-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
              : 'bg-white border-gray-200/90 hover:border-gray-300 text-gray-800 focus:border-[#175C46] focus:ring-1 focus:ring-[#175C46]'
          } ${className}`}
          {...props}
        />
        {error && <p className="text-[11px] text-rose-500 mt-0.5">{error}</p>}
        {!error && helperText && (
          <p className="text-[11px] text-gray-400 mt-0.5">{helperText}</p>
        )}
      </div>
    );
  }
);

TextInput.displayName = 'TextInput';

