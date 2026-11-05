'use client';

import React, { useRef } from 'react';
import { Toast } from 'primereact/toast';
import { AgreementForm } from '@/components/agreements/agreement-form';
import { PageHeader } from '@/components/ui';

export default function CreateAgreementPage() {
  const toastRef = useRef<Toast>(null);

  return (
    <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 max-w-[1600px] w-full mx-auto space-y-6">
      <Toast ref={toastRef} position="top-right" />

      {/* Top Header with minimal Back arrow button matching Figma image */}
      <PageHeader
        title="Create New Agreement"
        subtitle="Create a new Agreement."
        backHref="/dashboard/residents/agreements"
        backTitle="Back to Agreements"
      />

      {/* Main Form */}
      <AgreementForm toastRef={toastRef} />
    </main>
  );
}
