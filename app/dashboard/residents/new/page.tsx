import React from 'react';
import { Metadata } from 'next';
import { ResidentForm } from '@/components/residents/resident-form';

export const metadata: Metadata = {
  title: 'Create Resident | HomeNest Admin',
  description: 'Add a new resident profile and assign room details.',
};

export default function CreateResidentPage() {
  return <ResidentForm mode="create" />;
}
