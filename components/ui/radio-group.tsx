'use client';

import React from 'react';

export interface RadioOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  label?: string;
  required?: boolean;
  name: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  label,
  required = false,
  name,
  options,
  value,
  onChange,
  error,
  className = '',
}) => {
  return (
    <div className={`space-y-2 pt-1 ${className}`}>
      {label && (
        <label className="text-xs sm:text-sm font-semibold text-gray-800 block">
          {label} {required && <span className="text-[#175C46]">*</span>}
        </label>
      )}

      <div className="flex flex-wrap items-center gap-6 pt-1">
        {options.map((option) => {
          const isChecked = value === option.value;
          return (
            <label
              key={option.value}
              className={`inline-flex items-center gap-2 cursor-pointer select-none ${
                option.disabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={isChecked}
                disabled={option.disabled}
                onChange={() => onChange(option.value)}
                className="w-4 h-4 text-[#175C46] focus:ring-[#175C46] border-gray-300 cursor-pointer accent-[#175C46]"
              />
              <span className="text-xs sm:text-sm font-medium text-gray-700">
                {option.label}
              </span>
            </label>
          );
        })}
      </div>

      {error && <p className="text-[11px] text-rose-500 mt-1">{error}</p>}
    </div>
  );
};

