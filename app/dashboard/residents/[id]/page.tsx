'use client';

import React, { Suspense, use, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ProgressSpinner } from 'primereact/progressspinner';
import { ResidentDetail } from '@/types/resident';
import { residentService, DEFAULT_RESIDENT_DETAIL } from '@/services/resident.service';

interface ResidentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ResidentDetailPage({ params }: ResidentDetailPageProps) {
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
      <ResidentDetailContent params={params} />
    </Suspense>
  );
}

function ResidentDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const residentId = resolvedParams?.id;

  const [resident, setResident] = useState<ResidentDetail>(DEFAULT_RESIDENT_DETAIL);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'Overview' | 'Documents' | 'Payments' | 'Complaints' | 'Activity'>('Overview');

  useEffect(() => {
    let isMounted = true;
    if (!residentId) return;

    residentService
      .getResidentById(residentId)
      .then((data) => {
        if (!isMounted) return;
        setResident(data);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('Failed to load resident details, falling back:', err);
        setResident(DEFAULT_RESIDENT_DETAIL);
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [residentId]);

  // Loading state for active file download
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);

  // Cross-origin safe automatic file download helper
  const handleDownloadDocument = async (fileUrl: string, fileName?: string, docKey?: string) => {
    if (!fileUrl) return;
    if (docKey) setDownloadingKey(docKey);

    const cleanFileName = fileName || fileUrl.split('/').pop()?.split('?')[0] || 'document';

    try {
      const response = await fetch(fileUrl, { mode: 'cors' });
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = cleanFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
    } catch {
      // Fallback: direct programmatic anchor click
      const link = document.createElement('a');
      link.href = fileUrl;
      link.setAttribute('download', cleanFileName);
      link.setAttribute('target', '_blank');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      if (docKey) setDownloadingKey(null);
    }
  };

  // Helper to determine document format (pdf, image, other)
  const getDocFormat = (fileName?: string | null, url?: string | null): 'pdf' | 'image' | 'other' => {
    const str = (fileName || url || '').toLowerCase();
    if (str.endsWith('.pdf')) return 'pdf';
    if (str.endsWith('.jpg') || str.endsWith('.jpeg') || str.endsWith('.png') || str.endsWith('.webp') || str.endsWith('.gif')) {
      return 'image';
    }
    return 'other';
  };

  // Helper to get uppercase file extension
  const getFileExtension = (fileName?: string | null, url?: string | null): string => {
    const str = (fileName || url || '').split('?')[0];
    const lastDot = str.lastIndexOf('.');
    if (lastDot !== -1 && lastDot < str.length - 1) {
      return str.substring(lastDot + 1).toUpperCase();
    }
    return 'FILE';
  };

  // Compute initials for avatar fallback (e.g. "John Doe" -> "JD")
  const getInitials = (name?: string): string => {
    if (!name || !name.trim()) return 'R';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  };

  // Format phone number
  const formatPhone = (phone?: string): string => {
    if (!phone) return '-';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }
    return phone;
  };

  // Format date helper e.g. "04-11-2026 00:00" -> "04 Nov 2026"
  const formatDate = (dateStr?: string | null): string => {
    if (!dateStr) return '-';
    try {
      const parts = dateStr.split(' ')[0].split('-');
      if (parts.length === 3) {
        const [day, month, year] = parts;
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const mIdx = parseInt(month, 10) - 1;
        if (mIdx >= 0 && mIdx < 12) {
          return `${day} ${monthNames[mIdx]} ${year}`;
        }
      }
      return dateStr.split(' ')[0];
    } catch {
      return dateStr;
    }
  };

  const isStatusActive = resident.status?.toLowerCase() === 'active';
  const isStatusPending = resident.status?.toLowerCase() === 'pending';

  const roomNo = resident.room_info?.room_no || 'A-201';
  const roomTypeFormatted = resident.room_info?.room_type
    ? resident.room_info.room_type.charAt(0).toUpperCase() + resident.room_info.room_type.slice(1) + ' Room'
    : 'Single Room';
  const sinceDateFormatted = resident.room_info?.check_in_date
    ? formatDate(resident.room_info.check_in_date)
    : '12 Jan 2025';

  return (
    <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 max-w-[1600px] w-full mx-auto space-y-6 bg-[#F7F7F5]">
      {/* Top Header Row: Breadcrumb Back Link & Edit Profile Action Button */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
          <Link
            href="/dashboard/residents"
            className="hover:text-gray-900 flex items-center gap-1 font-medium transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Residents List
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-800 font-semibold">{resident.name}</span>
        </div>

        <Link
          href={`/dashboard/residents/${resident.id}/edit`}
          className="px-5 py-2 bg-[#175C46] hover:bg-[#124B38] text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-2 cursor-pointer shrink-0"
        >
          <svg className="w-3.5 h-3.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          <span>Edit Profile</span>
        </Link>
      </div>

      {loading ? (
        <div className="p-24 flex flex-col items-center justify-center gap-3">
          <ProgressSpinner style={{ width: '40px', height: '40px' }} strokeWidth="3" />
          <span className="text-xs text-gray-500 font-medium">Loading resident profile...</span>
        </div>
      ) : (
        <>
          {/* Top Profile Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pt-1">
            {/* Profile Photo */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-white shadow-sm shrink-0 bg-emerald-100 flex items-center justify-center text-[#175C46] font-bold text-2xl relative">
              {resident.profile_photo_url ? (
                <Image
                  src={resident.profile_photo_url}
                  alt={resident.name}
                  width={112}
                  height={112}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                <span>{getInitials(resident.name)}</span>
              )}
            </div>

            {/* Profile Main Info */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                  {resident.name}
                </h1>
                <span
                  className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold capitalize ${
                    isStatusActive
                      ? 'bg-[#E6F4EA] text-[#137333]'
                      : isStatusPending
                      ? 'bg-[#FEF7E0] text-[#B06000]'
                      : 'bg-[#FCE8E6] text-[#C5221F]'
                  }`}
                >
                  {resident.status}
                </span>
              </div>

              {/* Subtitle Line: Room | Room Type | Since Date */}
              <div className="flex items-center gap-2.5 text-xs text-gray-500 font-normal">
                <span>{roomNo}</span>
                <span className="text-gray-300">|</span>
                <span>{roomTypeFormatted}</span>
                <span className="text-gray-300">|</span>
                <span>Since {sinceDateFormatted}</span>
              </div>

              {/* Contact Icons List */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 text-xs text-gray-600 pt-1">
                {/* Phone */}
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>{formatPhone(resident.contact_info?.phone || resident.phone)}</span>
                </div>

                {/* Email */}
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>{resident.contact_info?.email || resident.email}</span>
                </div>

                {/* Location */}
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{resident.contact_info?.location_display || (resident.contact_info?.city && resident.contact_info?.state ? `${resident.contact_info.city}, ${resident.contact_info.state}` : 'Location not set')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs Bar matching Figma */}
          <div className="border-b border-gray-200">
            <nav className="flex items-center gap-8 -mb-[1px]">
              {(['Overview', 'Documents', 'Payments', 'Complaints', 'Activity'] as const).map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`pb-3.5 text-sm transition-colors cursor-pointer relative ${
                      isActive
                        ? 'text-gray-900 font-bold border-b-2 border-[#175C46]'
                        : 'text-gray-500 font-medium hover:text-gray-800'
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab 1: Overview matching Figma layout */}
          {activeTab === 'Overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Card 1: Personal Information */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-5">
                <h2 className="text-base font-bold text-gray-900">Personal Information</h2>

                <div className="space-y-4">
                  {/* Full Name */}
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#EBF7F2] text-[#175C46] flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 font-normal block">Full Name</span>
                      <span className="text-sm font-semibold text-gray-900 block mt-0.5">
                        {resident.personal_info?.name || resident.name}
                      </span>
                    </div>
                  </div>

                  {/* Date of Birth */}
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#EBF7F2] text-[#175C46] flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M3 21h18M3 10h18M5 10v10a1 1 0 001 1h12a1 1 0 001-1V10" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 font-normal block">Date of birth</span>
                      <span className="text-sm font-semibold text-gray-900 block mt-0.5">
                        {resident.personal_info?.dob_display || '20 August 1999 (27 Years)'}
                      </span>
                    </div>
                  </div>

                  {/* Gender */}
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#EBF7F2] text-[#175C46] flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <circle cx="10" cy="10" r="6" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.5 5.5L20 1m0 0h-4m4 0v4M10 16v6m-3-3h6" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 font-normal block">Gender</span>
                      <span className="text-sm font-semibold text-gray-900 block mt-0.5 capitalize">
                        {resident.personal_info?.gender || resident.gender || 'Male'}
                      </span>
                    </div>
                  </div>

                  {/* Nationality */}
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#EBF7F2] text-[#175C46] flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 font-normal block">Nationality</span>
                      <span className="text-sm font-semibold text-gray-900 block mt-0.5">
                        {resident.personal_info?.nationality || 'Indian'}
                      </span>
                    </div>
                  </div>

                  {/* Marital Status */}
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#EBF7F2] text-[#175C46] flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 font-normal block">Marital Status</span>
                      <span className="text-sm font-semibold text-gray-900 block mt-0.5 capitalize">
                        {resident.personal_info?.marital_status || 'Single'}
                      </span>
                    </div>
                  </div>

                  {/* Occupation */}
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#EBF7F2] text-[#175C46] flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 font-normal block">Occupation</span>
                      <span className="text-sm font-semibold text-gray-900 block mt-0.5">
                        {resident.personal_info?.occupation || 'Senior Developer'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Room Information */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-5">
                <h2 className="text-base font-bold text-gray-900">Room Information</h2>

                <div className="space-y-4">
                  {/* Room No. */}
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#EBF7F2] text-[#175C46] flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 font-normal block">Room No.</span>
                      <span className="text-sm font-semibold text-gray-900 block mt-0.5">
                        {resident.room_info?.room_no || 'A-201'}
                      </span>
                    </div>
                  </div>

                  {/* Room Type */}
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#EBF7F2] text-[#175C46] flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 font-normal block">Room Type</span>
                      <span className="text-sm font-semibold text-gray-900 block mt-0.5 capitalize">
                        {resident.room_info?.room_type || 'Single'}
                      </span>
                    </div>
                  </div>

                  {/* Building */}
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#EBF7F2] text-[#175C46] flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 font-normal block">Building</span>
                      <span className="text-sm font-semibold text-gray-900 block mt-0.5">
                        {resident.room_info?.building_name || 'Main Building'}
                      </span>
                    </div>
                  </div>

                  {/* Check-in Date */}
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#EBF7F2] text-[#175C46] flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 font-normal block">Check-in Date</span>
                      <span className="text-sm font-semibold text-gray-900 block mt-0.5">
                        {formatDate(resident.room_info?.check_in_date) || '04 Nov 2026'}
                      </span>
                    </div>
                  </div>

                  {/* Expected Check-out */}
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#EBF7F2] text-[#175C46] flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 font-normal block">Expected Check-out</span>
                      <span className="text-sm font-semibold text-gray-900 block mt-0.5">
                        {formatDate(resident.room_info?.check_out_date)}
                      </span>
                    </div>
                  </div>

                  {/* Current status */}
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#EBF7F2] text-[#175C46] flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 font-normal block">Current status</span>
                      <span className="text-sm font-semibold text-gray-900 block mt-0.5 capitalize">
                        {resident.room_info?.current_status || resident.status || 'Active'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Contact Information */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-5">
                <h2 className="text-base font-bold text-gray-900">Contact Information</h2>

                <div className="space-y-4">
                  {/* Phone */}
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#EBF7F2] text-[#175C46] flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 font-normal block">Phone</span>
                      <span className="text-sm font-semibold text-gray-900 block mt-0.5">
                        {formatPhone(resident.contact_info?.phone || resident.phone)}
                      </span>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#EBF7F2] text-[#175C46] flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 font-normal block">Email</span>
                      <span className="text-sm font-semibold text-gray-900 block mt-0.5">
                        {resident.contact_info?.email || resident.email}
                      </span>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#EBF7F2] text-[#175C46] flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 font-normal block">Emergency contact</span>
                      <span className="text-sm font-semibold text-gray-900 block mt-0.5">
                        {resident.contact_info?.emergency_contact_display || resident.contact_info?.emergency_contact_name || 'Not provided'}
                      </span>
                      {resident.contact_info?.emergency_contact_phone && (
                        <span className="text-xs font-medium text-gray-600 block mt-0.5">
                          {formatPhone(resident.contact_info.emergency_contact_phone)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Address */}
                  <div className="flex items-start gap-3.5 pt-1 border-t border-gray-100">
                    <div className="w-10 h-10 rounded-full bg-[#EBF7F2] text-[#175C46] flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 font-normal block">Permanent Address</span>
                      <span className="text-xs font-semibold text-gray-800 block mt-0.5">
                        {resident.contact_info?.address || resident.contact_info?.address_line_1 || 'Not provided'}
                      </span>
                      {(resident.contact_info?.city || resident.contact_info?.state) && (
                        <span className="text-xs text-gray-500 block">
                          {[resident.contact_info?.city, resident.contact_info?.state, resident.contact_info?.pincode].filter(Boolean).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Documents Tab */}
          {activeTab === 'Documents' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    key: 'aadhar_card',
                    title: 'Aadhaar Card',
                    fileName: resident.documents?.aadhar_card,
                    url: resident.documents?.aadhar_card_url,
                    status: 'Verified',
                    defaultExt: 'PDF',
                  },
                  {
                    key: 'address_proof',
                    title: 'Address Proof',
                    fileName: resident.documents?.address_proof,
                    url: resident.documents?.address_proof_url,
                    status: 'Verified',
                    defaultExt: 'PNG',
                  },
                  {
                    key: 'education_certificate',
                    title: 'Education Certificate',
                    fileName: resident.documents?.education_certificate,
                    url: resident.documents?.education_certificate_url,
                    status: 'Verified',
                    defaultExt: 'JPG',
                  },
                  {
                    key: 'signature',
                    title: 'Resident Signature',
                    fileName: resident.documents?.signature,
                    url: resident.documents?.signature_url,
                    status: 'Signed',
                    defaultExt: 'PNG',
                  },
                ].map((doc) => {
                  const format = getDocFormat(doc.fileName, doc.url);
                  const ext = doc.fileName ? getFileExtension(doc.fileName, doc.url) : doc.defaultExt;
                  const isPdf = format === 'pdf' || ext === 'PDF';
                  const isUploaded = Boolean(doc.url && doc.url.trim() !== '');

                  return (
                    <div
                      key={doc.key}
                      className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between space-y-4 hover:border-gray-200 transition-colors"
                    >
                      {/* Top: Icon + Title + Status */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                              isPdf
                                ? 'bg-red-50 text-red-600'
                                : 'bg-[#EBF7F2] text-[#175C46]'
                            }`}
                          >
                            {isPdf ? (
                              <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm font-bold text-gray-900 truncate">{doc.title}</h3>
                            <span
                              className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                isPdf
                                  ? 'bg-red-50 text-red-700 border border-red-200/60'
                                  : 'bg-emerald-50 text-[#175C46] border border-emerald-200/60'
                              }`}
                            >
                              {ext} File
                            </span>
                          </div>
                        </div>

                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E6F4EA] text-[#137333] shrink-0">
                          {doc.status}
                        </span>
                      </div>

                      {/* File Name Attachment Info Box */}
                      <div className="bg-gray-50/70 rounded-xl p-3 border border-gray-100/80">
                        <span className="text-[11px] text-gray-400 block font-medium">Attachment</span>
                        <p className="text-xs text-gray-700 font-mono font-medium truncate mt-0.5 cursor-pointer" title={doc.fileName || undefined}>
                          {doc.fileName || 'No file attached'}
                        </p>
                      </div>

                      {/* Action Buttons: View in new tab & Download */}
                      <div className="pt-1">
                        {isUploaded ? (
                          <div className="grid grid-cols-2 gap-2">
                            {/* View button - opens in browser native viewer with zero iframe issues */}
                            <a
                              href={doc.url!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="py-2.5 px-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View
                            </a>

                            {/* Download button with automatic download */}
                            <button
                              type="button"
                              disabled={downloadingKey === doc.key}
                              onClick={() => handleDownloadDocument(doc.url!, doc.fileName || undefined, doc.key)}
                              className="py-2.5 px-3 bg-[#175C46] hover:bg-[#124B38] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs disabled:opacity-70"
                            >
                              {downloadingKey === doc.key ? (
                                <>
                                  <ProgressSpinner style={{ width: '13px', height: '13px' }} strokeWidth="3" />
                                  <span>Downloading...</span>
                                </>
                              ) : (
                                <>
                                  <svg className="w-3.5 h-3.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                  </svg>
                                  <span>Download</span>
                                </>
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 block text-center py-2.5 bg-gray-50 rounded-xl">
                            Not uploaded
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 3: Payments Tab */}
          {activeTab === 'Payments' && (
            <div className="space-y-6">
              {/* Payment Summary Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0 font-bold text-base">
                    ₹
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500 block">Total Due Amount</span>
                    <span className="text-2xl font-bold text-red-600 tracking-tight block mt-0.5">
                      ₹{resident.due_amount ?? resident.payment_info?.due_amount ?? 150}
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full bg-emerald-50 text-[#175C46] flex items-center justify-center shrink-0 font-bold text-base">
                    ₹
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500 block">Monthly Rent</span>
                    <span className="text-2xl font-bold text-gray-900 tracking-tight block mt-0.5">
                      ₹{(resident.room_info?.monthly_rent ?? 9000).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 font-bold text-base">
                    ₹
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500 block">Security Deposit</span>
                    <span className="text-2xl font-bold text-gray-900 tracking-tight block mt-0.5">
                      ₹{(resident.room_info?.security_deposit ?? 9000).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Outstanding Invoices & Bills Table */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Billing History & Dues</h3>
                    <p className="text-xs text-gray-500 mt-0.5">All pending charges and recorded receipts</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => alert('Record Payment modal')}
                    className="px-4 py-2 bg-[#175C46] hover:bg-[#124B38] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    + Record Payment
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-500 font-semibold bg-gray-50/50">
                        <th className="py-3.5 px-5">Invoice / Description</th>
                        <th className="py-3.5 px-4">Due Date</th>
                        <th className="py-3.5 px-4">Breakdown</th>
                        <th className="py-3.5 px-4">Due Amount</th>
                        <th className="py-3.5 px-4">Paid</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {resident.payment_info ? (
                        <tr className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-4 px-5 font-semibold text-gray-900">
                            {resident.payment_info.title || 'Monthly Laundry Charges - April 2026'}
                            <span className="block text-[11px] text-gray-400 font-normal">
                              ID: #{resident.payment_info.payment_id || 26}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-gray-600">
                            {formatDate(resident.payment_info.due_date) || '20 Apr 2026'}
                          </td>
                          <td className="py-4 px-4 text-gray-600">
                            {resident.payment_info.breakdown ? (
                              <span>Other charges: ₹{resident.payment_info.breakdown.other || 150}</span>
                            ) : (
                              <span>Laundry Charges</span>
                            )}
                          </td>
                          <td className="py-4 px-4 font-bold text-red-600">
                            ₹{resident.payment_info.due_amount ?? 150}
                          </td>
                          <td className="py-4 px-4 font-medium text-gray-700">
                            ₹{resident.payment_info.paid_amount ?? 0}
                          </td>
                          <td className="py-4 px-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FEF7E0] text-[#B06000] capitalize">
                              {resident.payment_info.status || 'Pending'}
                            </span>
                          </td>
                          <td className="py-4 px-5 text-right">
                            <button
                              type="button"
                              onClick={() => alert(`Collect payment for #${resident.payment_info?.payment_id}`)}
                              className="px-3 py-1.5 bg-[#175C46] text-white rounded-md text-xs font-medium hover:bg-[#124B38] cursor-pointer"
                            >
                              Collect
                            </button>
                          </td>
                        </tr>
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-gray-400">
                            No billing records found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Complaints Tab */}
          {activeTab === 'Complaints' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-[0_1px_3px_rgba(0,0,0,0.02)] text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-[#EBF7F2] text-[#175C46] flex items-center justify-center mx-auto">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-gray-900">No Complaints Reported</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                This resident currently has no active or past maintenance and facility complaints.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => alert('Log new complaint modal')}
                  className="px-5 py-2.5 bg-[#175C46] hover:bg-[#124B38] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  + Log Resident Complaint
                </button>
              </div>
            </div>
          )}

          {/* Tab 5: Activity Tab */}
          {activeTab === 'Activity' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-6">
              <h3 className="text-base font-bold text-gray-900">Activity Timeline</h3>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                {/* Timeline Item 1 */}
                <div className="relative">
                  <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-[#175C46] ring-4 ring-[#EBF7F2]" />
                  <span className="text-xs text-gray-400 font-medium">04-11-2026 15:39</span>
                  <h4 className="text-sm font-semibold text-gray-900 mt-0.5">Profile Updated</h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    User personal and room assignment details updated by admin.
                  </p>
                </div>

                {/* Timeline Item 2 */}
                <div className="relative">
                  <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-[#175C46] ring-4 ring-[#EBF7F2]" />
                  <span className="text-xs text-gray-400 font-medium">
                    {resident.room_info?.check_in_date || '04-11-2026 00:00'}
                  </span>
                  <h4 className="text-sm font-semibold text-gray-900 mt-0.5">
                    Room Allocated: {resident.room_info?.room_no || 'A-201'} ({resident.room_info?.bed_number || 'Bed-1'})
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {resident.room_info?.stay_notes || 'Allocated via Admin User Update'} in {resident.room_info?.building_name || 'Main Building'}.
                  </p>
                </div>

                {/* Timeline Item 3 */}
                <div className="relative">
                  <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-[#175C46] ring-4 ring-[#EBF7F2]" />
                  <span className="text-xs text-gray-400 font-medium">{resident.created_at || '31-10-2026 16:10'}</span>
                  <h4 className="text-sm font-semibold text-gray-900 mt-0.5">Resident Registered</h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Resident registered into {resident.room_info?.pg_name || 'PG Facility'}.
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}

