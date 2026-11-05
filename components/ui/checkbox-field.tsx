'use client';

import React from 'react';
import { Checkbox } from 'primereact/checkbox';

interface CheckboxFieldProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
}

export const CheckboxField: React.FC<CheckboxFieldProps> = ({
  id,
  label,
  checked,
  onChange,
  className = '',
  disabled = false,
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Checkbox
        inputId={id}
        checked={checked}
        onChange={(e) => onChange(!!e.checked)}
        disabled={disabled}
      />
      <label
        htmlFor={id}
        className="text-xs sm:text-[13px] text-gray-800 font-normal cursor-pointer select-none"
      >
        {label}
      </label>
    </div>
  );
};
