'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ResidentDetail } from '@/types/resident';
import { residentService } from '@/services/resident.service';
import { ResidentForm } from '@/components/residents/resident-form';
import { BrandLoader } from '@/components/ui';

export default function EditResidentPage() {
  const params = useParams();
  const router = useRouter();

  const [resident, setResident] = useState<ResidentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const residentId = params?.id ? String(params.id) : '';

  useEffect(() => {
    if (!residentId) {
      router.push('/residents');
      return;
    }

    let isMounted = true;

    residentService
      .getResidentById(residentId)
      .then((data) => {
        if (!isMounted) return;
        if (!data) {
          setError('Resident details could not be found.');
          setLoading(false);
          return;
        }
        setResident(data);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Failed to load resident for edit:', err);
        setError('Failed to load resident details.');
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [residentId, router]);

  if (loading) {
    return (
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 max-w-[1600px] w-full mx-auto flex items-center justify-center min-h-[450px]">
        <BrandLoader message="Loading resident details for edit..." />
      </main>
    );
  }

  if (error || !resident) {
    return (
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 max-w-[1600px] w-full mx-auto text-center py-20 bg-[#F7F7F5] rounded-2xl my-8">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Resident Not Found</h2>
        <p className="text-sm text-gray-500 mb-6">
          {error || 'The resident you are trying to edit could not be found or has been removed.'}
        </p>
        <Link
          href="/residents"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#175C46] hover:bg-[#134e3b] text-white text-sm font-medium rounded-xl transition-colors"
        >
          Back to Residents List
        </Link>
      </main>
    );
  }

  return (
    <ResidentForm
      mode="edit"
      residentId={residentId}
      initialData={resident}
      key={`resident-edit-${residentId}-${resident.id}`}
    />
  );
}
