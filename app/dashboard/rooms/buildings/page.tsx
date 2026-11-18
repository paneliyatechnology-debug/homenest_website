'use client';

import React, { useEffect, useState, useTransition, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building, BuildingMeta, BuildingStats } from '@/types/building';
import { Branch } from '@/types/branch';
import { buildingService, INITIAL_BUILDING_STATS } from '@/services/building.service';
import { branchService } from '@/services/branch.service';
import { BuildingStatsCards } from '@/components/buildings/building-stats-cards';
import { BuildingDetailsModal } from '@/components/buildings/building-details-modal';
import { useResetOnNavigation } from '@/hooks';
import {
  DataTable,
  IconButton,
  TableActions,
  Dropdown,
  SearchInput,
  DeleteConfirmationModal,
} from '@/components/ui';

export default function BuildingsPage() {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Filter States
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');

  // Data States
  const [stats, setStats] = useState<BuildingStats>(INITIAL_BUILDING_STATS);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [meta, setMeta] = useState<BuildingMeta>({
    page: 1,
    limit: 10,
    total_pages: 1,
    total_records: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Modal States
  const [viewingBuildingId, setViewingBuildingId] = useState<number | null>(null);
  const [deletingBuilding, setDeletingBuilding] = useState<Building | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check if any filter is currently applied
  const hasActiveFilters = useMemo(() => {
    return selectedBranchId !== 'all' || Boolean(searchTerm.trim());
  }, [selectedBranchId, searchTerm]);

  // Clear all filters handler
  const handleClearAllFilters = () => {
    startTransition(() => {
      setSelectedBranchId('all');
      setSearchTerm('');
      setDebouncedSearch('');
      setCurrentPage(1);
    });
  };

  // Reset Table on Navigation
  const resetTableState = useCallback(() => {
    setSelectedBranchId('all');
    setSearchTerm('');
    setDebouncedSearch('');
    setCurrentPage(1);
    setViewingBuildingId(null);
    setDeletingBuilding(null);
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
        if (!isMounted) return;
        setBranches([]);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch Building Stats
  useEffect(() => {
    let isMounted = true;
    buildingService
      .getBuildingStats(selectedBranchId !== 'all' ? selectedBranchId : undefined)
      .then((data) => {
        if (!isMounted) return;
        setStats(data);
      })
      .catch(() => {
        if (!isMounted) return;
        setStats(INITIAL_BUILDING_STATS);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedBranchId, refreshTrigger]);

  // Fetch Buildings
  useEffect(() => {
    let isMounted = true;

    buildingService
      .getBuildings({
        page: currentPage,
        limit: 10,
        search: debouncedSearch,
        branch_id: selectedBranchId !== 'all' ? selectedBranchId : undefined,
      })
      .then((res) => {
        if (!isMounted) return;
        setBuildings(res.data);
        setMeta(res.meta);
        setLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setBuildings([]);
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentPage, debouncedSearch, selectedBranchId, refreshTrigger]);

  // Handle Delete Confirmation
  const handleConfirmDelete = async () => {
    if (!deletingBuilding) return;

    setIsDeleting(true);
    try {
      await buildingService.deleteBuilding(deletingBuilding.id);
      setDeletingBuilding(null);
      setRefreshTrigger((prev) => prev + 1);
    } catch {
      // Backend error toast handled automatically
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 max-w-[1600px] w-full mx-auto space-y-6">
      {/* Top Header: Title, Subtitle, Add Building Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Buildings & Floors
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-normal mt-0.5">
            Manage buildings, branch assignments, and floor configurations.
          </p>
        </div>

        <Link
          href="/dashboard/rooms/buildings/new"
          className="px-6 py-2.5 bg-[#175C46] hover:bg-[#124B38] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors shrink-0 self-start sm:self-auto inline-flex items-center justify-center cursor-pointer"
        >
          Add Building
        </Link>
      </div>

      {/* Building Statistics Cards matching Room Module UI */}
      <BuildingStatsCards stats={stats} />

      {/* Filter Row: Branch & Search */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 items-end">
        <Dropdown
          label="Branch"
          value={selectedBranchId}
          onChange={(e) => {
            const val = e.target.value;
            startTransition(() => {
              setSelectedBranchId(val);
              setCurrentPage(1);
            });
          }}
          options={[
            { label: 'All Branches', value: 'all' },
            ...branches.map((b) => ({ label: b.name, value: String(b.id) })),
          ]}
        />

        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-800 block">
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
                placeholder="Search building name"
              />
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearAllFilters}
                title="Clear all filters"
                aria-label="Clear all filters"
                className="h-11 w-11 shrink-0 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/90 flex items-center justify-center transition-all cursor-pointer shadow-2xs group"
              >
                <div className="relative flex items-center justify-center">
                  <svg
                    className="w-4 h-4 stroke-current group-hover:scale-110 transition-transform"
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
                  <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-600 text-white rounded-full flex items-center justify-center text-[9px] font-bold leading-none shadow-xs">
                    &times;
                  </span>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Standardized Buildings Table */}
      <DataTable<Building>
        data={buildings}
        loading={loading}
        loadingLabel="Loading building records..."
        emptyTitle="No Buildings Found"
        emptyDescription="No building records match your current filter criteria."
        pagination={{
          currentPage: meta.page || currentPage,
          totalCount: meta.total_records ?? buildings.length,
          pageSize: meta.limit || 10,
          itemCount: buildings.length,
          itemLabel: 'Buildings',
          onPageChange: (page) => setCurrentPage(page),
        }}
        columns={[
          {
            header: 'Building Name',
            cell: (building) => (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#E8F8F0] text-[#175C46] flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <span className="font-semibold text-gray-900 whitespace-nowrap">
                  {building.name}
                </span>
              </div>
            ),
          },
          {
            header: 'Branch',
            cell: (building) => (
              <span className="text-gray-700 font-medium whitespace-nowrap">
                {building.branch_name || building.branch_title || '—'}
              </span>
            ),
          },
          {
            header: 'Total Floors',
            cell: (building) => {
              const floorCount = building.total_floors ?? building.floors?.length ?? 0;
              return (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#E8F8F0] text-[#175C46]">
                  {floorCount} {floorCount === 1 ? 'Floor' : 'Floors'}
                </span>
              );
            },
          },
          {
            header: 'Floors List',
            cell: (building) => {
              const list = building.floors || [];
              if (list.length === 0) {
                return <span className="text-gray-400 text-xs">—</span>;
              }
              const names = list.map((f) => f.name).join(', ');
              return (
                <span className="text-gray-600 text-xs max-w-[260px] truncate block" title={names}>
                  {names}
                </span>
              );
            },
          },
          {
            header: 'Total Rooms',
            cell: (building) => (
              <span className="text-gray-700 font-medium">
                {building.total_rooms ?? 0}
              </span>
            ),
          },
          {
            header: 'Action',
            align: 'right',
            cell: (building) => (
              <TableActions>
                <IconButton
                  variant="view"
                  title="View building details"
                  onClick={() => setViewingBuildingId(building.id)}
                />
                <IconButton
                  variant="edit"
                  title="Edit building"
                  onClick={() => router.push(`/dashboard/rooms/buildings/${building.id}/edit`)}
                />
                <IconButton
                  variant="delete"
                  title="Delete building"
                  onClick={() => setDeletingBuilding(building)}
                />
              </TableActions>
            ),
          },
        ]}
      />

      {/* Building Details View Modal */}
      <BuildingDetailsModal
        visible={viewingBuildingId !== null}
        onHide={() => setViewingBuildingId(null)}
        buildingId={viewingBuildingId}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        visible={Boolean(deletingBuilding)}
        onHide={() => setDeletingBuilding(null)}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
        confirmLabel="Delete"
        title="Delete Building"
        message="Are you sure you want to delete this building? This action cannot be undone."
      />
    </main>
  );
}
