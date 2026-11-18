'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Visitor,
  VisitorStats,
  VisitorPaginationMeta,
} from '@/types/visitor';
import { visitorService, DEFAULT_VISITOR_STATS, DEFAULT_VISITOR_META } from '@/services/visitor.service';
import { branchService } from '@/services/branch.service';
import { Branch } from '@/types/branch';
import { VisitorStatsCards } from '@/components/visitors/visitor-stats-cards';
import { VisitorDetailsModal, VisitorStatusModal } from '@/components/visitors';
import {
  Dropdown,
  StatusBadge,
  DataTable,
  ColumnDef,
  IconButton,
  DateRangeFilter,
  DeleteConfirmationModal,
  ClearFilterButton,
} from '@/components/ui';

export default function VisitorsPage() {
  // Data states
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [stats, setStats] = useState<VisitorStats>(DEFAULT_VISITOR_STATS);
  const [meta, setMeta] = useState<VisitorPaginationMeta>(DEFAULT_VISITOR_META);
  const [branches, setBranches] = useState<Branch[]>([]);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // Filters
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedPurpose, setSelectedPurpose] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Check if any filter is active
  const hasActiveFilters = useMemo(() => {
    return (
      selectedBranch !== 'all' ||
      selectedPurpose !== 'all' ||
      selectedStatus !== 'all' ||
      Boolean(startDate) ||
      Boolean(endDate)
    );
  }, [selectedBranch, selectedPurpose, selectedStatus, startDate, endDate]);

  // Clear all filters handler
  const handleClearAllFilters = () => {
    setSelectedBranch('all');
    setSelectedPurpose('all');
    setSelectedStatus('all');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  // Modal states
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [visitorToDelete, setVisitorToDelete] = useState<Visitor | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [visitorToChangeStatus, setVisitorToChangeStatus] = useState<Visitor | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  // Load branches and stats on mount
  useEffect(() => {
    let isMounted = true;

    branchService
      .getBranches({ limit: 100 })
      .then((res) => {
        if (!isMounted) return;
        setBranches(res.data || []);
      })
      .catch((err) => {
        console.warn('Failed to load branches:', err);
      });

    visitorService
      .getVisitorStats()
      .then((data) => {
        if (!isMounted) return;
        setStats(data);
        setStatsLoading(false);
      })
      .catch((err) => {
        console.warn('Failed to load visitor stats:', err);
        if (!isMounted) return;
        setStatsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Fetch visitors list when filters, page, or refreshKey change
  useEffect(() => {
    let isMounted = true;

    visitorService
      .getVisitors({
        page: currentPage,
        limit: 10,
        branch_id: selectedBranch !== 'all' ? selectedBranch : undefined,
        purpose: selectedPurpose !== 'all' ? selectedPurpose : undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      })
      .then((res) => {
        if (!isMounted) return;
        setVisitors(res.data || []);
        setMeta(res.meta || DEFAULT_VISITOR_META);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('Failed to fetch visitors:', err);
        setVisitors([]);
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentPage, selectedBranch, selectedPurpose, selectedStatus, startDate, endDate, refreshKey]);

  // Delete confirmation handler
  const handleDeleteConfirm = async () => {
    if (!visitorToDelete) return;
    try {
      setIsDeleting(true);
      await visitorService.deleteVisitor(visitorToDelete.id);
      setIsDeleteModalOpen(false);
      setVisitorToDelete(null);
      setLoading(true);
      setRefreshKey((k) => k + 1);
      visitorService.getVisitorStats().then(setStats).catch(() => {});
    } catch (err) {
      console.warn('Failed to delete visitor:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Options for Dropdowns
  const branchOptions = [
    { label: 'All', value: 'all' },
    ...branches.map((b) => ({
      label: b.name,
      value: String(b.id),
    })),
  ];

  const purposeOptions = [
    { label: 'All', value: 'all' },
    { label: 'Meeting', value: 'Meeting' },
    { label: 'Personal Visit', value: 'Personal Visit' },
    { label: 'Delivery', value: 'Delivery' },
    { label: 'Maintenance', value: 'Maintenance' },
    { label: 'Other', value: 'Other' },
  ];

  const statusOptions = [
    { label: 'All', value: 'all' },
    { label: 'In Office', value: 'in_office' },
    { label: 'Left', value: 'left' },
    { label: 'Pending', value: 'pending' },
    { label: 'Approved', value: 'approved' },
  ];

  // Table Columns matching Figma pixel-for-pixel
  const columns: ColumnDef<Visitor>[] = [
    {
      key: 'sr_no',
      header: 'Sr no.',
      headerClassName: 'pl-6 w-16',
      cell: (_, index) => (
        <span className="font-semibold text-gray-800 pl-2">
          {(currentPage - 1) * meta.limit + index + 1}
        </span>
      ),
    },
    {
      key: 'visitor_name',
      header: 'Visitor Name',
      cell: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-[#175C46]/10 text-[#175C46] flex items-center justify-center font-bold text-xs shrink-0 relative">
            {item.visitor_photo_url || item.visitor_photo ? (
              <Image
                src={item.visitor_photo_url || item.visitor_photo || ''}
                alt={item.visitor_name}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              item.visitor_name ? item.visitor_name.charAt(0).toUpperCase() : 'V'
            )}
          </div>
          <span className="font-semibold text-gray-900 truncate">
            {item.visitor_name}
          </span>
        </div>
      ),
    },
    {
      key: 'visitor_phone',
      header: 'Phone',
      cell: (item) => (
        <span className="text-gray-600 font-medium whitespace-nowrap">
          {item.visitor_phone}
        </span>
      ),
    },
    {
      key: 'purpose',
      header: 'Purpose',
      cell: (item) => (
        <span className="text-gray-700 font-medium">
          {item.purpose}
        </span>
      ),
    },
    {
      key: 'host_resident',
      header: 'Host Resident',
      cell: (item) => {
        const host = item.host_resident || (item.resident ? `${item.room?.room_no || ''} (${item.resident.name})` : '—');
        return (
          <span className="text-gray-700 font-medium">
            {host}
          </span>
        );
      },
    },
    {
      key: 'entry_time',
      header: 'Entry Time',
      cell: (item) => (
        <span className="text-gray-600 font-medium whitespace-nowrap">
          {item.entry_time || item.last_entry_time || '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (item) => (
        <StatusBadge status={item.status} />
      ),
    },
    {
      key: 'action',
      header: 'Action',
      align: 'right',
      headerClassName: 'pr-6',
      cell: (item) => (
        <div className="flex items-center justify-end gap-1.5 pr-2">
          <IconButton
            variant="view"
            title="View Visitor Pass"
            aria-label="View Visitor Pass"
            onClick={() => {
              setSelectedVisitor(item);
              setIsDetailsOpen(true);
            }}
          />
          <IconButton
            variant="status"
            title="Change Status"
            aria-label="Change Status"
            onClick={() => {
              setVisitorToChangeStatus(item);
              setIsStatusModalOpen(true);
            }}
          />
          <Link href={`/dashboard/visitors/${item.id}/edit`}>
            <IconButton
              variant="edit"
              title="Edit Visitor"
              aria-label="Edit Visitor"
            />
          </Link>
          <IconButton
            variant="delete"
            title="Delete Visitor"
            aria-label="Delete Visitor"
            onClick={() => {
              setVisitorToDelete(item);
              setIsDeleteModalOpen(true);
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 max-w-[1600px] w-full mx-auto space-y-5 bg-[#F7F7F5] min-h-screen">
      {/* Header matching Figma pixel-for-pixel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Visitor Records
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-normal mt-0.5">
            Monitor and manage visitor access and approvals.
          </p>
        </div>

        <Link
          href="/dashboard/visitors/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#175C46] hover:bg-[#124937] text-white text-sm font-semibold transition-colors shadow-2xs shrink-0 self-start sm:self-auto cursor-pointer"
        >
          Add Visitor
        </Link>
      </div>

      {/* 4 Summary Stat Cards matching Figma */}
      <VisitorStatsCards stats={stats} loading={statsLoading} />

      {/* 4 Filters Row covering full width (Branches, Purpose, Status, Date Range) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full items-end pt-1">
        {/* Branches Dropdown */}
        <div className="flex flex-col gap-1 w-full">
          <label className="text-[11px] font-semibold text-gray-500 tracking-tight">
            Branches
          </label>
          <Dropdown
            options={branchOptions}
            value={selectedBranch}
            onChange={(e) => {
              setSelectedBranch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Purpose Dropdown */}
        <div className="flex flex-col gap-1 w-full">
          <label className="text-[11px] font-semibold text-gray-500 tracking-tight">
            Purpose
          </label>
          <Dropdown
            options={purposeOptions}
            value={selectedPurpose}
            onChange={(e) => {
              setSelectedPurpose(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Status Dropdown */}
        <div className="flex flex-col gap-1 w-full">
          <label className="text-[11px] font-semibold text-gray-500 tracking-tight">
            Status
          </label>
          <Dropdown
            options={statusOptions}
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Date Range Filter & Clear Filter Button */}
        <div className="flex flex-col gap-1 w-full">
          <label className="text-[11px] font-semibold text-gray-500 tracking-tight">
            Date Range
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <DateRangeFilter
                startDate={startDate}
                endDate={endDate}
                onChange={(s, e) => {
                  setStartDate(s);
                  setEndDate(e);
                  setCurrentPage(1);
                }}
                placeholder="Select date range"
                className="w-full"
              />
            </div>
            {hasActiveFilters && (
              <ClearFilterButton onClick={handleClearAllFilters} />
            )}
          </div>
        </div>
      </div>

      {/* Visitor Records Data Table */}
      <DataTable
        data={visitors}
        columns={columns}
        loading={loading}
        pagination={{
          currentPage,
          totalCount: meta.total,
          pageSize: meta.limit,
          onPageChange: (p) => setCurrentPage(p),
        }}
        emptyTitle="No Visitors Found"
        emptyDescription="No visitor records found matching your filters."
      />

      {/* Details & Pass Modal */}
      <VisitorDetailsModal
        key={selectedVisitor?.id ? `details-${selectedVisitor.id}` : 'details-modal'}
        visible={isDetailsOpen}
        onHide={() => {
          setIsDetailsOpen(false);
          setSelectedVisitor(null);
        }}
        visitor={selectedVisitor}
        onStatusChange={() => {
          setLoading(true);
          setRefreshKey((k) => k + 1);
          visitorService.getVisitorStats().then(setStats).catch(() => {});
        }}
      />

      {/* Delete Confirmation Modal - only message in description */}
      <DeleteConfirmationModal
        visible={isDeleteModalOpen}
        onHide={() => {
          setIsDeleteModalOpen(false);
          setVisitorToDelete(null);
        }}
        title="Delete Visitor"
        message={
          <span>
            Are you sure you want to delete{' '}
            <strong className="text-gray-900 font-semibold">
              {visitorToDelete?.visitor_name || 'this visitor'}
            </strong>
            ? This action cannot be undone.
          </span>
        }
        confirmLabel="Delete"
        loading={isDeleting}
        onConfirm={handleDeleteConfirm}
      />

      {/* Change Status Modal */}
      <VisitorStatusModal
        key={visitorToChangeStatus?.id ? `status-${visitorToChangeStatus.id}` : 'status-modal'}
        visible={isStatusModalOpen}
        onHide={() => {
          setIsStatusModalOpen(false);
          setVisitorToChangeStatus(null);
        }}
        visitor={visitorToChangeStatus}
        onSuccess={() => {
          setLoading(true);
          setRefreshKey((k) => k + 1);
          visitorService.getVisitorStats().then(setStats).catch(() => {});
        }}
      />
    </main>
  );
}
