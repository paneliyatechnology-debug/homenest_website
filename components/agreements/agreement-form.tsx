'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppDatePicker } from '@/components/ui/app-date-picker';
import { ResidentDropdown } from '@/components/residents/resident-dropdown';
import { AgreementRecord, AgreementStatus, CreateAgreementInput, UpdateAgreementInput } from '@/types/agreement';
import { Resident } from '@/types/resident';
import { agreementService } from '@/services/agreement.service';
import { Toast } from 'primereact/toast';

interface AgreementFormProps {
  onSuccess?: () => void;
  toastRef?: React.RefObject<Toast | null>;
  initialData?: AgreementRecord | null;
  isEdit?: boolean;
}

// Backend agreement_type values
const AGREEMENT_TYPE_OPTIONS = [
  { value: 'rental', label: 'Rental Agreement' },
  { value: '11_months', label: '11 Months Standard' },
  { value: 'lease', label: 'Lease Agreement' },
  { value: 'resident', label: 'Resident Agreement' },
];

const STATUS_OPTIONS: { value: AgreementStatus; label: string }[] = [
  { value: 'signed', label: 'Signed' },
  { value: 'pending', label: 'Pending' },
  { value: 'draft', label: 'Draft' },
  { value: 'expired', label: 'Expired' },
];

