'use client';

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Toast } from 'primereact/toast';
import { DeleteConfirmationModal, Dropdown, DataTable, StatusBadge, IconButton, TableActions, SearchInput } from '@/components/ui';

import { Resident, ResidentMeta, ResidentStats } from '@/types/resident';
import { residentService, DEFAULT_RESIDENT_STATS } from '@/services/resident.service';
import { BranchDropdown } from '@/components/residents/branch-dropdown';

const getInitials = (name?: string): string => {
  if (!name || !name.trim()) return 'R';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
};

const formatPhone = (phone?: string): string => {
  if (!phone) return '-';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
};

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
        <Dropdown
          label="Status"
          value={selectedStatus}
          onChange={(e) => {
            setSelectedStatus(e.target.value);
            setCurrentPage(1);
          }}
          options={[
            { label: 'All Status', value: '' },
            { label: 'Active', value: 'active' },
            { label: 'Pending', value: 'pending' },
            { label: 'Inactive', value: 'inactive' },
          ]}
        />

        {/* Room Type Filter */}
        <Dropdown
          label="Room Type"
          value={selectedRoomType}
          onChange={(e) => {
            setSelectedRoomType(e.target.value);
            setCurrentPage(1);
          }}
          options={[
            { label: 'All types', value: '' },
            { label: 'Single', value: 'Single' },
            { label: 'Double', value: 'Double' },
            { label: 'Triple', value: 'Triple' },
          ]}
        />

        {/* Search Resident Input using unified SearchInput */}
        <SearchInput
          label="Search Resident"
          value={searchTerm}
          onChange={(val) => setSearchTerm(val)}
          placeholder="Search name, phone, room..."
        />
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

      {/* Standardized Residents Table using unified DataTable */}
      <DataTable<Resident>
        data={residents}
        loading={loading}
        loadingLabel="Loading residents..."
        emptyTitle="No Residents Found"
        emptyDescription="No resident records match your filter criteria."
        pagination={{
          currentPage: meta.page || currentPage,
          totalCount: meta.total ?? residents.length,
          pageSize: meta.limit || 10,
          itemCount: residents.length,
          itemLabel: 'Residents',
          onPageChange: (page) => setCurrentPage(page),
        }}
        columns={[
          {
            header: 'Sr no.',
            width: '64px',
            cell: (_item, idx) => {
              const srNo = ((meta.page || currentPage) - 1) * (meta.limit || 10) + idx + 1;
              return <span className="font-medium text-gray-900">{srNo}</span>;
            },
          },
          {
            header: 'Photo',
            width: '60px',
            cell: (resident) => {
              const isPhotoValid = Boolean(
                resident.profile_photo_url && resident.profile_photo_url.trim() !== ''
              );
              return (
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
              );
            },
          },
          {
            header: 'Name',
            cell: (resident) => (
              <span className="font-semibold text-gray-900 whitespace-nowrap">{resident.name}</span>
            ),
          },
          {
            header: 'Room no.',
            cell: (resident) => (
              <span className="font-medium text-gray-800 whitespace-nowrap">
                {resident.room_no || '—'}
              </span>
            ),
          },
          {
            header: 'Room type',
            cell: (resident) => (
              <span className="text-gray-700 capitalize whitespace-nowrap">
                {resident.room_type || 'Single'}
              </span>
            ),
          },
          {
            header: 'Phone no.',
            cell: (resident) => (
              <span className="text-gray-700 whitespace-nowrap">{formatPhone(resident.phone)}</span>
            ),
          },
          {
            header: 'Status',
            cell: (resident) => <StatusBadge status={resident.status} />,
          },
          {
            header: 'Actions',
            align: 'right',
            className: 'whitespace-nowrap',
            cell: (resident) => (
              <TableActions align="right">
                <Link href={`/dashboard/residents/${resident.id}`}>
                  <IconButton variant="view" title="View Details" />
                </Link>
                <Link href={`/dashboard/residents/${resident.id}/edit`}>
                  <IconButton variant="edit" title="Edit Profile" />
                </Link>
                <IconButton
                  variant="delete"
                  onClick={() => setDeletingResident(resident)}
                  title="Delete Resident"
                />
              </TableActions>
            ),
          },
        ]}
      />

      {/* Reusable Delete Confirmation Modal */}
      <DeleteConfirmationModal
        visible={Boolean(deletingResident)}
        onHide={() => setDeletingResident(null)}
        title="Delete Resident"
        itemType="resident"
        itemName={deletingResident?.name}
        details={[
          { label: 'Resident', value: deletingResident?.name || '—' },
          { label: 'Room', value: deletingResident?.room_no || '—' },
        ]}
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
      />
    </main>
  );
}
