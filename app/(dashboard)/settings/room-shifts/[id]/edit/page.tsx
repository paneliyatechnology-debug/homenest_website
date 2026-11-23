'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { RoomShiftRequest } from '@/types/room-shift';
import { roomShiftService } from '@/services/room-shift.service';
import { RoomShiftForm } from '@/components/room-shifts';
import { BrandLoader } from '@/components/ui';

export default function EditRoomShiftPage() {
  const params = useParams();
  const router = useRouter();

  const [shift, setShift] = useState<RoomShiftRequest | null>(null);
  const [loading, setLoading] = useState(true);

  const shiftId = params?.id ? String(params.id) : undefined;

  useEffect(() => {
    if (!shiftId) {
      router.push('/settings/room-shifts');
      return;
    }

    let isMounted = true;
    roomShiftService
      .getShiftById(shiftId)
      .then((data) => {
        if (!isMounted) return;
        if (!data) {
          router.push('/settings/room-shifts');
          return;
        }
        setShift(data);
        setLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        router.push('/settings/room-shifts');
      });

    return () => {
      isMounted = false;
    };
  }, [shiftId, router]);

  if (loading) {
    return (
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 sm:py-6 max-w-[1600px] w-full mx-auto flex items-center justify-center min-h-[450px]">
        <BrandLoader message="Loading room shift request details..." />
      </main>
    );
  }

  if (!shift) {
    return (
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 sm:py-6 max-w-[1600px] w-full mx-auto text-center py-20">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Room Shift Request Not Found</h2>
        <Link
          href="/settings/room-shifts"
          className="text-xs font-semibold text-[#175C46] hover:underline"
        >
          Return to Room Shift Requests
        </Link>
      </main>
    );
  }

  return (
    <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 sm:py-6 max-w-[1600px] w-full mx-auto bg-[#F7F7F5]">
      <RoomShiftForm
        mode="edit"
        shiftId={shift.id}
        initialData={shift}
        key={shift.id}
      />
    </main>
  );
}
