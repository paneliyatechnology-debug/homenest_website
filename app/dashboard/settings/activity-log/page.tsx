'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Toast } from 'primereact/toast';
import { AuditLog, AuditMeta, AuditStats } from '@/types/audit';
import { auditService, INITIAL_AUDIT_STATS } from '@/services/audit.service';
import { AuditStatsCards } from '@/components/audit/audit-stats-cards';

import { AuditDetailsModal } from '@/components/audit/audit-details-modal';
import { AppDatePicker, formatDateForApi } from '@/components/ui/app-date-picker';
import { Dropdown, DataTable, IconButton, TableActions } from '@/components/ui';

const MONTH_NAMES = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

function formatDateToCurlFormat(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = MONTH_NAMES[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

export default function AdministrativeActivityLogPage() {
  const toastRef = useRef<Toast>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const datePickerDropdownRef = useRef<HTMLDivElement>(null);

  // Data states
  const [records, setRecords] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats>(INITIAL_AUDIT_STATS);
  const [meta, setMeta] = useState<AuditMeta>({
    page: 1,
    limit: 10,
    total_records: 0,
    total_pages: 1,
    total: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedBranchId] = useState<number | null>(null);

  // Date Range Filter
  const [dateRangeText, setDateRangeText] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Pagination & Modals
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedRecord, setSelectedRecord] = useState<AuditLog | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<boolean>(false);

  // Export State
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setIsExportMenuOpen(false);
      }
      if (datePickerDropdownRef.current && !datePickerDropdownRef.current.contains(e.target as Node)) {
        setIsDatePickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  // Fetch Stats
  useEffect(() => {
    let isMounted = true;
    auditService
      .getAuditStats({
        branch_id: selectedBranchId,
        date_range: dateRangeText,
        start_date: startDate,
        end_date: endDate,
      })
      .then((data) => {
        if (!isMounted) return;
        setStats(data);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [selectedBranchId, dateRangeText, startDate, endDate]);

  // Fetch Audits
  useEffect(() => {
    let isMounted = true;

    auditService
      .getAudits({
        page: currentPage,
        limit: 10,
        branch_id: selectedBranchId,
        module: selectedModule || undefined,
        action: selectedAction || undefined,
        user: selectedUser || undefined,
        date_range: dateRangeText || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
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
  }, [
    currentPage,
    selectedBranchId,
    selectedModule,
    selectedAction,
    selectedUser,
    dateRangeText,
    startDate,
    endDate,
  ]);

  // Handle Export (PDF or Excel)
  const handleExport = async (format: 'pdf' | 'xlsx') => {
    try {
      setExporting(format);
      setIsExportMenuOpen(false);

      toastRef.current?.show({
        severity: 'info',
        summary: 'Export Started',
        detail: `Preparing ${format.toUpperCase()} log export...`,
        life: 2500,
      });

      const res = await auditService.exportAudits({
        format,
        branch_id: selectedBranchId,
        module: selectedModule || undefined,
        action: selectedAction || undefined,
        user: selectedUser || undefined,
        date_range: dateRangeText || undefined,
      });

      const downloadUrl = res.download_url || res.file_url;
      if (downloadUrl) {
        window.open(downloadUrl, '_blank');
      }

      toastRef.current?.show({
        severity: 'success',
        summary: 'Export Complete',
        detail: `Administrative activity log ${format.toUpperCase()} report generated successfully`,
        life: 4000,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Export failed';
      toastRef.current?.show({
        severity: 'error',
        summary: 'Export Failed',
        detail: msg,
        life: 4000,
      });
    } finally {
      setExporting(null);
    }
  };

  // Open Details Modal with fresh ID lookup
  const handleViewRecord = async (record: AuditLog) => {
    setSelectedRecord(record);
    setIsDetailsModalOpen(true);

    try {
      const fullRecord = await auditService.getAuditById(record.id);
      if (fullRecord) {
        setSelectedRecord(fullRecord);
      }
    } catch {
      // Keep existing record in state if fetch fails
    }
  };

  // Dynamic modules list from stats or defaults
  const moduleOptions = useMemo(() => {
    const list = new Set<string>([
      'Residents',
      'Authentication',
      'Rooms',
      'Payments',
      'Complaints',
      'Notices',
      'Settings',
      'Staff',
    ]);
    if (stats.modules) {
      Object.keys(stats.modules).forEach((k) => list.add(k));
    }
    return Array.from(list);
  }, [stats.modules]);

  // Dynamic actions list from stats or defaults
  const actionOptions = useMemo(() => {
    const list = new Set<string>([
      'Update resident profile',
      'User login',
      'Create resident',
      'Delete resident',
      'Create agreement',
      'Update agreement',
      'Delete agreement',
    ]);
    if (stats.actions) {
      Object.keys(stats.actions).forEach((k) => list.add(k));
    }
    return Array.from(list);
  }, [stats.actions]);

  // Dynamic users list from recent logs or defaults
  const userOptions = useMemo(() => {
    const list = new Set<string>(['Aarav sharma', 'Jasmin Korat Updated', 'Admin']);
    records.forEach((r) => {
      if (r.user_name) list.add(r.user_name);
      else if (r.user) list.add(r.user);
    });
    return Array.from(list);
  }, [records]);

  // Quick Date Range Presets
  const applyDatePreset = (preset: 'today' | '7days' | '30days' | 'thisMonth' | 'all') => {
    const today = new Date();
    if (preset === 'today') {
      const formatted = formatDateToCurlFormat(today);
      const iso = formatDateForApi(today);
      setDateRangeText(`${formatted} - ${formatted}`);
      setStartDate(iso);
      setEndDate(iso);
    } else if (preset === '7days') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 7);
      setDateRangeText(`${formatDateToCurlFormat(sevenDaysAgo)} - ${formatDateToCurlFormat(today)}`);
      setStartDate(formatDateForApi(sevenDaysAgo));
      setEndDate(formatDateForApi(today));
    } else if (preset === '30days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      setDateRangeText(`${formatDateToCurlFormat(thirtyDaysAgo)} - ${formatDateToCurlFormat(today)}`);
      setStartDate(formatDateForApi(thirtyDaysAgo));
      setEndDate(formatDateForApi(today));
    } else if (preset === 'thisMonth') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      setDateRangeText(`${formatDateToCurlFormat(firstDay)} - ${formatDateToCurlFormat(lastDay)}`);
      setStartDate(formatDateForApi(firstDay));
      setEndDate(formatDateForApi(lastDay));
    } else if (preset === 'all') {
      setDateRangeText('');
      setStartDate('');
      setEndDate('');
    }
    setCurrentPage(1);
    setIsDatePickerOpen(false);
  };

  // Reset all filters
  const resetFilters = () => {
    setSelectedModule('');
    setSelectedAction('');
    setSelectedUser('');
    setDateRangeText('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(
    selectedModule ||
      selectedAction ||
      selectedUser ||
      dateRangeText ||
      startDate ||
      endDate
  );

  return (
    <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 max-w-[1600px] w-full mx-auto space-y-5 sm:space-y-6 bg-[#F7F7F5]">
      <Toast ref={toastRef} position="top-right" />

      {/* Header matching Figma: Title, Subtitle, and Export Log Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Administrative Activity Log
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-normal mt-0.5">
            Track all admin actions and system changes.
          </p>
        </div>

        {/* Export Log Action Button with Dropdown */}
        <div className="relative shrink-0 self-start sm:self-auto" ref={exportMenuRef}>
          <button
            type="button"
            onClick={() => setIsExportMenuOpen((prev) => !prev)}
            disabled={Boolean(exporting)}
            className="px-6 py-2.5 bg-[#175C46] hover:bg-[#124B38] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-70"
          >
            {exporting ? (
              <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            )}
            <span>Export Log</span>
            <svg
              className={`w-3.5 h-3.5 ml-0.5 transition-transform ${isExportMenuOpen ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Export Dropdown Menu */}
          {isExportMenuOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50 text-xs font-medium">
              <button
                type="button"
                onClick={() => handleExport('pdf')}
                className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 cursor-pointer transition-colors"
              >
                <div className="w-6 h-6 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <svg className="w-3.5 h-3.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Export as PDF</div>
                  <div className="text-[11px] text-gray-400">Activity log document (.pdf)</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleExport('xlsx')}
                className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 cursor-pointer transition-colors border-t border-gray-50"
              >
                <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <svg className="w-3.5 h-3.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Export as Excel</div>
                  <div className="text-[11px] text-gray-400">Spreadsheet table (.xlsx)</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4 Summary Stat Cards matching Figma pixel-for-pixel */}
      <AuditStatsCards stats={stats} />

      {/* Filter Controls Row matching Figma: Modules, Actions, Users, Date Range, Filter Button */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-end gap-3 sm:gap-4 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 flex-1">
          {/* Modules Filter */}
          <Dropdown
            label="Modules"
            value={selectedModule}
            onChange={(e) => {
              setSelectedModule(e.target.value);
              setCurrentPage(1);
            }}
            options={[
              { label: 'All', value: '' },
              ...moduleOptions.map((mod) => ({ label: mod, value: mod })),
            ]}
          />

          {/* Actions Filter */}
          <Dropdown
            label="Actions"
            value={selectedAction}
            onChange={(e) => {
              setSelectedAction(e.target.value);
              setCurrentPage(1);
            }}
            options={[
              { label: 'All', value: '' },
              ...actionOptions.map((act) => ({ label: act, value: act })),
            ]}
          />

          {/* Users Filter */}
          <Dropdown
            label="Users"
            value={selectedUser}
            onChange={(e) => {
              setSelectedUser(e.target.value);
              setCurrentPage(1);
            }}
            options={[
              { label: 'All', value: '' },
              ...userOptions.map((usr) => ({ label: usr, value: usr })),
            ]}
          />

          {/* Date Range Picker Dropdown */}
          <div className="space-y-1 relative" ref={datePickerDropdownRef}>
            <label className="text-xs font-normal text-gray-500 block opacity-0 pointer-events-none select-none">
              Date
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDatePickerOpen((prev) => !prev)}
                className="w-full h-11 px-4 pr-10 py-2.5 bg-white border border-gray-200/90 rounded-xl text-xs sm:text-sm text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#175C46] focus:border-[#175C46] shadow-2xs text-left cursor-pointer transition-all flex items-center justify-between font-sans"
              >
                <span className={`truncate ${dateRangeText ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
                  {dateRangeText || 'Select Date Range'}
                </span>
                <svg
                  className="w-4 h-4 text-gray-400 shrink-0 ml-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Date Range Popover */}
              {isDatePickerOpen && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-50 text-xs">
                  <div className="font-semibold text-gray-800 mb-2.5">Date Range Filter</div>

                  {/* Preset Pills */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <button
                      type="button"
                      onClick={() => applyDatePreset('thisMonth')}
                      className="px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-[#E8F8F0] hover:text-[#175C46] hover:border-[#175C46]/30 text-gray-700 font-medium transition-colors text-center cursor-pointer"
                    >
                      This Month
                    </button>
                    <button
                      type="button"
                      onClick={() => applyDatePreset('today')}
                      className="px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium transition-colors text-center cursor-pointer"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => applyDatePreset('7days')}
                      className="px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium transition-colors text-center cursor-pointer"
                    >
                      Last 7 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => applyDatePreset('30days')}
                      className="px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium transition-colors text-center cursor-pointer"
                    >
                      Last 30 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => applyDatePreset('all')}
                      className="col-span-2 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium transition-colors text-center cursor-pointer"
                    >
                      All Time (Clear)
                    </button>
                  </div>

                  {/* Custom Start & End Date Inputs */}
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <div>
                      <span className="text-[11px] text-gray-500 block mb-1">Start Date</span>
                      <AppDatePicker
                        value={startDate}
                        onChange={(val) => {
                          setStartDate(val);
                          const startD = val ? new Date(val) : null;
                          const endD = endDate ? new Date(endDate) : null;
                          if (startD && endD) {
                            setDateRangeText(`${formatDateToCurlFormat(startD)} - ${formatDateToCurlFormat(endD)}`);
                          }
                        }}
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-gray-500 block mb-1">End Date</span>
                      <AppDatePicker
                        value={endDate}
                        onChange={(val) => {
                          setEndDate(val);
                          const startD = startDate ? new Date(startDate) : null;
                          const endD = val ? new Date(val) : null;
                          if (startD && endD) {
                            setDateRangeText(`${formatDateToCurlFormat(startD)} - ${formatDateToCurlFormat(endD)}`);
                          }
                        }}
                      />
                    </div>
                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsDatePickerOpen(false);
                          setCurrentPage(1);
                        }}
                        className="px-4 py-1.5 bg-[#175C46] text-white rounded-lg font-semibold hover:bg-[#124B38] transition-colors cursor-pointer"
                      >
                        Apply Range
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filter / Reset Action Button matching Figma */}
        <div className="self-end pb-0">
          <button
            type="button"
            onClick={resetFilters}
            title={hasActiveFilters ? 'Reset Filters' : 'Active Filter'}
            className={`h-11 px-4.5 rounded-xl border text-xs sm:text-sm font-medium flex items-center justify-center gap-2 cursor-pointer shadow-2xs transition-colors shrink-0 ${
              hasActiveFilters
                ? 'bg-emerald-50 text-[#175C46] border-[#175C46]/30 hover:bg-emerald-100'
                : 'bg-white text-gray-700 border-gray-200/90 hover:bg-gray-50'
            }`}
          >
            <svg
              className="w-4 h-4 stroke-current"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            <span>{hasActiveFilters ? 'Clear Filter' : 'Filter'}</span>
          </button>
        </div>
      </div>

      {/* Audit Log Table using unified DataTable */}
      <DataTable<AuditLog>
        data={records}
        loading={loading}
        loadingLabel="Loading activity logs..."
        emptyTitle="No Activity Logs Found"
        emptyDescription="No audit records match the current filter or date range criteria."
        pagination={{
          currentPage: meta.page || currentPage,
          totalCount: meta.total_records ?? meta.total ?? 0,
          pageSize: meta.limit || 10,
          itemCount: records.length,
          itemLabel: 'Logs',
          onPageChange: (p) => setCurrentPage(p),
        }}
        columns={[
          {
            header: 'Sr no.',
            width: '64px',
            cell: (item, idx) => {
              const srNo =
                item.sr_no ??
                ((meta.page || currentPage) - 1) * (meta.limit || 10) + idx + 1;
              return <span className="font-medium text-gray-900">{srNo}</span>;
            },
          },
          {
            header: 'User',
            cell: (item) => <span className="font-semibold text-gray-900 whitespace-nowrap">{item.user_name || item.user}</span>,
          },
          {
            header: 'Action',
            cell: (item) => <span className="text-gray-700 font-medium whitespace-nowrap">{item.action}</span>,
          },
          {
            header: 'Module',
            cell: (item) => <span className="text-gray-700 font-medium whitespace-nowrap">{item.module}</span>,
          },
          {
            header: 'Details',
            cell: (item) => (
              <span
                className="text-gray-600 max-w-xs truncate block cursor-pointer"
                title={item.details || item.description}
              >
                {item.details || item.description || '—'}
              </span>
            ),
          },
          {
            header: 'Timestamp',
            cell: (item) => (
              <span className="text-gray-600 whitespace-nowrap">
                {item.timestamp || item.created_at_formatted || item.created_at || '—'}
              </span>
            ),
          },
          {
            header: 'IP address',
            cell: (item) => (
              <span className="font-mono text-gray-600 text-xs whitespace-nowrap">
                {item.ip_address || '—'}
              </span>
            ),
          },
          {
            header: 'Action',
            align: 'center',
            width: '80px',
            cell: (item) => (
              <TableActions align="center">
                <IconButton
                  variant="view"
                  onClick={() => handleViewRecord(item)}
                  title="View Details"
                />
              </TableActions>
            ),
          },
        ]}
      />

      {/* Details View Modal */}
      <AuditDetailsModal
        visible={isDetailsModalOpen}
        onHide={() => {
          setIsDetailsModalOpen(false);
          setSelectedRecord(null);
        }}
        record={selectedRecord}
      />
    </main>
  );
}
