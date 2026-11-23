'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Visitor } from '@/types/visitor';
import { visitorService } from '@/services/visitor.service';
import { VisitorForm } from '@/components/visitors/visitor-form';
import { BrandLoader } from '@/components/ui';

export default function EditVisitorPage() {
  const params = useParams();
  const router = useRouter();

  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [loading, setLoading] = useState(true);

  const visitorId = params?.id ? String(params.id) : null;

  useEffect(() => {
    if (!visitorId) {
      router.push('/visitors');
      return;
    }

    let isMounted = true;
    visitorService
      .getVisitorById(visitorId)
      .then((data) => {
        if (!isMounted) return;
        if (!data) {
          router.push('/visitors');
          return;
        }
        setVisitor(data);
        setLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        router.push('/visitors');
      });

    return () => {
      isMounted = false;
    };
  }, [visitorId, router]);

  if (loading) {
    return (
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 max-w-[1400px] w-full mx-auto flex items-center justify-center min-h-[450px]">
        <BrandLoader />
      </main>
    );
  }

  return <VisitorForm key={visitor?.id || 'edit'} mode="edit" initialData={visitor} />;
}
