'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { Room, RoomStats, RoomBuilding } from '@/types/room';
import { Branch } from '@/types/branch';
import { roomService, INITIAL_ROOM_STATS } from '@/services/room.service';
import { branchService } from '@/services/branch.service';
import { RoomStatsCards } from '@/components/rooms/room-stats-cards';
import { Dropdown, ClearFilterButton } from '@/components/ui';
import { useResetOnNavigation } from '@/hooks';

export default function RoomDetailsAllocationPage() {
  // Master Branches State
  const [branches, setBranches] = useState<Branch[]>([]);

  // Data States
  const [stats, setStats] = useState<RoomStats>(INITIAL_ROOM_STATS);
  const [buildings, setBuildings] = useState<RoomBuilding[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  // Selection & Filter States
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('all');
  const [selectedFloorId, setSelectedFloorId] = useState<string>('all');
  const [activeFloorKey, setActiveFloorKey] = useState<{ buildingId: number; floorNumber: number } | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  // Sidebar Filter & Accordion States
  const [sidebarSearch, setSidebarSearch] = useState<string>('');
  const [collapsedBuildingIds, setCollapsedBuildingIds] = useState<Set<number>>(new Set());

  // Reset filters callback on navigation
  const resetFilters = useCallback(() => {
    setSelectedBranchId('all');
    setSelectedBuildingId('all');
    setSelectedFloorId('all');
    setSidebarSearch('');
  }, []);

  const hasActiveFilters = useMemo(() => {
    return (
      selectedBranchId !== 'all' ||
      selectedBuildingId !== 'all' ||
      selectedFloorId !== 'all' ||
      Boolean(sidebarSearch.trim())
    );
  }, [selectedBranchId, selectedBuildingId, selectedFloorId, sidebarSearch]);

  useResetOnNavigation(resetFilters, { cleanQueryToast: true });

  // Fetch branches on mount
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

  // Fetch Stats, Buildings, and Rooms when selectedBranchId changes
  useEffect(() => {
    let isMounted = true;
    const branchParam = selectedBranchId !== 'all' ? selectedBranchId : undefined;

    Promise.all([
      roomService.getRoomStats(branchParam).catch(() => INITIAL_ROOM_STATS),
      roomService.getRoomBuildings(branchParam).catch(() => []),
      roomService.getRooms({ limit: 100, branch_id: branchParam }).catch(() => ({
        data: [],
        meta: { page: 1, limit: 100, total_pages: 1, total_items: 0 },
      })),
    ]).then(([statsData, buildingsData, roomsRes]) => {
      if (!isMounted) return;
      setStats(statsData);
      setBuildings(buildingsData);
      setRooms(roomsRes.data);
      setLoading(false);

      // Default active floor to the first building with floors
      let found = false;
      if (buildingsData.length > 0) {
        for (const b of buildingsData) {
          if (b.floor_details && b.floor_details.length > 0) {
            const firstFloor = b.floor_details[0];
            setActiveFloorKey({
              buildingId: b.building_id,
              floorNumber: firstFloor.floor_number,
            });
            found = true;
            break;
          }
        }
      }
      if (!found) {
        setActiveFloorKey(null);
      }

      // Default selected room
      if (roomsRes.data.length > 0) {
        setSelectedRoom(roomsRes.data[0]);
      } else {
        setSelectedRoom(null);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [selectedBranchId]);

  // Current building's floors for dependent dropdown
  const currentBuildingFloors = useMemo(() => {
    if (selectedBuildingId === 'all') return [];
    const found = buildings.find((x) => String(x.building_id) === String(selectedBuildingId));
    return found?.floor_details || [];
  }, [buildings, selectedBuildingId]);

  // Filtered buildings for the left sidebar explorer
  const filteredSidebarBuildings = useMemo(() => {
    if (!sidebarSearch.trim()) return buildings;
    const q = sidebarSearch.toLowerCase();
    return buildings.filter(
      (b) =>
        b.building_name.toLowerCase().includes(q) ||
        b.floor_details?.some((f) => f.name?.toLowerCase().includes(q))
    );
  }, [buildings, sidebarSearch]);

  const toggleBuildingCollapse = (buildingId: number) => {
    setCollapsedBuildingIds((prev) => {
      const next = new Set(prev);
      if (next.has(buildingId)) {
        next.delete(buildingId);
      } else {
        next.add(buildingId);
      }
      return next;
    });
  };

  // Filtered rooms based on selected Building and Floor dropdowns (or floor plan active item)
  const currentFloorRooms = useMemo(() => {
    if (!activeFloorKey) {
      return rooms;
    }

    return rooms.filter((r) => {
      const matchBuilding =
        selectedBuildingId !== 'all'
          ? String(r.building_id) === String(selectedBuildingId)
          : String(r.building_id) === String(activeFloorKey.buildingId);

      const matchFloor =
        selectedFloorId !== 'all'
          ? String(r.floor_number ?? r.floor_id) === String(selectedFloorId)
          : (r.floor_number ?? 1) === activeFloorKey.floorNumber;

      return matchBuilding && matchFloor;
    });
  }, [rooms, activeFloorKey, selectedBuildingId, selectedFloorId]);

  // Currently selected room (derives first room of active floor if none selected)
  const activeSelectedRoom = useMemo(() => {
    if (selectedRoom && currentFloorRooms.some((r) => r.id === selectedRoom.id)) {
      return selectedRoom;
    }
    return currentFloorRooms[0] || null;
  }, [selectedRoom, currentFloorRooms]);

  // Active Floor Display Title
  const activeFloorTitle = useMemo(() => {
    if (!activeFloorKey) return 'Floor Rooms';
    const b = buildings.find((x) => x.building_id === activeFloorKey.buildingId);
    const bName = b?.building_name || 'Building';
    return `Floor ${activeFloorKey.floorNumber} - ${bName}`;
  }, [activeFloorKey, buildings]);

  // Helper for status badge style
  const getRoomPillStyle = (room: Room) => {
    const isSelected = activeSelectedRoom?.id === room.id;
    const status = String(room.status).toLowerCase();

    let baseColors = 'bg-[#E8F8F0] text-[#175C46] border-emerald-200';
    if (status === 'vacant') {
      baseColors = 'bg-[#EFF6FF] text-[#2563EB] border-blue-200';
    } else if (status === 'maintenance') {
      baseColors = 'bg-[#FEF9C3] text-[#854D0E] border-amber-200';
    } else if (status === 'out_of_service') {
      baseColors = 'bg-[#FFF1F2] text-[#E11D48] border-rose-200';
    }

    if (isSelected) {
      return `${baseColors} ring-2 ring-[#2563EB] shadow-xs font-bold scale-[1.02] border-transparent`;
    }
    return `${baseColors} hover:opacity-90 transition-all hover:scale-[1.01]`;
  };

  return (
    <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 max-w-[1600px] w-full mx-auto space-y-6">
      {/* Top Header matching Figma: Title, Subtitle */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
          Room Details & Allocation
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 font-normal mt-0.5">
          View room details, capacity and manage allocations.
        </p>
      </div>

      {/* 5 Summary Stat Cards matching Figma pixel-for-pixel */}
      <RoomStatsCards stats={stats} />

      {/* Filters & Status Legend matching Figma */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200/80 pb-3">
        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          {/* Branch Dropdown */}
          <div className="w-36 sm:w-44">
            <Dropdown
              value={selectedBranchId}
              onChange={(e) => {
                const bVal = e.target.value;
                setSelectedBranchId(bVal);
                setSelectedBuildingId('all');
                setSelectedFloorId('all');
              }}
              options={[
                { label: 'All Branches', value: 'all' },
                ...branches.map((b) => ({
                  label: b.name,
                  value: String(b.id),
                })),
              ]}
            />
          </div>

          {/* Building Dropdown */}
          <div className="w-36 sm:w-44">
            <Dropdown
              value={selectedBuildingId}
              onChange={(e) => {
                const bId = e.target.value;
                setSelectedBuildingId(bId);
                setSelectedFloorId('all');
                if (bId !== 'all') {
                  const b = buildings.find((x) => String(x.building_id) === bId);
                  if (b && b.floor_details && b.floor_details.length > 0) {
                    setActiveFloorKey({
                      buildingId: b.building_id,
                      floorNumber: b.floor_details[0].floor_number,
                    });
                  }
                }
              }}
              options={[
                { label: 'All Buildings', value: 'all' },
                ...buildings.map((b) => ({
                  label: b.building_name,
                  value: String(b.building_id),
                })),
              ]}
            />
          </div>

          {/* Floor Dropdown (Dependent on Building) */}
          <div className="w-32 sm:w-36">
            <Dropdown
              value={selectedFloorId}
              disabled={selectedBuildingId === 'all'}
              placeholder={selectedBuildingId === 'all' ? 'Select building first' : 'All Floors'}
              onChange={(e) => {
                const fVal = e.target.value;
                setSelectedFloorId(fVal);
                if (fVal !== 'all' && activeFloorKey) {
                  setActiveFloorKey({
                    ...activeFloorKey,
                    floorNumber: Number(fVal),
                  });
                }
              }}
              options={[
                { label: 'All Floors', value: 'all' },
                ...currentBuildingFloors.map((f) => ({
                  label: f.name || `Floor ${f.floor_number}`,
                  value: String(f.floor_number),
                })),
              ]}
            />
          </div>

          {/* Dynamic Clear Filters Button */}
          {hasActiveFilters && (
            <ClearFilterButton onClick={resetFilters} />
          )}
        </div>

        {/* Status Legend matching Figma: Occupied, Vacant, Maintenance, Out of service */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-medium text-gray-600 sm:ml-auto shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
            <span>Occupied</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" />
            <span>Vacant</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
            <span>Maintenance</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
            <span>Out of service</span>
          </div>
        </div>
      </div>

      {/* Main Content Area: 2-Column Floor Explorer matching Figma */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Sidebar: Buildings & Floors Tree with Scroll & Improved UX */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-2xs overflow-hidden flex flex-col max-h-[640px] lg:sticky lg:top-24">
          {/* Sidebar Top Header */}
          <div className="p-3.5 sm:p-4 border-b border-gray-100 bg-gray-50/70 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#175C46]" />
              <h3 className="text-xs font-bold text-gray-900 tracking-tight uppercase">
                Buildings & Floors
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-[#175C46] bg-[#E8F8F0] px-2 py-0.5 rounded-full">
              {buildings.length} {buildings.length === 1 ? 'Building' : 'Buildings'}
            </span>
          </div>

          {/* Quick Search inside Sidebar */}
          {buildings.length > 2 && (
            <div className="p-3 border-b border-gray-100/70 bg-white shrink-0">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search building..."
                  value={sidebarSearch}
                  onChange={(e) => setSidebarSearch(e.target.value)}
                  className="w-full h-8 pl-8 pr-7 text-xs rounded-lg bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:bg-white focus:border-[#175C46] outline-none transition-all"
                />
                <svg
                  className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400 pointer-events-none"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
                </svg>
                {sidebarSearch && (
                  <button
                    type="button"
                    onClick={() => setSidebarSearch('')}
                    className="absolute right-2.5 top-1.5 text-gray-400 hover:text-gray-600 text-sm cursor-pointer"
                  >
                    &times;
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Scrollable Building Tree */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
            {filteredSidebarBuildings.length === 0 ? (
              <div className="text-xs text-gray-400 py-8 text-center">
                {loading
                  ? 'Loading buildings...'
                  : sidebarSearch
                  ? 'No matching buildings.'
                  : 'No buildings registered.'}
              </div>
            ) : (
              filteredSidebarBuildings.map((building) => {
                const isCollapsed = collapsedBuildingIds.has(building.building_id);
                const branchName =
                  building.branch_name ||
                  branches.find((b) => b.id === building.branch_id)?.name ||
                  (selectedBranchId !== 'all' ? branches.find((b) => String(b.id) === selectedBranchId)?.name : '') ||
                  '';

                return (
                  <div key={building.building_id} className="space-y-1.5">
                    {/* Building Section Header (Collapsible) */}
                    <button
                      type="button"
                      onClick={() => toggleBuildingCollapse(building.building_id)}
                      className="w-full flex items-center justify-between text-left py-1 px-1 rounded-lg hover:bg-gray-50 transition-colors group cursor-pointer"
                    >
                      <span className="text-xs font-bold text-gray-900 tracking-tight group-hover:text-[#175C46] transition-colors truncate pr-2">
                        {building.building_name}
                      </span>

                      <div className="flex items-center gap-1.5 shrink-0 max-w-[50%]">
                        {branchName && (
                          <span
                            className="text-[10px] text-gray-400 font-medium truncate"
                            title={branchName}
                          >
                            {branchName}
                          </span>
                        )}
                        <svg
                          className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 shrink-0 ${
                            isCollapsed ? '-rotate-90' : 'rotate-0'
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="2.5"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>

                    {/* Floor List */}
                    {!isCollapsed && (
                      <div className="space-y-1 pl-1">
                        {building.floor_details && building.floor_details.length > 0 ? (
                          building.floor_details.map((floor) => {
                            const isActive =
                              activeFloorKey?.buildingId === building.building_id &&
                              activeFloorKey?.floorNumber === floor.floor_number;

                            return (
                              <button
                                key={floor.id}
                                type="button"
                                onClick={() => {
                                  setActiveFloorKey({
                                    buildingId: building.building_id,
                                    floorNumber: floor.floor_number,
                                  });
                                  setSelectedBuildingId(String(building.building_id));
                                  setSelectedFloorId(String(floor.floor_number));
                                }}
                                className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                                  isActive
                                    ? 'bg-[#EBF7F2] text-[#175C46] font-semibold shadow-2xs'
                                    : 'text-gray-600 hover:bg-gray-50'
                                }`}
                              >
                                <span>{floor.name || `Floor ${floor.floor_number}`}</span>
                                {floor.total_rooms > 0 && (
                                  <span
                                    className={`text-[11px] ${
                                      isActive ? 'text-[#175C46]/80 font-semibold' : 'text-gray-400'
                                    }`}
                                  >
                                    {floor.total_rooms} rooms
                                  </span>
                                )}
                              </button>
                            );
                          })
                        ) : (
                          <div className="text-[11px] text-gray-400 pl-3.5 py-1">
                            Floor 1
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Main Panel: Room Grid + Room Details Card matching Figma */}
        <div className="lg:col-span-9 space-y-5">
          {/* Top Card: Active Floor Room Grid */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-gray-900 tracking-tight">
              {activeFloorTitle}
            </h2>

            {currentFloorRooms.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400">
                No rooms assigned to this floor yet.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {currentFloorRooms.map((room) => (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => setSelectedRoom(room)}
                    className={`py-3 px-2 rounded-xl text-xs sm:text-sm font-semibold border text-center transition-all cursor-pointer ${getRoomPillStyle(
                      room
                    )}`}
                  >
                    <span>{room.room_no}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Card: Selected Room Details matching Figma */}
          {activeSelectedRoom && (
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-2xs space-y-3.5">
              <h3 className="text-sm font-bold text-gray-900 tracking-tight">
                Room Details
              </h3>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 rounded-xl bg-gray-50/70 border border-gray-100">
                {/* Room Photo */}
                <div className="w-full sm:w-48 h-32 rounded-xl overflow-hidden bg-gray-100 relative shrink-0 border border-gray-100 shadow-2xs">
                  {activeSelectedRoom.image_url || activeSelectedRoom.image ? (
                    <Image
                      src={activeSelectedRoom.image_url || activeSelectedRoom.image!}
                      alt={activeSelectedRoom.room_no}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-[#EBF7F2] text-[#175C46] gap-1.5">
                      <svg className="w-8 h-8 stroke-current opacity-70" fill="none" viewBox="0 0 24 24" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v11m0-4h18m0-7v11M3 11a3 3 0 013-3h3a3 3 0 013 3v3H3v-3z" />
                      </svg>
                      <span className="text-xs font-semibold">Room {activeSelectedRoom.room_no}</span>
                    </div>
                  )}
                </div>

                {/* Room Info */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <h4 className="text-lg font-bold text-gray-900 tracking-tight">
                    {activeSelectedRoom.room_no}
                  </h4>
                  <p className="text-xs text-gray-500 font-medium">
                    <span className="capitalize">{activeSelectedRoom.sharing_label || `${activeSelectedRoom.room_type} Room`}</span>
                    {'  '}&bull;{'  '}
                    <span>Floor {activeSelectedRoom.floor_number ?? activeSelectedRoom.floor_name ?? '1'}</span>
                    {'  '}&bull;{'  '}
                    <span>{activeSelectedRoom.building_name || 'Main Building'}</span>
                  </p>

                  <div className="pt-1.5 space-y-1 text-xs text-gray-700 font-medium">
                    <p>
                      <span className="text-gray-500">Capacity :</span>{' '}
                      <span className="font-semibold text-gray-900">{activeSelectedRoom.capacity}</span>
                    </p>
                    <p>
                      <span className="text-gray-500">Size :</span>{' '}
                      <span className="font-semibold text-gray-900">{activeSelectedRoom.size || '14 m*2'}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
