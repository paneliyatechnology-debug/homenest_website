'use client';

import React from 'react';

export interface ModalHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  iconBg?: string;
  iconShape?: 'rounded' | 'circle';
  rightElement?: React.ReactNode;
  className?: string;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({
  title,
  subtitle,
  icon,
  iconBg = 'bg-[#E8F8F0] text-[#175C46]',
  iconShape = 'rounded',
  rightElement,
  className = '',
}) => {
  const shapeClass = iconShape === 'circle' ? 'rounded-full' : 'rounded-xl';

  return (
    <div className={`flex items-center justify-between gap-3 w-full ${className}`}>
      <div className="flex items-center gap-3 min-w-0">
        {icon && (
          <div
            className={`w-10 h-10 ${shapeClass} ${iconBg} flex items-center justify-center shrink-0 shadow-2xs`}
          >
            {icon}
          </div>
        )}
        <div className="min-w-0">
          {typeof title === 'string' ? (
            <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight leading-snug truncate">
              {title}
            </h2>
          ) : (
            title
          )}
          {subtitle && (
            <p className="text-xs text-gray-500 font-normal mt-0.5 truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {rightElement && <div className="shrink-0">{rightElement}</div>}
    </div>
  );
};
