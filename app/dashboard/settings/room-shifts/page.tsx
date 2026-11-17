'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  DataTable,
  ColumnDef,
  TableActions,
  IconButton,
  StatusBadge,
  DeleteConfirmationModal,
  DeleteDetailItem,
} from '@/components/ui';
import {
  RoomShiftStatsCards,
  RoomShiftDetailsModal,
  RoomShiftStatusModal,
} from '@/components/room-shifts';
import {
  RoomShiftRequest,
  RoomShiftStats,
  RoomShiftMeta,
} from '@/types/room-shift';
import { roomShiftService, INITIAL_ROOM_SHIFT_STATS } from '@/services/room-shift.service';

export default function RoomShiftRequestPage() {
  const router = useRouter();

  // Data states
  const [shifts, setShifts] = useState<RoomShiftRequest[]>([]);
  const [stats, setStats] = useState<RoomShiftStats>(INITIAL_ROOM_SHIFT_STATS);
  const [meta, setMeta] = useState<RoomShiftMeta>({
    page: 1,
    limit: 10,
    total_pages: 1,
    total_items: 0,
  });

  // UI & Loading states
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  // Modals state
  const [selectedShift, setSelectedShift] = useState<RoomShiftRequest | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [statusModalShift, setStatusModalShift] = useState<RoomShiftRequest | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [shiftToDelete, setShiftToDelete] = useState<RoomShiftRequest | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch KPI Stats
  useEffect(() => {
    let isMounted = true;
    roomShiftService
      .getShiftStats()
      .then((data) => {
        if (!isMounted) return;
        setStats(data);
      })
      .catch((err) => {
        console.error('Failed to fetch room shift stats:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingStats(false);
      });

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  // Fetch paginated shift requests
  useEffect(() => {
    let isMounted = true;
    roomShiftService
      .getShifts({
        page: currentPage,
        limit: 10,
      })
      .then((res) => {
        if (!isMounted) return;
        setShifts(res.data);
        setMeta(res.meta);
      })
      .catch((err) => {
        console.error('Failed to fetch room shifts:', err);
        if (isMounted) setShifts([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentPage, refreshKey]);

  // Action Handlers
  const handleView = useCallback((item: RoomShiftRequest) => {
    setSelectedShift(item);
    setIsDetailsOpen(true);
  }, []);

  const handleOpenStatusModal = useCallback((item: RoomShiftRequest) => {
    setStatusModalShift(item);
    setIsStatusModalOpen(true);
  }, []);

  const handleDeleteClick = useCallback((item: RoomShiftRequest) => {
    setShiftToDelete(item);
    setIsDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = async () => {
    if (!shiftToDelete) return;
    try {
      setIsDeleting(true);
      await roomShiftService.deleteShift(shiftToDelete.id);
      setIsDeleteModalOpen(false);
      setShiftToDelete(null);
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      console.error('Failed to delete shift request:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Table Columns matching image media_1794916841270_a7110dff.png
  const columns: ColumnDef<RoomShiftRequest>[] = useMemo(
    () => [
      {
        key: 'sr_no',
        header: 'Sr no.',
        width: '80px',
        cell: (_: RoomShiftRequest, index: number) => (
          <span className="text-xs sm:text-sm font-medium text-gray-700">
            {(currentPage - 1) * 10 + index + 1}
          </span>
        ),
      },
      {
        key: 'resident',
        header: 'Resident',
        cell: (item: RoomShiftRequest) => (
          <span className="text-xs sm:text-sm font-semibold text-gray-900 block truncate">
            {item.resident?.name || '—'}
          </span>
        ),
      },
      {
        key: 'current_room',
        header: 'Current room',
        cell: (item: RoomShiftRequest) => (
          <span className="text-xs sm:text-sm font-medium text-gray-700">
            {item.current_room?.room_no || '—'}
          </span>
        ),
      },
      {
        key: 'requested_room',
        header: 'Requested room',
        cell: (item: RoomShiftRequest) => (
          <span className="text-xs sm:text-sm font-medium text-gray-700">
            {item.requested_room?.room_no || '—'}
          </span>
        ),
      },
      {
        key: 'reason',
        header: 'Reason',
        cell: (item: RoomShiftRequest) => (
          <span className="text-xs sm:text-sm text-gray-700 block truncate max-w-[220px]">
            {item.reason || '—'}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        cell: (item: RoomShiftRequest) => (
          <StatusBadge status={item.status} label={item.status} />
        ),
      },
      {
        key: 'actions',
        header: 'Action',
        align: 'right',
        cell: (item: RoomShiftRequest) => (
          <TableActions>
            <IconButton
              variant="view"
              title="View Shift Details"
              onClick={() => handleView(item)}
            />
            <button
              type="button"
              title="Review & Update Status"
              onClick={() => handleOpenStatusModal(item)}
              className="w-8 h-8 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-[#175C46] hover:border-emerald-300 hover:bg-emerald-50/50 flex items-center justify-center transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <IconButton
              variant="delete"
              title="Delete Shift Request"
              onClick={() => handleDeleteClick(item)}
            />
          </TableActions>
        ),
      },
    ],
    [currentPage, handleView, handleOpenStatusModal, handleDeleteClick]
  );

  const deleteDetails: DeleteDetailItem[] = shiftToDelete
    ? [
        { label: 'Resident', value: shiftToDelete.resident?.name || '—' },
        { label: 'Current Room', value: shiftToDelete.current_room?.room_no || '—' },
        { label: 'Requested Room', value: shiftToDelete.requested_room?.room_no || '—' },
        { label: 'Reason', value: shiftToDelete.reason || '—' },
        { label: 'Status', value: shiftToDelete.status || '—' },
      ]
    : [];

  return (
    <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 sm:py-6 max-w-[1600px] w-full mx-auto space-y-6 bg-[#F7F7F5] animate-fade-in font-sans">
      {/* Top Header matching media_1794916841270_a7110dff.png */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Room Shift Request
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-normal mt-0.5">
            Review and approve room change requests from residents.
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={() => router.push('/dashboard/settings/room-shifts/new')}
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-[#175C46] hover:bg-[#124937] text-white text-xs sm:text-sm font-semibold tracking-wide transition-all shadow-xs cursor-pointer"
          >
            New Request
          </button>
        </div>
      </div>

      {/* KPI Stats Cards matching media_1794916841270_a7110dff.png */}
      <RoomShiftStatsCards stats={stats} loading={loadingStats} />

      {/* DataTable matching media_1794916841270_a7110dff.png */}
      <DataTable
        columns={columns}
        data={shifts}
        loading={loading}
        loadingLabel="Loading room shift requests..."
        emptyTitle="No Room Shift Requests Found"
        emptyDescription="There are no room shift requests found."
        pagination={{
          currentPage,
          totalCount: meta.total_items || shifts.length,
          pageSize: 10,
          itemCount: shifts.length,
          itemLabel: 'records',
          onPageChange: (page: number) => setCurrentPage(page),
        }}
      />

      {/* Shift Details Modal */}
      <RoomShiftDetailsModal
        visible={isDetailsOpen}
        onHide={() => {
          setIsDetailsOpen(false);
          setSelectedShift(null);
        }}
        shift={selectedShift}
        onOpenStatusModal={(s) => handleOpenStatusModal(s)}
      />

      {/* Shift Status Update Modal */}
      <RoomShiftStatusModal
        visible={isStatusModalOpen}
        onHide={() => {
          setIsStatusModalOpen(false);
          setStatusModalShift(null);
        }}
        shift={statusModalShift}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        visible={isDeleteModalOpen}
        onHide={() => {
          setIsDeleteModalOpen(false);
          setShiftToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Room Shift Request"
        subtitle="Are you sure you want to delete this room shift request? This action cannot be undone."
        loading={isDeleting}
        details={deleteDetails}
      />
    </main>
  );
}
