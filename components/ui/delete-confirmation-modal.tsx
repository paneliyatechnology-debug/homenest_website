'use client';

import React from 'react';
import { Dialog } from 'primereact/dialog';

export interface DeleteConfirmationModalProps {
  visible: boolean;
  onHide: () => void;
  title?: string;
  subtitle?: string;
  itemName?: string;
  itemType?: string; // e.g. "branch", "resident", "agreement"
  message?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  visible,
  onHide,
  title,
  subtitle = 'This action is permanent and cannot be undone',
  itemName,
  itemType = 'item',
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  loading = false,
  onConfirm,
}) => {
  const displayTitle =
    title || `Delete ${itemType.charAt(0).toUpperCase() + itemType.slice(1)}`;
  const displayConfirmLabel = confirmLabel || displayTitle;

  const defaultMessage = (
    <span>
      Are you sure you want to remove{' '}
      {itemName ? (
        <strong className="text-gray-900 font-semibold">{itemName}</strong>
      ) : (
        `this ${itemType}`
      )}
      ? All associated records will be removed.
    </span>
  );

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      modal
      draggable={false}
      resizable={false}
      className="w-full max-w-[460px] mx-4 rounded-2xl overflow-hidden shadow-2xl border-0"
      header={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 shadow-2xs">
            <svg
              className="w-5 h-5 stroke-current"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 tracking-tight leading-snug">
              {displayTitle}
            </h2>
            {subtitle && (
              <p className="text-xs text-gray-500 font-normal mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-5 pt-3">
        <div className="text-xs sm:text-sm text-gray-600 leading-relaxed">
          {message || defaultMessage}
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onHide}
            disabled={loading}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200/80 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl transition-colors shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin w-3.5 h-3.5 text-white"
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
                <span>Deleting...</span>
              </>
            ) : (
              displayConfirmLabel
            )}
          </button>
        </div>
      </div>
    </Dialog>
  );
};

