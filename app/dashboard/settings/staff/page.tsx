'use client';

import React, { useEffect, useState, useTransition, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { StaffMember, StaffStats, StaffMeta } from '@/types/staff';
import { Branch } from '@/types/branch';
import { staffService, INITIAL_STAFF_STATS } from '@/services/staff.service';
import { branchService } from '@/services/branch.service';
import { StaffStatsCards } from '@/components/staff/staff-stats-cards';
import { StaffDetailsModal } from '@/components/staff/staff-details-modal';
import { StaffStatusModal } from '@/components/staff/staff-status-modal';
import { useResetOnNavigation } from '@/hooks';
import {
  DataTable,
  StatusBadge,
  IconButton,
  TableActions,
  Dropdown,
  SearchInput,
  DeleteConfirmationModal,
  ClearFilterButton,
} from '@/components/ui';

const ROLE_FILTER_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Branch Manager', value: 'BRANCH_MANAGER' },
  { label: 'Kitchen Staff', value: 'KITCHEN_STAFF' },
  { label: 'Housekeeping', value: 'HOUSEKEEPING' },
  { label: 'Security Guard', value: 'SECURITY_GUARD' },
  { label: 'Accountant', value: 'ACCOUNTANT' },
  { label: 'Warden', value: 'WARDEN' },
  { label: 'Maintenance', value: 'MAINTENANCE' },
];

const STATUS_FILTER_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'On Leave', value: 'on_leave' },
  { label: 'Inactive', value: 'inactive' },
];

