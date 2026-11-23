'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Room } from '@/types/room';
import { roomService } from '@/services/room.service';
import { RoomForm } from '@/components/rooms/room-form';
import { BrandLoader } from '@/components/ui';

export default function EditRoomPage() {
  const params = useParams();
  const router = useRouter();

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);

  const roomId = Number(params?.id);

  useEffect(() => {
    if (!roomId || Number.isNaN(roomId)) {
      router.push('/rooms');
      return;
    }

    let isMounted = true;
    roomService
      .getRoomById(roomId)
      .then((data) => {
        if (!isMounted) return;
        if (!data) {
          router.push('/rooms');
          return;
        }
        setRoom(data);
        setLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        router.push('/rooms');
      });

    return () => {
      isMounted = false;
    };
  }, [roomId, router]);

  if (loading) {
    return (
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 max-w-[1200px] w-full mx-auto flex items-center justify-center min-h-[450px]">
        <BrandLoader message="Loading room details..." />
      </main>
    );
  }

  if (!room) {
    return (
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 max-w-[1200px] w-full mx-auto text-center py-20">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Room Not Found</h2>
        <Link
          href="/rooms"
          className="text-xs font-semibold text-[#175C46] hover:underline"
        >
          Return to Room Inventory
        </Link>
      </main>
    );
  }

  return (
    <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 max-w-[1200px] w-full mx-auto space-y-5 sm:space-y-6">
      <RoomForm mode="edit" initialData={room} key={room.id} />
    </main>
  );
}

