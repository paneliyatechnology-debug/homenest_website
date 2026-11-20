'use client';

import React, { useEffect, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Building } from '@/types/building';
import { buildingService } from '@/services/building.service';
import { ModalHeader } from '@/components/ui';

interface BuildingDetailsModalProps {
  visible: boolean;
  onHide: () => void;
  buildingId?: number | string | null;
  building?: Building | null;
}

export const BuildingDetailsModal: React.FC<BuildingDetailsModalProps> = ({
  visible,
  onHide,
  buildingId,
  building,
}) => {
  const targetId = buildingId ?? building?.id ?? null;

  const [prevTargetId, setPrevTargetId] = useState<number | string | null>(null);
  const [fetchedBuilding, setFetchedBuilding] = useState<Building | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Synchronize state during render phase when visible / targetId changes
  if (visible && targetId !== prevTargetId) {
    setPrevTargetId(targetId);
    setFetchedBuilding(null);
    setLoading(true);
    setError(null);
  } else if (!visible && prevTargetId !== null) {
    setPrevTargetId(null);
    setFetchedBuilding(null);
    setLoading(false);
    setError(null);
  }

  // Always fetch fresh building details from the single building GET API whenever the modal opens
  useEffect(() => {
    if (!visible || !targetId) return;

    let isMounted = true;

    buildingService
      .getBuildingById(targetId)
      .then((data) => {
        if (!isMounted) return;
        setFetchedBuilding(data);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setLoading(false);
        setError(err?.message || 'Failed to load building details.');
      });

    return () => {
      isMounted = false;
    };
  }, [visible, targetId]);

  if (!visible) return null;

  const displayBuilding = fetchedBuilding;
  const titleName = displayBuilding?.name || building?.name || 'Building Details';
  const branchName =
    displayBuilding?.branch_name ||
    displayBuilding?.branch_title ||
    building?.branch_name ||
    building?.branch_title ||
    'Main Branch';

  const floorsList = displayBuilding?.floors || building?.floors || [];

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={
        <ModalHeader
          title={titleName}
          subtitle={branchName}
          iconShape="circle"
          icon={
            <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />
      }
      style={{ width: '520px' }}
      modal
      className="p-fluid rounded-2xl overflow-hidden font-sans"
    >
      {loading ? (
        <div className="py-14 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-[#175C46]/20 border-t-[#175C46] rounded-full animate-spin" />
          <p className="text-xs text-gray-500 font-medium">Loading building details...</p>
        </div>
      ) : error || !displayBuilding ? (
        <div className="py-10 text-center space-y-2">
          <p className="text-xs text-rose-500 font-medium">
            {error || 'Building details could not be found.'}
          </p>
          <button
            type="button"
            onClick={onHide}
            className="px-4 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      ) : (
        <div className="space-y-4 pt-1">
          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100 space-y-1">
              <span className="text-gray-400 font-medium block">Branch</span>
              <span className="font-semibold text-gray-800 block truncate">
                {branchName}
              </span>
            </div>

            <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100 space-y-1">
              <span className="text-gray-400 font-medium block">Total Floors</span>
              <span className="font-semibold text-gray-800 block">
                {displayBuilding.total_floors ?? floorsList.length} Floors
              </span>
            </div>

            <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100 space-y-1 col-span-2 sm:col-span-1">
              <span className="text-gray-400 font-medium block">Total Rooms</span>
              <span className="font-semibold text-gray-800 block">
                {displayBuilding.total_rooms ?? 0} Rooms
              </span>
            </div>
          </div>

          {/* Configured Floors List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                Configured Floors ({floorsList.length})
              </h4>
            </div>

            {floorsList.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-400 bg-gray-50/60 rounded-xl border border-dashed border-gray-200">
                No floor configuration found for this building.
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {floorsList.map((floor, index) => (
                  <div
                    key={floor.id ? String(floor.id) : index}
                    className="p-3 bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-[#E8F8F0] text-[#175C46] font-bold text-xs flex items-center justify-center shrink-0">
                        {floor.floor_number}
                      </span>
                      <div>
                        <span className="text-xs font-semibold text-gray-800 block">
                          {floor.name}
                        </span>
                        <span className="text-[11px] text-gray-400 block">
                          Floor Number: {floor.floor_number}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg">
                        {floor.total_rooms ?? 0} {floor.total_rooms === 1 ? 'room' : 'rooms'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={onHide}
              className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </Dialog>
  );
};
