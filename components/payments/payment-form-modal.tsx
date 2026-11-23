'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import {
  PaymentRecord,
  PaymentType,
  PaymentCreatePayload,
  PaymentUpdatePayload,
  formatCurrency,
} from '@/types/payment';
import { paymentService } from '@/services/payment.service';
import { residentService } from '@/services/resident.service';
import { branchService } from '@/services/branch.service';
import { Resident } from '@/types/resident';
import { Branch } from '@/types/branch';
import { AppDatePicker, Dropdown, ModalHeader } from '@/components/ui';
import { ResidentDropdown } from '@/components/residents/resident-dropdown';

interface ResidentContext {
  resident_id: number;
  resident_name?: string;
  pg_id?: number;
  branch_id?: number;
  branch_name?: string;
  building_name?: string;
  floor_name?: string;
  stay_id?: number;
  room_id?: number;
  room_no?: string;
  room_type?: string;
  monthly_rent?: number;
  security_deposit?: number;
}

interface PaymentFormModalProps {
  visible: boolean;
  onHide: () => void;
  onSuccess: () => void;
  initialPayment?: PaymentRecord | null;
  residentContext?: ResidentContext;
}

// Helper to format date string to YYYY-MM-DD
function parseToYYYYMMDD(dateStr?: string | null): string {
  if (!dateStr || !dateStr.trim()) return '';
  const clean = dateStr.trim().split(' ')[0];
  const parts = clean.includes('/') ? clean.split('/') : clean.split('-');
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
    if (parts[2].length === 4) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  return clean;
}

export const PaymentFormModal: React.FC<PaymentFormModalProps> = ({
  visible,
  onHide,
  onSuccess,
  initialPayment,
  residentContext,
}) => {
  const isEdit = Boolean(initialPayment);
  const [formSessionKey, setFormSessionKey] = useState(0);

  const handleClose = () => {
    setFormSessionKey((k) => k + 1);
    onHide();
  };

  const handleSuccess = () => {
    setFormSessionKey((k) => k + 1);
    onSuccess();
  };

  return (
    <Dialog
      visible={visible}
      onHide={handleClose}
      header={
        <ModalHeader
          title={isEdit ? 'Edit Payment / Invoice' : 'Record Payment / Generate Bill'}
          subtitle={
            isEdit
              ? 'Update billing breakdown, due date, and notes'
              : 'Create a new charge or invoice for the resident'
          }
          iconBg="bg-[#EBF7F2] text-[#175C46]"
          icon={
            <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
              />
            </svg>
          }
        />
      }
      style={{ width: '94vw', maxWidth: '640px' }}
      modal
      className="payment-form-modal font-sans"
    >
      {visible && (
        <PaymentFormContent
          key={`session-${formSessionKey}-${initialPayment ? `edit-${initialPayment.id}` : `create-${residentContext?.resident_id || 'new'}`}`}
          initialPayment={initialPayment}
          residentContext={residentContext}
          onHide={handleClose}
          onSuccess={handleSuccess}
        />
      )}
    </Dialog>
  );
};

interface PaymentFormContentProps {
  initialPayment?: PaymentRecord | null;
  residentContext?: ResidentContext;
  onHide: () => void;
  onSuccess: () => void;
}

