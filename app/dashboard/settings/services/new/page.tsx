'use client';

import React from 'react';
import { LaundryForm } from '@/components/laundry';

export default function NewServiceRequestPage() {
  return (
    <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 sm:py-6 max-w-[1600px] w-full mx-auto bg-[#F7F7F5]">
      <LaundryForm />
    </main>
  );
}
