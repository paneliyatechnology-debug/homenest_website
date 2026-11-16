'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AgreementRecord } from '@/types/agreement';
import { agreementService } from '@/services/agreement.service';
import { AgreementForm } from '@/components/agreements/agreement-form';
import { PageHeader, BrandLoader } from '@/components/ui';

export default function EditAgreementPage() {
  const params = useParams();
  const router = useRouter();

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
      {/* Top Header with minimal Back arrow button matching Figma image */}
      <PageHeader
        title="Edit Agreement"
        subtitle="Update agreement details."
        backHref="/dashboard/residents/agreements"
        backTitle="Back to Agreements"
      />

      {loading ? (
        <div className="p-12 flex flex-col items-center justify-center">
          <BrandLoader message="Loading agreement details..." />
        </div>
      ) : (
        <AgreementForm
          key={record?.id || agreementId}
          initialData={record}
          isEdit={true}
        />
      )}
    </main>
  );
}
