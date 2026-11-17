'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Complaint,
  ComplaintCategory,
  ComplaintStats,
  ComplaintMeta,
  INITIAL_COMPLAINT_STATS,
} from '@/types/complaint';
import { complaintService } from '@/services/complaint.service';
import { ComplaintStatsCards } from '@/components/complaints/complaint-stats-cards';
import {
  Dropdown,
  SearchInput,
  StatusBadge,
  DataTable,
  ColumnDef,
  IconButton,
} from '@/components/ui';

function formatComplaintDate(dateStr?: string | null): string {
  if (!dateStr || !dateStr.trim()) return '—';

  // DD-MM-YYYY or DD/MM/YYYY
  const match = dateStr.match(/^(\d{2})[-/](\d{2})[-/](\d{4})/);
  if (match) {
    return `${match[1]}/${match[2]}/${match[3]}`;
  }

  // YYYY-MM-DD
  const ymdMatch = dateStr.match(/^(\d{4})[-/](\d{2})[-/](\d{2})/);
  if (ymdMatch) {
    return `${ymdMatch[3]}/${ymdMatch[2]}/${ymdMatch[1]}`;
  }

  // ISO date
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    const day = String(parsed.getDate()).padStart(2, '0');
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const year = parsed.getFullYear();
    return `${day}/${month}/${year}`;
  }

  return dateStr;
}

export default function ComplaintsPage() {
  // Data states
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState<ComplaintStats>(INITIAL_COMPLAINT_STATS);
  const [categories, setCategories] = useState<ComplaintCategory[]>([]);
  const [meta, setMeta] = useState<ComplaintMeta>({
    page: 1,
    limit: 10,
    total_pages: 1,
    total: 0,
  });

  // Loading states
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Load Categories & Initial Stats on mount
  useEffect(() => {
    let isMounted = true;

    complaintService
      .getCategories()
      .then((data) => {
        if (!isMounted) return;
        setCategories(data);
      })
      .catch((err) => {
        console.warn('Failed to load categories:', err);
      });

    complaintService
      .getStats()
      .then((data) => {
        if (!isMounted) return;
        setStats(data);
        setStatsLoading(false);
      })
      .catch((err) => {
        console.warn('Failed to load stats:', err);
        if (isMounted) setStatsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch Complaints when filters change
  useEffect(() => {
    let isMounted = true;

    complaintService
      .getComplaints({
        page: currentPage,
        limit: 10,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        category_id: selectedCategory !== 'all' ? selectedCategory : undefined,
        priority: selectedPriority !== 'all' ? selectedPriority : undefined,
        search: searchTerm.trim() || undefined,
      })
      .then((res) => {
        if (!isMounted) return;
        setComplaints(res.data);
        setMeta(res.meta);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('Failed to load complaints:', err);
        setComplaints([]);
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentPage, selectedCategory, selectedPriority, selectedStatus, searchTerm]);

  // Dropdown options
  const categoryOptions = useMemo(() => {
    const list = [{ label: 'All', value: 'all' }];
    categories.forEach((cat) => {
      list.push({ label: cat.name, value: String(cat.id) });
    });
    return list;
  }, [categories]);

  const priorityOptions = [
    { label: 'All', value: 'all' },
    { label: 'High', value: 'HIGH' },
    { label: 'Medium', value: 'MEDIUM' },
    { label: 'Low', value: 'LOW' },
  ];

  const statusOptions = [
    { label: 'All', value: 'all' },
    { label: 'Open', value: 'OPEN' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'Resolved', value: 'RESOLVED' },
  ];

  // Table Columns Definition matching Figma
  const columns: ColumnDef<Complaint>[] = [
    {
      key: 'sr_no',
      header: 'Sr no.',
      width: '60px',
      cell: (_item, index) => (
        <span className="text-gray-500 font-medium">
          {(currentPage - 1) * meta.limit + index + 1}
        </span>
      ),
    },
    {
      key: 'complaint_number',
      header: 'Complaint Id',
      cell: (item) => (
        <Link
          href={`/dashboard/complaints/${item.id}`}
          className="font-semibold text-gray-900 hover:text-[#175C46] transition-colors whitespace-nowrap"
        >
          {item.complaint_number || `CMP-${item.id}`}
        </Link>
      ),
    },
    {
      key: 'title',
      header: 'Title/Issue',
      cell: (item) => (
        <span className="font-medium text-gray-900 max-w-[200px] truncate block" title={item.title}>
          {item.title}
        </span>
      ),
    },
    {
      key: 'resident',
      header: 'Resident',
      cell: (item) => (
        <span className="text-gray-700 whitespace-nowrap">
          {item.resident?.name || '—'}
        </span>
      ),
    },
    {
      key: 'room_no',
      header: 'Room no.',
      cell: (item) => (
        <span className="text-gray-700 font-medium whitespace-nowrap">
          {item.location?.room_no || '—'}
        </span>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      cell: (item) => (
        <span className="text-gray-600 whitespace-nowrap">
          {item.category?.name || 'General'}
        </span>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      cell: (item) => (
        <StatusBadge status={item.priority} />
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
      key: 'created_at',
      header: 'Created on',
      cell: (item) => (
        <span className="text-gray-500 whitespace-nowrap">
          {formatComplaintDate(item.created_at)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      headerClassName: 'pr-6',
      cell: (item) => (
        <div className="flex items-center justify-end pr-2">
          <Link href={`/dashboard/complaints/${item.id}`}>
            <IconButton
              variant="view"
              title="View Complaint Details"
              aria-label="View Complaint Details"
            />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 max-w-[1600px] w-full mx-auto space-y-5 bg-[#F7F7F5] min-h-screen">
      {/* Header matching Figma pixel-for-pixel */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
          Complaint Management
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 font-normal mt-0.5">
          View, filter and manage all resident complaints.
        </p>
      </div>

      {/* 5 Summary Stat Cards matching Figma */}
      <ComplaintStatsCards stats={stats} loading={statsLoading} />

      {/* Filters Row: Categories, Priorities, Status, Search */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-center">
        {/* Categories Dropdown */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-gray-500 tracking-tight">
            Categories
          </label>
          <Dropdown
            options={categoryOptions}
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Priorities Dropdown */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-gray-500 tracking-tight">
            Priorities
          </label>
          <Dropdown
            options={priorityOptions}
            value={selectedPriority}
            onChange={(e) => {
              setSelectedPriority(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Status Dropdown */}
        <div className="flex flex-col gap-1">
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

        {/* Search Input */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-gray-500 tracking-tight opacity-0 select-none">
            Search
          </label>
          <SearchInput
            placeholder="Search complaint ID, title..."
            value={searchTerm}
            onChange={(val) => {
              setSearchTerm(val);
              setCurrentPage(1);
            }}
            onClear={() => {
              setSearchTerm('');
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* Complaints Data Table using reusable DataTable component */}
      <DataTable
        columns={columns}
        data={complaints}
        loading={loading}
        loadingLabel="Loading complaints..."
        emptyTitle="No Complaints Found"
        emptyDescription="There are no complaints matching the selected filter criteria."
        pagination={{
          currentPage,
          totalCount: meta.total,
          pageSize: meta.limit,
          itemCount: complaints.length,
          itemLabel: 'complaints',
          onPageChange: (page) => setCurrentPage(page),
        }}
      />
    </main>
  );
}
