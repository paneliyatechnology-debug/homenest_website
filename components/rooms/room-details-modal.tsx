'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Dialog } from 'primereact/dialog';
import { Room } from '@/types/room';
import { roomService } from '@/services/room.service';
import { StatusBadge } from '@/components/ui';

interface RoomDetailsModalProps {
  visible: boolean;
  onHide: () => void;
  roomId?: number | string | null;
  room?: Room | null;
}

export const RoomDetailsModal: React.FC<RoomDetailsModalProps> = ({
  visible,
  onHide,
  roomId,
  room,
}) => {
  const targetId = roomId ?? room?.id ?? null;

  const [prevTargetId, setPrevTargetId] = useState<number | string | null>(null);
  const [fetchedRoom, setFetchedRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Synchronize state during render phase when visible / targetId changes
  if (visible && targetId !== prevTargetId) {
    setPrevTargetId(targetId);
    setFetchedRoom(null);
    setLoading(true);
    setError(null);
  } else if (!visible && prevTargetId !== null) {
    setPrevTargetId(null);
    setFetchedRoom(null);
    setLoading(false);
    setError(null);
  }

  // Always fetch fresh room details from the single room GET API whenever the modal opens
  useEffect(() => {
    if (!visible || !targetId) return;

    let isMounted = true;

    roomService
      .getRoomById(targetId)
      .then((data) => {
        if (!isMounted) return;
        setFetchedRoom(data);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setLoading(false);
        setError(err?.message || 'Failed to load room details.');
      });

    return () => {
      isMounted = false;
    };
  }, [visible, targetId]);

  if (!visible) return null;

  const displayRoom = fetchedRoom;
  const photoUrl = displayRoom?.image_url || displayRoom?.image;

  const titleName = displayRoom?.room_no
    ? `Room ${displayRoom.room_no}`
    : room?.room_no
    ? `Room ${room.room_no}`
    : 'Room Details';

  const roomTypeLabel =
    displayRoom?.sharing_label ||
    displayRoom?.room_type?.replace(/_/g, ' ') ||
    room?.sharing_label ||
    room?.room_type?.replace(/_/g, ' ') ||
    'Room';

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#E8F8F0] text-[#175C46] flex items-center justify-center font-bold text-sm">
            <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v11m0-4h18m0-7v11M3 11a3 3 0 013-3h3a3 3 0 013 3v3H3v-3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 leading-tight">{titleName}</h3>
            <p className="text-xs text-gray-500 capitalize">{roomTypeLabel}</p>
          </div>
        </div>
      }
      style={{ width: '480px' }}
      modal
      className="p-fluid rounded-2xl overflow-hidden font-sans"
    >
      {loading ? (
        <div className="py-14 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-[#175C46]/20 border-t-[#175C46] rounded-full animate-spin" />
          <p className="text-xs text-gray-500 font-medium">Loading room details...</p>
        </div>
      ) : error || !displayRoom ? (
        <div className="py-10 text-center space-y-2">
          <p className="text-xs text-rose-500 font-medium">
            {error || 'Room details could not be found.'}
          </p>
          <button
            type="button"
            onClick={onHide}
            className="px-4 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      ) : (
        <div className="space-y-4 pt-1">
          {/* Room Banner Photo */}
          <div className="w-full h-44 rounded-xl overflow-hidden bg-gray-100 relative border border-gray-100 shadow-2xs">
            {photoUrl ? (
              <Image
                src={photoUrl}
                alt={displayRoom.room_no}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-[#EBF7F2] text-[#175C46] gap-2">
                <svg className="w-10 h-10 stroke-current opacity-80" fill="none" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v11m0-4h18m0-7v11M3 11a3 3 0 013-3h3a3 3 0 013 3v3H3v-3z" />
                </svg>
                <span className="text-xs font-semibold">Room {displayRoom.room_no}</span>
              </div>
            )}
          </div>

          {/* Quick Info Header */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50/70 border border-gray-100">
            <div>
              <span className="text-sm font-bold text-gray-900 block">
                Room {displayRoom.room_no}
              </span>
              <span className="text-xs text-gray-500 capitalize">
                {displayRoom.room_type} Sharing &bull; Floor {displayRoom.floor_number ?? displayRoom.floor_name ?? '—'}
              </span>
            </div>
            <StatusBadge status={displayRoom.status} />
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-white rounded-xl border border-gray-100 space-y-1">
              <span className="text-gray-400 font-medium block">Building</span>
              <span className="font-semibold text-gray-800 block truncate">
                {displayRoom.building_name || '—'}
              </span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-gray-100 space-y-1">
              <span className="text-gray-400 font-medium block">Branch</span>
              <span className="font-semibold text-gray-800 block truncate">
                {displayRoom.branch_name || displayRoom.pg_name || '—'}
              </span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-gray-100 space-y-1">
              <span className="text-gray-400 font-medium block">Capacity</span>
              <span className="font-semibold text-gray-800 block">
                {displayRoom.capacity} {displayRoom.capacity === 1 ? 'Bed' : 'Beds'}
              </span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-gray-100 space-y-1">
              <span className="text-gray-400 font-medium block">Room Size</span>
              <span className="font-semibold text-gray-800 block">
                {displayRoom.size || '12 m*2'}
              </span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-gray-100 space-y-1">
              <span className="text-gray-400 font-medium block">Current Occupant</span>
              <span className="font-semibold text-gray-800 block truncate">
                {displayRoom.current_occupant_name || 'None'}
              </span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-gray-100 space-y-1">
              <span className="text-gray-400 font-medium block">Available Beds</span>
              <span className="font-semibold text-gray-800 block">
                {displayRoom.available_beds ?? (displayRoom.status === 'occupied' ? 0 : displayRoom.capacity)}
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={onHide}
              className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </Dialog>
  );
};

