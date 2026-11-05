'use client';

import React from 'react';
import { BackButton } from './back-button';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  backTitle?: string;
  onBackClick?: () => void;
  action?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  backHref,
  backTitle,
  onBackClick,
  action,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${className}`}
    >
      <div className="flex items-center gap-3">
        {backHref && (
          <BackButton
            href={backHref}
            title={backTitle}
            onClick={onBackClick}
          />
        )}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs sm:text-sm text-gray-500 font-normal mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {action && <div className="shrink-0 self-start sm:self-auto">{action}</div>}
    </div>
  );
};

