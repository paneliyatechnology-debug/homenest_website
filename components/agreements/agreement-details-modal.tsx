'use client';

import React from 'react';
import { Dialog } from 'primereact/dialog';
import { AgreementRecord } from '@/types/agreement';

interface AgreementDetailsModalProps {
  visible: boolean;
  onHide: () => void;
  record: AgreementRecord | null;
}

export const AgreementDetailsModal: React.FC<AgreementDetailsModalProps> = ({
  visible,
  onHide,
  record,
}) => {
  if (!record) return null;

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    switch (s) {
      case 'signed':
        return <span className="bg-[#E8F8F0] text-[#175C46] px-3 py-1 rounded-full text-xs font-semibold capitalize">Signed</span>;
      case 'pending_sign':
        return <span className="bg-[#FEF7E6] text-[#B06000] px-3 py-1 rounded-full text-xs font-semibold">Pending Sign</span>;
      case 'pending':
        return <span className="bg-[#FEF7E6] text-[#B06000] px-3 py-1 rounded-full text-xs font-semibold capitalize">Pending</span>;
      case 'draft':
        return <span className="bg-[#EFF6FF] text-[#2563EB] px-3 py-1 rounded-full text-xs font-semibold capitalize">Draft</span>;
      case 'expired':
        return <span className="bg-[#FDF2F2] text-[#DC2626] px-3 py-1 rounded-full text-xs font-semibold capitalize">Expired</span>;
      default:
        return <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-semibold capitalize">{status}</span>;
    }
  };

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#E8F8F0] text-[#175C46] flex items-center justify-center">
            <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 leading-tight">Agreement Details</h3>
            <p className="text-xs text-gray-500 font-normal">{record.agreement_no}</p>
          </div>
        </div>
      }
      className="w-full max-w-lg mx-4"
      contentClassName="p-5 sm:p-6"
    >
      <div className="space-y-4 text-xs sm:text-sm">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <span className="text-gray-500 font-medium">Status</span>
          <div>{getStatusBadge(record.status)}</div>
        </div>

        <div className="grid grid-cols-2 gap-4 py-1">
          <div>
            <span className="text-gray-400 block text-xs mb-0.5">Resident Name</span>
            <span className="font-semibold text-gray-900 text-sm">{record.resident_name}</span>
          </div>
          <div>
            <span className="text-gray-400 block text-xs mb-0.5">Agreement No.</span>
            <span className="font-semibold text-gray-900 text-sm">{record.agreement_no}</span>
          </div>
        </div>

        {(record.resident_email || record.resident_phone) && (
          <div className="grid grid-cols-2 gap-4 py-1">
            {record.resident_email && (
              <div>
                <span className="text-gray-400 block text-xs mb-0.5">Email</span>
                <span className="font-medium text-gray-800 text-sm break-all">{record.resident_email}</span>
              </div>
            )}
            {record.resident_phone && (
              <div>
                <span className="text-gray-400 block text-xs mb-0.5">Phone</span>
                <span className="font-medium text-gray-800 text-sm">{record.resident_phone}</span>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 py-1">
          <div>
            <span className="text-gray-400 block text-xs mb-0.5">Room No.</span>
            <span className="font-semibold text-gray-900 text-sm">{record.room_number ?? '—'}</span>
          </div>
          <div>
            <span className="text-gray-400 block text-xs mb-0.5">Room Type</span>
            <span className="font-semibold text-gray-900 text-sm capitalize">{record.room_type ?? '—'}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 py-1">
          <div>
            <span className="text-gray-400 block text-xs mb-0.5">Agreement Type</span>
            <span className="font-semibold text-gray-900 text-sm capitalize">{record.agreement_type}</span>
          </div>
          {record.pg_name && (
            <div>
              <span className="text-gray-400 block text-xs mb-0.5">PG / Branch</span>
              <span className="font-semibold text-gray-900 text-sm">{record.pg_name}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100">
          <div>
            <span className="text-gray-400 block text-xs mb-0.5">Start Date</span>
            <span className="font-medium text-gray-800 text-sm">{record.start_date}</span>
          </div>
          <div>
            <span className="text-gray-400 block text-xs mb-0.5">End Date</span>
            <span className="font-medium text-gray-800 text-sm">{record.end_date}</span>
          </div>
        </div>

        <div className="pt-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onHide}
            className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-700 text-xs sm:text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </Dialog>
  );
};
