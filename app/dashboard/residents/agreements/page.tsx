'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Toast } from 'primereact/toast';
import { AgreementRecord, AgreementMeta, AgreementStats } from '@/types/agreement';
import {
  agreementService,
  INITIAL_AGREEMENT_STATS,
} from '@/services/agreement.service';
import { AgreementStatsCards } from '@/components/agreements/agreement-stats-cards';
import { AgreementTable } from '@/components/agreements/agreement-table';
import { AgreementDetailsModal } from '@/components/agreements/agreement-details-modal';

import { AgreementDeleteModal } from '@/components/agreements/agreement-delete-modal';
import { BranchDropdown } from '@/components/residents/branch-dropdown';

export default function AgreementRecordsPage() {
  const router = useRouter();
  const toastRef = useRef<Toast>(null);
  const hasShownFlashRef = useRef<boolean>(false);

  const [records, setRecords] = useState<AgreementRecord[]>([]);
  const [stats, setStats] = useState<AgreementStats>(INITIAL_AGREEMENT_STATS);
  const [meta, setMeta] = useState<AgreementMeta>({
    page: 1,
    limit: 6,
    total_pages: 42,
    total: 248,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [selectedAgreementType, setSelectedAgreementType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Selected Record for Eye/Details Modal
  const [selectedRecord, setSelectedRecord] = useState<AgreementRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Edit & Delete Modals
  
  const [deletingRecord, setDeletingRecord] = useState<AgreementRecord | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Trigger data refresh after edit or delete
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Flash toast on redirect
  useEffect(() => {
    if (typeof window === 'undefined' || hasShownFlashRef.current) return;
    try {
      const stored = sessionStorage.getItem('homenest_flash_toast');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.summary) {
          hasShownFlashRef.current = true;
          sessionStorage.removeItem('homenest_flash_toast');
          toastRef.current?.show({
            severity: parsed.severity || 'success',
            summary: parsed.summary,
            detail: parsed.detail,
            life: 3000,
          });
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch Agreements
  useEffect(() => {
    let isMounted = true;
    agreementService
      .getAgreements({
        page: currentPage,
        limit: 6,
        branch_id: selectedBranchId,
        agreement_type: selectedAgreementType,
        status: selectedStatus,
        search: debouncedSearch,
      })
      .then((res) => {
        if (!isMounted) return;
        setRecords(res.data);
        setMeta(res.meta);
        setLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentPage, selectedBranchId, selectedAgreementType, selectedStatus, debouncedSearch, refreshTrigger]);

  // Fetch Stats
  useEffect(() => {
    let isMounted = true;
    agreementService
      .getAgreementStats({ branch_id: selectedBranchId })
      .then((data) => { if (isMounted) setStats(data); })
      .catch(() => {});
    return () => { isMounted = false; };
  }, [selectedBranchId, refreshTrigger]);

  return (
    <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 max-w-[1600px] w-full mx-auto space-y-5 sm:space-y-6 bg-[#F7F7F5]">
      <Toast ref={toastRef} position="top-right" />

      {/* Header: Title & Subtitle + "New Agreement" Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Agreement Records
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-normal mt-0.5">
            Manage and track all resident agreement.
          </p>
        </div>

        <Link
          href="/dashboard/residents/agreements/new"
          className="px-6 py-2.5 bg-[#175C46] hover:bg-[#124B38] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors shrink-0 self-start sm:self-auto inline-flex items-center justify-center cursor-pointer"
        >
          New Agreement
        </Link>
      </div>

      {/* 5 Summary Stat Cards matching Figma pixel-for-pixel */}
      <AgreementStatsCards stats={stats} />

      {/* Filter Controls Row matching Figma: Branch, Agreement Types, Status, and Search Input */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-end">
        {/* Branch Filter */}
        <div className="space-y-1">
          <label className="text-xs font-normal text-gray-500 block">Branch</label>
          <BranchDropdown
            selectedBranchId={selectedBranchId}
            onSelectBranch={(id) => {
              setSelectedBranchId(id);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Agreement Types Filter */}
        <div className="space-y-1">
          <label className="text-xs font-normal text-gray-500 block">Agreement Types</label>
          <div className="relative">
            <select
              value={selectedAgreementType}
              onChange={(e) => {
                setSelectedAgreementType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-11 px-4 py-2 bg-white rounded-xl border border-gray-200/90 hover:border-gray-300 text-xs sm:text-sm text-gray-800 outline-none focus:border-[#175C46] focus:ring-1 focus:ring-[#175C46] transition-all appearance-none cursor-pointer pr-9 shadow-2xs"
            >
              <option value="">All Types</option>
              <option value="resident">Resident Agreement</option>
              <option value="lease">Lease Agreement</option>
              <option value="rental">Rental Agreement</option>
              <option value="11_months">11 Months Standard</option>
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

        {/* Status Filter */}
        <div className="space-y-1">
          <label className="text-xs font-normal text-gray-500 block">Status</label>
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-11 px-4 py-2 bg-white rounded-xl border border-gray-200/90 hover:border-gray-300 text-xs sm:text-sm text-gray-800 outline-none focus:border-[#175C46] focus:ring-1 focus:ring-[#175C46] transition-all appearance-none cursor-pointer pr-9 shadow-2xs"
            >
              <option value="">All status</option>
              <option value="signed">Signed</option>
              <option value="pending">Pending</option>
              <option value="draft">Draft</option>
              <option value="expired">Expired</option>
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

        {/* Search Input matching placeholder "Search by resident or agreement no." */}
        <div className="space-y-1">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by resident or agreement no."
              className="w-full h-11 pl-10 pr-8 py-2 bg-white rounded-xl border border-gray-200/90 hover:border-gray-300 text-xs sm:text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#175C46] focus:ring-1 focus:ring-[#175C46] transition-all shadow-2xs"
            />
            <svg
              className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-current"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 font-bold text-sm w-4 h-4 flex items-center justify-center cursor-pointer"
              >
                &times;
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Agreement Records Table */}
      <AgreementTable
        records={records}
        meta={meta}
        loading={loading}
        onPageChange={(page) => setCurrentPage(page)}
        onViewRecord={(record) => {
          setSelectedRecord(record);
          setIsModalOpen(true);
        }}
        onEditRecord={(record) => {
          router.push(`/dashboard/residents/agreements/${record.id}/edit`);
        }}
        onDeleteRecord={(record) => {
          setDeletingRecord(record);
          setIsDeleteModalOpen(true);
        }}
      />

      {/* View Agreement Details Modal */}
      <AgreementDetailsModal
        visible={isModalOpen}
        onHide={() => {
          setIsModalOpen(false);
          setSelectedRecord(null);
        }}
        record={selectedRecord}
      />

      
      {/* Delete Confirmation Modal */}
      <AgreementDeleteModal
        visible={isDeleteModalOpen}
        onHide={() => {
          setIsDeleteModalOpen(false);
          setDeletingRecord(null);
        }}
        record={deletingRecord}
        onSuccess={() => setRefreshTrigger((prev) => prev + 1)}
        showToast={(severity, summary, detail) => {
          toastRef.current?.show({ severity, summary, detail, life: 3000 });
        }}
      />
    </main>
  );
}
