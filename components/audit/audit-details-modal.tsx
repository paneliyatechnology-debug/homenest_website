'use client';

import React from 'react';
import { Dialog } from 'primereact/dialog';
import { AuditLog } from '@/types/audit';

interface AuditDetailsModalProps {
  visible: boolean;
  onHide: () => void;
  record: AuditLog | null;
}

export const AuditDetailsModal: React.FC<AuditDetailsModalProps> = ({
  visible,
  onHide,
  record,
}) => {
  if (!record) return null;

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      modal
      draggable={false}
      resizable={false}
      className="w-full max-w-xl mx-4 rounded-2xl overflow-hidden shadow-2xl border-0"
      header={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E8F8F0] text-[#175C46] flex items-center justify-center shrink-0 shadow-2xs">
            <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 tracking-tight leading-snug">
              Activity Log Details
            </h2>
            <p className="text-xs text-gray-500 font-normal mt-0.5">
              Record #{record.id} &bull; {record.timestamp || record.created_at || '—'}
            </p>
          </div>
        </div>
      }
    >
      <div className="space-y-4 pt-3 text-xs sm:text-sm">
        {/* User Card */}
        <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-100 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 block">Performed By</span>
            <span className="font-semibold text-gray-900 text-sm mt-0.5 block">
              {record.user_name || record.user}
            </span>
          </div>
          {record.ip_address && (
            <div className="text-right">
              <span className="text-xs text-gray-400 block">IP Address</span>
              <span className="font-mono text-xs text-gray-700 bg-white px-2 py-0.5 rounded border border-gray-200 mt-0.5 inline-block">
                {record.ip_address}
              </span>
            </div>
          )}
        </div>

        {/* Key-Value Details */}
        <div className="divide-y divide-gray-100/90 border-t border-b border-gray-100 py-1">
          <div className="py-2.5 flex items-center justify-between">
            <span className="text-gray-500 font-medium">Action</span>
            <span className="font-semibold text-gray-900">{record.action}</span>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <span className="text-gray-500 font-medium">Module</span>
            <span className="px-2.5 py-0.5 bg-[#E8F8F0] text-[#175C46] rounded-md font-semibold text-xs">
              {record.module}
            </span>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <span className="text-gray-500 font-medium">Branch / Property</span>
            <span className="text-gray-800 font-medium">
              {record.branch_name || record.pg_name || 'All Branches'}
            </span>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <span className="text-gray-500 font-medium">Timestamp</span>
            <span className="text-gray-700">{record.timestamp || record.created_at_formatted || record.created_at || '—'}</span>
          </div>

          {record.entity_type && (
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-gray-500 font-medium">Entity</span>
              <span className="text-gray-800 capitalize">
                {record.entity_type} {record.entity_id ? `(#${record.entity_id})` : ''}
              </span>
            </div>
          )}
        </div>

        {/* Detailed Description */}
        <div>
          <span className="text-xs font-semibold text-gray-700 block mb-1">Details & Description</span>
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-gray-700 text-xs sm:text-[13px] leading-relaxed">
            {record.details || record.description || 'No additional details logged.'}
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-3">
          <button
            type="button"
            onClick={onHide}
            className="px-5 py-2 text-xs sm:text-sm font-semibold text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200/80 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </Dialog>
  );
};

