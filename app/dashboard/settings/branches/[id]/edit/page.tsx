'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Branch } from '@/types/branch';
import { branchService } from '@/services/branch.service';
import { BranchForm } from '@/components/branches/branch-form';

export default function EditBranchPage() {
  const params = useParams();
  const router = useRouter();

  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);

  const branchId = Number(params?.id);

  useEffect(() => {
    if (!branchId || Number.isNaN(branchId)) {
      router.push('/dashboard/settings/branches');
      return;
    }

    let isMounted = true;
    branchService
      .getBranchById(branchId)
      .then((data) => {
        if (!isMounted) return;
        if (!data) {
          router.push('/dashboard/settings/branches');
          return;
        }
        setBranch(data);
        setLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        router.push('/dashboard/settings/branches');
      });

    return () => {
      isMounted = false;
    };
  }, [branchId, router]);

  if (loading) {
    return (
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 max-w-[1200px] w-full mx-auto flex items-center justify-center min-h-[450px]">
        <div className="flex flex-col items-center justify-center gap-3">
          <ProgressSpinner style={{ width: '40px', height: '40px' }} strokeWidth="4" />
          <span className="text-xs text-gray-500 font-medium">Loading branch details...</span>
        </div>
      </main>
    );
  }

  if (!branch) {
    return (
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 max-w-[1200px] w-full mx-auto text-center py-20">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Branch Not Found</h2>
        <Link
          href="/dashboard/settings/branches"
          className="text-xs font-semibold text-[#175C46] hover:underline"
        >
          Return to Branch Management
        </Link>
      </main>
    );
  }

  return (
    <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 max-w-[1200px] w-full mx-auto space-y-5 sm:space-y-6 bg-[#F7F7F5]">
      <BranchForm mode="edit" initialData={branch} />
    </main>
  );
}

