'use client';

import React from 'react';
import Link from 'next/link';

export interface BackButtonProps {
  href: string;
  title?: string;
  onClick?: () => void;
  className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  href,
  title = 'Go back',
  onClick,
  className = '',
}) => {
  return (
    <Link
      href={href}
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`text-gray-900 hover:text-gray-600 transition-colors inline-flex items-center justify-center shrink-0 mt-0.5 sm:mt-1 cursor-pointer ${className}`}
    >
      <svg
        className="w-6 h-6 stroke-current"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="2.25"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
        />
      </svg>
    </Link>
  );
};
