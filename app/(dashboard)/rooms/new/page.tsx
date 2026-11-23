'use client';

import React from 'react';
import { RoomForm } from '@/components/rooms/room-form';

export default function NewRoomPage() {
  return (
    <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 max-w-[1200px] w-full mx-auto space-y-5 sm:space-y-6">
      <RoomForm mode="create" />
    </main>
  );
}

