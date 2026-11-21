'use client';

import React from 'react';
import { Dialog } from 'primereact/dialog';
import { AuditLog } from '@/types/audit';
import { ModalHeader, DetailRow, DetailGrid } from '@/components/ui';

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
        <ModalHeader
          title="Activity Log Details"
          subtitle={`Record #${record.id} • ${record.timestamp || record.created_at || '—'}`}
          icon={
            <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
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
        </div>

        {/* Key-Value Details */}
        <DetailGrid>
          <DetailRow label="Action" value={record.action} />
          <DetailRow
            label="Module"
            value={
              <span className="px-2.5 py-0.5 bg-[#E8F8F0] text-[#175C46] rounded-md font-semibold text-xs">
                {record.module}
              </span>
            }
          />
          <DetailRow
            label="Branch / Property"
            value={record.branch_name || record.pg_name || 'All Branches'}
          />
          <DetailRow
            label="Timestamp"
            value={record.timestamp || record.created_at_formatted || record.created_at || '—'}
          />
          {record.entity_type && (
            <DetailRow
              label="Entity"
              value={`${record.entity_type} ${record.entity_id ? `(#${record.entity_id})` : ''}`}
            />
          )}
        </DetailGrid>

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
