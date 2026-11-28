import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { ResidentCreateView } from '@/components/residents/resident-create-view';

export const metadata: Metadata = {
  title: 'Create Resident | MYPGPMS Admin',
  description: 'Add a new resident profile and assign room details.',
};

export default function CreateResidentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F7F7F5]" />}>
      <ResidentCreateView />
    </Suspense>
  );
}
