'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { StaffMember } from '@/types/staff';
import { staffService } from '@/services/staff.service';
import { StaffForm } from '@/components/staff/staff-form';
import { BrandLoader } from '@/components/ui';

export default function EditStaffPage() {
  const params = useParams();
  const router = useRouter();

  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [loading, setLoading] = useState(true);

  const staffId = Number(params?.id);

  useEffect(() => {
    if (!staffId || Number.isNaN(staffId)) {
      router.push('/dashboard/settings/staff');
      return;
    }

    let isMounted = true;
    staffService
      .getStaffById(staffId)
      .then((data) => {
        if (!isMounted) return;
        if (!data) {
          router.push('/dashboard/settings/staff');
          return;
        }
        setStaff(data);
        setLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        router.push('/dashboard/settings/staff');
      });

    return () => {
      isMounted = false;
    };
  }, [staffId, router]);

  if (loading) {
    return (
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 max-w-[1200px] w-full mx-auto flex items-center justify-center min-h-[450px]">
        <BrandLoader message="Loading staff member details..." />
      </main>
    );
  }

  if (!staff) {
    return (
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 max-w-[1200px] w-full mx-auto text-center py-20">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Staff Member Not Found</h2>
        <Link
          href="/dashboard/settings/staff"
          className="text-xs font-semibold text-[#175C46] hover:underline"
        >
          Return to Staff Management
        </Link>
      </main>
    );
  }

  return (
    <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 max-w-[1200px] w-full mx-auto space-y-5 sm:space-y-6">
      <StaffForm mode="edit" initialData={staff} />
    </main>
  );
}

