'use client';

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Toast } from 'primereact/toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Resident, ResidentMeta, ResidentStats } from '@/types/resident';
import { residentService, DEFAULT_RESIDENT_STATS } from '@/services/resident.service';
import { BranchDropdown } from '@/components/residents/branch-dropdown';

export default function ResidentsListPage() {
  const toastRef = useRef<Toast>(null);
  const hasShownFlashRef = useRef<boolean>(false);

  const [residents, setResidents] = useState<Resident[]>([]);
  const [stats, setStats] = useState<ResidentStats>(DEFAULT_RESIDENT_STATS);
  const [meta, setMeta] = useState<ResidentMeta>({
    page: 1,
    limit: 10,
    total_pages: 1,
    total: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filter States
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedRoomType, setSelectedRoomType] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Delete resident state
  const [deletingResident, setDeletingResident] = useState<Resident | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Display flash toast upon redirection after create or update
  useEffect(() => {
    if (typeof window === 'undefined' || hasShownFlashRef.current) return;

    try {
      const stored = sessionStorage.getItem('homenest_flash_toast');
      const urlParams = new URLSearchParams(window.location.search);
      const toastParam = urlParams.get('toast');

      let toastData: { summary: string; detail: string; severity?: 'success' | 'info' | 'warn' | 'error' } | null = null;

      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.summary) {
          toastData = parsed;
        }
        sessionStorage.removeItem('homenest_flash_toast');
      } else if (toastParam === 'created') {
        toastData = {
          summary: 'Resident Created',
          detail: 'New resident profile was created successfully.',
        };
      } else if (toastParam === 'updated') {
        toastData = {
          summary: 'Resident Updated',
          detail: 'Resident profile was updated successfully.',
        };
      }

      if (toastData) {
        hasShownFlashRef.current = true;
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);

        toastRef.current?.show({
          severity: toastData.severity || 'success',
          summary: toastData.summary,
          detail: toastData.detail,
          life: 3000,
        });
      }
    } catch {
      // ignore parse error
    }
  }, []);

  // Debounce search query by 350ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setCurrentPage(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch Resident Statistics from GET /users/stats?role=resident&branch_id=...
  useEffect(() => {
    let isMounted = true;
    residentService
      .getResidentStats({ role: 'resident', branch_id: selectedBranchId })
      .then((data) => {
        if (!isMounted) return;
        setStats(data);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('Failed to fetch resident stats:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedBranchId, refreshTrigger]);

  // Fetch Residents from GET /users with filters
  useEffect(() => {
    let isMounted = true;
    residentService
      .getResidents({
        page: currentPage,
        limit: 10,
        role: 'resident',
        status: selectedStatus || undefined,
        branch_id: selectedBranchId,
        search: debouncedSearch || undefined,
      })
      .then((res) => {
        if (!isMounted) return;
        let filteredData = res.data;
        if (selectedRoomType) {
          filteredData = filteredData.filter((r) => {
            const type = r.bed_number?.toLowerCase() || '';
            if (selectedRoomType === 'Single') return type.includes('1') || type.includes('single') || !type;
            if (selectedRoomType === 'Double') return type.includes('2') || type.includes('double');
            if (selectedRoomType === 'Triple') return type.includes('3') || type.includes('triple');
            return true;
          });
        }
        setResidents(filteredData);
        setMeta(res.meta);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('Failed to fetch residents:', err);
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentPage, selectedStatus, selectedBranchId, selectedRoomType, debouncedSearch]);

  // Compute initials for avatar fallback (e.g. "John Doe" -> "JD")
  const getInitials = (name?: string): string => {
    if (!name || !name.trim()) return 'R';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  };

  // Format phone number e.g. "9876543259" -> "+91 98765 43259"
  const formatPhone = (phone?: string): string => {
    if (!phone) return '-';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }
    return phone;
  };

  // Calculate dynamic total pages based on actual records
  const totalPages = Math.max(1, meta.total_pages || Math.ceil((meta.total || 0) / (meta.limit || 10)));

  // Generate dynamic page numbers without showing unnecessary pages
  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 3) {
      return [1, 2, 3, 4, '...', totalPages];
    }
    if (currentPage >= totalPages - 2) {
      return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  return (
    <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 max-w-[1600px] w-full mx-auto space-y-6 bg-[#F7F7F5]">
      <Toast ref={toastRef} position="top-right" />

      {/* Top Header: Title & "Add Resident" Action Button matching Figma */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-[26px] font-bold text-gray-900 tracking-tight">
            Resident List
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-normal mt-0.5">
            Manage and view all residents in your property.
          </p>
        </div>

        <Link
          href="/dashboard/residents/new"
          className="px-6 py-2.5 bg-[#175C46] hover:bg-[#124B38] text-white text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer shrink-0 self-start sm:self-auto inline-block text-center"
        >
          Add Resident
        </Link>
      </div>

      {/* Filter Controls Row: Branch, Status, Room Type, and Search Resident (Full Width Responsive Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-end w-full">
        {/* Branch Filter */}
        <div className="space-y-1.5">
          <label className="text-xs font-normal text-gray-500 block">Branch</label>
          <BranchDropdown
            selectedBranchId={selectedBranchId}
            onSelectBranch={(id) => {
              setSelectedBranchId(id);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Status Filter */}
        <div className="space-y-1.5">
          <label className="text-xs font-normal text-gray-500 block">Status</label>
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-11 px-4 py-2.5 bg-white rounded-xl border border-gray-200/90 hover:border-gray-300 text-xs sm:text-sm font-normal text-gray-800 outline-none focus:border-[#175C46] focus:ring-1 focus:ring-[#175C46] transition-all appearance-none cursor-pointer pr-9 shadow-2xs"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
            </select>
            <svg
              className="w-4 h-4 text-gray-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Room Type Filter */}
        <div className="space-y-1.5">
          <label className="text-xs font-normal text-gray-500 block">Room Type</label>
          <div className="relative">
            <select
              value={selectedRoomType}
              onChange={(e) => {
                setSelectedRoomType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-11 px-4 py-2.5 bg-white rounded-xl border border-gray-200/90 hover:border-gray-300 text-xs sm:text-sm font-normal text-gray-800 outline-none focus:border-[#175C46] focus:ring-1 focus:ring-[#175C46] transition-all appearance-none cursor-pointer pr-9 shadow-2xs"
            >
              <option value="">All types</option>
              <option value="Single">Single</option>
              <option value="Double">Double</option>
              <option value="Triple">Triple</option>
            </select>
            <svg
              className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Search Resident Input with Debounce */}
        <div className="space-y-1.5">
          <label className="text-xs font-normal text-gray-500 block">Search Resident</label>
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search name, phone, room..."
              className="w-full h-11 pl-10 pr-8 py-2.5 bg-white rounded-xl border border-gray-200/90 hover:border-gray-300 text-xs sm:text-sm font-normal text-gray-800 placeholder-gray-400 outline-none focus:border-[#175C46] focus:ring-1 focus:ring-[#175C46] transition-all shadow-2xs"
            />
            <svg
              className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-current"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 font-bold text-sm w-4 h-4 flex items-center justify-center cursor-pointer"
              >
                &times;
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4 Summary Stat Cards matching Figma pixel-for-pixel */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Residents */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-[#EEF4FF] text-[#3B82F6] flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <span className="text-xs font-semibold text-[#3B82F6] block">Total Residents</span>
            <span className="text-2xl font-bold text-gray-900 tracking-tight leading-tight mt-0.5 block">
              {stats.total_residents ?? stats.total ?? 0}
            </span>
          </div>
        </div>

        {/* Active Residents */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-[#E6F4EA] text-[#137333] flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h7" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 19l2 2 4-4" />
            </svg>
          </div>
          <div>
            <span className="text-xs font-semibold text-[#137333] block">Active</span>
            <span className="text-2xl font-bold text-gray-900 tracking-tight leading-tight mt-0.5 block">
              {stats.active_residents ?? stats.active ?? 0}
            </span>
          </div>
        </div>

        {/* Pending Residents */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-[#FEF7E0] text-[#B06000] flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
              <circle cx="9" cy="14" r="5" />
              <circle cx="15" cy="10" r="5" />
            </svg>
          </div>
          <div>
            <span className="text-xs font-semibold text-[#B06000] block">Pending</span>
            <span className="text-2xl font-bold text-gray-900 tracking-tight leading-tight mt-0.5 block">
              {stats.pending_residents ?? stats.pending ?? 0}
            </span>
          </div>
        </div>

        {/* Inactive Residents */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-[#FCE8E6] text-[#C5221F] flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h6" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h6" />
            </svg>
          </div>
          <div>
            <span className="text-xs font-semibold text-[#C5221F] block">Inactive</span>
            <span className="text-2xl font-bold text-gray-900 tracking-tight leading-tight mt-0.5 block">
              {stats.inactive_residents ?? stats.inactive ?? 0}
            </span>
          </div>
        </div>
      </div>

      {/* Residents Table Container matching Figma pixel-for-pixel */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <ProgressSpinner style={{ width: '36px', height: '36px' }} strokeWidth="3" />
            <span className="text-xs text-gray-500 font-medium">Loading residents...</span>
          </div>
        ) : residents.length === 0 ? (
          <div className="p-16 text-center text-gray-400 text-xs">
            No residents found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-semibold text-gray-500">
                  <th className="py-4 px-5">Sr no.</th>
                  <th className="py-4 px-3">Photo</th>
                  <th className="py-4 px-4">Name</th>
                  <th className="py-4 px-4">Room no.</th>
                  <th className="py-4 px-4">Room type</th>
                  <th className="py-4 px-4">Phone no.</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs sm:text-[13px]">
                {residents.map((resident, idx) => {
                  const serialNumber = (meta.page - 1) * meta.limit + idx + 1;
                  const isPhotoValid = Boolean(
                    resident.profile_photo_url && resident.profile_photo_url.trim() !== ''
                  );
                  const isStatusActive = resident.status?.toLowerCase() === 'active';
                  const isStatusPending = resident.status?.toLowerCase() === 'pending';

                  return (
                    <tr
                      key={resident.id}
                      className="hover:bg-gray-50/60 transition-colors"
                    >
                      {/* Sr no. */}
                      <td className="py-4 px-5 font-normal text-gray-600">
                        {serialNumber}
                      </td>

                      {/* Photo */}
                      <td className="py-4 px-3">
                        <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-gray-100 bg-emerald-50 flex items-center justify-center text-[#175C46] font-bold text-xs relative">
                          {isPhotoValid ? (
                            <Image
                              src={resident.profile_photo_url!}
                              alt={resident.name}
                              width={36}
                              height={36}
                              className="w-full h-full object-cover"
                              unoptimized
                            />
                          ) : (
                            <span>{getInitials(resident.name)}</span>
                          )}
                        </div>
                      </td>

                      {/* Name (matching Figma: ONLY name, no extra email underneath) */}
                      <td className="py-4 px-4 font-semibold text-gray-900 whitespace-nowrap">
                        {resident.name}
                      </td>

                      {/* Room no. (matching Figma: ONLY room number, no floor text underneath) */}
                      <td className="py-4 px-4 font-medium text-gray-800 whitespace-nowrap">
                        {resident.room_no || 'A-204'}
                      </td>

                      {/* Room type (matching Figma: ONLY room type, no building name) */}
                      <td className="py-4 px-4 font-normal text-gray-700 whitespace-nowrap">
                        Single
                      </td>

                      {/* Phone no. */}
                      <td className="py-4 px-4 font-normal text-gray-700 whitespace-nowrap">
                        {formatPhone(resident.phone)}
                      </td>

                      {/* Status Badge matching Figma */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium capitalize ${
                            isStatusActive
                              ? 'bg-[#E6F4EA] text-[#137333]'
                              : isStatusPending
                              ? 'bg-[#FEF7E0] text-[#B06000]'
                              : 'bg-[#FCE8E6] text-[#C5221F]'
                          }`}
                        >
                          {resident.status}
                        </span>
                      </td>

                      {/* Actions matching Figma: 3 distinct bordered square button boxes */}
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          {/* Eye / View Details Button navigating to detail page */}
                          <Link
                            href={`/dashboard/residents/${resident.id}`}
                            title="View Details"
                            className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-colors cursor-pointer"
                          >
                            <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="1.8">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </Link>

                          {/* Pencil / Edit Button */}
                          <Link
                            href={`/dashboard/residents/${resident.id}/edit`}
                            title="Edit"
                            className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:text-[#175C46] hover:border-gray-300 transition-colors cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </Link>

                          {/* Delete Resident Button */}
                          <button
                            type="button"
                            onClick={() => setDeletingResident(resident)}
                            title="Delete Resident"
                            className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="1.8">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Footer matching Figma */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-gray-400 py-1">
        <span>
          Showing {residents.length > 0 ? (currentPage - 1) * meta.limit + 1 : 0}-
          {Math.min(currentPage * meta.limit, meta.total)} of {meta.total}
        </span>

        {/* Page Buttons matching Figma - dynamic based on actual total records */}
        <div className="inline-flex items-center gap-1.5">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            ‹
          </button>

          {getPageNumbers().map((pg, idx) => {
            if (typeof pg === 'string') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="w-7 h-7 flex items-center justify-center text-gray-400 text-xs"
                >
                  ...
                </span>
              );
            }
            const isActive = pg === currentPage;
            return (
              <button
                key={pg}
                type="button"
                onClick={() => setCurrentPage(pg)}
                className={`w-7 h-7 flex items-center justify-center rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-[#175C46] text-white shadow-2xs'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {pg}
              </button>
            );
          })}

          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            ›
          </button>
        </div>
      </div>

    
      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        visible={Boolean(deletingResident)}
        onHide={() => setDeletingResident(null)}
        title="Delete Resident"
        subtitle="This action cannot be undone"
        confirmLabel="Delete"
        loading={isDeleting}
        onConfirm={async () => {
          if (!deletingResident) return;
          setIsDeleting(true);
          try {
            const res = await residentService.deleteResident(deletingResident.id);
            toastRef.current?.show({
              severity: 'success',
              summary: 'Resident Deleted',
              detail: res.message || 'Resident deleted successfully',
              life: 3000,
            });
            setDeletingResident(null);
            setRefreshTrigger((prev) => prev + 1);
          } catch (err) {
            toastRef.current?.show({
              severity: 'error',
              summary: 'Delete Failed',
              detail: err instanceof Error ? err.message : 'Failed to delete resident',
              life: 3000,
            });
          } finally {
            setIsDeleting(false);
          }
        }}
        message={
          <span>
            Are you sure you want to delete resident{' '}
            <strong className="text-gray-900 font-semibold">{deletingResident?.name}</strong>? All associated records will be removed.
          </span>
        }
      />
    </main>
  );
}
