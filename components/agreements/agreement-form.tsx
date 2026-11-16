'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AppDatePicker } from '@/components/ui/app-date-picker';
import { Dropdown } from '@/components/ui';
import { ResidentDropdown } from '@/components/residents/resident-dropdown';
import {
  AgreementRecord,
  AgreementStatus,
  CreateAgreementInput,
  UpdateAgreementInput,
} from '@/types/agreement';
import { Resident } from '@/types/resident';
import { agreementService } from '@/services/agreement.service';

export interface AgreementFormData {
  selectedResident: Resident | null;
  agreement_no: string;
  agreement_type: string;
  start_date: string;
  end_date: string;
  status: AgreementStatus;
}

export const initialAgreementFormData: AgreementFormData = {
  selectedResident: null,
  agreement_no: '',
  agreement_type: '',
  start_date: '',
  end_date: '',
  status: 'pending',
};

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

export const buildAgreementFormData = (
  initialData?: AgreementRecord | null
): AgreementFormData => ({
  selectedResident: initialData
    ? {
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
      }
    : null,
  agreement_no: initialData?.agreement_no || '',
  agreement_type: initialData?.agreement_type || '',
  start_date: parseDateString(initialData?.start_date),
  end_date: parseDateString(initialData?.end_date),
  status: initialData?.status || 'pending',
});

interface AgreementFormProps {
  onSuccess?: () => void;
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

export const AgreementForm: React.FC<AgreementFormProps> = ({
  onSuccess,
  initialData,
  isEdit = false,
}) => {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  // Centralized Form State
  const [formData, setFormData] = useState<AgreementFormData>(() =>
    buildAgreementFormData(initialData)
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reusable Single Change Handler for standard input elements
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Reusable Field Change Handler for custom controls (dates, resident dropdown, radios)
  const handleFieldChange = <K extends keyof AgreementFormData>(
    field: K,
    value: AgreementFormData[K]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field as string]) {
      setErrors((prev) => ({ ...prev, [field as string]: '' }));
    }
  };

  const resetForm = useCallback(() => {
    setFormData(buildAgreementFormData(isEdit ? initialData : null));
    setErrors({});
  }, [isEdit, initialData]);

  const [prevRecordId, setPrevRecordId] = useState<number | null>(initialData?.id ?? null);

  // Synchronize on initialData changes in edit mode during render phase
  if (isEdit && initialData && initialData.id !== prevRecordId) {
    setPrevRecordId(initialData.id);
    setFormData(buildAgreementFormData(initialData));
    setErrors({});
  }

  // Clean all fields when leaving the page/component unmounts (only for create mode)
  useEffect(() => {
    return () => {
      if (!isEdit) {
        resetForm();
      }
    };
  }, [isEdit, resetForm]);

