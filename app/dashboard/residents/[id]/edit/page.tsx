'use client';

import React, { Suspense, use, useEffect, useState } from 'react';
import { ResidentDetail } from '@/types/resident';
import { residentService, DEFAULT_RESIDENT_DETAIL } from '@/services/resident.service';
import { ResidentForm } from '@/components/residents/resident-form';
import { BrandLoader } from '@/components/ui';

interface EditResidentPageProps {
  params: Promise<{ id: string }>;
}

export default function EditResidentPage({ params }: EditResidentPageProps) {
  return (
    <Suspense
      fallback={
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 max-w-[1600px] w-full mx-auto flex items-center justify-center min-h-[450px]">
          <BrandLoader message="Loading resident profile..." />
        </main>
      }
    >
      <EditResidentContent params={params} />
    </Suspense>
  );
}

function EditResidentContent({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const residentId = resolvedParams?.id;

  const [resident, setResident] = useState<ResidentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (!residentId) return;

    residentService
      .getResidentById(residentId)
      .then((data) => {
        if (isMounted) {
          setResident(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setResident(DEFAULT_RESIDENT_DETAIL);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [residentId]);

  if (loading) {
    return (
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 max-w-[1600px] w-full mx-auto flex items-center justify-center min-h-[450px]">
        <BrandLoader message="Loading resident details for edit..." />
      </main>
    );
  }

  return <ResidentForm mode="edit" residentId={residentId} initialData={resident} />;
}
