'use client';

import React from 'react';
import { BranchForm } from '@/components/branches/branch-form';

export default function NewBranchPage() {
  return (
    <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 max-w-[1200px] w-full mx-auto space-y-5 sm:space-y-6 bg-[#F7F7F5]">
      <BranchForm mode="create" />
    </main>
  );
}

