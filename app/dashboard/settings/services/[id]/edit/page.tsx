'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LaundryRequest } from '@/types/laundry';
import { laundryService } from '@/services/laundry.service';
import { LaundryForm } from '@/components/laundry';
import { BrandLoader } from '@/components/ui';

export default function EditServiceRequestPage() {
  const params = useParams();
  const router = useRouter();

  const [request, setRequest] = useState<LaundryRequest | null>(null);
  const [loading, setLoading] = useState(true);

  const requestId = params?.id ? String(params.id) : undefined;

  useEffect(() => {
    if (!requestId) {
      router.push('/dashboard/settings/services');
      return;
    }

    let isMounted = true;
    laundryService
      .getRequestById(requestId)
      .then((data) => {
        if (!isMounted) return;
        if (!data) {
          router.push('/dashboard/settings/services');
          return;
        }
        setRequest(data);
        setLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        router.push('/dashboard/settings/services');
      });

    return () => {
      isMounted = false;
    };
  }, [requestId, router]);

  if (loading) {
    return (
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 sm:py-6 max-w-[1600px] w-full mx-auto flex items-center justify-center min-h-[450px]">
        <BrandLoader message="Loading request details..." />
      </main>
    );
  }

  if (!request) {
    return (
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 sm:py-6 max-w-[1600px] w-full mx-auto text-center py-20">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Request Not Found</h2>
        <Link
          href="/dashboard/settings/services"
          className="text-xs font-semibold text-[#175C46] hover:underline"
        >
          Return to Service and Laundry Requests
        </Link>
      </main>
    );
  }

  return (
    <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 sm:py-6 max-w-[1600px] w-full mx-auto bg-[#F7F7F5]">
      <LaundryForm
        mode="edit"
        requestId={request.id}
        initialData={request}
        key={request.id}
      />
    </main>
  );
}
