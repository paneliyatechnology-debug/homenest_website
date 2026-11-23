'use client';

import React from 'react';
import { Dialog } from 'primereact/dialog';
import { ModalHeader } from './modal-header';

export interface DeleteDetailItem {
  label: string;
  value: React.ReactNode;
}

export interface DeleteConfirmationModalProps {
  visible: boolean;
  onHide: () => void;
  title?: string;
  subtitle?: string;
  itemName?: string;
  itemType?: string; // e.g. "branch", "resident", "room"
  message?: React.ReactNode;
  details?: DeleteDetailItem[];
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
  const displayConfirmLabel = confirmLabel || 'Delete';

  const defaultMessage = (
    <span>
      Are you sure you want to remove{' '}
      {itemName ? (
        <strong className="text-gray-900 font-semibold">{itemName}</strong>
      ) : (
        `this ${itemType}`
      )}
      ? All associated records will be affected.
    </span>
  );

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      modal
      draggable={false}
      resizable={false}
      className="w-full max-w-[480px] mx-4 rounded-2xl overflow-hidden shadow-2xl border-0"
      header={
        <ModalHeader
          title={displayTitle}
          subtitle={subtitle}
          iconBg="bg-rose-50 text-rose-600"
          icon={
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
          }
        />
      }
    >
      <div className="space-y-4 pt-2">
        {/* Confirmation Message (Only message in middle section) */}
        <div className="text-xs sm:text-sm text-gray-600 leading-relaxed">
          {message || defaultMessage}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onHide}
            disabled={loading}
            className="w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm font-semibold text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200/80 rounded-xl transition-colors cursor-pointer disabled:opacity-50 text-center"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#E11D48] hover:bg-[#BE123C] active:bg-[#9F1239] active:scale-[0.99] rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
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
