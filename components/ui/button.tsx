'use client';

import React from 'react';
import { Button as PrimeButton, ButtonProps as PrimeButtonProps } from 'primereact/button';

export interface ButtonProps extends PrimeButtonProps {
  variant?: 'primary' | 'outline' | 'text';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  fullWidth = false,
  className = '',
  loading = false,
  children,
  label,
  ...props
}) => {
  let variantStyles = '';

  if (variant === 'primary') {
    variantStyles =
      'bg-[#175c46] hover:bg-[#124b38] active:bg-[#0e3b2c] text-white border-none shadow-none';
  } else if (variant === 'outline') {
    variantStyles =
      'bg-white hover:bg-gray-50 active:bg-gray-100 text-[#175c46] border border-gray-200 hover:border-gray-300 font-medium';
  } else if (variant === 'text') {
    variantStyles =
      'bg-transparent hover:bg-gray-50 text-[#175c46] border-none p-0';
  }

  const baseStyles =
    'h-[44px] rounded-lg text-sm font-medium transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none';
  const widthStyles = fullWidth ? 'w-full' : '';

  return (
    <PrimeButton
      className={`${baseStyles} ${variantStyles} ${widthStyles} ${className}`}
      loading={loading}
      label={label}
      {...props}
    >
      {children}
    </PrimeButton>
  );
};
