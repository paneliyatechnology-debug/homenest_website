'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  PaymentRecord,
  PaymentStats,
  PaymentMeta,
  formatPaymentType,
  formatCurrency,
} from '@/types/payment';
import { paymentService, INITIAL_PAYMENT_STATS } from '@/services/payment.service';
import { PaymentHistoryStatsCards } from '@/components/payments/payment-history-stats-cards';
import { PaymentDetailsModal } from '@/components/payments/payment-details-modal';
import { useResetOnNavigation } from '@/hooks';
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
} from '@/components/ui';

function resolveFileUrl(fileUrl?: string): string {
  if (!fileUrl) return '';
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) return fileUrl;
  const base = config.backendUrl || '';
  return `${base}/${fileUrl.replace(/^\//, '')}`;
}

export default function PaymentHistoryPage() {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Filter States
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
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
  const [downloadingReceiptId, setDownloadingReceiptId] = useState<number | null>(null);

  // Modal State
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Check if any filter is active
  const hasActiveFilters = useMemo(() => {
    return (
      selectedType !== 'all' ||
      selectedStatus !== 'all' ||
      Boolean(searchTerm.trim()) ||
      Boolean(startDate) ||
      Boolean(endDate)
    );
  }, [selectedType, selectedStatus, searchTerm, startDate, endDate]);

  // Clear all filters handler
  const handleClearAllFilters = () => {
    setSelectedType('all');
    setSelectedStatus('all');
    setSearchTerm('');
    setDebouncedSearch('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  // Reset Table on Navigation
  const resetTableState = useCallback(() => {
    setSelectedType('all');
    setSelectedStatus('all');
    setSearchTerm('');
    setDebouncedSearch('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
    setSelectedPayment(null);
    setIsModalOpen(false);
    setDownloadingReceiptId(null);
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

  // Fetch Stats
  useEffect(() => {
    let isMounted = true;
    paymentService
      .getPaymentStats({
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        date_by: 'created_at',
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
  }, [startDate, endDate]);

  // Fetch Payments List
  useEffect(() => {
    let isMounted = true;
    paymentService
      .getPayments({
        page: currentPage,
        limit: 10,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        payment_type: selectedType !== 'all' ? selectedType : undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        date_by: 'created_at',
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
  }, [currentPage, selectedType, selectedStatus, startDate, endDate, debouncedSearch]);

  // Handle Export (Excel or PDF)
  const handleExport = async (format: ExportFormat = 'xlsx') => {
    try {
      setIsExporting(true);
      setExportingFormat(format);
      const result = await paymentService.exportPayments({
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        payment_type: selectedType !== 'all' ? selectedType : undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        date_by: 'created_at',
        search: debouncedSearch || undefined,
        format,
      });

      if (result && result.file_url) {
        const link = document.createElement('a');
        link.href = result.file_url;
        link.setAttribute('download', result.filename || `payments_history.${format}`);
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (err: unknown) {
      console.warn('Failed to export payments history:', err);
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
    if (downloadingReceiptId === payment.id) return;
    try {
      setDownloadingReceiptId(payment.id);
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
    } finally {
      setDownloadingReceiptId(null);
    }
  };

  const formatDateTime = (dateStr?: string | null): string => {
    if (!dateStr) return '—';
    const parts = dateStr.trim().split(' ');
    let d: Date | null = null;
    if (parts.length >= 2 && parts[0].includes('-')) {
      const dParts = parts[0].split('-');
      const tParts = parts[1].split(':');
      if (dParts.length === 3 && dParts[2].length === 4) {
        d = new Date(
          parseInt(dParts[2], 10),
          parseInt(dParts[1], 10) - 1,
          parseInt(dParts[0], 10),
          parseInt(tParts[0] || '0', 10),
          parseInt(tParts[1] || '0', 10)
        );
      } else if (dParts.length === 3 && dParts[0].length === 4) {
        d = new Date(
          parseInt(dParts[0], 10),
          parseInt(dParts[1], 10) - 1,
          parseInt(dParts[2], 10),
          parseInt(tParts[0] || '0', 10),
          parseInt(tParts[1] || '0', 10)
        );
      }
    }
    if (!d || isNaN(d.getTime())) {
      d = new Date(dateStr);
    }
    if (isNaN(d.getTime())) return dateStr;

    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' });
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const hourStr = String(hours).padStart(2, '0');

    return `${day} ${month} ${year}, ${hourStr}:${minutes} ${ampm}`;
  };

  // Payment type options matching enum('rent','maintenance','security_deposit','electricity','other','laundry')
  const typeOptions = [
    { label: 'All Types', value: 'all' },
    { label: 'Rent', value: 'rent' },
    { label: 'Maintenance', value: 'maintenance' },
    { label: 'Security Deposit', value: 'security_deposit' },
    { label: 'Electricity', value: 'electricity' },
    { label: 'Laundry', value: 'laundry' },
    { label: 'Other', value: 'other' },
  ];

  // Status options matching enum('paid','pending','overdue','refunded','failed')
  const statusOptions = [
    { label: 'All status', value: 'all' },
    { label: 'Paid', value: 'paid' },
    { label: 'Pending', value: 'pending' },
    { label: 'Overdue', value: 'overdue' },
    { label: 'Refunded', value: 'refunded' },
    { label: 'Failed', value: 'failed' },
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
      key: 'transaction_id',
      header: 'Transaction Id',
      cell: (item) => (
        <span className="text-gray-900 font-medium">
          {item.transaction_id || `TXN${String(item.id).padStart(6, '0')}`}
        </span>
      ),
    },
    {
      key: 'resident_name',
      header: 'Resident Name',
      cell: (item) => (
        <span className="font-medium text-gray-900">
          {item.resident?.name || 'Aarav sharma'}
        </span>
      ),
    },
    {
      key: 'room_no',
      header: 'Room No.',
      cell: (item) => (
        <span className="text-gray-700 font-medium">{item.room_no || '—'}</span>
      ),
    },
    {
      key: 'payment_type',
      header: 'Payment type',
      cell: (item) => (
        <span className="text-gray-700 font-medium">
          {formatPaymentType(item.payment_type)}
        </span>
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
      key: 'date_time',
      header: 'Date & Time',
      cell: (item) => (
        <span className="text-gray-600 text-xs sm:text-sm whitespace-nowrap">
          {formatDateTime(item.paid_at || item.created_at || item.due_date)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (item) => <StatusBadge status={item.status} />,
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
          <button
            type="button"
            title="Download Receipt"
            disabled={downloadingReceiptId === item.id}
            onClick={() => handleDownloadReceipt(item)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-[#175C46] hover:bg-emerald-50/80 transition-colors cursor-pointer disabled:opacity-50"
          >
            {downloadingReceiptId === item.id ? (
              <div className="w-3.5 h-3.5 border-2 border-[#175C46] border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            )}
          </button>
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
            Payments History and Receipts
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-normal mt-0.5">
            View all payment transactions with receipt details.
          </p>
        </div>

        {/* Export Dropdown Button */}
        <div>
          <ExportDropdown
            onExport={(format) => handleExport(format)}
            isExporting={isExporting}
            exportingFormat={exportingFormat}
          />
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <PaymentHistoryStatsCards stats={stats} />

      {/* Filters Row: 4 responsive columns matching Figma layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-center">
        {/* Date Range Filter */}
        <div className="w-full">
          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onChange={(start, end) => {
              setStartDate(start);
              setEndDate(end);
              setCurrentPage(1);
            }}
            className="w-full"
          />
        </div>

        {/* Payment Types Dropdown */}
        <div>
          <Dropdown
            value={selectedType}
            options={typeOptions}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="All Types"
          />
        </div>

        {/* Status Dropdown */}
        <div>
          <Dropdown
            value={selectedStatus}
            options={statusOptions}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="All status"
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
        loadingLabel="Loading transaction records..."
        emptyTitle="No Transactions Found"
        emptyDescription="There are no transaction records matching your filter criteria."
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
        onDownloadReceipt={handleDownloadReceipt}
      />
    </main>
  );
}
