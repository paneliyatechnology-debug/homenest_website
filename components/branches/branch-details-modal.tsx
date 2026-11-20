'use client';

import React from 'react';
import Image from 'next/image';
import { Dialog } from 'primereact/dialog';
import { Branch } from '@/types/branch';
import { StatusBadge, ModalHeader, DetailRow, DetailGrid } from '@/components/ui';

interface BranchDetailsModalProps {
  visible: boolean;
  onHide: () => void;
  branch: Branch | null;
  onEdit?: (branch: Branch) => void;
}

export const BranchDetailsModal: React.FC<BranchDetailsModalProps> = ({
  visible,
  onHide,
  branch,
  onEdit,
}) => {
  if (!branch) return null;

  const photoSrc = branch.branch_photo_url || branch.branch_photo;

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      modal
      draggable={false}
      resizable={false}
      className="w-full max-w-lg mx-4 rounded-2xl overflow-hidden shadow-2xl border-0"
      header={
        <ModalHeader
          title="Branch Details"
          subtitle={`${branch.name} • ${branch.location || 'No location set'}`}
          icon={
            <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          }
        />
      }
    >
      <div className="space-y-4 pt-2 text-xs sm:text-sm">
        {/* Photo Banner if available */}
        {photoSrc && (
          <div className="relative w-full h-44 rounded-xl overflow-hidden bg-gray-100 border border-gray-100">
            <Image
              src={photoSrc}
              alt={branch.name}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}

        {/* Room Metrics Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100 text-center">
            <span className="text-[11px] text-gray-400 block font-medium">Total Rooms</span>
            <span className="text-lg font-bold text-gray-900 mt-0.5 block">
              {branch.total_rooms ?? '—'}
            </span>
          </div>

          <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100/60 text-center">
            <span className="text-[11px] text-blue-600 block font-medium">Occupied</span>
            <span className="text-lg font-bold text-blue-700 mt-0.5 block">
              {branch.occupied_rooms ?? 0}
            </span>
          </div>

          <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100/60 text-center">
            <span className="text-[11px] text-emerald-600 block font-medium">Available</span>
            <span className="text-lg font-bold text-emerald-700 mt-0.5 block">
              {branch.available_rooms ?? branch.total_rooms ?? 0}
            </span>
          </div>
        </div>

        {/* Detailed Fields */}
        <DetailGrid>
          <DetailRow label="Branch Name" value={branch.name} />
          <DetailRow label="Location" value={branch.location || '—'} />
          <DetailRow
            label="Status"
            value={<StatusBadge variant="branch" status={branch.status} />}
          />
          {branch.pg_name && (
            <DetailRow label="PG Property" value={branch.pg_name} />
          )}
          {branch.created_at && (
            <DetailRow label="Created On" value={branch.created_at} />
          )}
        </DetailGrid>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3">
          <button
            type="button"
            onClick={onHide}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200/80 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
          {onEdit && (
            <button
              type="button"
              onClick={() => {
                onHide();
                onEdit(branch);
              }}
              className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-[#175C46] hover:bg-[#124B38] rounded-xl transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <span>Edit Branch</span>
            </button>
          )}
        </div>
      </div>
    </Dialog>
  );
};