const PaymentFormContent: React.FC<PaymentFormContentProps> = ({
  initialPayment,
  residentContext,
  onHide,
  onSuccess,
}) => {
  const isEdit = Boolean(initialPayment);

  // Form State - Clean by default unless editing an existing payment
  const [residentId, setResidentId] = useState<number | string>(
    initialPayment?.resident?.id ?? residentContext?.resident_id ?? ''
  );
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const [loadingResidentDetail, setLoadingResidentDetail] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);

  const [pgId, setPgId] = useState<number | string | undefined>(
    initialPayment?.pg_id ?? residentContext?.pg_id ?? undefined
  );
  const [branchId, setBranchId] = useState<number | string | undefined>(
    initialPayment?.branch_id ?? residentContext?.branch_id ?? undefined
  );
  const [stayId, setStayId] = useState<number | string | undefined>(
    initialPayment?.stay_id ?? residentContext?.stay_id ?? undefined
  );
  const [roomId, setRoomId] = useState<number | string | undefined>(
    initialPayment?.room_id ?? residentContext?.room_id ?? undefined
  );

  // Selected resident's location info for display
  const [selectedLocation, setSelectedLocation] = useState<{
    branchName?: string;
    buildingName?: string;
    floorName?: string;
    roomNo?: string;
    bedNumber?: string;
  } | null>(() => {
    if (residentContext) {
      return {
        branchName: residentContext.branch_name,
        buildingName: residentContext.building_name,
        floorName: residentContext.floor_name,
        roomNo: residentContext.room_no,
      };
    }
    if (initialPayment) {
      return {
        branchName: initialPayment.branch_name || undefined,
        buildingName: initialPayment.building_name || undefined,
        floorName:
          initialPayment.floor_name ||
          (initialPayment.floor_number ? `Floor ${initialPayment.floor_number}` : undefined),
        roomNo: initialPayment.room_no || undefined,
        bedNumber: initialPayment.bed_number || undefined,
      };
    }
    return null;
  });

  // Load branches to resolve branch names by ID if needed
  useEffect(() => {
    let isMounted = true;
    branchService
      .getBranches({ limit: 100 })
      .then((res) => {
        if (isMounted && res?.data) {
          setBranches(res.data);
        }
      })
      .catch(() => { });
    return () => {
      isMounted = false;
    };
  }, []);

  const displayBranchName = useMemo(() => {
    if (selectedLocation?.branchName) return selectedLocation.branchName;
    if (residentContext?.branch_name) return residentContext.branch_name;
    if (initialPayment?.branch_name) return initialPayment.branch_name;
    if (branchId) {
      const b = branches.find((item) => String(item.id) === String(branchId));
      if (b) return b.name;
    }
    return '';
  }, [
    selectedLocation?.branchName,
    residentContext?.branch_name,
    initialPayment?.branch_name,
    branchId,
    branches,
  ]);

  const handleResidentSelect = async (resident: Resident | null) => {
    setSelectedResident(resident);
    if (!resident) {
      setResidentId('');
      setSelectedLocation(null);
      setBranchId(undefined);
      setPgId(undefined);
      setStayId(undefined);
      setRoomId(undefined);
      return;
    }

    setResidentId(resident.id);
    if (errors.residentId) {
      setErrors((prev) => ({ ...prev, residentId: '' }));
    }

    // Initial location info from Resident list item
    const initialBranchName =
      resident.branch_name ||
      (resident.branch_id ? branches.find((b) => b.id === resident.branch_id)?.name : undefined) ||
      '';

    const floorDisplay =
      resident.floor_name ||
      (resident.floor_number ? `Floor ${resident.floor_number}` : '');

    setSelectedLocation({
      branchName: initialBranchName,
      buildingName: resident.building_name || '',
      floorName: floorDisplay,
      roomNo: resident.room_no || '',
      bedNumber: resident.bed_number || '',
    });

    if (resident.branch_id) setBranchId(resident.branch_id);
    if (resident.room_id) setRoomId(resident.room_id);

    // Fetch full resident detail for complete room_info (stay_id, pg_id, monthly_rent, etc.)
    setLoadingResidentDetail(true);
    try {
      const detail = await residentService.getResidentById(resident.id);
      if (detail?.room_info) {
        const info = detail.room_info;
        const resolvedBranchName =
          info.branch_name ||
          (info.branch_id ? branches.find((b) => b.id === info.branch_id)?.name : '') ||
          initialBranchName;

        const resolvedFloor =
          info.floor_name ||
          (info.floor_number ? `Floor ${info.floor_number}` : floorDisplay);

        setSelectedLocation({
          branchName: resolvedBranchName,
          buildingName: info.building_name || resident.building_name || '',
          floorName: resolvedFloor,
          roomNo: info.room_no || resident.room_no || '',
          bedNumber: info.bed_number || resident.bed_number || '',
        });

        if (info.branch_id) setBranchId(info.branch_id);
        if (info.pg_id) setPgId(info.pg_id);
        if (info.stay_id) setStayId(info.stay_id);
        if (info.room_id) setRoomId(info.room_id);
      }
    } catch (err) {
      console.warn('Failed to load resident details:', err);
    } finally {
      setLoadingResidentDetail(false);
    }
  };

  const resetForm = () => {
    setResidentId(initialPayment?.resident?.id ?? residentContext?.resident_id ?? '');
    setSelectedResident(null);
    setSelectedLocation(null);
    setBranchId(initialPayment?.branch_id ?? residentContext?.branch_id ?? undefined);
    setPgId(initialPayment?.pg_id ?? residentContext?.pg_id ?? undefined);
    setStayId(initialPayment?.stay_id ?? residentContext?.stay_id ?? undefined);
    setRoomId(initialPayment?.room_id ?? residentContext?.room_id ?? undefined);
    setTitle(initialPayment?.title ?? '');
    setPaymentType((initialPayment?.payment_type as PaymentType) || '');
    setBillingStart(parseToYYYYMMDD(initialPayment?.billing_period?.start) || '');
    setBillingEnd(parseToYYYYMMDD(initialPayment?.billing_period?.end) || '');
    setDueDate(parseToYYYYMMDD(initialPayment?.due_date) || '');
    setRentAmount('');
    setDepositAmount('');
    setMaintenanceAmount('');
    setElectricityAmount('');
    setOtherAmount('');
    setCustomAmount('');
    setManualOverride(false);
    setNotes(initialPayment?.notes ?? '');
    setErrors({});
  };

  const handleCancel = () => {
    resetForm();
    onHide();
  };

  const [title, setTitle] = useState<string>(
    initialPayment?.title ?? ''
  );
  const [paymentType, setPaymentType] = useState<PaymentType | ''>(
    (initialPayment?.payment_type as PaymentType) || ''
  );
  const [billingStart, setBillingStart] = useState<string>(
    parseToYYYYMMDD(initialPayment?.billing_period?.start) || ''
  );
  const [billingEnd, setBillingEnd] = useState<string>(
    parseToYYYYMMDD(initialPayment?.billing_period?.end) || ''
  );
  const [dueDate, setDueDate] = useState<string>(
    parseToYYYYMMDD(initialPayment?.due_date) || ''
  );

  // Breakdown Amounts - clean empty strings by default
  const breakdown = initialPayment?.breakdown;
  const [rentAmount, setRentAmount] = useState<string>(
    breakdown?.rent !== undefined ? String(breakdown.rent) : ''
  );
  const [depositAmount, setDepositAmount] = useState<string>(
    breakdown?.deposit !== undefined
      ? String(breakdown.deposit)
      : breakdown?.security_deposit !== undefined
        ? String(breakdown.security_deposit)
        : ''
  );
  const [maintenanceAmount, setMaintenanceAmount] = useState<string>(
    breakdown?.maintenance !== undefined ? String(breakdown.maintenance) : ''
  );
  const [electricityAmount, setElectricityAmount] = useState<string>(
    breakdown?.electricity !== undefined ? String(breakdown.electricity) : ''
  );
  const [otherAmount, setOtherAmount] = useState<string>(
    breakdown?.other !== undefined ? String(breakdown.other) : ''
  );

  // Custom amount override flag
  const [customAmount, setCustomAmount] = useState<string>(
    initialPayment?.amount ? String(initialPayment.amount) : ''
  );
  const [manualOverride, setManualOverride] = useState<boolean>(false);

  const [notes, setNotes] = useState<string>(
    initialPayment?.notes ?? ''
  );

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Computed sum from breakdown
  const computedSum = useMemo(() => {
    const rent = Number(rentAmount) || 0;
    const dep = Number(depositAmount) || 0;
    const maint = Number(maintenanceAmount) || 0;
    const elec = Number(electricityAmount) || 0;
    const oth = Number(otherAmount) || 0;
    return rent + dep + maint + elec + oth;
  }, [rentAmount, depositAmount, maintenanceAmount, electricityAmount, otherAmount]);

  // Sync amount with computed sum unless manual override is entered
  const effectiveAmount = manualOverride && customAmount !== '' ? Number(customAmount) || 0 : computedSum;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!paymentType) {
      newErrors.paymentType = 'Payment type is required';
    }
    if (!dueDate) {
      newErrors.dueDate = 'Due date is required';
    }
    if (!isEdit && !residentId) {
      newErrors.residentId = 'Please select a resident';
    }
    if (effectiveAmount <= 0) {
      newErrors.amount = 'Total amount must be greater than 0';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit && initialPayment) {
        const payload: PaymentUpdatePayload = {
          title: title.trim(),
          payment_type: paymentType as PaymentType,
          billing_period_start: billingStart || undefined,
          billing_period_end: billingEnd || undefined,
          due_date: dueDate,
          rent_amount: Number(rentAmount) || 0,
          deposit_amount: Number(depositAmount) || 0,
          maintenance_amount: Number(maintenanceAmount) || 0,
          electricity_amount: Number(electricityAmount) || 0,
          other_amount: Number(otherAmount) || 0,
          amount: effectiveAmount,
          notes: notes.trim() || undefined,
        };

        await paymentService.updatePayment(initialPayment.id, payload);
      } else {
        const payload: PaymentCreatePayload = {
          resident_id: Number(residentId),
          title: title.trim(),
          payment_type: paymentType as PaymentType,
          billing_period_start: billingStart || undefined,
          billing_period_end: billingEnd || undefined,
          due_date: dueDate,
          rent_amount: Number(rentAmount) || 0,
          deposit_amount: Number(depositAmount) || 0,
          maintenance_amount: Number(maintenanceAmount) || 0,
          electricity_amount: Number(electricityAmount) || 0,
          other_amount: Number(otherAmount) || 0,
          amount: effectiveAmount,
          notes: notes.trim() || undefined,
        };

        if (pgId) {
          payload.pg_id = Number(pgId);
        }
        if (branchId) {
          payload.branch_id = Number(branchId);
        }
        if (stayId) {
          payload.stay_id = Number(stayId);
        }
        if (roomId) {
          payload.room_id = Number(roomId);
        }

        await paymentService.createPayment(payload);
      }

      resetForm();
      onSuccess();
      onHide();
    } catch (err: unknown) {
      console.error('Failed to save payment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const paymentTypeOptions = [
    { label: 'Rent', value: 'rent' },
    { label: 'Maintenance', value: 'maintenance' },
    { label: 'Security Deposit', value: 'security_deposit' },
    { label: 'Electricity', value: 'electricity' },
    { label: 'Laundry', value: 'laundry' },
    { label: 'Other', value: 'other' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-1">
      {/* Resident Context Banner or Selector */}
      {residentContext || initialPayment?.resident ? (
        <div className="p-3.5 bg-gradient-to-r from-emerald-50/70 to-teal-50/40 rounded-xl border border-emerald-100 space-y-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#175C46] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                {(residentContext?.resident_name || initialPayment?.resident?.name)?.charAt(0) || 'R'}
              </div>
              <div>
                <span className="text-xs font-bold text-gray-900 block leading-tight">
                  {residentContext?.resident_name || initialPayment?.resident?.name || `Resident #${residentId}`}
                </span>
                <span className="text-[11px] text-gray-500 block">
                  {(residentContext?.room_no || initialPayment?.room_no)
                    ? `Room ${residentContext?.room_no || initialPayment?.room_no}`
                    : 'Assigned Resident'}
                  {(residentContext?.room_type || initialPayment?.room_type)
                    ? ` • ${residentContext?.room_type || initialPayment?.room_type}`
                    : ''}
                </span>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-[#175C46] bg-white px-2.5 py-1 rounded-lg border border-emerald-200/60 shadow-2xs">
              ID: #{residentId}
            </span>
          </div>

          {/* Location Details: Branch, Building, Floor, Room */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-emerald-100/60 text-xs">
            <div className="bg-white/80 p-2 rounded-lg border border-emerald-100/50">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">Branch</span>
              <span className="font-semibold text-gray-800 text-xs truncate block mt-0.5" title={displayBranchName}>
                {displayBranchName || '—'}
              </span>
            </div>
            <div className="bg-white/80 p-2 rounded-lg border border-emerald-100/50">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">Building</span>
              <span className="font-semibold text-gray-800 text-xs truncate block mt-0.5" title={selectedLocation?.buildingName}>
                {selectedLocation?.buildingName || '—'}
              </span>
            </div>
            <div className="bg-white/80 p-2 rounded-lg border border-emerald-100/50">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">Floor</span>
              <span className="font-semibold text-gray-800 text-xs truncate block mt-0.5" title={selectedLocation?.floorName}>
                {selectedLocation?.floorName || '—'}
              </span>
            </div>
            <div className="bg-white/80 p-2 rounded-lg border border-emerald-100/50">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">Room</span>
              <span className="font-bold text-[#175C46] text-xs truncate block mt-0.5" title={selectedLocation?.roomNo}>
                {(residentContext?.room_no || initialPayment?.room_no || selectedLocation?.roomNo)
                  ? `Room ${residentContext?.room_no || initialPayment?.room_no || selectedLocation?.roomNo}`
                  : '—'}
                {(residentContext?.room_type || initialPayment?.room_type)
                  ? ` (${residentContext?.room_type || initialPayment?.room_type})`
                  : ''}
              </span>
            </div>
          </div>
        </div>
      ) : !isEdit ? (
        <div className="space-y-2.5">
          <div className="relative z-20">
            <label className="block text-xs font-semibold text-gray-800 mb-1.5">
              Resident <span className="text-red-500">*</span>
            </label>
            <ResidentDropdown
              selectedResidentId={residentId ? Number(residentId) : null}
              selectedResidentName={selectedResident?.name}
              placeholder="Search and select resident..."
              onSelect={handleResidentSelect}
              hasError={Boolean(errors.residentId)}
              allowClear
            />
            {errors.residentId && <p className="text-[11px] text-red-500 mt-1">{errors.residentId}</p>}
          </div>

          {/* Allocation Details: Branch Name, Building, Floor, Room */}
          {residentId && (selectedLocation || loadingResidentDetail) && (
            <div className="p-3 bg-gradient-to-r from-emerald-50/60 to-teal-50/40 rounded-xl border border-emerald-100/80 shadow-2xs space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-700 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-[#175C46]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  Resident Allocation Details
                </span>
                {loadingResidentDetail && (
                  <span className="text-[11px] text-gray-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#175C46] animate-pulse" />
                    Loading details...
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5 text-xs">
                <div className="bg-white/90 p-2 rounded-lg border border-emerald-100/60">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">Branch</span>
                  <span className="font-bold text-gray-800 text-xs truncate block mt-0.5" title={displayBranchName}>
                    {displayBranchName || '—'}
                  </span>
                </div>

                <div className="bg-white/90 p-2 rounded-lg border border-emerald-100/60">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">Building</span>
                  <span className="font-bold text-gray-800 text-xs truncate block mt-0.5" title={selectedLocation?.buildingName}>
                    {selectedLocation?.buildingName || '—'}
                  </span>
                </div>

                <div className="bg-white/90 p-2 rounded-lg border border-emerald-100/60">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">Floor</span>
                  <span className="font-bold text-gray-800 text-xs truncate block mt-0.5" title={selectedLocation?.floorName}>
                    {selectedLocation?.floorName || '—'}
                  </span>
                </div>

                <div className="bg-white/90 p-2 rounded-lg border border-emerald-100/60">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">Room</span>
                  <span className="font-extrabold text-[#175C46] text-xs truncate block mt-0.5" title={selectedLocation?.roomNo}>
                    {selectedLocation?.roomNo ? `Room ${selectedLocation.roomNo}` : '—'}
                    {selectedLocation?.bedNumber ? ` (${selectedLocation.bedNumber})` : ''}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Row 1: Invoice Title */}
      <div>
        <label className="block text-xs font-semibold text-gray-800 mb-1.5">
          Invoice / Bill Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
          }}
          placeholder="Enter invoice title (e.g. Monthly Rent & Utilities)"
          className={`w-full h-11 px-4 bg-white border ${errors.title
            ? 'border-rose-400 focus:ring-1 focus:ring-rose-500 focus:border-rose-500 text-rose-900'
            : 'border-gray-200/90 hover:border-gray-300 focus:ring-1 focus:ring-[#175C46] focus:border-[#175C46] text-gray-800'
            } rounded-xl text-xs sm:text-sm focus:outline-none transition-all shadow-2xs font-sans`}
        />
        {errors.title && <p className="text-[11px] text-red-500 mt-1">{errors.title}</p>}
      </div>

      {/* Row 2: Payment Type & Due Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-800 mb-1.5">
            Payment Type <span className="text-red-500">*</span>
          </label>
          <Dropdown
            value={paymentType}
            onChange={(e) => {
              const newType = e.target.value as PaymentType;
              setPaymentType(newType);
              if (errors.paymentType) setErrors((prev) => ({ ...prev, paymentType: '' }));
            }}
            options={paymentTypeOptions}
            placeholder="Select payment type"
          />
          {errors.paymentType && <p className="text-[11px] text-red-500 mt-1">{errors.paymentType}</p>}
        </div>

        <div>
          <label htmlFor="payment-form-due-date" className="block text-xs font-semibold text-gray-800 mb-1.5 cursor-pointer">
            Due Date <span className="text-red-500">*</span>
          </label>
          <AppDatePicker
            id="payment-form-due-date"
            value={dueDate}
            onChange={(val) => {
              setDueDate(val);
              if (errors.dueDate) setErrors((prev) => ({ ...prev, dueDate: '' }));
            }}
            placeholder="dd/mm/yyyy"
            dateFormat="dd/mm/yy"
            hasError={Boolean(errors.dueDate)}
            appendTo={typeof document !== 'undefined' ? document.body : undefined}
          />
          {errors.dueDate && <p className="text-[11px] text-red-500 mt-1">{errors.dueDate}</p>}
        </div>
      </div>

      {/* Row 3: Billing Period Start & End */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="payment-form-billing-start" className="block text-xs font-semibold text-gray-800 mb-1.5 cursor-pointer">
            Billing Period Start
          </label>
          <AppDatePicker
            id="payment-form-billing-start"
            value={billingStart}
            onChange={(val) => setBillingStart(val)}
            placeholder="dd/mm/yyyy"
            dateFormat="dd/mm/yy"
            appendTo={typeof document !== 'undefined' ? document.body : undefined}
          />
        </div>

        <div>
          <label htmlFor="payment-form-billing-end" className="block text-xs font-semibold text-gray-800 mb-1.5 cursor-pointer">
            Billing Period End
          </label>
          <AppDatePicker
            id="payment-form-billing-end"
            value={billingEnd}
            onChange={(val) => setBillingEnd(val)}
            placeholder="dd/mm/yyyy"
            dateFormat="dd/mm/yy"
            appendTo={typeof document !== 'undefined' ? document.body : undefined}
          />
        </div>
      </div>

      {/* Row 4: Breakdown Fields (Rent, Deposit, Maintenance, Electricity, Other) */}
      <div className="pt-1">
        <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
          Amount Breakdown (₹)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {/* Rent */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
              Rent Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-semibold">₹</span>
              <input
                type="number"
                min="0"
                value={rentAmount}
                onChange={(e) => setRentAmount(e.target.value)}
                placeholder="0"
                className="w-full h-10 pl-7 pr-3 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold text-gray-800 focus:outline-none focus:border-[#175C46] focus:ring-1 focus:ring-[#175C46]"
              />
            </div>
          </div>

          {/* Deposit */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
              Deposit
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-semibold">₹</span>
              <input
                type="number"
                min="0"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="0"
                className="w-full h-10 pl-7 pr-3 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold text-gray-800 focus:outline-none focus:border-[#175C46] focus:ring-1 focus:ring-[#175C46]"
              />
            </div>
          </div>

          {/* Maintenance */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
              Maintenance
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-semibold">₹</span>
              <input
                type="number"
                min="0"
                value={maintenanceAmount}
                onChange={(e) => setMaintenanceAmount(e.target.value)}
                placeholder="0"
                className="w-full h-10 pl-7 pr-3 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold text-gray-800 focus:outline-none focus:border-[#175C46] focus:ring-1 focus:ring-[#175C46]"
              />
            </div>
          </div>

          {/* Electricity */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
              Electricity
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-semibold">₹</span>
              <input
                type="number"
                min="0"
                value={electricityAmount}
                onChange={(e) => setElectricityAmount(e.target.value)}
                placeholder="0"
                className="w-full h-10 pl-7 pr-3 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold text-gray-800 focus:outline-none focus:border-[#175C46] focus:ring-1 focus:ring-[#175C46]"
              />
            </div>
          </div>

          {/* Other */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
              Other Charges
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-semibold">₹</span>
              <input
                type="number"
                min="0"
                value={otherAmount}
                onChange={(e) => setOtherAmount(e.target.value)}
                placeholder="0"
                className="w-full h-10 pl-7 pr-3 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold text-gray-800 focus:outline-none focus:border-[#175C46] focus:ring-1 focus:ring-[#175C46]"
              />
            </div>
          </div>

          {/* Total Amount Box */}
          <div className="bg-[#EBF7F2] border border-[#175C46]/20 rounded-xl p-2.5 flex flex-col justify-center">
            <span className="text-[10px] font-bold text-[#175C46] uppercase tracking-wider block">
              Total Amount
            </span>
            <span className="text-base font-extrabold text-[#175C46] block mt-0.5">
              {formatCurrency(effectiveAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* Optional Manual Amount Adjustment */}
      <div className="flex items-center justify-between text-[11px] text-gray-500 pt-0.5 px-1">
        <span>Auto-calculated sum: <strong className="text-gray-700">{formatCurrency(computedSum)}</strong></span>
        <button
          type="button"
          onClick={() => {
            setManualOverride((prev) => !prev);
            if (!manualOverride) {
              setCustomAmount(String(computedSum));
            }
          }}
          className="text-[#175C46] hover:underline font-semibold cursor-pointer"
        >
          {manualOverride ? 'Reset to Auto-Sum' : 'Custom Override Total'}
        </button>
      </div>

      {manualOverride && (
        <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 animate-fade-in">
          <label className="block text-xs font-bold text-amber-900 mb-1">
            Manual Total Amount Override (₹)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-semibold">₹</span>
            <input
              type="number"
              min="0"
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value);
                if (errors.amount) setErrors((prev) => ({ ...prev, amount: '' }));
              }}
              placeholder="Enter custom total amount"
              className="w-full h-10 pl-7 pr-3 bg-white border border-amber-300 rounded-xl text-xs sm:text-sm font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#175C46]"
            />
          </div>
        </div>
      )}
      {errors.amount && <p className="text-[11px] text-red-500 mt-1">{errors.amount}</p>}

      {/* Row 5: Notes */}
      <div>
        <label className="block text-xs font-semibold text-gray-800 mb-1.5">
          Notes / Remarks <span className="text-gray-400 font-normal">(Optional)</span>
        </label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Enter invoice payment terms or remarks..."
          className="w-full p-3 bg-white border border-gray-200/90 hover:border-gray-300 focus:border-[#175C46] focus:ring-1 focus:ring-[#175C46] rounded-xl text-xs sm:text-sm focus:outline-none transition-all shadow-2xs text-gray-800 placeholder-gray-400 font-sans resize-none"
        />
      </div>

      {/* Modal Actions */}
      <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={handleCancel}
          disabled={submitting}
          className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2 rounded-xl bg-[#175C46] hover:bg-[#134e3b] text-white text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
        >
          {submitting && (
            <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          )}
          <span>{isEdit ? 'Save Changes' : 'Record Payment'}</span>
        </button>
      </div>
    </form>
  );
};
