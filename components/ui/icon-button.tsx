'use client';

import React from 'react';

export type IconButtonVariant = 'view' | 'edit' | 'delete' | 'default';
export type IconButtonSize = 'sm' | 'md';

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  title?: string;
  icon?: React.ReactNode;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      variant = 'default',
      size = 'sm',
      title,
      icon,
      className = '',
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    // Sizing
    const sizeClasses =
      size === 'md'
        ? 'w-9 h-9 rounded-xl shadow-2xs'
        : 'w-8 h-8 rounded-lg';

    // Variant color & interaction styling
    let variantClasses =
      'border border-gray-200 bg-white text-gray-600 hover:text-gray-900 hover:border-gray-300';

    if (variant === 'view') {
      variantClasses =
        'border border-gray-200 bg-white text-gray-600 hover:text-gray-900 hover:border-gray-300';
    } else if (variant === 'edit') {
      variantClasses =
        'border border-gray-200 bg-white text-gray-600 hover:text-[#175C46] hover:border-gray-300';
    } else if (variant === 'delete') {
      variantClasses =
        'border border-gray-200 bg-white text-gray-600 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50';
    }

    // Default built-in icons
    const renderDefaultIcon = () => {
      if (icon) return icon;
      if (children) return children;

      if (variant === 'view') {
        return (
          <svg
            className="w-4 h-4 stroke-current"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        );
      }

      if (variant === 'edit') {
        return (
          <svg
            className="w-3.5 h-3.5 stroke-current"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
            />
          </svg>
        );
      }

      if (variant === 'delete') {
        return (
          <svg
            className="w-4 h-4 stroke-current"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        );
      }

      return null;
    };

    return (
      <button
        ref={ref}
        type="button"
        title={title}
        aria-label={title}
        disabled={disabled}
        className={`inline-flex items-center justify-center transition-colors cursor-pointer select-none disabled:opacity-40 disabled:cursor-not-allowed ${sizeClasses} ${variantClasses} ${className}`}
        {...props}
      >
        {renderDefaultIcon()}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';

/**
 * Action Column Container for table action icon buttons
 */
export interface TableActionsProps {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export const TableActions: React.FC<TableActionsProps> = ({
  children,
  align = 'right',
  className = '',
}) => {
  const alignClass =
    align === 'center'
      ? 'justify-center'
      : align === 'left'
      ? 'justify-start'
      : 'justify-end';

  return (
    <div className={`inline-flex items-center gap-2 ${alignClass} ${className}`}>
      {children}
    </div>
  );
};

