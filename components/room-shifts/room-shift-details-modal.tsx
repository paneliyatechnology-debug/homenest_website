'use client';

import React from 'react';
import { Dialog } from 'primereact/dialog';
import { RoomShiftRequest } from '@/types/room-shift';
import { StatusBadge } from '@/components/ui';

interface RoomShiftDetailsModalProps {
  visible: boolean;
  onHide: () => void;
  shift: RoomShiftRequest | null;
  onOpenStatusModal?: (shift: RoomShiftRequest) => void;
}

export const RoomShiftDetailsModal: React.FC<RoomShiftDetailsModalProps> = ({
  visible,
  onHide,
  shift,
  onOpenStatusModal,
}) => {
  if (!shift) return null;

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      modal
      draggable={false}
      resizable={false}
      className="w-full max-w-2xl mx-4 rounded-2xl overflow-hidden shadow-2xl border-0 font-sans"
      header={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E8F8F0] text-[#175C46] flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
                Room Shift Request Details
              </h2>
              <StatusBadge status={shift.status} label={shift.status} />
            </div>
            <p className="text-xs text-gray-500 font-normal mt-0.5">
              Request #{shift.id} • Created on {shift.created_at}
            </p>
          </div>
        </div>
      }
      contentClassName="p-5 sm:p-6 space-y-5 bg-gray-50/50 max-h-[75vh] overflow-y-auto"
      footer={
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100 bg-white">
          <div>
            {onOpenStatusModal && (
              <button
                type="button"
                onClick={() => {
                  onHide();
                  onOpenStatusModal(shift);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#175C46] text-white hover:bg-[#124937] transition-all shadow-xs"
              >
                Review & Update Status
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onHide}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      }
    >
      {/* Resident Info Card */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-2xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
          Resident Information
        </h3>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#175C46] flex items-center justify-center font-bold text-base shrink-0 border border-emerald-100">
            {shift.resident?.name?.charAt(0)?.toUpperCase() || 'R'}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-gray-900 truncate">
              {shift.resident?.name}
            </h4>
            <p className="text-xs text-gray-500 truncate mt-0.5">
              {shift.resident?.phone || 'No phone'} • {shift.resident?.email || 'No email'}
            </p>
            {shift.branch_name && (
              <p className="text-[11px] text-[#175C46] font-medium mt-0.5">
                {shift.branch_name}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Room Transition Card */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-2xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
          Relocation Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
            <span className="text-[11px] font-semibold text-gray-400 uppercase block">
              Current Room
            </span>
            <span className="text-base font-bold text-gray-900 block mt-1">
              {shift.current_room?.room_no || 'Not Assigned'}
            </span>
            <span className="text-xs text-gray-500 capitalize block mt-0.5">
              {shift.current_room?.room_type ? `${shift.current_room.room_type} Room` : ''}
              {shift.current_room?.building_name ? ` • ${shift.current_room.building_name}` : ''}
              {shift.current_room?.floor_number ? ` (Floor ${shift.current_room.floor_number})` : ''}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-100">
            <span className="text-[11px] font-semibold text-[#175C46] uppercase block">
              Requested Room
            </span>
            <span className="text-base font-bold text-emerald-950 block mt-1">
              {shift.requested_room?.room_no || 'Any available room'}
            </span>
            <span className="text-xs text-emerald-700 capitalize block mt-0.5">
              {shift.requested_room?.room_type || shift.preferred_room_type || 'Standard'}
              {shift.requested_room?.building_name ? ` • ${shift.requested_room.building_name}` : ''}
              {shift.requested_room?.floor_number ? ` (Floor ${shift.requested_room.floor_number})` : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Reason & Notes Card */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-2xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
          Reason & Specifications
        </h3>
        <div>
          <span className="text-xs font-medium text-gray-500 block">Shift Reason:</span>
          <p className="text-sm font-semibold text-gray-800 mt-0.5">
            {shift.reason || 'No reason specified'}
          </p>
        </div>
        {(shift.additional_notes || shift.notes) && (
          <div className="pt-2 border-t border-gray-50">
            <span className="text-xs font-medium text-gray-500 block">Resident Notes:</span>
            <p className="text-xs text-gray-700 mt-1 leading-relaxed bg-gray-50 p-2.5 rounded-lg border border-gray-100">
              {shift.additional_notes || shift.notes}
            </p>
          </div>
        )}
        {shift.expected_move_date && (
          <div className="pt-2 border-t border-gray-50 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Expected Move Date:</span>
            <span className="text-xs font-bold text-gray-800">
              {shift.expected_move_date}
            </span>
          </div>
        )}
      </div>

      {/* Review / Admin Notes (if processed) */}
      {(shift.admin_notes || shift.reviewer_name) && (
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-2xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
            Administrative Review
          </h3>
          <div className="text-xs text-gray-700 space-y-1">
            {shift.reviewer_name && (
              <p>
                <span className="font-medium text-gray-500">Reviewed by:</span>{' '}
                <span className="font-semibold text-gray-900">{shift.reviewer_name}</span>
                {shift.reviewed_at && ` on ${shift.reviewed_at}`}
              </p>
            )}
            {shift.admin_notes && (
              <div className="mt-2 p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                <span className="text-[11px] font-medium text-gray-500 block mb-1">
                  Admin Resolution Note:
                </span>
                <p className="text-xs text-gray-800 font-normal leading-relaxed">
                  {shift.admin_notes}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </Dialog>
  );
};
