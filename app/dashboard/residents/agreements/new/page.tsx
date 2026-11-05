'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { Toast } from 'primereact/toast';
import { AgreementForm } from '@/components/agreements/agreement-form';

export default function CreateAgreementPage() {
  const toastRef = useRef<Toast>(null);

  return (
    <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 max-w-[1600px] w-full mx-auto space-y-6">
      <Toast ref={toastRef} position="top-right" />

      {/* Top Header with minimal Back arrow button matching Figma image */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/residents/agreements"
          className="text-gray-900 hover:text-black flex items-center justify-center transition-colors cursor-pointer p-1 -ml-1 rounded-lg hover:bg-gray-100"
          title="Back to Agreements"
        >
          <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2.4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight leading-tight">
            Create New Agreement
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-normal mt-0.5">
            Create a new Agreement.
          </p>
        </div>
      </div>

      {/* Main Form */}
      <AgreementForm toastRef={toastRef} />
    </main>
  );
}
