'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { ResidentForm } from './resident-form';

/**
 * Client wrapper that keys ResidentForm by search parameters so that
 * navigating to /residents/new (with no params) always mounts a completely
 * blank form with no stale pre-filled fields.
 */
export function ResidentCreateView() {
  const searchParams = useSearchParams();
  const searchKey = searchParams ? searchParams.toString() : 'clean';
  return <ResidentForm key={searchKey} mode="create" />;
}