const formatStaffRole = (role?: string): string => {
  if (!role) return '—';
  const upper = role.toUpperCase();
  const map: Record<string, string> = {
    BRANCH_MANAGER: 'Manager',
    KITCHEN_STAFF: 'Kitchen Staff',
    HOUSEKEEPING: 'Housekeeping',
    SECURITY_GUARD: 'Security Guard',
    ACCOUNTANT: 'Accountant',
    WARDEN: 'Warden',
    MAINTENANCE: 'Maintenance',
  };
  return map[upper] || role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

const getStaffBranches = (staff: StaffMember): string[] => {
  if (staff.branches && staff.branches.length > 0) {
    return staff.branches.map((b) => b.name).filter(Boolean);
  }
  if (staff.branch_names) {
    return staff.branch_names
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (staff.branch_name) {
    return [staff.branch_name.trim()];
  }
  return [];
};

export default function StaffManagementPage() {
  const [, startTransition] = useTransition();

  // Filter States
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');

  // Data States
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [stats, setStats] = useState<StaffStats>(INITIAL_STAFF_STATS);
  const [meta, setMeta] = useState<StaffMeta>({
    page: 1,
    limit: 10,
    total_pages: 1,
    total: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Modals
  const [viewingStaff, setViewingStaff] = useState<StaffMember | null>(null);
  const [statusStaff, setStatusStaff] = useState<StaffMember | null>(null);
  const [deletingStaff, setDeletingStaff] = useState<StaffMember | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check if any filter is active
  const hasActiveFilters = useMemo(() => {
    return (
      selectedBranchId !== 'all' ||
      selectedRole !== 'all' ||
      selectedStatus !== 'all' ||
      Boolean(searchTerm.trim())
    );
  }, [selectedBranchId, selectedRole, selectedStatus, searchTerm]);

  // Clear all filters handler
  const handleClearAllFilters = () => {
    startTransition(() => {
      setSelectedBranchId('all');
      setSelectedRole('all');
      setSelectedStatus('all');
      setSearchTerm('');
      setDebouncedSearch('');
      setCurrentPage(1);
    });
  };

  // Table & Modal Reset callback for page transitions / bfcache
  const resetTableState = useCallback(() => {
    setSelectedBranchId('all');
    setSelectedRole('all');
    setSelectedStatus('all');
    setSearchTerm('');
    setDebouncedSearch('');
    setCurrentPage(1);
    setViewingStaff(null);
    setStatusStaff(null);
    setDeletingStaff(null);
  }, []);

  useResetOnNavigation(resetTableState, { cleanQueryToast: true });

  // Fetch Branches for Filter Dropdown
  useEffect(() => {
    let isMounted = true;
    branchService
      .getBranches({ limit: 50 })
      .then((res) => {
        if (isMounted) setBranches(res.data);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // Debounce search query by 350ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch KPI Stats
  useEffect(() => {
    let isMounted = true;
    staffService
      .getStaffStats(selectedBranchId !== 'all' ? selectedBranchId : undefined)
      .then((data) => {
        if (isMounted) setStats(data);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [selectedBranchId, refreshTrigger]);

  // Fetch Staff List
  useEffect(() => {
    let isMounted = true;

    staffService
      .getStaffList({
        branch_id: selectedBranchId !== 'all' ? selectedBranchId : undefined,
        staff_role: selectedRole !== 'all' ? selectedRole : undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        search: debouncedSearch || undefined,
        page: currentPage,
        limit: 10,
      })
      .then((res) => {
        if (!isMounted) return;
        setStaffList(res.data);
        setMeta(res.meta);
        setLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setStaffList([]);
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [
    selectedBranchId,
    selectedRole,
    selectedStatus,
    debouncedSearch,
    currentPage,
    refreshTrigger,
  ]);

  // Handle Delete Staff
  const handleDeleteStaff = async () => {
    if (!deletingStaff) return;
    setIsDeleting(true);
    try {
      await staffService.deleteStaff(deletingStaff.id);
      setDeletingStaff(null);
      setRefreshTrigger((prev) => prev + 1);
    } catch {
      // Backend error toast is handled automatically by apiClient
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 max-w-[1600px] w-full mx-auto space-y-6">
      {/* Top Header matching Figma: Title, Subtitle, Add staff Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Staff Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-normal mt-0.5">
            Manage your team, roles and assignments.
          </p>
        </div>

        <Link
          href="/dashboard/settings/staff/new"
          className="px-6 py-2.5 bg-[#175C46] hover:bg-[#124B38] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors shrink-0 self-start sm:self-auto inline-flex items-center justify-center cursor-pointer"
        >
          Add staff
        </Link>
      </div>

      {/* 4 Summary Stat Cards matching Figma pixel-for-pixel */}
      <StaffStatsCards stats={stats} />

      {/* Filter Controls Row matching Figma: Branches, Roles, Status, Search */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-end">
        {/* Branches Filter */}
        <Dropdown
          label="Branches"
          value={selectedBranchId}
          onChange={(e) => {
            const val = e.target.value;
            startTransition(() => {
              setSelectedBranchId(val);
              setCurrentPage(1);
            });
          }}
          options={[
            { label: 'All', value: 'all' },
            ...branches.map((b) => ({ label: b.name, value: String(b.id) })),
          ]}
        />

        {/* Roles Filter */}
        <Dropdown
          label="Roles"
          value={selectedRole}
          onChange={(e) => {
            const val = e.target.value;
            startTransition(() => {
              setSelectedRole(val);
              setCurrentPage(1);
            });
          }}
          options={ROLE_FILTER_OPTIONS}
        />

        {/* Status Filter */}
        <Dropdown
          label="Status"
          value={selectedStatus}
          onChange={(e) => {
            const val = e.target.value;
            startTransition(() => {
              setSelectedStatus(val);
              setCurrentPage(1);
            });
          }}
          options={STATUS_FILTER_OPTIONS}
        />

        {/* Search Input & Clear Filter Button matching Figma */}
        <div className="space-y-1">
          <label className="text-xs font-normal text-gray-500 block opacity-0 pointer-events-none select-none">
            Search
          </label>
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
                placeholder="Search staff..."
              />
            </div>
            {hasActiveFilters && (
              <ClearFilterButton onClick={handleClearAllFilters} />
            )}
          </div>
        </div>
      </div>

      {/* Standardized Staff Table using unified DataTable */}
      <DataTable<StaffMember>
        data={staffList}
        loading={loading}
        loadingLabel="Loading staff members..."
        emptyTitle="No Staff Members Found"
        emptyDescription="No staff records match your current filter criteria."
        pagination={{
          currentPage: meta.page || currentPage,
          totalCount: meta.total ?? staffList.length,
          pageSize: meta.limit || 10,
          itemCount: staffList.length,
          itemLabel: 'Staff',
          onPageChange: (page) => setCurrentPage(page),
        }}
        columns={[
          {
            header: 'Sr no.',
            width: '64px',
            cell: (_item, idx) => {
              const srNo = ((meta.page || currentPage) - 1) * (meta.limit || 10) + idx + 1;
              return <span className="font-medium text-gray-900">{srNo}</span>;
            },
          },
          {
            header: 'Name',
            cell: (staff) => (
              <span className="font-semibold text-gray-900 whitespace-nowrap">
                {staff.name}
              </span>
            ),
          },
          {
            header: 'Role',
            cell: (staff) => (
              <span className="text-gray-700 font-medium whitespace-nowrap">
                {formatStaffRole(staff.staff_role || staff.role)}
              </span>
            ),
          },
          {
            header: 'Branch',
            cell: (staff) => {
              const branchList = getStaffBranches(staff);
              if (branchList.length === 0) {
                return <span className="text-gray-400">—</span>;
              }
              if (branchList.length === 1) {
                return (
                  <span
                    className="text-gray-800 font-medium text-xs sm:text-sm truncate max-w-[170px] block"
                    title={branchList[0]}
                  >
                    {branchList[0]}
                  </span>
                );
              }
              const first = branchList[0];
              const remaining = branchList.length - 1;
              const fullTooltip = branchList.join(', ');

              return (
                <div
                  className="flex items-center gap-1.5 whitespace-nowrap"
                  title={fullTooltip}
                >
                  <span className="text-gray-800 font-medium text-xs sm:text-sm truncate max-w-[130px]">
                    {first}
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] font-semibold bg-[#E8F8F0] text-[#175C46] border border-[#175C46]/20 shrink-0 cursor-default hover:bg-[#d5f3e4] transition-colors">
                    +{remaining} more
                  </span>
                </div>
              );
            },
          },
          {
            header: 'Email',
            cell: (staff) => (
              <span className="text-gray-700 font-medium whitespace-nowrap">
                {staff.email}
              </span>
            ),
          },
          {
            header: 'Phone',
            cell: (staff) => (
              <span className="text-gray-700 font-medium whitespace-nowrap">
                {staff.phone}
              </span>
            ),
          },
          {
            header: 'Status',
            cell: (staff) => <StatusBadge status={staff.status} />,
          },
          {
            header: 'Action',
            align: 'right',
            className: 'whitespace-nowrap',
            cell: (staff) => (
              <TableActions align="right">
                <IconButton
                  variant="view"
                  onClick={() => setViewingStaff(staff)}
                  title="View Details"
                />
                <Link href={`/dashboard/settings/staff/${staff.id}/edit`}>
                  <IconButton variant="edit" title="Edit Staff" />
                </Link>
                <IconButton
                  variant="status"
                  onClick={() => setStatusStaff(staff)}
                  title="Change Status"
                />
                <IconButton
                  variant="delete"
                  onClick={() => setDeletingStaff(staff)}
                  title="Delete Staff"
                />
              </TableActions>
            ),
          },
        ]}
      />

      {/* Staff Profile Details Modal */}
      <StaffDetailsModal
        visible={Boolean(viewingStaff)}
        onHide={() => setViewingStaff(null)}
        staff={viewingStaff}
      />

      {/* Change Status Modal */}
      <StaffStatusModal
        visible={Boolean(statusStaff)}
        onHide={() => setStatusStaff(null)}
        staff={statusStaff}
        onSuccess={() => {
          setRefreshTrigger((prev) => prev + 1);
        }}
      />

      {/* Delete Confirmation Modal - only message in description */}
      <DeleteConfirmationModal
        visible={Boolean(deletingStaff)}
        onHide={() => setDeletingStaff(null)}
        title="Delete Staff Member"
        subtitle=""
        message="Are you sure you want to delete this staff member? This action cannot be undone."
        confirmLabel="Delete"
        loading={isDeleting}
        onConfirm={handleDeleteStaff}
      />
    </main>
  );
}