  // Reset fields on browser back/forward bfcache restoration
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted && !isEdit) {
        resetForm();
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [isEdit, resetForm]);

  const handleResidentSelect = (resident: Resident | null) => {
    handleFieldChange('selectedResident', resident);
    if (errors.residentId) {
      setErrors((prev) => ({ ...prev, residentId: '' }));
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!isEdit && !formData.selectedResident) {
      errs.residentId = 'Please select a resident';
    } else if (!isEdit && formData.selectedResident && !formData.selectedResident.room_id) {
      errs.residentId = 'Selected resident does not have an allocated room';
    }
    if (!formData.agreement_no.trim()) errs.agreement_no = 'Agreement number is required';
    if (!formData.agreement_type) errs.agreement_type = 'Agreement type is required';
    if (!formData.start_date) errs.start_date = 'Start date is required';

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
          agreement_type: formData.agreement_type,
          status: formData.status,
          start_date: formData.start_date,
          end_date: formData.end_date,
        };
        await agreementService.updateAgreement(initialData.id, updateInput);
      } else {
        if (!formData.selectedResident) return;
        const roomId = formData.selectedResident.room_id
          ? String(formData.selectedResident.room_id)
          : '';
        const roomType = formData.selectedResident.room_type || 'single';
        const branchId = formData.selectedResident.branch_id ? String(formData.selectedResident.branch_id) : undefined;

        const input: CreateAgreementInput = {
          resident_id: formData.selectedResident.id,
          agreement_no: formData.agreement_no.trim(),
          agreement_type: formData.agreement_type,
          start_date: formData.start_date,
          end_date: formData.end_date || formData.start_date,
          branch_id: branchId,
          room_id: roomId,
          room_type: roomType,
          status: formData.status,
        };

        await agreementService.createAgreement(input);
        resetForm();
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/dashboard/residents/agreements');
      }
    } catch {
      // Backend error toast is handled automatically by apiClient
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-5 sm:p-7 space-y-6">
        {/* Row 1: Resident & Agreement No */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 items-start">
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
                  selectedResidentId={formData.selectedResident?.id ?? null}
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
              name="agreement_no"
              value={formData.agreement_no}
              onChange={handleChange}
              disabled={isEdit}
              placeholder="e.g. AGR-2026-003"
              className={`w-full h-11 px-4 py-2.5 rounded-xl border ${
                isEdit
                  ? 'bg-gray-50/80 border-gray-200/80 text-gray-500 cursor-not-allowed select-none'
                  : errors.agreement_no
                  ? 'bg-white border-rose-400 text-gray-800'
                  : 'bg-white border-gray-200/90 hover:border-gray-300 text-gray-800'
              } text-xs sm:text-sm placeholder-gray-400 outline-none focus:border-[#175C46] focus:ring-1 focus:ring-[#175C46] transition-all`}
            />
            {errors.agreement_no && (
              <span className="text-[11px] text-rose-500 mt-1 block">{errors.agreement_no}</span>
            )}
          </div>
        </div>

        {/* Resident Summary Details Banner */}
        {formData.selectedResident && (
          <div className="flex flex-wrap items-center gap-2.5 px-4 py-3 bg-[#F0FAF5] border border-[#C6E9D7] rounded-xl text-xs text-[#175C46]">
            <svg className="w-4 h-4 shrink-0 text-[#175C46]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold text-gray-700">Resident Details:</span>
            {formData.selectedResident.room_no && (
              <span className="bg-white/80 px-2.5 py-1 rounded-md border border-[#C6E9D7] font-medium text-gray-800">
                Room: <strong className="text-[#175C46]">{formData.selectedResident.room_no}</strong>
              </span>
            )}
            {formData.selectedResident.room_type && (
              <span className="bg-white/80 px-2.5 py-1 rounded-md border border-[#C6E9D7] font-medium text-gray-800">
                Type: <strong className="text-[#175C46] capitalize">{formData.selectedResident.room_type}</strong>
              </span>
            )}
            {formData.selectedResident.building_name && (
              <span className="bg-white/80 px-2.5 py-1 rounded-md border border-[#C6E9D7] font-medium text-gray-800">
                Building: <strong className="text-[#175C46]">{formData.selectedResident.building_name}</strong>
              </span>
            )}
            {formData.selectedResident.bed_number && (
              <span className="bg-white/80 px-2.5 py-1 rounded-md border border-[#C6E9D7] font-medium text-gray-800">
                Bed: <strong className="text-[#175C46]">{formData.selectedResident.bed_number}</strong>
              </span>
            )}
          </div>
        )}

        {/* Row 2: Agreement Type & Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 items-start">
          <Dropdown
            label="Agreement Type"
            name="agreement_type"
            required
            placeholder="Select agreement type"
            value={formData.agreement_type}
            onChange={handleChange}
            error={errors.agreement_type}
            options={AGREEMENT_TYPE_OPTIONS}
          />

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
                    checked={formData.status === opt.value}
                    onChange={() => handleFieldChange('status', opt.value)}
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
              value={formData.start_date}
              onChange={(val) => handleFieldChange('start_date', val)}
              hasError={Boolean(errors.start_date)}
            />
            {errors.start_date && (
              <span className="text-[11px] text-rose-500 mt-1 block">{errors.start_date}</span>
            )}
          </div>

          <div>
            <label className="text-xs sm:text-[13px] font-medium text-gray-700 block mb-1.5">
              End date
            </label>
            <AppDatePicker
              placeholder="Select end date"
              value={formData.end_date}
              onChange={(val) => handleFieldChange('end_date', val)}
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
            <span>{isEdit ? 'Save Changes' : 'Save'}</span>
          </button>
        </div>
      </div>
    </form>
  );
};