const parseDateString = (raw?: string): string => {
  if (!raw) return '';
  let d = raw;
  if (d.includes(' ')) {
    const datePart = d.split(' ')[0];
    if (datePart.includes('-')) {
      const parts = datePart.split('-');
      if (parts[0].length === 2) {
        // DD-MM-YYYY -> YYYY-MM-DD
        d = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }
  }
  return d;
};

export const AgreementForm: React.FC<AgreementFormProps> = ({
  onSuccess,
  toastRef,
  initialData,
  isEdit = false,
}) => {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  // Resident selection — drives auto-fill
  const [selectedResident, setSelectedResident] = useState<Resident | null>(() => {
    if (!initialData) return null;
    return {
      id: initialData.resident_id,
      name: initialData.resident_name,
      email: initialData.resident_email || '',
      phone: initialData.resident_phone || '',
      gender: 'male',
      status: 'active',
      room_no: initialData.room_number || null,
      room_type: initialData.room_type || null,
      building_name: initialData.pg_name || null,
      room_id: initialData.room_id || null,
      building_id: initialData.branch_id || initialData.pg_id || 1,
      created_at: initialData.created_at || '',
      updated_at: initialData.updated_at || '',
      role: 'resident',
    };
  });

  // Form fields
  const [agreementNo, setAgreementNo] = useState(() => initialData?.agreement_no || '');
  const [agreementType, setAgreementType] = useState(() => initialData?.agreement_type || '');
  const [startDate, setStartDate] = useState(() => parseDateString(initialData?.start_date));
  const [endDate, setEndDate] = useState(() => parseDateString(initialData?.end_date));
  const [status, setStatus] = useState<AgreementStatus>(() => initialData?.status || 'pending');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setSelectedResident(null);
    setAgreementNo('');
    setAgreementType('');
    setStartDate('');
    setEndDate('');
    setStatus('pending');
    setErrors({});
  };

  // Clean all fields when leaving the page/component unmounts (only for create mode)
  useEffect(() => {
    return () => {
      if (!isEdit) {
        resetForm();
      }
    };
  }, [isEdit]);

  const clearError = (key: string) => {
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const handleResidentSelect = (resident: Resident | null) => {
    setSelectedResident(resident);
    clearError('residentId');
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!isEdit && !selectedResident) {
      errs.residentId = 'Please select a resident';
    } else if (!isEdit && selectedResident && !selectedResident.room_id) {
      errs.residentId = 'Selected resident does not have an allocated room';
    }
    if (!agreementNo.trim()) errs.agreementNo = 'Agreement number is required';
    if (!agreementType) errs.agreementType = 'Agreement type is required';
    if (!startDate) errs.startDate = 'Start date is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      if (isEdit && initialData) {
        const updateInput: UpdateAgreementInput = {
          agreement_type: agreementType,
          status,
          start_date: startDate,
          end_date: endDate,
        };
        const res = await agreementService.updateAgreement(initialData.id, updateInput);

        try {
          sessionStorage.setItem(
            'homenest_flash_toast',
            JSON.stringify({
              severity: 'success',
              summary: 'Agreement Updated',
              detail: res.message || `Agreement ${initialData.agreement_no} updated successfully.`,
            })
          );
        } catch {
          // ignore
        }
      } else {
        if (!selectedResident) return;
        const roomId = selectedResident.room_id ? String(selectedResident.room_id) : '';
        const roomType = selectedResident.room_type || 'single';
        const branchId = String(selectedResident.building_id || 1);

        const input: CreateAgreementInput = {
          resident_id: selectedResident.id,
          agreement_no: agreementNo.trim(),
          agreement_type: agreementType,
          start_date: startDate,
          end_date: endDate || startDate,
          branch_id: branchId,
          room_id: roomId,
          room_type: roomType,
          status,
        };

        const created = await agreementService.createAgreement(input);

        try {
          sessionStorage.setItem(
            'homenest_flash_toast',
            JSON.stringify({
              severity: 'success',
              summary: 'Agreement Created',
              detail: created.message || `Agreement ${input.agreement_no} created successfully.`,
            })
          );
        } catch {
          // ignore
        }

        resetForm();
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/dashboard/residents/agreements');
      }
    } catch (err) {
      toastRef?.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: err instanceof Error ? err.message : 'Failed to save agreement. Please try again.',
        life: 4000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-6">

        {/* Row 1: Resident & Agreement No. */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          <div>
            <label className="text-xs sm:text-[13px] font-medium text-gray-700 block mb-1.5">
              Resident name {isEdit ? <span className="text-gray-400 font-normal">(locked)</span> : <span className="text-rose-500">*</span>}
            </label>
            {isEdit ? (
              <input
                type="text"
                value={initialData?.resident_name || ''}
                disabled
                className="w-full h-11 px-4 py-2.5 bg-gray-50/80 rounded-xl border border-gray-200/80 text-xs sm:text-sm text-gray-500 cursor-not-allowed select-none outline-none font-medium"
              />
            ) : (
              <>
                <ResidentDropdown
                  selectedResidentId={selectedResident?.id ?? null}
                  onSelect={handleResidentSelect}
                  hasError={Boolean(errors.residentId)}
                />
                {errors.residentId && (
                  <span className="text-[11px] text-rose-500 mt-1 block">{errors.residentId}</span>
                )}
              </>
            )}
          </div>

          <div>
            <label className="text-xs sm:text-[13px] font-medium text-gray-700 block mb-1.5">
              Agreement no. {isEdit ? <span className="text-gray-400 font-normal">(locked)</span> : <span className="text-rose-500">*</span>}
            </label>
            <input
              type="text"
              value={agreementNo}
              onChange={(e) => { setAgreementNo(e.target.value); clearError('agreementNo'); }}
              disabled={isEdit}
              placeholder="e.g. AGR-2026-003"
              className={`w-full h-11 px-4 py-2.5 rounded-xl border ${
                isEdit
                  ? 'bg-gray-50/80 border-gray-200/80 text-gray-500 cursor-not-allowed select-none'
                  : errors.agreementNo
                  ? 'bg-white border-rose-400 text-gray-800'
                  : 'bg-white border-gray-200/90 hover:border-gray-300 text-gray-800'
              } text-xs sm:text-sm placeholder-gray-400 outline-none focus:border-[#175C46] focus:ring-1 focus:ring-[#175C46] transition-all`}
            />
            {errors.agreementNo && (
              <span className="text-[11px] text-rose-500 mt-1 block">{errors.agreementNo}</span>
            )}
          </div>
        </div>

        {/* Resident Summary Details Banner */}
        {selectedResident && (
          <div className="flex flex-wrap items-center gap-2.5 px-4 py-3 bg-[#F0FAF5] border border-[#C6E9D7] rounded-xl text-xs text-[#175C46]">
            <svg className="w-4 h-4 shrink-0 text-[#175C46]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold text-gray-700">Resident Details:</span>
            {selectedResident.room_no && (
              <span className="bg-white/80 px-2.5 py-1 rounded-md border border-[#C6E9D7] font-medium text-gray-800">
                Room: <strong className="text-[#175C46]">{selectedResident.room_no}</strong>
              </span>
            )}
            {selectedResident.room_type && (
              <span className="bg-white/80 px-2.5 py-1 rounded-md border border-[#C6E9D7] font-medium text-gray-800">
                Type: <strong className="text-[#175C46] capitalize">{selectedResident.room_type}</strong>
              </span>
            )}
            {selectedResident.building_name && (
              <span className="bg-white/80 px-2.5 py-1 rounded-md border border-[#C6E9D7] font-medium text-gray-800">
                Building: <strong className="text-[#175C46]">{selectedResident.building_name}</strong>
              </span>
            )}
            {selectedResident.bed_number && (
              <span className="bg-white/80 px-2.5 py-1 rounded-md border border-[#C6E9D7] font-medium text-gray-800">
                Bed: <strong className="text-[#175C46]">{selectedResident.bed_number}</strong>
              </span>
            )}
          </div>
        )}

        {/* Row 2: Agreement Type & Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 items-start">
          <div>
            <label className="text-xs sm:text-[13px] font-medium text-gray-700 block mb-1.5">
              Agreement Type <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                value={agreementType}
                onChange={(e) => { setAgreementType(e.target.value); clearError('agreementType'); }}
                className={`w-full h-11 px-4 py-2.5 bg-white rounded-xl border ${
                  errors.agreementType ? 'border-rose-400' : 'border-gray-200/90 hover:border-gray-300'
                } text-xs sm:text-sm text-gray-800 outline-none focus:border-[#175C46] focus:ring-1 focus:ring-[#175C46] transition-all appearance-none cursor-pointer pr-9`}
              >
                <option value="">Select agreement type</option>
                {AGREEMENT_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <svg className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            {errors.agreementType && (
              <span className="text-[11px] text-rose-500 mt-1 block">{errors.agreementType}</span>
            )}
          </div>

          <div>
            <label className="text-xs sm:text-[13px] font-medium text-gray-700 block mb-2.5">
              Status <span className="text-rose-500">*</span>
            </label>
            <div className="flex flex-wrap items-center gap-4 sm:gap-5 h-11">
              {STATUS_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="inline-flex items-center gap-2 cursor-pointer text-xs sm:text-sm text-gray-800 select-none"
                >
                  <input
                    type="radio"
                    name="agreement_status"
                    value={opt.value}
                    checked={status === opt.value}
                    onChange={() => setStatus(opt.value)}
                    className="w-4 h-4 border-gray-300 focus:ring-[#175C46] accent-[#175C46] cursor-pointer"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Row 3: Start date & End date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 items-start">
          <div>
            <label className="text-xs sm:text-[13px] font-medium text-gray-700 block mb-1.5">
              Start date <span className="text-rose-500">*</span>
            </label>
            <AppDatePicker
              placeholder="Select Start date"
              value={startDate}
              onChange={(val) => { setStartDate(val); clearError('startDate'); }}
              hasError={Boolean(errors.startDate)}
            />
            {errors.startDate && (
              <span className="text-[11px] text-rose-500 mt-1 block">{errors.startDate}</span>
            )}
          </div>

          <div>
            <label className="text-xs sm:text-[13px] font-medium text-gray-700 block mb-1.5">
              End date
            </label>
            <AppDatePicker
              placeholder="Select end date"
              value={endDate}
              onChange={(val) => setEndDate(val)}
            />
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full h-12 bg-[#175C46] hover:bg-[#124B38] active:bg-[#0E3B2C] text-white text-sm font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Saving...</span>
              </span>
            ) : isEdit ? (
              'Save Changes'
            ) : (
              'Save'
            )}
          </button>
        </div>
      </div>
    </form>
  );
};
