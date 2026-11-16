'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Room, RoomStats, RoomBuilding } from '@/types/room';
import { roomService, INITIAL_ROOM_STATS } from '@/services/room.service';
import { RoomStatsCards } from '@/components/rooms/room-stats-cards';
import { Dropdown } from '@/components/ui';

export default function RoomDetailsAllocationPage() {
  // Data States
  const [stats, setStats] = useState<RoomStats>(INITIAL_ROOM_STATS);
  const [buildings, setBuildings] = useState<RoomBuilding[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  // Selection States
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('all');
  const [selectedFloorId, setSelectedFloorId] = useState<string>('all');
  const [activeFloorKey, setActiveFloorKey] = useState<{ buildingId: number; floorNumber: number } | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  // Fetch initial data
  useEffect(() => {
    let isMounted = true;
    Promise.all([
      roomService.getRoomStats().catch(() => INITIAL_ROOM_STATS),
      roomService.getRoomBuildings().catch(() => []),
      roomService.getRooms({ limit: 100 }).catch(() => ({ data: [], meta: { page: 1, limit: 100, total_pages: 1, total_items: 0 } })),
    ]).then(([statsData, buildingsData, roomsRes]) => {
      if (!isMounted) return;
      setStats(statsData);
      setBuildings(buildingsData);
      setRooms(roomsRes.data);
      setLoading(false);

      // Default active floor to the first building with floors
      if (buildingsData.length > 0) {
        for (const b of buildingsData) {
          if (b.floor_details && b.floor_details.length > 0) {
            const firstFloor = b.floor_details[0];
            setActiveFloorKey({
              buildingId: b.building_id,
              floorNumber: firstFloor.floor_number,
            });
            break;
          }
        }
      }

      // Default selected room
      if (roomsRes.data.length > 0) {
        setSelectedRoom(roomsRes.data[0]);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Current building's floors for dependent dropdown
  const currentBuildingFloors = useMemo(() => {
    if (selectedBuildingId === 'all') return [];
    const found = buildings.find((x) => String(x.building_id) === String(selectedBuildingId));
    return found?.floor_details || [];
  }, [buildings, selectedBuildingId]);

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

      {/* Tab Bar & Filters Row matching Figma */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-200/80 pb-3">
        {/* Left Tabs: Floor Plan (active) & Room List */}
        <div className="flex items-center gap-6">
          <button
            type="button"
            className="text-sm font-semibold text-[#175C46] border-b-2 border-[#175C46] pb-3 -mb-3 cursor-pointer"
          >
            Floor Plan
          </button>
          <Link
            href="/dashboard/rooms"
            className="text-sm font-medium text-gray-500 hover:text-gray-900 pb-3 -mb-3 transition-colors cursor-pointer"
          >
            Room List
          </Link>
        </div>

        {/* Right Filters & Status Legend matching Figma */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Building Dropdown */}
          <div className="w-40 sm:w-48">
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
          <div className="w-36 sm:w-40">
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

          {/* Status Legend matching Figma: Occupied, Vacant, Maintenance */}
          <div className="flex items-center gap-4 text-xs font-medium text-gray-600 pl-2">
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
          </div>
        </div>
      </div>

      {/* Main Content Area: 2-Column Floor Explorer matching Figma */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Sidebar: Buildings & Floors Tree */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-2xs space-y-5">
          {buildings.length === 0 ? (
            <div className="text-xs text-gray-400 py-4 text-center">
              {loading ? 'Loading buildings...' : 'No buildings registered.'}
            </div>
          ) : (
            buildings.map((building) => (
              <div key={building.building_id} className="space-y-2">
                <h3 className="text-xs font-bold text-gray-900 tracking-tight flex items-center justify-between">
                  <span>{building.building_name}</span>
                </h3>

                <div className="space-y-1">
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
                          }}
                          className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${
                            isActive
                              ? 'bg-[#EBF7F2] text-[#175C46] font-semibold shadow-2xs'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <span>{floor.name || `Floor ${floor.floor_number}`}</span>
                          {floor.total_rooms > 0 && (
                            <span className="text-[11px] text-gray-400">
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
              </div>
            ))
          )}
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
                      <span className="font-semibold text-gray-900">{activeSelectedRoom.size || '12 m*2'}</span>
                    </p>
                    {activeSelectedRoom.current_occupant_name && (
                      <p>
                        <span className="text-gray-500">Occupant :</span>{' '}
                        <span className="font-semibold text-gray-900">{activeSelectedRoom.current_occupant_name}</span>
                      </p>
                    )}
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
