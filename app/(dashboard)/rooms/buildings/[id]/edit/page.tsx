'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building } from '@/types/building';
import { buildingService } from '@/services/building.service';
import { BuildingForm } from '@/components/buildings/building-form';
import { BrandLoader } from '@/components/ui';

export default function EditBuildingPage() {
  const params = useParams();
  const router = useRouter();

  const [building, setBuilding] = useState<Building | null>(null);
  const [loading, setLoading] = useState(true);

  const buildingId = Number(params?.id);

  useEffect(() => {
    if (!buildingId || Number.isNaN(buildingId)) {
      router.push('/rooms/buildings');
      return;
    }

    let isMounted = true;
    buildingService
      .getBuildingById(buildingId)
      .then((data) => {
        if (!isMounted) return;
        if (!data) {
          router.push('/rooms/buildings');
          return;
        }
        setBuilding(data);
        setLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        router.push('/rooms/buildings');
      });

    return () => {
      isMounted = false;
    };
  }, [buildingId, router]);

  if (loading) {
    return (
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 max-w-[1200px] w-full mx-auto flex items-center justify-center min-h-[450px]">
        <BrandLoader message="Loading building details..." />
      </main>
    );
  }

  if (!building) {
    return (
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 max-w-[1200px] w-full mx-auto text-center py-20">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Building Not Found</h2>
        <Link
          href="/rooms/buildings"
          className="text-xs font-semibold text-[#175C46] hover:underline"
        >
          Return to Buildings & Floors
        </Link>
      </main>
    );
  }

  return (
    <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 max-w-[1200px] w-full mx-auto space-y-5 sm:space-y-6">
      <BuildingForm mode="edit" initialData={building} key={building.id} />
    </main>
  );
}
