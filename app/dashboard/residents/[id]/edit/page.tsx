'use client';

import React, { Suspense, use, useEffect, useState } from 'react';
import { ProgressSpinner } from 'primereact/progressspinner';
import { ResidentDetail } from '@/types/resident';
import { residentService, DEFAULT_RESIDENT_DETAIL } from '@/services/resident.service';
import { ResidentForm } from '@/components/dashboard/resident-form';

interface EditResidentPageProps {
  params: Promise<{ id: string }>;
}

export default function EditResidentPage({ params }: EditResidentPageProps) {
  return (
    <Suspense
      fallback={
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 max-w-[1600px] w-full mx-auto space-y-6 bg-[#F7F7F5]">
          <div className="p-24 flex flex-col items-center justify-center gap-3">
            <ProgressSpinner style={{ width: '40px', height: '40px' }} strokeWidth="3" />
            <span className="text-xs text-gray-500 font-medium">Loading resident profile...</span>
          </div>
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
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 max-w-[1600px] w-full mx-auto space-y-6 bg-[#F7F7F5]">
        <div className="p-24 flex flex-col items-center justify-center gap-3">
          <ProgressSpinner style={{ width: '40px', height: '40px' }} strokeWidth="3" />
          <span className="text-xs text-gray-500 font-medium">Loading resident details for edit...</span>
        </div>
      </main>
    );
  }

  return <ResidentForm mode="edit" residentId={residentId} initialData={resident} />;
}

