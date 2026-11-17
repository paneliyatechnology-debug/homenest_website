'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BackButton } from '@/components/ui/back-button';
import { residentService } from '@/services/resident.service';
import { roomShiftService } from '@/services/room-shift.service';
import { Resident, Branch, Building, Floor, RoomOption } from '@/types/resident';

export const RoomShiftForm: React.FC = () => {
  const router = useRouter();

  // Form Fields
  const [residentId, setResidentId] = useState<number | ''>('');
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState<'approved' | 'pending' | 'rejected'>('pending');

  // Resident Current Details (viewable upon selecting resident)
  const [currentRoomNo, setCurrentRoomNo] = useState('');
  const [currentBranchName, setCurrentBranchName] = useState('');
  const [currentBuildingName, setCurrentBuildingName] = useState('');
  const [currentFloorName, setCurrentFloorName] = useState('');

  // Target Room Selection (cascading dropdowns)
  const [targetBranchId, setTargetBranchId] = useState<number | ''>('');
  const [targetBuildingId, setTargetBuildingId] = useState<number | ''>('');
  const [targetFloorId, setTargetFloorId] = useState<number | ''>('');
  const [requestedRoomId, setRequestedRoomId] = useState<number | ''>('');

  // Dropdown Data Sources
  const [residents, setResidents] = useState<Resident[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [availableRooms, setAvailableRooms] = useState<RoomOption[]>([]);

  // Loading & Submission states
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingBuildings, setLoadingBuildings] = useState(false);
  const [loadingFloors, setLoadingFloors] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load initial residents and branches
  useEffect(() => {
    let isMounted = true;

    Promise.all([
      residentService.getResidents({ limit: 100 }),
      residentService.getBranches({ limit: 100 }),
    ])
      .then(([resResidents, resBranches]) => {
        if (!isMounted) return;
        setResidents(resResidents.data || []);
        setBranches(resBranches.data || []);
      })
      .catch((err) => {
        console.error('Failed to load initial form data:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingInitial(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Cascading Handler: Target Branch change
  const handleTargetBranchChange = async (branchId: number | '') => {
    setTargetBranchId(branchId);
    setTargetBuildingId('');
    setTargetFloorId('');
    setRequestedRoomId('');
    setBuildings([]);
    setFloors([]);
    setAvailableRooms([]);

    if (!branchId) return;

    try {
      setLoadingBuildings(true);
      const data = await residentService.getBuildings(branchId);
      setBuildings(data || []);
    } catch (err) {
      console.error('Failed to load buildings:', err);
      setBuildings([]);
    } finally {
      setLoadingBuildings(false);
    }
  };

  // Cascading Handler: Target Building change
  const handleTargetBuildingChange = async (buildingId: number | '') => {
    setTargetBuildingId(buildingId);
    setTargetFloorId('');
    setRequestedRoomId('');
    setFloors([]);
    setAvailableRooms([]);

    if (!buildingId) return;

    try {
      setLoadingFloors(true);
      const data = await residentService.getFloors(buildingId);
      setFloors(data || []);
    } catch (err) {
      console.error('Failed to load floors:', err);
      setFloors([]);
    } finally {
      setLoadingFloors(false);
    }
  };

  // Cascading Handler: Target Floor change
  const handleTargetFloorChange = async (floorId: number | '') => {
    setTargetFloorId(floorId);
    setRequestedRoomId('');
    setAvailableRooms([]);

    if (!floorId || !targetBranchId || !targetBuildingId) return;

    try {
      setLoadingRooms(true);
      const data = await residentService.getRooms({
        branch_id: targetBranchId,
        building_id: targetBuildingId,
        floor_id: floorId,
      });
      setAvailableRooms(data || []);
    } catch (err) {
      console.error('Failed to load rooms:', err);
      setAvailableRooms([]);
    } finally {
      setLoadingRooms(false);
    }
  };

  // When resident is picked: populate current details and optionally initialize target branch
  const handleResidentChange = async (selectedId: number | '') => {
    setResidentId(selectedId);
    if (!selectedId) {
      setCurrentRoomNo('');
      setCurrentBranchName('');
      setCurrentBuildingName('');
      setCurrentFloorName('');
      return;
    }

    const found = residents.find((r) => r.id === selectedId);
    if (found) {
      setCurrentRoomNo(found.room_no || '—');
      setCurrentBuildingName(found.building_name || '—');
      setCurrentFloorName(
        found.floor_name || (found.floor_number ? `Floor ${found.floor_number}` : '—')
      );
      if (found.branch_id) {
        const b = branches.find((branch) => branch.id === found.branch_id);
        if (b) setCurrentBranchName(b.name);
      }
    }

    try {
      const detail = await residentService.getResidentById(selectedId);
      if (detail?.room_info) {
        if (detail.room_info.room_no) setCurrentRoomNo(detail.room_info.room_no);
        if (detail.room_info.branch_name) setCurrentBranchName(detail.room_info.branch_name);
        if (detail.room_info.building_name) setCurrentBuildingName(detail.room_info.building_name);
        if (detail.room_info.floor_name || detail.room_info.floor_number) {
          setCurrentFloorName(
            detail.room_info.floor_name || `Floor ${detail.room_info.floor_number}`
          );
        }

        // Auto-select target branch to current branch if not yet selected
        const residentBranchId = detail.room_info.branch_id || found?.branch_id;
        if (residentBranchId && !targetBranchId) {
          handleTargetBranchChange(residentBranchId);
        }
      }
    } catch (err) {
      console.warn('Failed to load resident details:', err);
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!residentId) {
      setErrorMessage('Please select a resident.');
      return;
    }

    if (!reason.trim()) {
      setErrorMessage('Please enter a shift reason.');
      return;
    }

    if (!status) {
      setErrorMessage('Please select a status.');
      return;
    }

    try {
      setSubmitting(true);
      // Only the required fields are passed to the API
      await roomShiftService.createShift({
        resident_id: Number(residentId),
        reason: reason.trim(),
        requested_room_id: requestedRoomId ? Number(requestedRoomId) : null,
        status,
        preferred_room_type: 'Double Sharing',
      });

      router.push('/dashboard/settings/room-shifts');
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Failed to create room shift request';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BackButton href="/dashboard/settings/room-shifts" />
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Add New Room Shift Request
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Add a new room shift request.
          </p>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMessage && (
            <div className="p-3.5 text-xs bg-red-50 text-red-700 rounded-xl border border-red-200">
              {errorMessage}
            </div>
          )}

          {/* Row 1: Resident Name & Shift Reason */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Resident name * */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">
                Resident name <span className="text-[#175C46]">*</span>
              </label>
              <select
                value={residentId}
                onChange={(e) => handleResidentChange(e.target.value ? Number(e.target.value) : '')}
                disabled={loadingInitial || submitting}
                className="w-full h-11 px-3.5 text-xs sm:text-sm bg-white border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#175C46] focus:border-[#175C46] transition-colors"
              >
                <option value="">Select resident</option>
                {residents.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} {r.room_no ? `(Room ${r.room_no})` : ''} - {r.phone}
                  </option>
                ))}
              </select>
            </div>

            {/* Shift Reason * */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">
                Shift Reason <span className="text-[#175C46]">*</span>
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter shift reason"
                disabled={submitting}
                className="w-full h-11 px-3.5 text-xs sm:text-sm bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#175C46] focus:border-[#175C46] transition-colors"
              />
            </div>
          </div>

          {/* Section: Resident Current Details */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Resident Current Location Details
              </span>
              <div className="h-px bg-gray-100 flex-1" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Resident Current Room no. */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Resident Current Room no. <span className="text-[#175C46]">*</span>
                </label>
                <input
                  type="text"
                  readOnly
                  value={currentRoomNo || ''}
                  placeholder="Enter room no."
                  className="w-full h-11 px-3.5 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 cursor-not-allowed select-none"
                />
              </div>

              {/* Current Branch */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Current Branch
                </label>
                <input
                  type="text"
                  readOnly
                  value={currentBranchName || ''}
                  placeholder="Branch name"
                  className="w-full h-11 px-3.5 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 cursor-not-allowed select-none"
                />
              </div>

              {/* Current Building */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Current Building
                </label>
                <input
                  type="text"
                  readOnly
                  value={currentBuildingName || ''}
                  placeholder="Building name"
                  className="w-full h-11 px-3.5 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 cursor-not-allowed select-none"
                />
              </div>

              {/* Current Floor */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Current Floor
                </label>
                <input
                  type="text"
                  readOnly
                  value={currentFloorName || ''}
                  placeholder="Floor name"
                  className="w-full h-11 px-3.5 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 cursor-not-allowed select-none"
                />
              </div>
            </div>
          </div>

          {/* Section: Cascading Requested Room Selection */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Requested Room Selection
              </span>
              <span className="text-[11px] text-gray-400 font-normal">
                (Select Branch, Building and Floor to pick the requested room)
              </span>
              <div className="h-px bg-gray-100 flex-1" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Branch */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Target Branch <span className="text-[#175C46]">*</span>
                </label>
                <select
                  value={targetBranchId}
                  onChange={(e) =>
                    handleTargetBranchChange(e.target.value ? Number(e.target.value) : '')
                  }
                  disabled={loadingInitial || submitting}
                  className="w-full h-11 px-3.5 text-xs sm:text-sm bg-white border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#175C46] focus:border-[#175C46] transition-colors"
                >
                  <option value="">Select branch</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Building */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Target Building <span className="text-[#175C46]">*</span>
                </label>
                <select
                  value={targetBuildingId}
                  onChange={(e) =>
                    handleTargetBuildingChange(e.target.value ? Number(e.target.value) : '')
                  }
                  disabled={!targetBranchId || loadingBuildings || submitting}
                  className="w-full h-11 px-3.5 text-xs sm:text-sm bg-white border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#175C46] focus:border-[#175C46] transition-colors disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {loadingBuildings
                      ? 'Loading buildings...'
                      : !targetBranchId
                      ? 'Select branch first'
                      : 'Select building'}
                  </option>
                  {buildings.map((bld) => (
                    <option key={bld.id} value={bld.id}>
                      {bld.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Floor */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Target Floor <span className="text-[#175C46]">*</span>
                </label>
                <select
                  value={targetFloorId}
                  onChange={(e) =>
                    handleTargetFloorChange(e.target.value ? Number(e.target.value) : '')
                  }
                  disabled={!targetBuildingId || loadingFloors || submitting}
                  className="w-full h-11 px-3.5 text-xs sm:text-sm bg-white border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#175C46] focus:border-[#175C46] transition-colors disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {loadingFloors
                      ? 'Loading floors...'
                      : !targetBuildingId
                      ? 'Select building first'
                      : 'Select floor'}
                  </option>
                  {floors.map((flr) => (
                    <option key={flr.id} value={flr.id}>
                      {flr.name || flr.floor_name || `Floor ${flr.floor_number}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Requested room no. */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Requested room no. <span className="text-[#175C46]">*</span>
                </label>
                <select
                  value={requestedRoomId}
                  onChange={(e) =>
                    setRequestedRoomId(e.target.value ? Number(e.target.value) : '')
                  }
                  disabled={!targetFloorId || loadingRooms || submitting}
                  className="w-full h-11 px-3.5 text-xs sm:text-sm bg-white border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#175C46] focus:border-[#175C46] transition-colors disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {loadingRooms
                      ? 'Loading rooms...'
                      : !targetFloorId
                      ? 'Select floor first'
                      : 'Select room'}
                  </option>
                  {availableRooms.map((rm) => (
                    <option key={rm.id} value={rm.id}>
                      {rm.room_no || rm.room_number || `Room ${rm.id}`}{' '}
                      {rm.room_type ? `(${rm.room_type})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Status * */}
          <div className="pt-1">
            <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-3">
              Status <span className="text-[#175C46]">*</span>
            </label>
            <div className="flex items-center gap-4 sm:gap-6">
              <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm font-medium text-gray-800">
                <input
                  type="radio"
                  name="shift-status"
                  value="approved"
                  checked={status === 'approved'}
                  onChange={() => setStatus('approved')}
                  className="w-4 h-4 text-[#175C46] focus:ring-[#175C46] border-gray-300"
                />
                <span>Approved</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm font-medium text-gray-800">
                <input
                  type="radio"
                  name="shift-status"
                  value="pending"
                  checked={status === 'pending'}
                  onChange={() => setStatus('pending')}
                  className="w-4 h-4 text-[#175C46] focus:ring-[#175C46] border-gray-300"
                />
                <span>Pending</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm font-medium text-gray-800">
                <input
                  type="radio"
                  name="shift-status"
                  value="rejected"
                  checked={status === 'rejected'}
                  onChange={() => setStatus('rejected')}
                  className="w-4 h-4 text-[#175C46] focus:ring-[#175C46] border-gray-300"
                />
                <span>Rejected</span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-12 rounded-lg bg-[#175C46] hover:bg-[#124937] text-white font-semibold text-sm transition-colors shadow-xs disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
