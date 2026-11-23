'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { AppDatePicker, ModalHeader } from '@/components/ui';
import { ResidentDropdown } from '@/components/residents/resident-dropdown';
import { residentService } from '@/services/resident.service';
import { branchService } from '@/services/branch.service';
import { checkoutService } from '@/services/checkout.service';
import { CreateCheckoutPayload } from '@/types/checkout';
import { Resident } from '@/types/resident';
import { Branch } from '@/types/branch';

interface CheckoutFormModalProps {
  visible: boolean;
  onHide: () => void;
  onSuccess: () => void;
}

interface CheckoutFormContentProps {
  onHide: () => void;
  onSuccess: () => void;
}

const COMMON_REASONS = [
  'Job Relocation',
  'Course Completed',
  'Personal Reasons',
  'Moving to Another City',
  'Internship Ended',
];

const CheckoutFormContent: React.FC<CheckoutFormContentProps> = ({
  onHide,
  onSuccess,
}) => {
  // Form fields
  const [residentId, setResidentId] = useState<number | ''>('');
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const [departureDate, setDepartureDate] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [additionalNotes, setAdditionalNotes] = useState<string>('');

  // Location display info
  const [selectedLocation, setSelectedLocation] = useState<{
    branchName?: string;
    buildingName?: string;
    floorName?: string;
    roomNo?: string;
    bedNumber?: string;
  } | null>(null);

  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingResidentDetail, setLoadingResidentDetail] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    residentId?: string;
    departureDate?: string;
    reason?: string;
  }>({});
  const [apiError, setApiError] = useState<string | null>(null);

  // Load branches once to resolve branch names
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

  // Display branch name resolved directly
  const displayBranchName =
    selectedLocation?.branchName ||
    (selectedResident?.branch_id
      ? branches.find((item) => item.id === selectedResident.branch_id)?.name
      : '') ||
    '';

  // Handle Resident selection
  const handleResidentSelect = async (resident: Resident | null) => {
    setSelectedResident(resident);
    if (!resident) {
      setResidentId('');
      setSelectedLocation(null);
      return;
    }

    setResidentId(resident.id);
    if (errors.residentId) {
      setErrors((prev) => ({ ...prev, residentId: undefined }));
    }

    const initialBranch =
      resident.branch_name ||
      (resident.branch_id ? branches.find((b) => b.id === resident.branch_id)?.name : undefined) ||
      '';

    const floorDisplay =
      resident.floor_name ||
      (resident.floor_number ? `Floor ${resident.floor_number}` : '');

    setSelectedLocation({
      branchName: initialBranch,
      buildingName: resident.building_name || '',
      floorName: floorDisplay,
      roomNo: resident.room_no || '',
      bedNumber: resident.bed_number || '',
    });

    // Fetch full resident room & stay info
    setLoadingResidentDetail(true);
    try {
      const detail = await residentService.getResidentById(resident.id);
      if (detail?.room_info) {
        const info = detail.room_info;
        const resolvedBranch =
          info.branch_name ||
          (info.branch_id ? branches.find((b) => b.id === info.branch_id)?.name : '') ||
          initialBranch;

        const resolvedFloor =
          info.floor_name ||
          (info.floor_number ? `Floor ${info.floor_number}` : floorDisplay);

        setSelectedLocation({
          branchName: resolvedBranch,
          buildingName: info.building_name || resident.building_name || '',
          floorName: resolvedFloor,
          roomNo: info.room_no || resident.room_no || '',
          bedNumber: info.bed_number || resident.bed_number || '',
        });
      }
    } catch {
      // keep initial summary
    } finally {
      setLoadingResidentDetail(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const newErrors: {
      residentId?: string;
      departureDate?: string;
      reason?: string;
    } = {};

    if (!residentId) {
      newErrors.residentId = 'Please select a resident';
    }
    if (!departureDate || !departureDate.trim()) {
      newErrors.departureDate = 'Please select departure date';
    }
    if (!reason.trim()) {
      newErrors.reason = 'Please enter reason for departure';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      setApiError(null);

      const payload: CreateCheckoutPayload = {
        resident_id: Number(residentId),
        departure_date: departureDate,
        reason: reason.trim(),
        additional_notes: additionalNotes.trim() || undefined,
      };

      await checkoutService.createCheckout(payload);

      onSuccess();
      onHide();
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Failed to create checkout request';
      setApiError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {apiError && (
        <div className="p-3 text-xs bg-red-50 text-red-600 rounded-lg border border-red-200">
          {apiError}
        </div>
      )}

      {/* Resident Selection */}
      <div className="space-y-2">
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
          {errors.residentId && (
            <p className="text-[11px] text-red-500 mt-1">{errors.residentId}</p>
          )}
        </div>

        {/* Allocation Details Preview: Branch, Building, Floor, Room */}
        {residentId && (selectedLocation || loadingResidentDetail) && (
          <div className="p-3 bg-gradient-to-r from-emerald-50/60 to-teal-50/40 rounded-xl border border-emerald-100/80 shadow-2xs space-y-2 animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-gray-700 flex items-center gap-1.5">
                <svg
                  className="w-3.5 h-3.5 text-[#175C46]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                  />
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
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">
                  Branch
                </span>
                <span
                  className="font-bold text-gray-800 text-xs truncate block mt-0.5"
                  title={displayBranchName}
                >
                  {displayBranchName || '—'}
                </span>
              </div>

              <div className="bg-white/90 p-2 rounded-lg border border-emerald-100/60">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">
                  Building
                </span>
                <span
                  className="font-bold text-gray-800 text-xs truncate block mt-0.5"
                  title={selectedLocation?.buildingName}
                >
                  {selectedLocation?.buildingName || '—'}
                </span>
              </div>

              <div className="bg-white/90 p-2 rounded-lg border border-emerald-100/60">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">
                  Floor
                </span>
                <span
                  className="font-bold text-gray-800 text-xs truncate block mt-0.5"
                  title={selectedLocation?.floorName}
                >
                  {selectedLocation?.floorName || '—'}
                </span>
              </div>

              <div className="bg-white/90 p-2 rounded-lg border border-emerald-100/60">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">
                  Room
                </span>
                <span
                  className="font-extrabold text-[#175C46] text-xs truncate block mt-0.5"
                  title={selectedLocation?.roomNo}
                >
                  {selectedLocation?.roomNo ? `Room ${selectedLocation.roomNo}` : '—'}
                  {selectedLocation?.bedNumber ? ` (${selectedLocation.bedNumber})` : ''}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Departure Date */}
      <div>
        <label
          htmlFor="checkout-form-departure-date"
          className="block text-xs font-semibold text-gray-800 mb-1.5 cursor-pointer"
        >
          Departure Date <span className="text-red-500">*</span>
        </label>
        <AppDatePicker
          id="checkout-form-departure-date"
          value={departureDate}
          onChange={(val) => {
            setDepartureDate(val);
            if (errors.departureDate) {
              setErrors((prev) => ({ ...prev, departureDate: undefined }));
            }
          }}
          placeholder="dd-mm-yyyy"
          dateFormat="dd-mm-yy"
          hasError={Boolean(errors.departureDate)}
          appendTo={typeof document !== 'undefined' ? document.body : undefined}
          className="w-full"
        />
        {errors.departureDate && (
          <p className="text-[11px] text-red-500 mt-1">{errors.departureDate}</p>
        )}
      </div>

      {/* Reason for Departure */}
      <div>
        <label className="block text-xs font-semibold text-gray-800 mb-1.5">
          Reason for Departure <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            if (errors.reason) {
              setErrors((prev) => ({ ...prev, reason: undefined }));
            }
          }}
          placeholder="Enter reason for checkout..."
          className={`w-full h-10 px-3 text-xs sm:text-sm bg-white border rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 transition-colors ${errors.reason
              ? 'border-red-400 focus:ring-red-400 focus:border-red-400'
              : 'border-gray-200 focus:ring-[#175C46] focus:border-[#175C46]'
            }`}
        />
        {errors.reason && (
          <p className="text-[11px] text-red-500 mt-1">{errors.reason}</p>
        )}

        {/* Quick Reason Suggestions */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {COMMON_REASONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                setReason(r);
                if (errors.reason) {
                  setErrors((prev) => ({ ...prev, reason: undefined }));
                }
              }}
              className={`text-[11px] px-2.5 py-1 rounded-full border transition-all cursor-pointer ${reason === r
                  ? 'bg-[#E8F8F0] border-[#175C46] text-[#175C46] font-semibold'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Additional Notes (Optional) */}
      <div>
        <label className="block text-xs font-semibold text-gray-800 mb-1.5">
          Additional Notes <span className="text-gray-400 font-normal">(Optional)</span>
        </label>
        <textarea
          value={additionalNotes}
          onChange={(e) => setAdditionalNotes(e.target.value)}
          rows={3}
          placeholder="Enter additional instructions or relocation notes..."
          className="w-full p-3 text-xs sm:text-sm bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#175C46] focus:border-[#175C46] transition-colors resize-none"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
        <button
          type="button"
          onClick={onHide}
          disabled={isSubmitting}
          className="w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer text-center"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto px-6 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-[#175C46] text-white hover:bg-[#124937] active:bg-[#0e3b2c] active:scale-[0.99] transition-all disabled:opacity-50 shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin -ml-0.5 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
              <span>Submitting...</span>
            </>
          ) : (
            'Create Checkout'
          )}
        </button>
      </div>
    </form>
  );
};

export const CheckoutFormModal: React.FC<CheckoutFormModalProps> = ({
  visible,
  onHide,
  onSuccess,
}) => {
  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      modal
      draggable={false}
      resizable={false}
      className="w-full max-w-lg mx-4 rounded-2xl overflow-hidden shadow-2xl border-0 font-sans"
      header={
        <ModalHeader
          title="Create Checkout Request"
          subtitle="Initiate resident departure and refund clearance"
          icon={
            <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
              />
            </svg>
          }
        />
      }
      contentClassName="p-5 sm:p-6 bg-white space-y-4"
    >
      {visible && (
        <CheckoutFormContent
          onHide={onHide}
          onSuccess={onSuccess}
        />
      )}
    </Dialog>
  );
};
