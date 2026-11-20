'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Branch } from '@/types/branch';
import {
  PaymentRecord,
  PaymentStats,
  PaymentMeta,
  formatPaymentMethod,
  formatCurrency,
} from '@/types/payment';
import { paymentService, INITIAL_PAYMENT_STATS } from '@/services/payment.service';
import { branchService } from '@/services/branch.service';
import {
  PaymentOverviewStatsCards,
  PaymentDetailsModal,
  PaymentFormModal,
  PaymentCollectModal,
  PaymentStatusModal,
} from '@/components/payments';
import { useResetOnNavigation, useSocketEvent, SOCKET_EVENTS } from '@/hooks';
import { config } from '@/lib/config';
import {
  DataTable,
  ColumnDef,
  IconButton,
  TableActions,
  Dropdown,
  SearchInput,
  StatusBadge,
  DateRangeFilter,
  ExportDropdown,
  ExportFormat,
  ClearFilterButton,
  DeleteConfirmationModal,
} from '@/components/ui';

type TabKey = 'all' | 'paid' | 'pending' | 'overdue' | 'refunded' | 'failed';

function resolveFileUrl(fileUrl?: string): string {
  if (!fileUrl) return '';
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) return fileUrl;
  const base = config.backendUrl || '';
  return `${base}/${fileUrl.replace(/^\//, '')}`;
}

