import React from 'react';

export interface ClearFilterButtonProps {
  onClick: () => void;
  title?: string;
  className?: string;
}

export function ClearFilterButton({
  onClick,
  title = 'Clear all filters',
  className = '',
}: ClearFilterButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`h-11 w-11 shrink-0 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/90 flex items-center justify-center transition-all cursor-pointer shadow-2xs group ${className}`}
    >
      <svg
        className="w-4.5 h-4.5 stroke-current transition-transform duration-200 group-hover:scale-110"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M13.013 3H2a1 1 0 0 0-.707 1.707l6.707 6.707v5.586a1 1 0 0 0 .293.707l3 3A1 1 0 0 0 13 20v-8.586l1.293-1.293" />
        <path d="m22 3-5 5" />
        <path d="m17 3 5 5" />
      </svg>
    </button>
  );
}
