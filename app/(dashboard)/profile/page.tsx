'use client';

import React from 'react';
import { ProfileForm } from '@/components/profile';

export default function AdminProfilePage() {
  return (
    <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 sm:py-6 max-w-[1600px] w-full mx-auto space-y-6 bg-[#F7F7F5] animate-fade-in font-sans">
      <ProfileForm />
    </main>
  );
}