export default function PaymentOverviewPage() {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Tab State
  const [activeTab, setActiveTab] = useState<TabKey>('all');

  // Filter States
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [selectedRoomType, setSelectedRoomType] = useState<string>('all');
  const [selectedMethod, setSelectedMethod] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');

  // Data States
  const [stats, setStats] = useState<PaymentStats>(INITIAL_PAYMENT_STATS);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [meta, setMeta] = useState<PaymentMeta>({
    page: 1,
    limit: 10,
    total: 0,
    total_pages: 1,
    total_records: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);

  // Modal States
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentRecord | null>(null);

  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [collectingPayment, setCollectingPayment] = useState<PaymentRecord | null>(null);

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusPayment, setStatusPayment] = useState<PaymentRecord | null>(null);

  const [deletingPayment, setDeletingPayment] = useState<PaymentRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Real-time WebSocket updates for Payment Stats & Billings
  useSocketEvent(SOCKET_EVENTS.PAYMENT_STATS_UPDATED, () => {
    setRefreshTrigger((prev) => prev + 1);
  });
  useSocketEvent(SOCKET_EVENTS.PAYMENT_NEW, () => {
    setRefreshTrigger((prev) => prev + 1);
  });
  useSocketEvent(SOCKET_EVENTS.PAYMENT_STATUS_UPDATED, () => {
    setRefreshTrigger((prev) => prev + 1);
  });

  // Handle Delete Payment
  const handleConfirmDeletePayment = async () => {
    if (!deletingPayment) return;
    setIsDeleting(true);
    try {
      await paymentService.deletePayment(deletingPayment.id);
      setDeletingPayment(null);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: unknown) {
      console.error('Failed to delete payment:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Check if any filter is active
  const hasActiveFilters = useMemo(() => {
    return (
      selectedBranchId !== 'all' ||
      selectedRoomType !== 'all' ||
      selectedMethod !== 'all' ||
      activeTab !== 'all' ||
      Boolean(searchTerm.trim()) ||
      Boolean(startDate) ||
      Boolean(endDate)
    );
  }, [
    selectedBranchId,
    selectedRoomType,
    selectedMethod,
    activeTab,
    searchTerm,
    startDate,
    endDate,
  ]);

  // Clear all filters handler
  const handleClearAllFilters = () => {
    setSelectedBranchId('all');
    setSelectedRoomType('all');
    setSelectedMethod('all');
    setActiveTab('all');
    setSearchTerm('');
    setDebouncedSearch('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  // Reset Table on Navigation
  const resetTableState = useCallback(() => {
    setActiveTab('all');
    setSelectedBranchId('all');
    setSelectedRoomType('all');
    setSelectedMethod('all');
    setSearchTerm('');
    setDebouncedSearch('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
    setSelectedPayment(null);
    setIsModalOpen(false);
    setEditingPayment(null);
    setIsFormModalOpen(false);
    setCollectingPayment(null);
    setIsCollectModalOpen(false);
    setStatusPayment(null);
    setIsStatusModalOpen(false);
    setDeletingPayment(null);
  }, []);

  useResetOnNavigation(resetTableState, { cleanQueryToast: true });

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Fetch Branches
  useEffect(() => {
    let isMounted = true;
    branchService
      .getBranches({ limit: 50, status: 'all', sort_by: 'created_at', order: 'desc' })
      .then((res) => {
        if (!isMounted) return;
        setBranches(res.data);
      })
      .catch(() => {
        if (isMounted) setBranches([]);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch Stats
  useEffect(() => {
    let isMounted = true;
    paymentService
      .getPaymentStats({
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        branch_id: selectedBranchId !== 'all' ? selectedBranchId : undefined,
        date_by: 'due_date',
      })
      .then((data) => {
        if (!isMounted) return;
        setStats(data);
      })
      .catch(() => {
        if (!isMounted) return;
        setStats(INITIAL_PAYMENT_STATS);
      });

    return () => {
      isMounted = false;
    };
  }, [startDate, endDate, selectedBranchId, refreshTrigger]);

  // Fetch Payments List
  useEffect(() => {
    let isMounted = true;
    paymentService
      .getPayments({
        page: currentPage,
        limit: 10,
        status: activeTab === 'all' ? 'all' : activeTab,
        tab: activeTab === 'all' ? undefined : activeTab,
        branch_id: selectedBranchId !== 'all' ? selectedBranchId : undefined,
        room_type: selectedRoomType !== 'all' ? selectedRoomType : undefined,
        payment_method: selectedMethod !== 'all' ? selectedMethod : undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        date_by: 'due_date',
        search: debouncedSearch || undefined,
      })
      .then((res) => {
        if (!isMounted) return;
        setPayments(res.data);
        setMeta(res.meta);
        setLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setPayments([]);
        setMeta({
          page: 1,
          limit: 10,
          total: 0,
          total_pages: 1,
          total_records: 0,
        });
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [
    currentPage,
    activeTab,
    selectedBranchId,
    selectedRoomType,
    selectedMethod,
    startDate,
    endDate,
    debouncedSearch,
    refreshTrigger,
  ]);

  // Handle Export (Excel or PDF)
  const handleExport = async (format: ExportFormat = 'xlsx') => {
    try {
      setIsExporting(true);
      setExportingFormat(format);
      const result = await paymentService.exportPayments({
        status: activeTab === 'all' ? 'all' : activeTab,
        branch_id: selectedBranchId !== 'all' ? selectedBranchId : undefined,
        room_type: selectedRoomType !== 'all' ? selectedRoomType : undefined,
        payment_method: selectedMethod !== 'all' ? selectedMethod : undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        date_by: 'due_date',
        search: debouncedSearch || undefined,
        format,
      });

      if (result && result.file_url) {
        const link = document.createElement('a');
        link.href = result.file_url;
        link.setAttribute('download', result.filename || `payment_report.${format}`);
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (err: unknown) {
      console.warn('Failed to export payment report:', err);
    } finally {
      setIsExporting(false);
      setExportingFormat(null);
    }
  };

  const handleView = (payment: PaymentRecord) => {
    setSelectedPayment(payment);
    setIsModalOpen(true);
  };

  const handleDownloadReceipt = async (payment: PaymentRecord) => {
    try {
      const res = await paymentService.getPaymentReceipt(payment.id);
      if (res?.file_url) {
        const fullUrl = resolveFileUrl(res.file_url);
        const fileName = res.filename || `${res.receipt_no || `receipt-${payment.id}`}.pdf`;
        try {
          const fileResp = await fetch(fullUrl, { mode: 'cors' });
          if (!fileResp.ok) throw new Error('File fetch failed');
          const blob = await fileResp.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
        } catch {
          const link = document.createElement('a');
          link.href = fullUrl;
          link.setAttribute('download', fileName);
          link.setAttribute('target', '_blank');
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
    } catch {
      // Backend success or error notifications are handled automatically by apiClient
    }
  };

  const formatDisplayDate = (dateStr?: string | null): string => {
    if (!dateStr) return '—';
    const clean = dateStr.split(' ')[0];
    let d: Date | null = null;
    const parts = clean.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      } else if (parts[2].length === 4) {
        d = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
      }
    }
    if (!d || isNaN(d.getTime())) {
      d = new Date(dateStr);
    }
    if (isNaN(d.getTime())) return dateStr;

    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'long' }).toLowerCase();
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  // Branch dropdown options
  const branchOptions = useMemo(() => {
    const list = [{ label: 'All Branches', value: 'all' }];
    branches.forEach((b) => {
      list.push({ label: b.name, value: String(b.id) });
    });
    return list;
  }, [branches]);

  // Room type options
  const roomTypeOptions = [
    { label: 'All Room Types', value: 'all' },
    { label: 'Single', value: 'single' },
    { label: 'Double Sharing', value: 'double' },
    { label: 'Triple Sharing', value: 'triple' },
    { label: 'Four Sharing', value: 'four' },
  ];

  // Payment method options matching enum('upi','card','net_banking','wallet','bank_transfer','cash')
  const methodOptions = [
    { label: 'All methods', value: 'all' },
    { label: 'UPI', value: 'upi' },
    { label: 'Card', value: 'card' },
    { label: 'Net Banking', value: 'net_banking' },
    { label: 'Wallet', value: 'wallet' },
    { label: 'Bank Transfer', value: 'bank_transfer' },
    { label: 'Cash', value: 'cash' },
  ];

  // Table Columns matching Figma pixel-for-pixel
  const columns: ColumnDef<PaymentRecord>[] = [
    {
      key: 'sr_no',
      header: 'Sr no.',
      width: '70px',
      cell: (_, idx) => (
        <span className="text-gray-500 font-medium">
          {(currentPage - 1) * meta.limit + idx + 1}
        </span>
      ),
    },
    {
      key: 'resident_name',
      header: 'Resident Name',
      cell: (item) => {
        const name = item.resident?.name || 'Resident';
        const initial = name.charAt(0).toUpperCase();
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#175C46]/10 text-[#175C46] flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
              {item.resident?.profile_photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.resident.profile_photo_url}
                  alt={name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{initial}</span>
              )}
            </div>
            <span className="font-medium text-gray-900 truncate">{name}</span>
          </div>
        );
      },
    },
    {
      key: 'room_no',
      header: 'Room no.',
      cell: (item) => (
        <span className="text-gray-700 font-medium">{item.room_no || '—'}</span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      cell: (item) => (
        <span className="text-gray-900 font-semibold">{formatCurrency(item.amount)}</span>
      ),
    },
    {
      key: 'due_date',
      header: 'Due Date',
      cell: (item) => (
        <span className="text-gray-600 text-xs sm:text-sm whitespace-nowrap">
          {formatDisplayDate(item.due_date)}
        </span>
      ),
    },
    {
      key: 'payment_status',
      header: 'Payment Status',
      cell: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: 'method',
      header: 'Method',
      cell: (item) => (
        <span className="text-gray-700 font-medium">
          {formatPaymentMethod(item.payment_method)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      cell: (item) => {
        const due = (item.amount || 0) - (item.paid_amount || 0);
        const isPaid = (item.status || '').toLowerCase() === 'paid';
        const isPendingOrOverdue =
          item.status?.toLowerCase() === 'pending' ||
          item.status?.toLowerCase() === 'overdue' ||
          due > 0;
        const hasPaymentMethod =
          Boolean(item.payment_method && item.payment_method.toLowerCase() !== 'unpaid') ||
          Boolean(item.paid_at) ||
          isPaid;
        const showCollectButton = !isPaid && !hasPaymentMethod && isPendingOrOverdue;

        return (
          <TableActions>
            {showCollectButton && (
              <button
                type="button"
                onClick={() => {
                  setCollectingPayment(item);
                  setIsCollectModalOpen(true);
                }}
                className="px-2.5 py-1 bg-[#175C46] text-white rounded-lg text-xs font-semibold hover:bg-[#124B38] transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
                title="Collect Payment"
              >
                Collect
              </button>
            )}
            <IconButton
              variant="view"
              title="View Details"
              onClick={() => handleView(item)}
            />
            <IconButton
              variant="status"
              title={isPaid ? 'Cannot change status of paid transaction' : 'Update Status'}
              disabled={isPaid}
              onClick={() => {
                if (isPaid) return;
                setStatusPayment(item);
                setIsStatusModalOpen(true);
              }}
            />
            <IconButton
              variant="edit"
              title={isPaid ? 'Cannot edit paid bill' : 'Edit Payment'}
              disabled={isPaid}
              onClick={() => {
                if (isPaid) return;
                setEditingPayment(item);
                setIsFormModalOpen(true);
              }}
            />
            <IconButton
              variant="delete"
              title={isPaid ? 'Cannot delete paid bill' : 'Delete Payment'}
              disabled={isPaid}
              onClick={() => {
                if (isPaid) return;
                setDeletingPayment(item);
              }}
            />
          </TableActions>
        );
      },
    },
  ];

  return (
    <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 sm:py-6 max-w-[1600px] w-full mx-auto space-y-6 bg-[#F7F7F5] animate-fade-in">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Payments Overview
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-normal mt-0.5">
            Track collections, pending dues and payment totals.
          </p>
        </div>

        {/* Date Filter, Export Button & Record Payment Button */}
        <div className="flex items-center gap-3 flex-wrap">
          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onChange={(start, end) => {
              setStartDate(start);
              setEndDate(end);
              setCurrentPage(1);
            }}
          />

          <ExportDropdown
            onExport={(format) => handleExport(format)}
            isExporting={isExporting}
            exportingFormat={exportingFormat}
          />

          <button
            type="button"
            onClick={() => {
              setEditingPayment(null);
              setIsFormModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-[#175C46] hover:bg-[#124b38] active:bg-[#0e3b2c] text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs hover:shadow-sm transition-all cursor-pointer shrink-0"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <PaymentOverviewStatsCards stats={stats} />

      {/* Tabs Row matching Figma */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-6 sm:space-x-8 overflow-x-auto scrollbar-none" aria-label="Tabs">
          {[
            { key: 'all' as TabKey, label: 'All Payments' },
            { key: 'paid' as TabKey, label: 'Paid' },
            { key: 'pending' as TabKey, label: 'Pending' },
            { key: 'overdue' as TabKey, label: 'Overdue' },
            { key: 'refunded' as TabKey, label: 'Refunded' },
            { key: 'failed' as TabKey, label: 'Failed' },
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setActiveTab(tab.key);
                  setCurrentPage(1);
                }}
                className={`pb-3.5 px-1 border-b-2 font-semibold text-xs sm:text-sm whitespace-nowrap transition-colors cursor-pointer -mb-[1px] ${isActive
                  ? 'border-[#175C46] text-[#175C46]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Filters Row: 4 responsive columns matching Figma layout with clean spacing */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-center pt-2 sm:pt-3">
        {/* Branch Dropdown */}
        <div>
          <Dropdown
            value={selectedBranchId}
            options={branchOptions}
            onChange={(e) => {
              setSelectedBranchId(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="All Branches"
          />
        </div>

        {/* Room Types Dropdown */}
        <div>
          <Dropdown
            value={selectedRoomType}
            options={roomTypeOptions}
            onChange={(e) => {
              setSelectedRoomType(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="All Room Types"
          />
        </div>

        {/* Payment Methods Dropdown */}
        <div>
          <Dropdown
            value={selectedMethod}
            options={methodOptions}
            onChange={(e) => {
              setSelectedMethod(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="All methods"
          />
        </div>

        {/* Search Input & Clear Filter Button */}
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <SearchInput
              value={searchTerm}
              onChange={(val) => setSearchTerm(val)}
              onClear={() => {
                setSearchTerm('');
                setDebouncedSearch('');
                setCurrentPage(1);
              }}
              placeholder="Search resident or transaction ID"
            />
          </div>
          {hasActiveFilters && (
            <ClearFilterButton onClick={handleClearAllFilters} />
          )}
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={payments}
        loading={loading}
        loadingLabel="Loading payment records..."
        emptyTitle="No Payments Found"
        emptyDescription="There are no payment records matching your filter criteria."
        pagination={{
          currentPage,
          totalCount: meta.total_records ?? meta.total,
          pageSize: meta.limit,
          itemCount: payments.length,
          itemLabel: 'records',
          onPageChange: (page) => setCurrentPage(page),
        }}
      />

      {/* Create / Edit Payment Modal */}
      <PaymentFormModal
        visible={isFormModalOpen}
        onHide={() => {
          setIsFormModalOpen(false);
          setEditingPayment(null);
        }}
        onSuccess={() => {
          setRefreshTrigger((prev) => prev + 1);
        }}
        initialPayment={editingPayment}
      />

      {/* Collect Payment Modal */}
      <PaymentCollectModal
        visible={isCollectModalOpen}
        onHide={() => {
          setIsCollectModalOpen(false);
          setCollectingPayment(null);
        }}
        onSuccess={() => {
          setRefreshTrigger((prev) => prev + 1);
        }}
        payment={collectingPayment}
      />

      {/* Payment Details Modal */}
      <PaymentDetailsModal
        payment={selectedPayment}
        visible={isModalOpen}
        onHide={() => {
          setIsModalOpen(false);
          setSelectedPayment(null);
        }}
        onDownloadReceipt={handleDownloadReceipt}
      />

      {/* Payment Status Modal */}
      <PaymentStatusModal
        visible={isStatusModalOpen}
        onHide={() => {
          setIsStatusModalOpen(false);
          setStatusPayment(null);
        }}
        payment={statusPayment}
        onSuccess={() => setRefreshTrigger((prev) => prev + 1)}
      />

      {/* Delete Payment Confirmation Modal */}
      <DeleteConfirmationModal
        visible={Boolean(deletingPayment)}
        onHide={() => setDeletingPayment(null)}
        title="Delete Payment Record"
        itemName={deletingPayment?.title}
        itemType="payment record"
        details={[
          { label: 'Invoice Title', value: deletingPayment?.title || '—' },
          { label: 'Resident', value: deletingPayment?.resident?.name || '—' },
          { label: 'Total Amount', value: formatCurrency(deletingPayment?.amount) },
          { label: 'Status', value: deletingPayment?.status || '—' },
        ]}
        loading={isDeleting}
        onConfirm={handleConfirmDeletePayment}
      />
    </main>
  );
}
