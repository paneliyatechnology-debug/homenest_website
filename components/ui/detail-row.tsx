'use client';

import React from 'react';

export interface DetailRowProps {
  label: React.ReactNode;
  value: React.ReactNode;
  className?: string;
  border?: boolean;
}

export const DetailRow: React.FC<DetailRowProps> = ({
  label,
  value,
  className = '',
  border = true,
}) => {
  return (
    <div
      className={`py-2.5 flex items-center justify-between text-xs sm:text-sm ${
        border ? 'border-b border-gray-100/90 last:border-b-0' : ''
      } ${className}`}
    >
      <span className="text-gray-500 font-medium">{label}</span>
      <span className="font-semibold text-gray-900 text-right">{value ?? '—'}</span>
    </div>
  );
};

export interface DetailGridProps {
  children: React.ReactNode;
  className?: string;
}

export const DetailGrid: React.FC<DetailGridProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`divide-y divide-gray-100/90 border-t border-b border-gray-100 py-1 ${className}`}>
      {children}
    </div>
  );
};
