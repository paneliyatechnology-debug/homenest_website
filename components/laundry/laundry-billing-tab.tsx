'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  LaundryUserResident,
  LaundryUsersOverview,
  CreateLaundryPaymentPayload,
  LaundryPaymentEntry,
  LaundryRequest,
} from '@/types/laundry';
import { laundryService } from '@/services/laundry.service';
import { DataTable, ColumnDef, StatusBadge, AppDatePicker, Dropdown, SearchInput } from '@/components/ui';
import { Dialog } from 'primereact/dialog';

interface LaundryBillingTabProps {
  branchId?: number | string;
}

interface ModalEntryItem {
  resident_id: number;
  name: string;
  room_no?: string;
  branch_name?: string;
  unbilled_orders_count: number;
  amount: number;
  laundry_request_ids: number[];
  availableRequests?: LaundryRequest[];
}

export const LaundryBillingTab: React.FC<LaundryBillingTabProps> = ({ branchId = 'all' }) => {
  const [users, setUsers] = useState<LaundryUserResident[]>([]);
  const [overview, setOverview] = useState<LaundryUsersOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [refreshKey, setRefreshKey] = useState(0);

  // Multi-Selection State for Batch Billing
  const [selectedResidentIds, setSelectedResidentIds] = useState<number[]>([]);

  // Bill Generation Modal State
  const [billModalOpen, setBillModalOpen] = useState(false);
  const [modalEntries, setModalEntries] = useState<ModalEntryItem[]>([]);
  const [billTitle, setBillTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [billNotes, setBillNotes] = useState('Monthly laundry billing');
  const [isGeneratingBill, setIsGeneratingBill] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Default helpers
  const getDefaultTitle = useCallback(() => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const now = new Date();
    return `Laundry Charges - ${monthNames[now.getMonth()]} ${now.getFullYear()}`;
  }, []);

  const getDefaultDueDate = useCallback(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  // Fetch Residents Laundry Summary
  useEffect(() => {
    let isMounted = true;

    laundryService
      .getUsers({
        branch_id: branchId === 'all' ? undefined : branchId,
        search: search.trim(),
        laundry_status: statusFilter === 'all' ? undefined : statusFilter,
        page: currentPage,
        limit: 10,
        sort_by: 'unbilled_amount',
        order: 'desc',
      })
      .then((res) => {
        if (!isMounted) return;
        setUsers(res.data || []);
        if (res.meta?.overview) {
          setOverview(res.meta.overview);
        }
      })
      .catch((err) => console.warn('Failed to load laundry users:', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [branchId, search, statusFilter, currentPage, refreshKey]);

  // Residents on current page eligible for billing (unbilled_amount > 0)
  const selectableResidentsOnPage = useMemo(() => {
    return users.filter((u) => u.laundry_summary.unbilled_amount > 0);
  }, [users]);

  const allPageSelectableSelected = useMemo(() => {
    if (selectableResidentsOnPage.length === 0) return false;
    return selectableResidentsOnPage.every((u) =>
      selectedResidentIds.includes(u.resident.id)
    );
  }, [selectableResidentsOnPage, selectedResidentIds]);

  const handleToggleSelectAll = useCallback(() => {
    if (allPageSelectableSelected) {
      const pageIds = selectableResidentsOnPage.map((u) => u.resident.id);
      setSelectedResidentIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      const pageIds = selectableResidentsOnPage.map((u) => u.resident.id);
      setSelectedResidentIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  }, [allPageSelectableSelected, selectableResidentsOnPage]);

  const handleToggleSelectOne = (id: number) => {
    setSelectedResidentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Open Modal for a Single Resident
  const handleOpenSingleResidentModal = useCallback(async (user: LaundryUserResident) => {
    const defaultEntry: ModalEntryItem = {
      resident_id: user.resident.id,
      name: user.resident.name,
      room_no: user.resident.room?.room_no,
      branch_name: user.resident.branch_name,
      unbilled_orders_count: user.laundry_summary.unbilled_orders_count,
      amount: user.laundry_summary.unbilled_amount,
      laundry_request_ids: user.last_order && !user.last_order.is_billed ? [user.last_order.id] : [],
      availableRequests: [],
    };

    setModalEntries([defaultEntry]);
    setBillTitle(getDefaultTitle());
    setDueDate(getDefaultDueDate());
    setBillNotes(`Monthly laundry billing for ${user.resident.name}`);
    setBillModalOpen(true);

    // Fetch full order breakdown for fine-grained order selection
    setLoadingRequests(true);
    try {
      const billingData = await laundryService.getResidentBilling(user.resident.id);
      if (billingData?.laundry_requests) {
        const unbilledReqs = billingData.laundry_requests.filter(
          (r) => !r.is_billed && r.status !== 'cancelled'
        );
        const reqIds = unbilledReqs.map((r) => r.id);
        const totalReqAmount = unbilledReqs.reduce((sum, r) => sum + r.total_amount, 0);

        setModalEntries([
          {
            ...defaultEntry,
            amount: totalReqAmount > 0 ? totalReqAmount : user.laundry_summary.unbilled_amount,
            laundry_request_ids: reqIds,
            availableRequests: unbilledReqs,
          },
        ]);
      }
    } catch (err) {
      console.warn('Could not fetch resident unbilled orders:', err);
    } finally {
      setLoadingRequests(false);
    }
  }, [getDefaultDueDate, getDefaultTitle]);

  // Open Modal for Batch of Selected Residents
  const handleOpenBatchModal = () => {
    const selectedUsers = users.filter((u) => selectedResidentIds.includes(u.resident.id));
    if (selectedUsers.length === 0) return;

    const entries: ModalEntryItem[] = selectedUsers.map((u) => ({
      resident_id: u.resident.id,
      name: u.resident.name,
      room_no: u.resident.room?.room_no,
      branch_name: u.resident.branch_name,
      unbilled_orders_count: u.laundry_summary.unbilled_orders_count,
      amount: u.laundry_summary.unbilled_amount,
      laundry_request_ids: u.last_order && !u.last_order.is_billed ? [u.last_order.id] : [],
    }));

    setModalEntries(entries);
    setBillTitle(getDefaultTitle());
    setDueDate(getDefaultDueDate());
    setBillNotes('Monthly laundry billing');
    setBillModalOpen(true);
  };

  // Select all unbilled residents across entire PG/branch
  const handleSelectAllUnbilled = () => {
    const allUnbilled = users
      .filter((u) => u.laundry_summary.unbilled_amount > 0)
      .map((u) => u.resident.id);
    setSelectedResidentIds(allUnbilled);
  };

  // Handle Order Checkbox Toggle in Single Resident Mode
  const handleToggleRequestForResident = (requestId: number, reqAmount: number) => {
    setModalEntries((prev) => {
      if (prev.length === 0) return prev;
      const target = { ...prev[0] };
      const currentIds = target.laundry_request_ids || [];
      const isChecked = currentIds.includes(requestId);

      let nextIds: number[];
      let nextAmount: number;

      if (isChecked) {
        nextIds = currentIds.filter((id) => id !== requestId);
        nextAmount = Math.max(0, target.amount - reqAmount);
      } else {
        nextIds = [...currentIds, requestId];
        nextAmount = target.amount + reqAmount;
      }

      target.laundry_request_ids = nextIds;
      target.amount = parseFloat(nextAmount.toFixed(2));
      return [target];
    });
  };

  // Handle Amount change for an entry in Batch Mode
  const handleEntryAmountChange = (residentId: number, newAmount: number) => {
    setModalEntries((prev) =>
      prev.map((e) =>
        e.resident_id === residentId ? { ...e, amount: Math.max(0, newAmount) } : e
      )
    );
  };

  // Remove resident from current batch
  const handleRemoveEntry = (residentId: number) => {
    setModalEntries((prev) => prev.filter((e) => e.resident_id !== residentId));
  };

  // Calculate live Grand Total in modal
  const modalGrandTotal = useMemo(() => {
    return modalEntries.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [modalEntries]);

  // Submit Handler for POST /api/v1/laundry/payments
  const handleGenerateBillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modalEntries.length === 0 || isGeneratingBill) return;

    if (!billTitle.trim()) {
      alert('Please enter an invoice title');
      return;
    }
    if (!dueDate) {
      alert('Please select a due date');
      return;
    }

    try {
      setIsGeneratingBill(true);

      const entriesPayload: LaundryPaymentEntry[] = modalEntries.map((entry) => ({
        resident_id: entry.resident_id,
        amount: Number(entry.amount),
        laundry_request_ids:
          entry.laundry_request_ids && entry.laundry_request_ids.length > 0
            ? entry.laundry_request_ids
            : undefined,
      }));

      const payload: CreateLaundryPaymentPayload = {
        title: billTitle.trim(),
        due_date: dueDate,
        notes: billNotes.trim() || undefined,
        entries: entriesPayload,
      };

      await laundryService.createLaundryPayment(payload);

      setBillModalOpen(false);
      setModalEntries([]);
      setSelectedResidentIds([]);
      setRefreshKey((k) => k + 1);
    } catch {
      // apiClient handles alert / notification
    } finally {
      setIsGeneratingBill(false);
    }
  };

  // Selected Residents Overview Metric
  const totalSelectedUnbilled = useMemo(() => {
    return users
      .filter((u) => selectedResidentIds.includes(u.resident.id))
      .reduce((sum, u) => sum + u.laundry_summary.unbilled_amount, 0);
  }, [users, selectedResidentIds]);

  const columns: ColumnDef<LaundryUserResident>[] = useMemo(
    () => [
      {
        key: 'select',
        header: (
          <div className="flex items-center justify-center pl-1">
            <input
              type="checkbox"
              checked={allPageSelectableSelected}
              onChange={handleToggleSelectAll}
              className="w-4 h-4 rounded text-[#175C46] border-gray-300 focus:ring-[#175C46] cursor-pointer"
              title="Select all unbilled residents on this page"
            />
          </div>
        ),
        width: '44px',
        cell: (item: LaundryUserResident) => {
          const isSelectable = item.laundry_summary.unbilled_amount > 0;
          const isSelected = selectedResidentIds.includes(item.resident.id);

          return (
            <div className="flex items-center justify-center pl-1">
              <input
                type="checkbox"
                disabled={!isSelectable}
                checked={isSelected}
                onChange={() => handleToggleSelectOne(item.resident.id)}
                className="w-4 h-4 rounded text-[#175C46] border-gray-300 focus:ring-[#175C46] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                title={isSelectable ? 'Select for batch invoice' : 'No unbilled dues'}
              />
            </div>
          );
        },
      },
      {
        key: 'resident',
        header: 'Resident',
        cell: (item: LaundryUserResident) => (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-50 text-[#175C46] font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-100 shadow-2xs">
              {item.resident.name ? item.resident.name.charAt(0).toUpperCase() : 'R'}
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-gray-900 line-clamp-1">
                {item.resident.name}
              </p>
              <p className="text-[11px] text-gray-500">
                {item.resident.room?.room_no ? `Room ${item.resident.room.room_no}` : 'No room'} • {item.resident.branch_name || 'Main Branch'}
              </p>
            </div>
          </div>
        ),
      },
      {
        key: 'orders',
        header: 'Orders & Cleaned',
        cell: (item: LaundryUserResident) => (
          <div>
            <span className="text-xs sm:text-sm font-bold text-gray-900 block">
              {item.laundry_summary.total_orders} Orders
            </span>
            <span className="text-[11px] text-gray-500 font-medium">
              {item.laundry_summary.total_items_cleaned} items cleaned
            </span>
          </div>
        ),
      },
      {
        key: 'unbilled',
        header: 'Unbilled Dues',
        cell: (item: LaundryUserResident) => (
          <div>
            <span
              className={`text-xs sm:text-sm font-bold block ${
                item.laundry_summary.unbilled_amount > 0 ? 'text-amber-700' : 'text-gray-900'
              }`}
            >
              ₹{item.laundry_summary.unbilled_amount}
            </span>
            <span className="text-[11px] text-gray-500">
              {item.laundry_summary.unbilled_orders_count} unbilled order(s)
            </span>
          </div>
        ),
      },
      {
        key: 'total_charges',
        header: 'Total Charges',
        cell: (item: LaundryUserResident) => (
          <div>
            <span className="text-xs sm:text-sm font-bold text-gray-900 block">
              ₹{item.laundry_summary.total_charges}
            </span>
            <span className="text-[11px] text-gray-500">
              Due: ₹{item.payment_summary.total_due}
            </span>
          </div>
        ),
      },
      {
        key: 'last_order',
        header: 'Last Order',
        cell: (item: LaundryUserResident) => (
          <div className="max-w-xs">
            {item.last_order ? (
              <>
                <p className="text-xs font-semibold text-gray-900 line-clamp-1">
                  {item.last_order.request_number} • {item.last_order.request_detail}
                </p>
                <p className="text-[11px] text-gray-500">
                  {item.last_order.pickup_schedule || item.last_order.created_at}
                </p>
              </>
            ) : (
              <span className="text-gray-400 text-xs italic">No orders yet</span>
            )}
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Payment Status',
        cell: (item: LaundryUserResident) => (
          <StatusBadge
            status={item.payment_summary.payment_status}
            label={
              item.payment_summary.payment_status === 'no_orders'
                ? 'No Orders'
                : item.payment_summary.payment_status
            }
          />
        ),
      },
      {
        key: 'actions',
        header: 'Action',
        align: 'right',
        cell: (item: LaundryUserResident) => (
          <button
            type="button"
            disabled={item.laundry_summary.unbilled_amount <= 0}
            onClick={() => handleOpenSingleResidentModal(item)}
            className="h-8 px-3 text-xs font-semibold rounded-lg border transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-emerald-50 text-[#175C46] border-emerald-200 hover:bg-emerald-100/70 shadow-2xs flex items-center gap-1.5"
            title={item.laundry_summary.unbilled_amount > 0 ? 'Generate Payment Bill' : 'No unbilled dues'}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Create Bill
          </button>
        ),
      },
    ],
    [
      allPageSelectableSelected,
      handleOpenSingleResidentModal,
      handleToggleSelectAll,
      selectedResidentIds,
    ]
  );

  return (
    <div className="space-y-5 animate-fade-in font-sans">
      {/* KPI Overview Cards */}
      {overview && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-2xs">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Residents with Laundry
            </span>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
              {overview.residents_with_laundry}{' '}
              <span className="text-xs font-normal text-gray-400">/ {overview.total_residents}</span>
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-2xs">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Unbilled Residents
            </span>
            <p className="text-xl sm:text-2xl font-bold text-amber-700 mt-1">
              {overview.residents_with_unbilled}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-2xs">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Total Unbilled Amount
            </span>
            <p className="text-xl sm:text-2xl font-bold text-[#175C46] mt-1">
              ₹{overview.total_unbilled_amount}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-2xs">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Total Outstanding Due
            </span>
            <p className="text-xl sm:text-2xl font-bold text-rose-600 mt-1">
              ₹{overview.total_due_amount}
            </p>
          </div>
        </div>
      )}

      {/* Interactive Selection Toolbar Banner */}
      {selectedResidentIds.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200/90 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs animate-fade-in">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
              ✓
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-emerald-950">
                {selectedResidentIds.length} resident{selectedResidentIds.length > 1 ? 's' : ''} selected
              </p>
              <p className="text-[11px] text-emerald-700">
                Total Unbilled Amount to Invoice: <span className="font-bold">₹{totalSelectedUnbilled}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setSelectedResidentIds([])}
              className="px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950 hover:bg-emerald-100/60 rounded-lg transition-colors cursor-pointer"
            >
              Clear Selection
            </button>
            <button
              type="button"
              onClick={handleOpenBatchModal}
              className="h-9 px-4 rounded-xl bg-[#175C46] hover:bg-[#124b38] text-white text-xs font-bold flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
              </svg>
              Generate Batch Invoices ({selectedResidentIds.length})
            </button>
          </div>
        </div>
      )}

      {/* Search & Actions Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-gray-100 shadow-2xs">
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2.5 sm:gap-3 flex-1">
          <div className="col-span-2 sm:flex-1 sm:max-w-sm">
            <SearchInput
              value={search}
              onChange={(val) => {
                setSearch(val);
                setCurrentPage(1);
              }}
              onClear={() => {
                setSearch('');
                setCurrentPage(1);
              }}
              placeholder="Search resident by name or room..."
            />
          </div>

          <div className="col-span-2 sm:w-48">
            <Dropdown
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              options={[
                { label: 'All Status', value: 'all' },
                { label: 'Has Unbilled Dues', value: 'has_unbilled' },
                { label: 'Has Orders', value: 'has_orders' },
                { label: 'Has Payment Due', value: 'has_due' },
              ]}
              placeholder="All Status"
            />
          </div>
        </div>

        {/* Quick Batch Select Button */}
        {overview && overview.residents_with_unbilled > 0 && selectedResidentIds.length === 0 && (
          <button
            type="button"
            onClick={handleSelectAllUnbilled}
            className="h-10 sm:h-11 px-4 text-xs font-semibold text-[#175C46] bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shrink-0 shadow-2xs"
          >
            <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Select All Unbilled ({overview.residents_with_unbilled})
          </button>
        )}
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        loadingLabel="Loading residents laundry overview..."
        emptyTitle="No Laundry Users Found"
        emptyDescription="No laundry usage records found for selected filters."
        pagination={{
          currentPage,
          totalCount: overview?.total_residents || users.length,
          pageSize: 10,
          itemCount: users.length,
          itemLabel: 'residents',
          onPageChange: (p: number) => setCurrentPage(p),
        }}
      />

      {/* Create Payment Invoice Dialog matching user's curl API */}
      <Dialog
        visible={billModalOpen}
        onHide={() => {
          if (!isGeneratingBill) {
            setBillModalOpen(false);
          }
        }}
        modal
        draggable={false}
        resizable={false}
        className="w-full max-w-2xl mx-4 rounded-2xl overflow-hidden shadow-2xl border-0 font-sans"
        header={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E8F8F0] text-[#175C46] flex items-center justify-center shrink-0 shadow-2xs">
              <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
                {modalEntries.length > 1
                  ? 'Generate Batch Laundry Invoices'
                  : 'Generate Laundry Invoice'}
              </h2>
              <p className="text-xs text-gray-500 font-normal">
                {modalEntries.length > 1
                  ? `Invoicing ${modalEntries.length} selected residents`
                  : `${modalEntries[0]?.name} • ${modalEntries[0]?.room_no ? `Room ${modalEntries[0].room_no}` : ''}`}
              </p>
            </div>
          </div>
        }
        contentClassName="p-5 sm:p-6 bg-white space-y-5 max-h-[78vh] overflow-y-auto"
      >
        <form onSubmit={handleGenerateBillSubmit} className="space-y-5">
          {/* Top Form Fields: Title, Due Date, Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1.5">
                Invoice Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={billTitle}
                onChange={(e) => setBillTitle(e.target.value)}
                placeholder="Enter invoice title (e.g. Monthly Laundry Charges)"
                required
                className="w-full h-11 px-3.5 rounded-xl border border-gray-200 text-xs sm:text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#175C46]/20 focus:border-[#175C46]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1.5">
                Due Date <span className="text-red-500">*</span>
              </label>
              <AppDatePicker
                value={dueDate}
                onChange={(val) => setDueDate(val)}
                placeholder="Select payment due date"
                className="w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1.5">
              Invoice Notes <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <textarea
              value={billNotes}
              onChange={(e) => setBillNotes(e.target.value)}
              rows={2}
              placeholder="Enter invoice notes or remarks..."
              className="w-full p-3 rounded-xl border border-gray-200 text-xs sm:text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#175C46]/20 focus:border-[#175C46] resize-none"
            />
          </div>

          {/* Section: Entries Breakdown */}
          {modalEntries.length === 1 ? (
            /* Single Resident Mode with Order Checklist */
            <div className="border-t border-gray-100 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-gray-900">
                    Resident Orders Breakdown
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Select orders to link with this payment invoice.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Invoice Amount
                  </span>
                  <p className="text-base font-bold text-[#175C46]">
                    ₹{modalEntries[0]?.amount}
                  </p>
                </div>
              </div>

              {loadingRequests ? (
                <div className="py-6 text-center text-xs text-gray-500">
                  <div className="w-5 h-5 border-2 border-[#175C46] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Loading unbilled orders...
                </div>
              ) : modalEntries[0]?.availableRequests && modalEntries[0].availableRequests.length > 0 ? (
                <div className="space-y-2 border border-gray-100 rounded-xl p-2.5 bg-gray-50/50 max-h-48 overflow-y-auto">
                  {modalEntries[0].availableRequests.map((req) => {
                    const isChecked = modalEntries[0].laundry_request_ids.includes(req.id);

                    return (
                      <label
                        key={req.id}
                        className={`p-2.5 rounded-lg border flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-white border-[#175C46] shadow-2xs'
                            : 'bg-white/60 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() =>
                              handleToggleRequestForResident(req.id, req.total_amount)
                            }
                            className="w-4 h-4 rounded text-[#175C46] border-gray-300 focus:ring-[#175C46] cursor-pointer"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-900 truncate">
                              {req.request_number} • {req.request_detail}
                            </p>
                            <p className="text-[11px] text-gray-500">
                              {req.pickup_schedule} • Status: {req.status}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-[#175C46] shrink-0">
                          ₹{req.total_amount}
                        </span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-600 font-medium">Unbilled Total</span>
                  <span className="text-sm font-bold text-[#175C46]">
                    ₹{modalEntries[0]?.amount}
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* Multi-Resident Batch Mode with Editable List */
            <div className="border-t border-gray-100 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-gray-900">
                    Residents & Amounts to Bill ({modalEntries.length})
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Review and adjust bill amounts for each resident before generating invoices.
                  </p>
                </div>
              </div>

              <div className="border border-gray-100 rounded-xl overflow-hidden shadow-2xs divide-y divide-gray-100 max-h-56 overflow-y-auto">
                {modalEntries.map((entry) => (
                  <div
                    key={entry.resident_id}
                    className="p-3 bg-white hover:bg-gray-50/50 flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                        {entry.name}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {entry.room_no ? `Room ${entry.room_no}` : 'No room'} • {entry.unbilled_orders_count} unbilled order(s)
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="relative w-28">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">
                          ₹
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={entry.amount}
                          onChange={(e) =>
                            handleEntryAmountChange(
                              entry.resident_id,
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full h-9 pl-6 pr-2.5 text-xs font-bold text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#175C46]"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveEntry(entry.resident_id)}
                        className="w-8 h-8 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer"
                        title="Remove resident from this billing batch"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Batch Summary Footer Card */}
              <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#175C46] uppercase tracking-wider block">
                    Total Invoices to Generate
                  </span>
                  <p className="text-xs text-emerald-900 font-medium">
                    {modalEntries.length} resident invoice(s)
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-[#175C46] uppercase tracking-wider block">
                    Grand Total
                  </span>
                  <p className="text-lg font-bold text-gray-900">
                    ₹{modalGrandTotal}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Modal Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
            <button
              type="button"
              disabled={isGeneratingBill}
              onClick={() => setBillModalOpen(false)}
              className="h-10 px-4 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isGeneratingBill || modalGrandTotal <= 0 || modalEntries.length === 0}
              className="h-10 px-5 text-xs font-bold text-white bg-[#175C46] hover:bg-[#124b38] rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isGeneratingBill ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                `Generate ${modalEntries.length > 1 ? `Invoices (${modalEntries.length})` : 'Invoice'}`
              )}
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
