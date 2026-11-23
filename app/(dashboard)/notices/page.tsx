'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Notice,
  NoticeStats,
  NoticePaginationMeta,
  INITIAL_NOTICE_STATS,
  DEFAULT_NOTICE_META,
} from '@/types/notice';
import { noticeService } from '@/services/notice.service';
import { NoticeStatsCards, NoticeDetailsModal } from '@/components/notices';
import { useResetOnNavigation, useSocketEvent, SOCKET_EVENTS } from '@/hooks';
import {
  DataTable,
  ColumnDef,
  IconButton,
  TableActions,
  SearchInput,
  StatusBadge,
  Dropdown,
  DeleteConfirmationModal,
  ClearFilterButton,
} from '@/components/ui';

type NoticeTab = 'all' | 'draft' | 'scheduled' | 'sent';

export default function NoticesPage() {
  const router = useRouter();
  const filterPopoverRef = useRef<HTMLDivElement>(null);

  // Stats state
  const [stats, setStats] = useState<NoticeStats>(INITIAL_NOTICE_STATS);
  const [statsLoading, setStatsLoading] = useState(true);

  // List data state
  const [notices, setNotices] = useState<Notice[]>([]);
  const [meta, setMeta] = useState<NoticePaginationMeta>(DEFAULT_NOTICE_META);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Tabs & Filters
  const [activeTab, setActiveTab] = useState<NoticeTab>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Modal states
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [noticeToDelete, setNoticeToDelete] = useState<Notice | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sendingNoticeId, setSendingNoticeId] = useState<number | null>(null);

  // Real-time WebSocket updates for Notices module
  useSocketEvent(SOCKET_EVENTS.NOTICE_NEW, () => {
    setRefreshKey((k) => k + 1);
  });
  useSocketEvent(SOCKET_EVENTS.NOTICE_STATS_UPDATED, () => {
    setRefreshKey((k) => k + 1);
  });

  // Navigation state reset
  const resetState = useCallback(() => {
    setActiveTab('all');
    setSearchTerm('');
    setDebouncedSearch('');
    setSelectedCategory('all');
    setSelectedPriority('all');
    setCurrentPage(1);
    setSelectedNotice(null);
    setIsDetailsOpen(false);
    setNoticeToDelete(null);
    setIsDeleteModalOpen(false);
    setShowFilterDropdown(false);
  }, []);

  useResetOnNavigation(resetState, { cleanQueryToast: true });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Close filter popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterPopoverRef.current && !filterPopoverRef.current.contains(e.target as Node)) {
        setShowFilterDropdown(false);
      }
    };
    if (showFilterDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilterDropdown]);

  // Load stats
  useEffect(() => {
    let isMounted = true;
    noticeService
      .getNoticeStats()
      .then((data) => {
        if (!isMounted) return;
        setStats(data);
        setStatsLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setStats(INITIAL_NOTICE_STATS);
        setStatsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  // Load notices list
  useEffect(() => {
    let isMounted = true;

    noticeService
      .getNotices({
        page: currentPage,
        limit: 10,
        tab: activeTab,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        priority: selectedPriority !== 'all' ? selectedPriority : undefined,
        search: debouncedSearch || undefined,
      })
      .then((res) => {
        if (!isMounted) return;
        setNotices(res.data);
        setMeta(res.meta);
        setLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setNotices([]);
        setMeta(DEFAULT_NOTICE_META);
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentPage, activeTab, selectedCategory, selectedPriority, debouncedSearch, refreshKey]);

  // Actions
  const handleView = (item: Notice) => {
    setSelectedNotice(item);
    setIsDetailsOpen(true);
  };

  const handleEdit = useCallback(
    (item: Notice) => {
      router.push(`/notices/${item.id}/edit`);
    },
    [router]
  );

  const handleDeleteClick = (item: Notice) => {
    setNoticeToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!noticeToDelete?.id || isDeleting) return;
    try {
      setIsDeleting(true);
      await noticeService.deleteNotice(noticeToDelete.id);
      setIsDeleteModalOpen(false);
      setNoticeToDelete(null);
      setRefreshKey((k) => k + 1);
    } catch {
      // apiClient displays error toast automatically
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSendNotice = useCallback(
    async (noticeId: number) => {
      if (sendingNoticeId === noticeId) return;
      try {
        setSendingNoticeId(noticeId);
        await noticeService.sendNotice(noticeId);
        setRefreshKey((k) => k + 1);
      } catch {
        // apiClient displays error toast automatically
      } finally {
        setSendingNoticeId(null);
      }
    },
    [sendingNoticeId]
  );

  // Tabs list
  const tabs: { key: NoticeTab; label: string }[] = [
    { key: 'all', label: 'All Notices' },
    { key: 'draft', label: 'Drafts' },
    { key: 'scheduled', label: 'Scheduled' },
    { key: 'sent', label: 'Sent' },
  ];

  // Filter options
  const categoryOptions = [
    { label: 'All Categories', value: 'all' },
    { label: 'Maintenance', value: 'Maintenance' },
    { label: 'Important', value: 'Important' },
    { label: 'General', value: 'General' },
    { label: 'Event', value: 'Event' },
    { label: 'Safety', value: 'Safety' },
    { label: 'Other', value: 'Other' },
  ];

  const priorityOptions = [
    { label: 'All Priorities', value: 'all' },
    { label: 'High', value: 'high' },
    { label: 'Medium', value: 'medium' },
    { label: 'Low', value: 'low' },
  ];

  const isFilterActive = selectedCategory !== 'all' || selectedPriority !== 'all';

  const hasActiveFilters = useMemo(() => {
    return (
      selectedCategory !== 'all' ||
      selectedPriority !== 'all' ||
      Boolean(searchTerm.trim())
    );
  }, [selectedCategory, selectedPriority, searchTerm]);

  const clearFilters = () => {
    setSelectedCategory('all');
    setSelectedPriority('all');
    setShowFilterDropdown(false);
    setCurrentPage(1);
  };

  const handleClearAllFilters = () => {
    setSelectedCategory('all');
    setSelectedPriority('all');
    setSearchTerm('');
    setDebouncedSearch('');
    setShowFilterDropdown(false);
    setCurrentPage(1);
  };

  // Table columns definition
  const columns: ColumnDef<Notice>[] = useMemo(
    () => [
      {
        key: 'sr_no',
        header: 'Sr no.',
        width: '70px',
        cell: (item, idx) => (
          <span className="text-gray-500 font-medium">
            {item.sr_no || (currentPage - 1) * meta.limit + idx + 1}
          </span>
        ),
      },
      {
        key: 'title',
        header: 'Title',
        cell: (item) => (
          <div className="max-w-xs">
            <span className="text-gray-900 font-semibold text-xs sm:text-sm line-clamp-1 block">
              {item.title}
            </span>
          </div>
        ),
      },
      {
        key: 'category',
        header: 'Category',
        cell: (item) => (
          <span className="text-gray-700 font-medium capitalize">
            {item.category || 'General'}
          </span>
        ),
      },
      {
        key: 'audience',
        header: 'Audience',
        cell: (item) => (
          <span className="text-gray-700 font-medium">
            {item.audience || (item.audience_type === 'all' ? 'All Residents' : item.branch_name || 'Specific')}
          </span>
        ),
      },
      {
        key: 'priority',
        header: 'Priority',
        cell: (item) => (
          <StatusBadge status={item.priority} label={item.priority} />
        ),
      },
      {
        key: 'schedule_date',
        header: 'Schedule Date',
        cell: (item) => (
          <span className="text-gray-600 text-xs sm:text-sm whitespace-nowrap">
            {item.schedule_date || item.date_time || item.scheduled_at || '—'}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        cell: (item) => (
          <StatusBadge status={item.status} label={item.status} />
        ),
      },
      {
        key: 'actions',
        header: 'Action',
        align: 'right',
        cell: (item) => (
          <TableActions>
            <IconButton
              variant="view"
              title="View Notice Details"
              onClick={() => handleView(item)}
            />
            <IconButton
              variant="edit"
              title="Edit Notice"
              onClick={() => handleEdit(item)}
            />
            <button
              type="button"
              title={item.status === 'sent' ? 'Resend Notice' : 'Send Notice Now'}
              disabled={sendingNoticeId === item.id}
              onClick={() => handleSendNotice(item.id)}
              className="w-8 h-8 rounded-lg border border-gray-200 bg-white text-gray-600 hover:text-[#175C46] hover:border-emerald-300 hover:bg-emerald-50/50 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
            >
              {sendingNoticeId === item.id ? (
                <div className="w-3.5 h-3.5 border-2 border-[#175C46] border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
            <IconButton
              variant="delete"
              title="Delete Notice"
              onClick={() => handleDeleteClick(item)}
            />
          </TableActions>
        ),
      },
    ],
    [currentPage, meta.limit, sendingNoticeId, handleEdit, handleSendNotice]
  );

  return (
    <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 sm:py-6 max-w-[1600px] w-full mx-auto space-y-6 bg-[#F7F7F5] animate-fade-in">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Notice Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-normal mt-0.5">
            Manage and track all communications sent to residents.
          </p>
        </div>

        <Link
          href="/notices/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#175C46] hover:bg-[#124b38] text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span>Create Notice</span>
        </Link>
      </div>

      {/* Notice Stats Cards */}
      <NoticeStatsCards stats={stats} loading={statsLoading} />

      {/* Tabs & Search / Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200/80 pb-2">
        {/* Left Tabs */}
        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setActiveTab(tab.key);
                  setCurrentPage(1);
                }}
                className={`pb-2.5 text-xs sm:text-sm font-semibold transition-all relative whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'text-[#175C46]'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {tab.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#175C46] rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Right Search & Filter Button */}
        <div className="flex items-center gap-2.5 shrink-0 relative">
          <div className="w-56 sm:w-64">
            <SearchInput
              value={searchTerm}
              onChange={(val) => setSearchTerm(val)}
              onClear={() => {
                setSearchTerm('');
                setDebouncedSearch('');
                setCurrentPage(1);
              }}
              placeholder="Search notices..."
              size="sm"
            />
          </div>

          {/* Filter Popover Button */}
          <div className="relative" ref={filterPopoverRef}>
            <button
              type="button"
              onClick={() => setShowFilterDropdown((prev) => !prev)}
              className={`h-9 px-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                isFilterActive
                  ? 'border-[#175C46] bg-emerald-50 text-[#175C46]'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span>Filter</span>
              {isFilterActive && (
                <span className="w-2 h-2 rounded-full bg-[#175C46]" />
              )}
            </button>

            {/* Filter Dropdown Popover */}
            {showFilterDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-gray-100 shadow-xl p-4 z-50 space-y-4 font-sans animate-fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <span className="text-xs font-bold text-gray-900">Filter Notices</span>
                  {isFilterActive && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="text-[11px] font-semibold text-[#175C46] hover:underline cursor-pointer"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Category
                  </label>
                  <Dropdown
                    options={categoryOptions}
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="All Categories"
                    className="w-full text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Priority
                  </label>
                  <Dropdown
                    options={priorityOptions}
                    value={selectedPriority}
                    onChange={(e) => {
                      setSelectedPriority(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="All Priorities"
                    className="w-full text-xs"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowFilterDropdown(false)}
                    className="px-3 py-1.5 bg-[#175C46] hover:bg-[#124b38] text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Dynamic Clear Filter Button */}
          {hasActiveFilters && (
            <ClearFilterButton
              onClick={handleClearAllFilters}
              className="!h-9 !w-9 !rounded-xl"
            />
          )}
        </div>
      </div>

      {/* Notices Table */}
      <DataTable
        columns={columns}
        data={notices}
        loading={loading}
        loadingLabel="Loading notices..."
        emptyTitle="No Notices Found"
        emptyDescription="There are no notices matching your selected filter criteria."
        pagination={{
          currentPage,
          totalCount: meta.total_records,
          pageSize: meta.limit,
          itemCount: notices.length,
          itemLabel: 'notices',
          onPageChange: (page) => setCurrentPage(page),
        }}
      />

      {/* Notice Details Modal */}
      <NoticeDetailsModal
        visible={isDetailsOpen}
        onHide={() => {
          setIsDetailsOpen(false);
          setSelectedNotice(null);
        }}
        notice={selectedNotice}
        onNoticeSent={() => setRefreshKey((k) => k + 1)}
        onEditNotice={(n) => router.push(`/notices/${n.id}/edit`)}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        visible={isDeleteModalOpen}
        onHide={() => {
          setIsDeleteModalOpen(false);
          setNoticeToDelete(null);
        }}
        title="Delete Notice"
        message={
          <span>
            Are you sure you want to remove{' '}
            <strong className="text-gray-900 font-semibold">
              {noticeToDelete?.title || 'this notice'}
            </strong>
            ? All associated records will be affected.
          </span>
        }
        confirmLabel="Delete"
        loading={isDeleting}
        onConfirm={handleDeleteConfirm}
      />
    </main>
  );
}
