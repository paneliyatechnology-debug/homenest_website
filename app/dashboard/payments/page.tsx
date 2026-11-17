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
import { PaymentOverviewStatsCards } from '@/components/payments/payment-overview-stats-cards';
import { PaymentDetailsModal } from '@/components/payments/payment-details-modal';
import { useResetOnNavigation } from '@/hooks';
import { toast } from '@/lib/toast';
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
} from '@/components/ui';

type TabKey = 'all' | 'paid' | 'pending' | 'overdue' | 'refunded' | 'failed';

function getDefaultMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const fmt = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  return { start: fmt(start), end: fmt(end) };
}

export default function PaymentOverviewPage() {
  // Initialize date range to current month to match Figma design
  const defaultDates = useMemo(() => getDefaultMonthRange(), []);
  const [startDate, setStartDate] = useState<string>(defaultDates.start);
  const [endDate, setEndDate] = useState<string>(defaultDates.end);

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

  // Modal State
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Reset Table on Navigation
  const resetTableState = useCallback(() => {
    setActiveTab('all');
    setSelectedBranchId('all');
    setSelectedRoomType('all');
    setSelectedMethod('all');
    setSearchTerm('');
    setDebouncedSearch('');
    const cur = getDefaultMonthRange();
    setStartDate(cur.start);
    setEndDate(cur.end);
    setCurrentPage(1);
    setSelectedPayment(null);
    setIsModalOpen(false);
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
  }, [startDate, endDate, selectedBranchId]);

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
        toast.success(`Payment report (${format.toUpperCase()}) exported successfully`);
      } else {
        toast.info('Export request completed');
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
      cell: (item) => (
        <TableActions>
          <IconButton
            variant="view"
            title="View Details"
            onClick={() => handleView(item)}
          />
        </TableActions>
      ),
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

        {/* Date Filter & Export Button */}
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

        {/* Search Input */}
        <div>
          <SearchInput
            value={searchTerm}
            onChange={(val) => setSearchTerm(val)}
            placeholder="Search resident or transaction ID"
          />
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

      {/* Payment Details Modal */}
      <PaymentDetailsModal
        payment={selectedPayment}
        visible={isModalOpen}
        onHide={() => {
          setIsModalOpen(false);
          setSelectedPayment(null);
        }}
      />
    </main>
  );
}
