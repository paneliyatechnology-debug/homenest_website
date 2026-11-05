'use client';

import React, { useState } from 'react';
import { InputText, InputTextProps } from 'primereact/inputtext';

export interface FormInputProps extends Omit<InputTextProps, 'id'> {
  id: string;
  label: string;
  error?: string;
  containerClassName?: string;
}

export const FormInput: React.FC<FormInputProps> = ({
  id,
  label,
  error,
  containerClassName = '',
  className = '',
  autoComplete = 'off',
  onFocus,
  onBlur,
  onMouseDown,
  onTouchStart,
  readOnly,
  ...props
}) => {
  // Start with readOnly enabled until user interacts to strictly block browser autofill on page load
  const [isWritable, setIsWritable] = useState(false);
  const effectiveReadOnly = readOnly !== undefined ? readOnly : !isWritable;

  const handleInteraction = () => {
    if (!isWritable) {
      setIsWritable(true);
    }
  };

  return (
    <div
      className={`flex flex-col gap-1.5 w-full ${containerClassName}`}
      onPointerDown={handleInteraction}
      onMouseDown={handleInteraction}
      onTouchStart={handleInteraction}
    >
      <label
        htmlFor={id}
        className="text-xs sm:text-[13px] font-medium text-[#175c46]"
      >
        {label}
      </label>
      <InputText
        id={id}
        aria-describedby={error ? `${id}-error` : undefined}
        autoComplete={autoComplete}
        readOnly={effectiveReadOnly}
        data-lpignore="true"
        data-1p-ignore="true"
        data-bwignore="true"
        onFocus={(e) => {
          handleInteraction();
          onFocus?.(e);
        }}
        onBlur={(e) => {
          onBlur?.(e);
        }}
        onMouseDown={(e) => {
          handleInteraction();
          onMouseDown?.(e);
        }}
        onTouchStart={(e) => {
          handleInteraction();
          onTouchStart?.(e);
        }}
        className={`w-full h-[44px] text-sm rounded-lg border border-gray-200 px-3.5 text-gray-800 placeholder:text-gray-400 focus:border-[#175c46] focus:ring-1 focus:ring-[#175c46] outline-none transition-all ${
          error ? 'border-red-500' : ''
        } ${className}`}
        {...props}
      />
      {error && (
        <span id={`${id}-error`} className="text-xs text-red-500 mt-0.5">
          {error}
        </span>
      )}
    </div>
  );
};
