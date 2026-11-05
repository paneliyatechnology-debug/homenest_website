'use client';

import React, { useState } from 'react';
import { Password, PasswordProps } from 'primereact/password';

export interface FormPasswordInputProps
  extends Omit<PasswordProps, 'id' | 'value' | 'onChange'> {
  id: string;
  label: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  containerClassName?: string;
  placeholder?: string;
  autoComplete?: string;
}

export const FormPasswordInput: React.FC<FormPasswordInputProps> = ({
  id,
  label,
  value,
  onChange,
  error,
  containerClassName = '',
  placeholder = 'Enter your password',
  autoComplete = 'new-password',
  disabled,
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
      <div className="w-full relative flex">
        <Password
          id={id}
          value={value ?? ''}
          onChange={onChange}
          toggleMask
          feedback={false}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete={autoComplete}
          readOnly={effectiveReadOnly}
          pt={{
            input: {
              readOnly: effectiveReadOnly,
              autoComplete: 'new-password',
              'data-lpignore': 'true',
              'data-1p-ignore': 'true',
              'data-bwignore': 'true',
            },
          }}
          style={{ width: '100%', display: 'flex' }}
          inputStyle={{ width: '100%', flex: '1 1 100%', minWidth: 0 }}
          className="w-full p-fluid"
          inputClassName={`w-full flex-1 h-[44px] text-sm rounded-lg border border-gray-200 px-3.5 pr-11 text-gray-800 placeholder:text-gray-400 focus:border-[#175c46] focus:ring-1 focus:ring-[#175c46] outline-none transition-all ${
            error ? 'border-red-500' : ''
          }`}
          {...props}
        />
      </div>
      {error && (
        <span id={`${id}-error`} className="text-xs text-red-500 mt-0.5">
          {error}
        </span>
      )}
    </div>
  );
};
