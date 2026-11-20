'use client';

import React from 'react';

export interface ModalFooterProps {
  onCancel?: () => void;
  onConfirm?: () => void;
  cancelLabel?: string;
  confirmLabel?: string;
  confirmVariant?: 'primary' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const ModalFooter: React.FC<ModalFooterProps> = ({
  onCancel,
  onConfirm,
  cancelLabel = 'Cancel',
  confirmLabel = 'Confirm',
  confirmVariant = 'primary',
  loading = false,
  disabled = false,
  className = '',
  children,
}) => {
  if (children) {
    return (
      <div className={`flex items-center justify-end gap-3 pt-4 border-t border-gray-100 ${className}`}>
        {children}
      </div>
    );
  }

  const confirmBg =
    confirmVariant === 'danger'
      ? 'bg-rose-600 hover:bg-rose-700 text-white'
      : 'bg-[#175C46] hover:bg-[#124635] text-white';

  return (
    <div className={`flex items-center justify-end gap-3 pt-4 border-t border-gray-100 ${className}`}>
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
        >
          {cancelLabel}
        </button>
      )}
      {onConfirm && (
        <button
          type="button"
          onClick={onConfirm}
          disabled={disabled || loading}
          className={`px-5 py-2 text-sm font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 ${confirmBg}`}
        >
          {loading && (
            <svg
              className="w-4 h-4 animate-spin shrink-0 text-white"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
          )}
          {confirmLabel}
        </button>
      )}
    </div>
  );
};
