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

import { AgreementDetailsModal } from '@/components/agreements/agreement-details-modal';

import { DeleteConfirmationModal, Dropdown, DataTable, StatusBadge, IconButton, TableActions, SearchInput } from '@/components/ui';
import { BranchDropdown } from '@/components/residents/branch-dropdown';

const AGREEMENT_TYPE_LABELS: Record<string, string> = {
  rental: 'Rental Agreement',
  '11_months': '11 Months Standard',
  lease: 'Lease Agreement',
  resident: 'Resident Agreement',
};

const formatAgreementType = (val: string) => AGREEMENT_TYPE_LABELS[val] ?? val;

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
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAgreement = async () => {
    if (!deletingRecord) return;
    setIsDeleting(true);
    try {
      const res = await agreementService.deleteAgreement(deletingRecord.id);
      toastRef.current?.show({
        severity: 'success',
        summary: 'Agreement Deleted',
        detail: res.message || 'Agreement deleted successfully',
        life: 3000,
      });
      setIsDeleteModalOpen(false);
      setDeletingRecord(null);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      toastRef.current?.show({
        severity: 'error',
        summary: 'Delete Failed',
        detail: err instanceof Error ? err.message : 'Failed to delete agreement',
        life: 4000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

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
        <Dropdown
          label="Agreement Types"
          value={selectedAgreementType}
          onChange={(e) => {
            setSelectedAgreementType(e.target.value);
            setCurrentPage(1);
          }}
          options={[
            { label: 'All Types', value: '' },
            { label: 'Resident Agreement', value: 'resident' },
            { label: 'Lease Agreement', value: 'lease' },
            { label: 'Rental Agreement', value: 'rental' },
            { label: '11 Months Standard', value: '11_months' },
          ]}
        />

        {/* Status Filter */}
        <Dropdown
          label="Status"
          value={selectedStatus}
          onChange={(e) => {
            setSelectedStatus(e.target.value);
            setCurrentPage(1);
          }}
          options={[
            { label: 'All status', value: '' },
            { label: 'Signed', value: 'signed' },
            { label: 'Pending', value: 'pending' },
            { label: 'Draft', value: 'draft' },
            { label: 'Expired', value: 'expired' },
          ]}
        />

        {/* Search Input using unified SearchInput component */}
        <SearchInput
          value={searchTerm}
          onChange={(val) => setSearchTerm(val)}
          placeholder="Search by resident or agreement no."
        />
      </div>

      {/* Main Agreement Records Table using unified DataTable */}
      <DataTable<AgreementRecord>
        data={records}
        loading={loading}
        loadingLabel="Loading agreement records..."
        emptyTitle="No Agreements Found"
        emptyDescription="No agreement records match your filter criteria."
        pagination={{
          currentPage: meta.page || currentPage,
          totalCount: meta.total ?? records.length,
          pageSize: meta.limit || 6,
          itemCount: records.length,
          itemLabel: 'Agreements',
          onPageChange: (page) => setCurrentPage(page),
        }}
        columns={[
          {
            header: 'Sr no.',
            width: '64px',
            cell: (item, idx) => {
              const srNo =
                item.sr_no ??
                ((meta.page || currentPage) - 1) * (meta.limit || 6) + idx + 1;
              return <span className="font-medium text-gray-900">{srNo}</span>;
            },
          },
          {
            header: 'Agreement no.',
            cell: (item) => <span className="font-semibold text-gray-900">{item.agreement_no}</span>,
          },
          {
            header: 'Resident Name',
            cell: (item) => <span className="font-medium text-gray-900">{item.resident_name}</span>,
          },
          {
            header: 'Room No.',
            cell: (item) => <span className="text-gray-700 font-medium">{item.room_number ?? '—'}</span>,
          },
          {
            header: 'Agreement type',
            cell: (item) => <span className="text-gray-700 font-medium">{formatAgreementType(item.agreement_type)}</span>,
          },
          {
            header: 'Start Date',
            cell: (item) => <span className="text-gray-600">{item.start_date}</span>,
          },
          {
            header: 'End date',
            cell: (item) => <span className="text-gray-600">{item.end_date}</span>,
          },
          {
            header: 'Status',
            align: 'center',
            cell: (item) => <StatusBadge status={item.status} />,
          },
          {
            header: 'Actions',
            align: 'right',
            className: 'whitespace-nowrap',
            cell: (item) => (
              <TableActions align="right">
                <IconButton
                  variant="view"
                  size="md"
                  onClick={() => {
                    setSelectedRecord(item);
                    setIsModalOpen(true);
                  }}
                  title="View Agreement"
                />
                <IconButton
                  variant="edit"
                  size="md"
                  onClick={() => router.push(`/dashboard/residents/agreements/${item.id}/edit`)}
                  title="Edit Agreement"
                />
                <IconButton
                  variant="delete"
                  size="md"
                  onClick={() => {
                    setDeletingRecord(item);
                    setIsDeleteModalOpen(true);
                  }}
                  title="Delete Agreement"
                />
              </TableActions>
            ),
          },
        ]}
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
      <DeleteConfirmationModal
        visible={isDeleteModalOpen}
        onHide={() => {
          setIsDeleteModalOpen(false);
          setDeletingRecord(null);
        }}
        onConfirm={handleDeleteAgreement}
        loading={isDeleting}
        title="Delete Agreement"
        itemName={deletingRecord?.agreement_no || 'this agreement'}
        message={`Are you sure you want to remove ${deletingRecord?.agreement_no || 'this agreement'}? All associated records will be affected.`}
        details={[
          { label: 'Agreement No', value: deletingRecord?.agreement_no || '—' },
          { label: 'Resident', value: deletingRecord?.resident_name || '—' },
        ]}
      />
    </main>
  );
}
