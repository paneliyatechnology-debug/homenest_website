'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CheckoutListItem,
  CheckoutDetails,
  CheckoutPaginationMeta,
  CheckoutTab,
} from '@/types/checkout';
import { checkoutService } from '@/services/checkout.service';
import { branchService } from '@/services/branch.service';
import { Branch } from '@/types/branch';
import { config } from '@/lib/config';
import {
  DataTable,
  ColumnDef,
  StatusBadge,
  IconButton,
  TableActions,
  Dropdown,
  DateRangeFilter,
  ExportDropdown,
  ExportFormat,
  DeleteConfirmationModal,
  DeleteDetailItem,
} from '@/components/ui';
import {
  CheckoutDetailsModal,
  CheckoutStatusModal,
} from '@/components/checkout';

export default function CheckoutAndRefundApprovalsPage() {
  // Tabs & Filter States
  const [activeTab, setActiveTab] = useState<CheckoutTab>('all');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Pagination & Data States
  const [checkouts, setCheckouts] = useState<CheckoutListItem[]>([]);
  const [meta, setMeta] = useState<CheckoutPaginationMeta>({ total_records: 0 });
  const [branches, setBranches] = useState<Branch[]>([]);

  // Loading States
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  // Export State
  const [isExporting, setIsExporting] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);

  // Modals States
  const [selectedDetails, setSelectedDetails] = useState<CheckoutDetails | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const [statusModalItem, setStatusModalItem] = useState<CheckoutDetails | CheckoutListItem | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  const [itemToDelete, setItemToDelete] = useState<CheckoutListItem | null>(null);
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

  // Load branches for filter
  useEffect(() => {
    branchService
      .getBranches({ limit: 100 })
      .then((res) => setBranches(res.data || []))
      .catch((err) => console.warn('Failed to load branches:', err));
  }, []);

  // Fetch Checkouts List
  useEffect(() => {
    let isMounted = true;

    checkoutService
      .getCheckouts({
        page: currentPage,
        limit: 10,
        branch_id: selectedBranch === 'all' ? undefined : selectedBranch,
        status: activeTab === 'all' ? undefined : activeTab,
        search: debouncedSearch.trim(),
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        date_by: 'departure_date',
      })
      .then((res) => {
        if (!isMounted) return;
        setCheckouts(res.data || []);
        setMeta(res.meta || { total_records: res.data?.length || 0 });
      })
      .catch((err) => console.warn('Failed to load checkouts:', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentPage, selectedBranch, activeTab, debouncedSearch, startDate, endDate, refreshKey]);

  // View Details Modal
  const handleView = useCallback(async (item: CheckoutListItem) => {
    try {
      const details = await checkoutService.getCheckoutById(item.id);
      if (details) {
        setSelectedDetails(details);
        setIsDetailsOpen(true);
      }
    } catch (err) {
      console.warn('Failed to fetch checkout details:', err);
    }
  }, []);

  // Open Status Approval Modal
  const handleOpenStatusModal = useCallback((item: CheckoutDetails | CheckoutListItem) => {
    setStatusModalItem(item);
    setIsStatusModalOpen(true);
  }, []);

  // Delete Action
  const handleDeleteClick = useCallback((item: CheckoutListItem) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  }, []);

  const handleDeleteConfirm = async () => {
    if (!itemToDelete || isDeleting) return;
    try {
      setIsDeleting(true);
      await checkoutService.deleteCheckout(itemToDelete.id);
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
      setRefreshKey((k) => k + 1);
    } catch {
      // apiClient handles alert
    } finally {
      setIsDeleting(false);
    }
  };

  // Export Action
  const handleExport = async (format: ExportFormat) => {
    try {
      setIsExporting(true);
      setExportingFormat(format);
      const apiFormat = format === 'pdf' ? 'pdf' : 'excel';

      const result = await checkoutService.exportCheckouts({
        branch_id: selectedBranch === 'all' ? undefined : selectedBranch,
        status: activeTab === 'all' ? undefined : activeTab,
        search: debouncedSearch.trim(),
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        format: apiFormat,
      });

      if (result?.file_url) {
        const fullUrl = result.file_url.startsWith('http')
          ? result.file_url
          : `${config.api.baseUrl.replace('/api/v1', '')}/${result.file_url.replace(/^\//, '')}`;
        const fileName = result.filename || `checkout-refunds-report.${apiFormat === 'pdf' ? 'pdf' : 'xlsx'}`;

        try {
          const res = await fetch(fullUrl);
          const blob = await res.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);
        } catch {
          window.open(fullUrl, '_blank');
        }
      }
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
      setExportingFormat(null);
    }
  };

  // Tabs List matching image media_1794915924159_0ad2ab2e.png
  const tabs: { key: CheckoutTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
  ];

  // Branch Options
  const branchOptions = [
    { label: 'All Branches', value: 'all' },
    ...branches.map((b) => ({ label: b.name, value: String(b.id) })),
  ];

  // Currency helper
  const formatAmount = (amt?: number) => {
    if (amt === undefined || amt === null) return '₹ 0';
    return `₹ ${Number(amt).toLocaleString('en-IN')}`;
  };

  // Table Columns matching Figma pixel-for-pixel
  const columns: ColumnDef<CheckoutListItem>[] = useMemo(
    () => [
      {
        key: 'sr_no',
        header: 'Sr no.',
        width: '60px',
        cell: (_item: CheckoutListItem, index: number) => (
          <span className="text-gray-600 font-medium text-xs sm:text-sm">
            {(currentPage - 1) * 10 + index + 1}
          </span>
        ),
      },
      {
        key: 'resident',
        header: 'Resident',
        cell: (item: CheckoutListItem) => (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#175C46] font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-100 shadow-2xs">
              {item.resident.name ? item.resident.name.charAt(0).toUpperCase() : 'R'}
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-xs sm:text-sm line-clamp-1">
                {item.resident.name}
              </p>
              {item.resident.phone && (
                <p className="text-[11px] text-gray-500 font-medium">
                  {item.resident.phone}
                </p>
              )}
            </div>
          </div>
        ),
      },
      {
        key: 'room',
        header: 'Room',
        cell: (item: CheckoutListItem) => (
          <div>
            <span className="font-semibold text-gray-900 text-xs sm:text-sm block">
              {item.room?.room_no || '—'}
            </span>
            <span className="text-[11px] text-gray-500 font-medium">
              {item.room?.bed_number || item.room?.room_type || item.branch?.name || 'Main Branch'}
            </span>
          </div>
        ),
      },
      {
        key: 'check_out_date',
        header: 'Check out date',
        cell: (item: CheckoutListItem) => (
          <span className="text-gray-700 font-medium text-xs sm:text-sm whitespace-nowrap">
            {item.check_out_date || '—'}
          </span>
        ),
      },
      {
        key: 'dues',
        header: 'Dues',
        cell: (item: CheckoutListItem) => (
          <span className={`font-semibold text-xs sm:text-sm whitespace-nowrap ${
            item.dues > 0 ? 'text-amber-700 font-bold' : 'text-gray-700'
          }`}>
            {formatAmount(item.dues)}
          </span>
        ),
      },
      {
        key: 'deposit',
        header: 'Deposit',
        cell: (item: CheckoutListItem) => (
          <span className="text-gray-900 font-semibold text-xs sm:text-sm whitespace-nowrap">
            {formatAmount(item.deposit)}
          </span>
        ),
      },
      {
        key: 'refund',
        header: 'Refund',
        cell: (item: CheckoutListItem) => (
          <span className="text-[#175C46] font-bold text-xs sm:text-sm whitespace-nowrap">
            {formatAmount(item.refund)}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        cell: (item: CheckoutListItem) => (
          <StatusBadge status={item.status} label={item.status} />
        ),
      },
      {
        key: 'actions',
        header: 'Action',
        align: 'right',
        cell: (item: CheckoutListItem) => (
          <TableActions>
            <IconButton
              variant="view"
              title="View Departure & Clearance Details"
              onClick={() => handleView(item)}
            />
            <button
              type="button"
              title="Review & Process Clearance"
              onClick={() => handleOpenStatusModal(item)}
              className="w-8 h-8 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-[#175C46] hover:border-emerald-300 hover:bg-emerald-50/50 flex items-center justify-center transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <IconButton
              variant="delete"
              title="Cancel Checkout Request"
              onClick={() => handleDeleteClick(item)}
            />
          </TableActions>
        ),
      },
    ],
    [currentPage, handleView, handleOpenStatusModal, handleDeleteClick]
  );

  const deleteDetails: DeleteDetailItem[] = itemToDelete
    ? [
        { label: 'Resident', value: itemToDelete.resident?.name || '—' },
        { label: 'Room', value: itemToDelete.room?.room_no || '—' },
        { label: 'Departure Date', value: itemToDelete.check_out_date || '—' },
        { label: 'Status', value: itemToDelete.status || '—' },
      ]
    : [];

  return (
    <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 sm:py-6 max-w-[1600px] w-full mx-auto space-y-6 bg-[#F7F7F5] animate-fade-in font-sans">
      {/* Top Header Section matching media_1794915924159_0ad2ab2e.png */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Checkout and Refund Approvals
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-normal mt-0.5">
            Review and process resident departure and refund calculations.
          </p>
        </div>

        <div>
          <ExportDropdown
            label="Export"
            formats={['xlsx', 'pdf']}
            onExport={handleExport}
            isExporting={isExporting}
            exportingFormat={exportingFormat}
          />
        </div>
      </div>

      {/* Tabs Row matching Figma All / Pending / Approved */}
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
              className={`py-3 px-1 border-b-2 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === tab.key
                  ? 'border-[#175C46] text-[#175C46]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {meta.summary && meta.summary[tab.key] !== undefined && (
                <span
                  className={`ml-2 py-0.5 px-2 rounded-full text-[10px] font-bold ${
                    activeTab === tab.key
                      ? 'bg-emerald-100 text-[#175C46]'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {meta.summary[tab.key]}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Filter Row: Branches, Search & Date Range Filter */}
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

        <div className="lg:col-span-2">
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">
            Search Resident or Room
          </label>
          <div className="relative">
            <svg
              className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by resident name or room number..."
              className="w-full h-11 pl-9 pr-3 text-xs sm:text-sm bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#175C46]/20 focus:border-[#175C46] transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">
            Departure Date Range
          </label>
          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onChange={(start, end) => {
              setStartDate(start);
              setEndDate(end);
              setCurrentPage(1);
            }}
            placeholder="Select date range"
            className="w-full"
          />
        </div>
      </div>

      {/* DataTable matching Figma screenshot */}
      <DataTable
        columns={columns}
        data={checkouts}
        loading={loading}
        loadingLabel="Loading checkout requests..."
        emptyTitle="No Checkout Requests Found"
        emptyDescription="There are no checkout or refund requests matching your selected filter criteria."
        pagination={{
          currentPage,
          totalCount: meta.total_records || checkouts.length,
          pageSize: 10,
          itemCount: checkouts.length,
          itemLabel: 'records',
          onPageChange: (page: number) => setCurrentPage(page),
        }}
      />

      {/* Details Modal */}
      <CheckoutDetailsModal
        visible={isDetailsOpen}
        onHide={() => {
          setIsDetailsOpen(false);
          setSelectedDetails(null);
        }}
        checkout={selectedDetails}
        onOpenStatusModal={(c) => handleOpenStatusModal(c)}
      />

      {/* Review & Status Processing Modal */}
      <CheckoutStatusModal
        visible={isStatusModalOpen}
        onHide={() => {
          setIsStatusModalOpen(false);
          setStatusModalItem(null);
        }}
        checkout={statusModalItem}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        visible={isDeleteModalOpen}
        onHide={() => {
          setIsDeleteModalOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Cancel Checkout Request"
        subtitle="This action will cancel and remove the departure request."
        message={
          itemToDelete
            ? `Are you sure you want to cancel the checkout request for ${itemToDelete.resident?.name}?`
            : 'Are you sure you want to cancel this request?'
        }
        details={deleteDetails}
        confirmLabel="Cancel Request"
        loading={isDeleting}
      />
    </main>
  );
}
