'use client';

import React from 'react';
import { StaffForm } from '@/components/staff/staff-form';

export default function NewStaffPage() {
  return (
    <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 max-w-[1200px] w-full mx-auto space-y-5 sm:space-y-6">
      <StaffForm mode="create" />
    </main>
  );
}

