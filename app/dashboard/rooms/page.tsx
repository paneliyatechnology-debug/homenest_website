'use client';

import React, { useEffect, useState, useTransition, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Room, RoomStats, RoomMeta, RoomBuilding } from '@/types/room';
import { Branch } from '@/types/branch';
import { roomService, INITIAL_ROOM_STATS } from '@/services/room.service';
import { branchService } from '@/services/branch.service';
import { RoomStatsCards } from '@/components/rooms/room-stats-cards';
import { RoomDetailsModal } from '@/components/rooms/room-details-modal';
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

const STATUS_FILTER_OPTIONS = [
  { label: 'All Status', value: 'all' },
  { label: 'Occupied', value: 'occupied' },
  { label: 'Vacant', value: 'vacant' },
  { label: 'Maintenance', value: 'maintenance' },
  { label: 'Out of service', value: 'out_of_service' },
];

const ROOM_TYPE_FILTER_OPTIONS = [
  { label: 'All Types', value: 'all' },
  { label: 'Single', value: 'single' },
  { label: 'Double Sharing', value: 'double' },
  { label: 'Triple Sharing', value: 'triple' },
  { label: 'Four Sharing', value: 'four' },
];

export default function RoomInventoryPage() {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Filter States
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [buildings, setBuildings] = useState<RoomBuilding[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('all');
  const [selectedFloorId, setSelectedFloorId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedRoomType, setSelectedRoomType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');

  // Data States
  const [rooms, setRooms] = useState<Room[]>([]);
  const [stats, setStats] = useState<RoomStats>(INITIAL_ROOM_STATS);
  const [meta, setMeta] = useState<RoomMeta>({
    page: 1,
    limit: 10,
    total_pages: 1,
    total_items: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Modals
  const [viewingRoomId, setViewingRoomId] = useState<number | null>(null);
  const [deletingRoom, setDeletingRoom] = useState<Room | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check if any filter is currently applied
  const hasActiveFilters = useMemo(() => {
    return (
      selectedBranchId !== 'all' ||
      selectedBuildingId !== 'all' ||
      selectedFloorId !== 'all' ||
      selectedStatus !== 'all' ||
      selectedRoomType !== 'all' ||
      Boolean(searchTerm.trim())
    );
  }, [
    selectedBranchId,
    selectedBuildingId,
    selectedFloorId,
    selectedStatus,
    selectedRoomType,
    searchTerm,
  ]);

  // Clear all filters handler
  const handleClearAllFilters = () => {
    startTransition(() => {
      setSelectedBranchId('all');
      setSelectedBuildingId('all');
      setSelectedFloorId('all');
      setSelectedStatus('all');
      setSelectedRoomType('all');
      setSearchTerm('');
      setDebouncedSearch('');
      setCurrentPage(1);
    });
  };

  // Table & Modal Reset callback for page transitions / navigation
  const resetTableState = useCallback(() => {
    setSelectedBranchId('all');
    setSelectedBuildingId('all');
    setSelectedFloorId('all');
    setSelectedStatus('all');
    setSelectedRoomType('all');
    setSearchTerm('');
    setDebouncedSearch('');
    setCurrentPage(1);
    setViewingRoomId(null);
    setDeletingRoom(null);
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
      .getBranches({ limit: 50 })
      .then((res) => {
        if (!isMounted) return;
        setBranches(res.data);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch Buildings when branch changes
  useEffect(() => {
    let isMounted = true;
    const branchParam = selectedBranchId !== 'all' ? selectedBranchId : undefined;

    roomService
      .getRoomBuildings(branchParam)
      .then((bData) => {
        if (!isMounted) return;
        setBuildings(bData);
      })
      .catch(() => {
        if (!isMounted) return;
        setBuildings([]);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedBranchId]);

  // Dynamic Building Options
  const buildingOptions = useMemo(() => {
    return [
      { label: 'All Buildings', value: 'all' },
      ...buildings.map((b) => {
        const showBranch = selectedBranchId === 'all' && b.branch_name;
        const label = showBranch ? `${b.building_name} (${b.branch_name})` : b.building_name;
        return {
          label,
          value: String(b.building_id),
        };
      }),
    ];
  }, [buildings, selectedBranchId]);

  // Dynamic Floor Options (dependent on selected building)
  const floorOptions = useMemo(() => {
    if (selectedBuildingId === 'all') {
      return [{ label: 'Select building first', value: 'all' }];
    }
    const building = buildings.find((b) => String(b.building_id) === String(selectedBuildingId));
    const floors = building?.floor_details || [];
    if (floors.length === 0) {
      return [{ label: 'No floors available', value: 'all' }];
    }
    return [
      { label: 'All Floors', value: 'all' },
      ...floors.map((f) => ({
        label: f.name || `Floor ${f.floor_number}`,
        value: String(f.floor_id || f.id),
      })),
    ];
  }, [buildings, selectedBuildingId]);

  // Fetch Room Stats
  useEffect(() => {
    let isMounted = true;
    roomService
      .getRoomStats(selectedBranchId !== 'all' ? selectedBranchId : undefined)
      .then((data) => {
        if (!isMounted) return;
        setStats(data);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [selectedBranchId, refreshTrigger]);

  // Fetch Rooms List
  useEffect(() => {
    let isMounted = true;

    roomService
      .getRooms({
        page: currentPage,
        limit: 10,
        branch_id: selectedBranchId !== 'all' ? selectedBranchId : undefined,
        building_id: selectedBuildingId !== 'all' ? selectedBuildingId : undefined,
        floor_id: selectedFloorId !== 'all' ? selectedFloorId : undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        room_type: selectedRoomType !== 'all' ? selectedRoomType : undefined,
        search: debouncedSearch.trim() || undefined,
      })
      .then((res) => {
        if (!isMounted) return;
        setRooms(res.data);
        setMeta(res.meta);
        setLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setRooms([]);
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [
    currentPage,
    selectedBranchId,
    selectedBuildingId,
    selectedFloorId,
    selectedStatus,
    selectedRoomType,
    debouncedSearch,
    refreshTrigger,
  ]);

  // Handle Delete Room
  const handleDeleteRoom = async () => {
    if (!deletingRoom) return;
    setIsDeleting(true);
    try {
      await roomService.deleteRoom(deletingRoom.id);
      setDeletingRoom(null);
      setRefreshTrigger((prev) => prev + 1);
    } catch {
      // Backend error toast handled automatically by apiClient
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 max-w-[1600px] w-full mx-auto space-y-6">
      {/* Top Header matching Figma: Title, Subtitle, Add Room Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Room Inventory
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-normal mt-0.5">
            Manage room inventory, occupancy and status.
          </p>
        </div>

        <Link
          href="/dashboard/rooms/new"
          className="px-6 py-2.5 bg-[#175C46] hover:bg-[#124B38] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors shrink-0 self-start sm:self-auto inline-flex items-center justify-center cursor-pointer"
        >
          Add Room
        </Link>
      </div>

      {/* 5 Summary Stat Cards matching Figma pixel-for-pixel */}
      <RoomStatsCards stats={stats} />

      {/* Filter Controls Row: Branch, Building, Floor, Status, Room Type, Search */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 items-end">
        {/* Branch Filter */}
        <Dropdown
          label="Branch"
          value={selectedBranchId}
          onChange={(e) => {
            const val = e.target.value;
            startTransition(() => {
              setSelectedBranchId(val);
              setSelectedBuildingId('all');
              setSelectedFloorId('all');
              setCurrentPage(1);
            });
          }}
          options={[
            { label: 'All Branches', value: 'all' },
            ...branches.map((b) => ({ label: b.name, value: String(b.id) })),
          ]}
        />

        {/* Building Filter */}
        <Dropdown
          label="Building"
          value={selectedBuildingId}
          onChange={(e) => {
            const val = e.target.value;
            startTransition(() => {
              setSelectedBuildingId(val);
              setSelectedFloorId('all');
              setCurrentPage(1);
            });
          }}
          options={buildingOptions}
        />

        {/* Floor Filter */}
        <Dropdown
          label="Floor"
          value={selectedFloorId}
          disabled={selectedBuildingId === 'all'}
          onChange={(e) => {
            const val = e.target.value;
            startTransition(() => {
              setSelectedFloorId(val);
              setCurrentPage(1);
            });
          }}
          options={floorOptions}
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

        {/* Room Type Filter */}
        <Dropdown
          label="Room Type"
          value={selectedRoomType}
          onChange={(e) => {
            const val = e.target.value;
            startTransition(() => {
              setSelectedRoomType(val);
              setCurrentPage(1);
            });
          }}
          options={ROOM_TYPE_FILTER_OPTIONS}
        />

        {/* Search Room Number & Clear Filters Button */}
        <div className="space-y-1.5">
          <label className="text-xs sm:text-sm font-semibold text-gray-800 block opacity-0 pointer-events-none select-none">
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
                placeholder="Search room number"
              />
            </div>
            {hasActiveFilters && (
              <ClearFilterButton onClick={handleClearAllFilters} />
            )}
          </div>
        </div>
      </div>

      {/* Standardized Room Table using unified DataTable matching Figma */}
      <DataTable<Room>
        data={rooms}
        loading={loading}
        loadingLabel="Loading room records..."
        emptyTitle="No Rooms Found"
        emptyDescription="No room records match your current filter criteria."
        pagination={{
          currentPage: meta.page || currentPage,
          totalCount: meta.total_items ?? rooms.length,
          pageSize: meta.limit || 10,
          itemCount: rooms.length,
          itemLabel: 'Rooms',
          onPageChange: (page) => setCurrentPage(page),
        }}
        columns={[
          {
            header: 'Room no.',
            cell: (room) => (
              <span className="font-semibold text-gray-900 whitespace-nowrap">
                {room.room_no}
              </span>
            ),
          },
          {
            header: 'Room type',
            cell: (room) => (
              <span className="text-gray-700 font-medium capitalize whitespace-nowrap">
                {room.sharing_label || room.room_type}
              </span>
            ),
          },
          {
            header: 'Branch',
            cell: (room) => (
              <span className="text-gray-700 font-medium whitespace-nowrap">
                {room.branch_name || '-'}
              </span>
            ),
          },
          {
            header: 'Building',
            cell: (room) => (
              <span className="text-gray-700 font-medium whitespace-nowrap">
                {room.building_name || '-'}
              </span>
            ),
          },
          {
            header: 'Floor',
            cell: (room) => (
              <span className="text-gray-700 font-medium whitespace-nowrap">
                {room.floor_name || (room.floor_number !== undefined && room.floor_number !== null ? `Floor ${room.floor_number}` : '-')}
              </span>
            ),
          },
          {
            header: 'Status',
            cell: (room) => <StatusBadge status={room.status} />,
          },
          {
            header: 'Current occupant',
            cell: (room) => (
              <span className="text-gray-700 font-medium whitespace-nowrap">
                {room.current_occupant_name || '-'}
              </span>
            ),
          },
          {
            header: 'Action',
            align: 'right',
            className: 'whitespace-nowrap',
            cell: (room) => (
              <TableActions align="right">
                <IconButton
                  variant="view"
                  onClick={() => setViewingRoomId(room.id)}
                  title="View Details"
                />
                <IconButton
                  variant="edit"
                  onClick={() => router.push(`/dashboard/rooms/${room.id}/edit`)}
                  title="Edit Room"
                />
                <IconButton
                  variant="delete"
                  onClick={() => setDeletingRoom(room)}
                  title="Delete Room"
                />
              </TableActions>
            ),
          },
        ]}
      />

      {/* Room Details Modal - fetches directly from single room GET API */}
      <RoomDetailsModal
        visible={Boolean(viewingRoomId)}
        onHide={() => setViewingRoomId(null)}
        roomId={viewingRoomId}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        visible={Boolean(deletingRoom)}
        onHide={() => setDeletingRoom(null)}
        title="Delete Room"
        subtitle=""
        message="Are you sure you want to delete this room? This action cannot be undone."
        confirmLabel="Delete"
        loading={isDeleting}
        onConfirm={handleDeleteRoom}
      />
    </main>
  );
}
