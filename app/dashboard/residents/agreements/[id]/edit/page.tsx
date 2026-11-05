'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import { AgreementRecord } from '@/types/agreement';
import { agreementService } from '@/services/agreement.service';
import { AgreementForm } from '@/components/agreements/agreement-form';

export default function EditAgreementPage() {
  const params = useParams();
  const router = useRouter();
  const toastRef = useRef<Toast>(null);

  const [record, setRecord] = useState<AgreementRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const agreementId = Number(params.id);

  useEffect(() => {
    if (!agreementId || Number.isNaN(agreementId)) {
      router.push('/dashboard/residents/agreements');
      return;
    }

    let isMounted = true;
    agreementService
      .getAgreementById(agreementId)
      .then((data) => {
        if (!isMounted) return;
        if (!data) {
          router.push('/dashboard/residents/agreements');
          return;
        }
        setRecord(data);
        setLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        router.push('/dashboard/residents/agreements');
      });

    return () => {
      isMounted = false;
    };
  }, [agreementId, router]);

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
            Edit Agreement
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-normal mt-0.5">
            Update agreement details.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 flex flex-col items-center justify-center gap-3">
          <ProgressSpinner style={{ width: '38px', height: '38px' }} strokeWidth="3" />
          <span className="text-xs text-gray-500 font-medium">Loading agreement details...</span>
        </div>
      ) : (
        <AgreementForm
          toastRef={toastRef}
          initialData={record}
          isEdit={true}
        />
      )}
    </main>
  );
}
