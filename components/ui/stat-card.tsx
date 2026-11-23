'use client';

import React from 'react';

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
  iconShape?: 'circle' | 'rounded';
  labelColor?: string;
  valueColor?: string;
  subtext?: React.ReactNode;
  loading?: boolean;
  className?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = React.memo(({
  label,
  value,
  icon,
  iconBg = 'bg-[#E8F8F0]',
  iconColor = 'text-[#175C46]',
  iconShape = 'circle',
  labelColor = 'text-gray-500',
  valueColor = 'text-gray-900',
  subtext,
  loading = false,
  className = '',
  onClick,
}) => {
  // Combine iconBg and iconColor cleanly if iconBg already contains a text class or not
  const badgeClasses = iconBg.includes('text-')
    ? iconBg
    : `${iconBg} ${iconColor}`;

  const shapeClass = iconShape === 'rounded' ? 'rounded-xl' : 'rounded-full';

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-gray-100/90 px-4 py-4 sm:px-5 sm:py-4.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center gap-4 hover:shadow-xs transition-all min-w-0 ${
        onClick ? 'cursor-pointer hover:border-gray-200' : ''
      } ${className}`}
    >
      {/* Icon Badge */}
      <div
        className={`w-11 h-11 sm:w-12 sm:h-12 ${shapeClass} ${badgeClasses} flex items-center justify-center shrink-0 shadow-2xs`}
      >
        {icon}
      </div>

      {/* Label, Value & Subtext */}
      <div className="min-w-0 flex flex-col justify-center flex-1">
        <span className={`text-[12px] sm:text-[13px] font-medium tracking-tight truncate ${labelColor}`}>
          {label}
        </span>
        {loading ? (
          <div className="h-6 w-16 bg-gray-100 rounded-md animate-pulse mt-1" />
        ) : (
          <h3 className={`text-xl sm:text-2xl font-bold tracking-tight mt-0.5 leading-none ${valueColor}`}>
            {value}
          </h3>
        )}
        {subtext && (
          <span className="text-[11px] text-gray-400 mt-1 truncate">
            {subtext}
          </span>
        )}
      </div>
    </div>
  );
});
StatCard.displayName = 'StatCard';

export interface StatCardGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4 | 5;
  className?: string;
}

export const StatCardGrid: React.FC<StatCardGridProps> = React.memo(({
  children,
  columns = 4,
  className = '',
}) => {
  const colClass =
    columns === 2
      ? 'grid-cols-1 sm:grid-cols-2'
      : columns === 3
      ? 'grid-cols-1 sm:grid-cols-3'
      : columns === 5
      ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'
      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';

  return (
    <div className={`grid ${colClass} gap-3 sm:gap-4 w-full ${className}`}>
      {children}
    </div>
  );
});
StatCardGrid.displayName = 'StatCardGrid';
