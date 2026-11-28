'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { RoomShiftRequest } from '@/types/room-shift';
import { roomShiftService } from '@/services/room-shift.service';
import { roomService } from '@/services/room.service';
import { Room } from '@/types/room';
import { ModalHeader } from '@/components/ui';

interface RoomShiftStatusModalProps {
  visible: boolean;
  onHide: () => void;
  shift: RoomShiftRequest | null;
  onSuccess: () => void;
}

interface RoomShiftStatusFormProps {
  shift: RoomShiftRequest;
  onHide: () => void;
  onSuccess: () => void;
}

const RoomShiftStatusForm: React.FC<RoomShiftStatusFormProps> = ({
  shift,
  onHide,
  onSuccess,
}) => {
  const initialStatus: 'approved' | 'rejected' =
    shift.status === 'rejected' ? 'rejected' : 'approved';

  const [status, setStatus] = useState<'approved' | 'rejected'>(initialStatus);
  const [assignedRoomId, setAssignedRoomId] = useState<number | ''>(
    shift.requested_room?.id || ''
  );
  const [adminNotes, setAdminNotes] = useState(shift.admin_notes || '');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    roomService
      .getRooms({
        branch_id: shift.branch_id || undefined,
        limit: 50,
      })
      .then((res) => {
        if (!isMounted) return;
        setRooms(res.data || []);
      })
      .catch(() => {
        if (!isMounted) return;
        setRooms([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [shift.branch_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      const targetRoom = assignedRoomId ? Number(assignedRoomId) : (shift.requested_room?.id || undefined);
      if (status === 'approved' && !targetRoom) {
        setError('Please select an assigned room to approve the room shift.');
        setSubmitting(false);
        return;
      }

      await roomShiftService.updateShiftStatus(shift.id, {
        status,
        assigned_room_id: targetRoom,
        admin_notes: adminNotes.trim() || undefined,
      });

      onSuccess();
      onHide();
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Failed to update shift status';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 text-xs bg-red-50 text-red-600 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {/* Current Context */}
      <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between text-xs">
        <div>
          <span className="text-gray-400 block">Current Room:</span>
          <span className="font-semibold text-gray-800">
            {shift.current_room?.room_no || 'Unassigned'}
          </span>
        </div>
        <div className="text-gray-400 font-bold">➔</div>
        <div>
          <span className="text-gray-400 block">Requested Room:</span>
          <span className="font-semibold text-emerald-700">
            {shift.requested_room?.room_no || 'Any room'}
          </span>
        </div>
      </div>

      {/* Status Option */}
      <div>
        <label className="text-xs font-semibold text-gray-700 block mb-2">
          Decision Status <span className="text-red-500 font-bold">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setStatus('approved')}
            className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
              status === 'approved'
                ? 'bg-[#E8F8F0] border-[#175C46] text-[#175C46] shadow-xs'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            Approved
          </button>
          <button
            type="button"
            onClick={() => setStatus('rejected')}
            className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
              status === 'rejected'
                ? 'bg-[#FDF2F2] border-[#DC2626] text-[#DC2626] shadow-xs'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-600" />
            Rejected
          </button>
        </div>
      </div>

      {/* Assigned Room if Approved */}
      {status === 'approved' && (
        <div>
          <label className="text-xs font-semibold text-gray-700 block mb-1">
            Assign to Room
          </label>
          <select
            value={assignedRoomId}
            onChange={(e) => setAssignedRoomId(e.target.value ? Number(e.target.value) : '')}
            className="w-full h-10 px-3 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#175C46] focus:border-[#175C46]"
            disabled={loading}
          >
            <option value="">Select Assigned Room</option>
            {shift.requested_room?.id &&
              !rooms.some((r) => r.id === shift.requested_room?.id) && (
                <option value={shift.requested_room.id}>
                  {shift.requested_room.room_no} ({shift.requested_room.room_type || 'standard'})
                </option>
              )}
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.room_no || `Room #${r.id}`} ({r.room_type || 'standard'})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Admin Notes */}
      <div>
        <label className="text-xs font-semibold text-gray-700 block mb-1">
          Admin Resolution Notes
        </label>
        <textarea
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          rows={3}
          placeholder="Add explanation or details for this shift decision..."
          className="w-full p-3 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#175C46] focus:border-[#175C46] resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
        <button
          type="button"
          onClick={onHide}
          disabled={submitting}
          className="px-4 py-2 text-xs font-medium rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#175C46] text-white hover:bg-[#124937] transition-all disabled:opacity-50 shadow-xs"
        >
          {submitting ? 'Saving...' : 'Confirm Decision'}
        </button>
      </div>
    </form>
  );
};

export const RoomShiftStatusModal: React.FC<RoomShiftStatusModalProps> = ({
  visible,
  onHide,
  shift,
  onSuccess,
}) => {
  if (!shift) return null;

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      modal
      draggable={false}
      resizable={false}
      className="w-full max-w-lg mx-4 rounded-2xl overflow-hidden shadow-2xl border-0 font-sans"
      header={
        <ModalHeader
          title="Process Room Shift Status"
          subtitle={`Review and update decision for ${shift.resident?.name} (Shift #${shift.id})`}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      }
      contentClassName="p-5 sm:p-6 bg-white"
    >
      <RoomShiftStatusForm
        key={`${shift.id}-${visible}`}
        shift={shift}
        onHide={onHide}
        onSuccess={onSuccess}
      />
    </Dialog>
  );
};
