'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LaundryRequest,
  LaundryStats,
  LaundryTab,
  LaundryPaginationMeta,
  INITIAL_LAUNDRY_STATS,
  DEFAULT_LAUNDRY_META,
} from '@/types/laundry';
import { laundryService } from '@/services/laundry.service';
import { branchService } from '@/services/branch.service';
import { Branch } from '@/types/branch';
import {
  DataTable,
  ColumnDef,
  StatusBadge,
  IconButton,
  TableActions,
  Dropdown,
  DeleteConfirmationModal,
  DeleteDetailItem,
} from '@/components/ui';
import {
  LaundryStatsCards,
  LaundryDetailsModal,
  LaundryStatusModal,
  LaundryAssignModal,
  LaundryCatalogModal,
  LaundryBillingTab,
} from '@/components/laundry';

export default function ServiceAndLaundryRequestsPage() {
  const router = useRouter();

  // Tabs & Filter States
  const [activeTab, setActiveTab] = useState<LaundryTab>('all');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');

  // Pagination & Data States
  const [requests, setRequests] = useState<LaundryRequest[]>([]);
  const [meta, setMeta] = useState<LaundryPaginationMeta>(DEFAULT_LAUNDRY_META);
  const [stats, setStats] = useState<LaundryStats>(INITIAL_LAUNDRY_STATS);
  const [branches, setBranches] = useState<Branch[]>([]);

  // Loading States
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  // Modals States
  const [selectedRequest, setSelectedRequest] = useState<LaundryRequest | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [statusModalRequest, setStatusModalRequest] = useState<LaundryRequest | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [assignModalRequest, setAssignModalRequest] = useState<LaundryRequest | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<LaundryRequest | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Search Debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Load branches
  useEffect(() => {
    branchService
      .getBranches({ limit: 100 })
      .then((res) => setBranches(res.data || []))
      .catch((err) => console.warn('Failed to load branches:', err));
  }, []);

  // Fetch Stats
  useEffect(() => {
    laundryService
      .getStats({
        branch_id: selectedBranch === 'all' ? undefined : selectedBranch,
        type: selectedType === 'all' ? undefined : selectedType,
      })
      .then((data) => setStats(data))
      .catch((err) => console.warn('Failed to load stats:', err))
      .finally(() => setStatsLoading(false));
  }, [selectedBranch, selectedType, refreshKey]);

  // Fetch Requests List
  useEffect(() => {
    if (activeTab === 'billing') return;

    let isMounted = true;

    const queryTab = activeTab === 'all' ? 'all' : activeTab === 'service' ? 'service' : 'laundry';

    laundryService
      .getRequests({
        page: currentPage,
        limit: 10,
        branch_id: selectedBranch === 'all' ? undefined : selectedBranch,
        tab: queryTab,
        status: selectedStatus === 'all' ? undefined : selectedStatus,
        type: selectedType === 'all' ? undefined : selectedType,
        search: debouncedSearch.trim(),
      })
      .then((res) => {
        if (!isMounted) return;
        setRequests(res.data || []);
        setMeta(res.meta || DEFAULT_LAUNDRY_META);
      })
      .catch((err) => console.warn('Failed to load requests:', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentPage, activeTab, selectedBranch, selectedStatus, selectedType, debouncedSearch, refreshKey]);

  // Handlers
  const handleView = (item: LaundryRequest) => {
    setSelectedRequest(item);
    setIsDetailsOpen(true);
  };

  const handleOpenStatusModal = (item: LaundryRequest) => {
    setStatusModalRequest(item);
    setIsStatusModalOpen(true);
  };

  const handleOpenAssignModal = (item: LaundryRequest) => {
    setAssignModalRequest(item);
    setIsAssignModalOpen(true);
  };

  const handleDeleteClick = (item: LaundryRequest) => {
    setRequestToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!requestToDelete?.id || isDeleting) return;

    try {
      setIsDeleting(true);
      await laundryService.deleteRequest(requestToDelete.id);
      setIsDeleteModalOpen(false);
      setRequestToDelete(null);
      setRefreshKey((k) => k + 1);
    } catch {
      // apiClient handles backend errors
    } finally {
      setIsDeleting(false);
    }
  };

  // Tabs List
  const tabs: { key: LaundryTab; label: string }[] = [
    { key: 'all', label: 'All Requests' },
    { key: 'service', label: 'Service Requests' },
    { key: 'laundry', label: 'Laundry Requests' },
    { key: 'billing', label: 'Resident Billing' },
  ];

  // Branch Options
  const branchOptions = [
    { label: 'All', value: 'all' },
    ...branches.map((b) => ({ label: b.name, value: String(b.id) })),
  ];

  // Status Options
  const statusOptions = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Completed', value: 'completed' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  // Type Options
  const typeOptions = [
    { label: 'All', value: 'all' },
    { label: 'Laundry', value: 'Laundry' },
    { label: 'Room Cleaning', value: 'Room Cleaning' },
    { label: 'Maintenance', value: 'Maintenance' },
    { label: 'Other', value: 'Other' },
  ];

  // Table Columns matching media_1794912289737_961f372f.jpg pixel-for-pixel
  const columns: ColumnDef<LaundryRequest>[] = useMemo(
    () => [
      {
        key: 'sr_no',
        header: 'Sr no.',
        width: '70px',
        cell: (_: LaundryRequest, idx: number) => (
          <span className="text-gray-500 font-medium">
            {(currentPage - 1) * meta.limit + idx + 1}
          </span>
        ),
      },
      {
        key: 'resident',
        header: 'Resident',
        cell: (item: LaundryRequest) => (
          <div className="max-w-xs">
            <span className="text-gray-900 font-semibold text-xs sm:text-sm block">
              {item.resident?.name || 'Resident'}
            </span>
            {item.room?.room_no && (
              <span className="text-[11px] text-gray-500 font-medium">
                Room {item.room.room_no}
              </span>
            )}
          </div>
        ),
      },
      {
        key: 'type',
        header: 'Type',
        cell: (item: LaundryRequest) => (
          <span className="text-gray-700 font-medium">
            {item.request_type || 'Laundry'}
          </span>
        ),
      },
      {
        key: 'request_detail',
        header: 'Request Detail',
        cell: (item: LaundryRequest) => (
          <div className="max-w-xs">
            <span className="text-gray-900 font-medium text-xs sm:text-sm line-clamp-1 block">
              {item.request_detail || (item.items && item.items.length > 0 ? `${item.items.length} items` : 'Service Request')}
            </span>
            {item.total_amount > 0 && (
              <span className="text-[11px] text-[#175C46] font-bold">
                ₹{item.total_amount}
              </span>
            )}
          </div>
        ),
      },
      {
        key: 'pickup_schedule',
        header: 'Pickup/Schedule',
        cell: (item: LaundryRequest) => (
          <span className="text-gray-600 text-xs sm:text-sm whitespace-nowrap">
            {item.pickup_schedule || item.pickup_date || '—'}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        cell: (item: LaundryRequest) => <StatusBadge status={item.status} label={item.status} />,
      },
      {
        key: 'assign',
        header: 'Assign',
        cell: (item: LaundryRequest) => (
          <span className="text-gray-700 font-medium text-xs sm:text-sm">
            {item.assigned_staff?.name || item.assigned_name || '—'}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Action',
        align: 'right',
        cell: (item: LaundryRequest) => (
          <TableActions>
            <IconButton
              variant="view"
              title="View Request Details"
              onClick={() => handleView(item)}
            />
            <IconButton
              variant="edit"
              title="Edit Request"
              onClick={() => router.push(`/dashboard/settings/services/${item.id}/edit`)}
            />
            <button
              type="button"
              title="Assign Staff"
              onClick={() => handleOpenAssignModal(item)}
              className="w-8 h-8 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-[#175C46] hover:border-emerald-300 hover:bg-emerald-50/50 flex items-center justify-center transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
              </svg>
            </button>
            <IconButton
              variant="status"
              title="Update Status"
              onClick={() => handleOpenStatusModal(item)}
            />
            <IconButton
              variant="delete"
              title="Cancel / Delete Request"
              onClick={() => handleDeleteClick(item)}
            />
          </TableActions>
        ),
      },
    ],
    [currentPage, meta.limit, router]
  );

  const deleteDetails: DeleteDetailItem[] = requestToDelete
    ? [
      { label: 'Request Number', value: requestToDelete.request_number },
      { label: 'Resident', value: requestToDelete.resident?.name || '—' },
      { label: 'Room', value: requestToDelete.room?.room_no ? `Room ${requestToDelete.room.room_no}` : '—' },
      { label: 'Type', value: requestToDelete.request_type || 'Laundry' },
      { label: 'Status', value: <StatusBadge status={requestToDelete.status} label={requestToDelete.status} /> },
    ]
    : [];

  return (
    <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 sm:py-6 max-w-[1600px] w-full mx-auto space-y-6 bg-[#F7F7F5] animate-fade-in font-sans">
      {/* Top Header Section matching media_1794912289737_961f372f.jpg */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Service and Laundry Requests
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-normal mt-0.5">
            Assign and manage resident service and laundry requests.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsCatalogModalOpen(true)}
            className="h-11 px-4 text-xs sm:text-sm font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl shadow-2xs transition-colors cursor-pointer flex items-center gap-2"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Catalog & Rates
          </button>

          <Link
            href="/dashboard/settings/services/new"
            className="h-11 px-5 rounded-xl bg-[#175C46] hover:bg-[#124b38] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Request
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards matching Figma pixel-for-pixel */}
      <LaundryStatsCards stats={stats} loading={statsLoading} />

      {/* Tabs Row */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-6 sm:space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActiveTab(tab.key);
                setCurrentPage(1);
              }}
              className={`py-3 px-1 border-b-2 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${activeTab === tab.key
                ? 'border-[#175C46] text-[#175C46]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* View Switch: Table of Requests vs Resident Billing Tab */}
      {activeTab === 'billing' ? (
        <LaundryBillingTab branchId={selectedBranch} />
      ) : (
        <div className="space-y-4">
          {/* Filters Row matching media_1794912289737_961f372f.jpg */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 items-end">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                Branches
              </label>
              <Dropdown
                options={branchOptions}
                value={selectedBranch}
                onChange={(e) => {
                  setSelectedBranch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                Status
              </label>
              <Dropdown
                options={statusOptions}
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                Types
              </label>
              <Dropdown
                options={typeOptions}
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full"
              />
            </div>

            <div className="relative">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search request..."
                className="w-full h-11 pl-9 pr-3 text-xs sm:text-sm bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#175C46]/20 focus:border-[#175C46] transition-all"
              />
            </div>
          </div>

          {/* Table Container */}
          <DataTable
            columns={columns}
            data={requests}
            loading={loading}
            loadingLabel="Loading requests..."
            emptyTitle="No Requests Found"
            emptyDescription="There are no service or laundry requests matching your selected filter criteria."
            pagination={{
              currentPage,
              totalCount: meta.total || requests.length,
              pageSize: meta.limit || 10,
              itemCount: requests.length,
              itemLabel: 'requests',
              onPageChange: (page: number) => setCurrentPage(page),
            }}
          />
        </div>
      )}

      {/* Modals */}
      <LaundryDetailsModal
        visible={isDetailsOpen}
        onHide={() => {
          setIsDetailsOpen(false);
          setSelectedRequest(null);
        }}
        request={selectedRequest}
        onEdit={(req) => router.push(`/dashboard/settings/services/${req.id}/edit`)}
        onUpdateStatus={(req) => handleOpenStatusModal(req)}
        onAssignStaff={(req) => handleOpenAssignModal(req)}
      />

      <LaundryStatusModal
        visible={isStatusModalOpen}
        onHide={() => {
          setIsStatusModalOpen(false);
          setStatusModalRequest(null);
        }}
        request={statusModalRequest}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />

      <LaundryAssignModal
        visible={isAssignModalOpen}
        onHide={() => {
          setIsAssignModalOpen(false);
          setAssignModalRequest(null);
        }}
        request={assignModalRequest}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />

      <LaundryCatalogModal
        visible={isCatalogModalOpen}
        onHide={() => setIsCatalogModalOpen(false)}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />

      <DeleteConfirmationModal
        visible={isDeleteModalOpen}
        onHide={() => {
          setIsDeleteModalOpen(false);
          setRequestToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Cancel Laundry Request"
        subtitle="This action will cancel and remove the request."
        message={
          requestToDelete
            ? `Are you sure you want to cancel request ${requestToDelete.request_number} for ${requestToDelete.resident?.name}?`
            : 'Are you sure you want to cancel this request?'
        }
        details={deleteDetails}
        confirmLabel="Cancel Request"
        loading={isDeleting}
      />
    </main>
  );
}
