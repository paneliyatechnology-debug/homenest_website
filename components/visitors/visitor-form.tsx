'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Visitor } from '@/types/visitor';
import { visitorService } from '@/services/visitor.service';
import { branchService } from '@/services/branch.service';
import { residentService } from '@/services/resident.service';
import { authService } from '@/services/auth.service';
import { Resident } from '@/types/resident';
import { Branch } from '@/types/branch';
import { ResidentDropdown } from '@/components/residents/resident-dropdown';
import {
  PageHeader,
  TextInput,
  Dropdown,
  AppDatePicker,
  AppTimePicker,
  parseDateString,
  formatDateForApi,
  formatDateToDDMMYYYY,
} from '@/components/ui';

function convertDateStringToApiFormat(dateStr: string): string {
  if (!dateStr || !dateStr.trim()) return '';
  const clean = dateStr.trim().split(' ')[0];
  const parts = clean.includes('/') ? clean.split('/') : clean.split('-');

  if (parts.length === 3) {
    // DD/MM/YYYY or DD-MM-YYYY
    if (parts[2].length === 4) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    // YYYY-MM-DD or YYYY/MM/DD
    if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
  }

  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? dateStr : formatDateForApi(d);
}

function formatInitialDateDisplay(val?: string | null): string {
  if (!val) return '';
  const formatted = formatDateToDDMMYYYY(val);
  return formatted && formatted !== '—' ? formatted.split(' ')[0] : '';
}

export interface VisitorFormProps {
  initialData?: Visitor | null;
  mode: 'create' | 'edit';
}

export const VisitorForm: React.FC<VisitorFormProps> = ({ initialData, mode }) => {
  const router = useRouter();
  const isEdit = mode === 'edit';

  // Form Fields matching POST /api/v1/visitors and PUT /api/v1/visitors/:id
  const [visitorName, setVisitorName] = useState(initialData?.visitor_name || '');
  const [visitorPhone, setVisitorPhone] = useState(initialData?.visitor_phone || '');
  const [purpose, setPurpose] = useState(initialData?.purpose || '');
  const [visitDate, setVisitDate] = useState<string>(() =>
    initialData?.visit_date ? formatInitialDateDisplay(initialData.visit_date) : ''
  );
  const [validUntil, setValidUntil] = useState<string>(() =>
    initialData?.valid_until ? formatInitialDateDisplay(initialData.valid_until) : ''
  );
  const [entryTime, setEntryTime] = useState<string>(
    initialData?.entry_time || initialData?.last_entry_time || ''
  );

  // Resident State
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const [selectedResidentId, setSelectedResidentId] = useState<number | null>(
    initialData?.resident?.id || null
  );
  const [residentName, setResidentName] = useState(
    initialData?.resident?.name || (initialData?.host_resident ? initialData.host_resident.replace(/^.*?\((.*?)\).*$/, '$1') : '')
  );
  const [roomNo, setRoomNo] = useState(initialData?.room?.room_no || '');

  // PG, Branch, and Notes
  const [pgId, setPgId] = useState<string>(() => {
    if (initialData?.pg?.id) return String(initialData.pg.id);
    const u = authService.getCurrentUser();
    const found = u?.pg?.id || (u as any)?.pg_id;
    return found ? String(found) : '';
  });
  const [branchId, setBranchId] = useState<string>(
    initialData?.branch?.id ? String(initialData.branch.id) : ''
  );
  const [adminNotes, setAdminNotes] = useState(initialData?.admin_notes || '');
  const [status, setStatus] = useState<string>(initialData?.status || 'approved');

  // Photo state
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    initialData?.visitor_photo_url || initialData?.visitor_photo || null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Validation & Submission
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available branches
  const [branches, setBranches] = useState<Branch[]>([]);

  // Minimum allowed visit date: today (past dates disabled)
  const minVisitDate = useMemo(() => {
    if (isEdit && initialData?.visit_date) {
      const existing = parseDateString(initialData.visit_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (existing && existing < today) {
        existing.setHours(0, 0, 0, 0);
        return existing;
      }
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }, [isEdit, initialData?.visit_date]);

  // Maximum allowed visit date: valid until date (if selected)
  const maxVisitDate = useMemo(() => {
    if (!validUntil || !validUntil.trim()) return null;
    const d = parseDateString(validUntil);
    if (!d) return null;
    d.setHours(23, 59, 59, 999);
    return d;
  }, [validUntil]);

  // Minimum allowed valid until date: visit date (disables all dates before visit date)
  const minValidUntilDate = useMemo(() => {
    if (visitDate && visitDate.trim()) {
      const d = parseDateString(visitDate);
      if (d) {
        d.setHours(0, 0, 0, 0);
        return d;
      }
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }, [visitDate]);

  // Reset form to clean defaults (or record values if in edit mode)
  const resetForm = useCallback(() => {
    if (isEdit && initialData) {
      setVisitorName(initialData.visitor_name || '');
      setVisitorPhone(initialData.visitor_phone || '');
      setPurpose(initialData.purpose || '');
      setVisitDate(initialData.visit_date ? formatInitialDateDisplay(initialData.visit_date) : '');
      setValidUntil(initialData.valid_until ? formatInitialDateDisplay(initialData.valid_until) : '');
      setEntryTime(initialData.entry_time || initialData.last_entry_time || '');
      setSelectedResident(null);
      setSelectedResidentId(initialData.resident?.id || null);
      setResidentName(
        initialData.resident?.name ||
        (initialData.host_resident ? initialData.host_resident.replace(/^.*?\((.*?)\).*$/, '$1') : '')
      );
      setRoomNo(initialData.room?.room_no || '');
      setBranchId(
        initialData.branch?.id
          ? String(initialData.branch.id)
          : (branches.length > 0 ? String(branches[0].id) : '')
      );
      setPgId(
        initialData.pg?.id
          ? String(initialData.pg.id)
          : (branches.length > 0 && branches[0].pg_id ? String(branches[0].pg_id) : '')
      );
      setAdminNotes(initialData.admin_notes || '');
      setStatus(initialData.status || 'approved');
      setPhotoFile(null);
      setPhotoPreview(initialData.visitor_photo_url || initialData.visitor_photo || null);
    } else {
      // Create mode: completely reset all fields
      setVisitorName('');
      setVisitorPhone('');
      setPurpose('');
      setVisitDate('');
      setValidUntil('');
      setEntryTime('');
      setSelectedResident(null);
      setSelectedResidentId(null);
      setResidentName('');
      setRoomNo('');
      const currentUser = authService.getCurrentUser();
      const defaultPg =
        currentUser?.pg?.id ||
        (currentUser as any)?.pg_id ||
        (branches.length > 0 && branches[0].pg_id ? branches[0].pg_id : '');
      setBranchId(branches.length > 0 ? String(branches[0].id) : '');
      setPgId(defaultPg ? String(defaultPg) : '');
      setAdminNotes('');
      setStatus('approved');
      setPhotoFile(null);
      setPhotoPreview(null);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setErrors({});
  }, [isEdit, initialData, branches]);

  const resetFormRef = useRef(resetForm);
  useEffect(() => {
    resetFormRef.current = resetForm;
  }, [resetForm]);

  // Clean all fields when navigating away or unmounting in create mode
  useEffect(() => {
    return () => {
      if (!isEdit) {
        resetFormRef.current();
      }
    };
  }, [isEdit]);

  // Reset fields on browser back/forward bfcache restoration
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted && !isEdit) {
        resetFormRef.current();
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [isEdit]);

  // Load available branches
  useEffect(() => {
    let isMounted = true;
    branchService
      .getBranches({ limit: 100 })
      .then((res) => {
        if (!isMounted) return;
        if (res && res.data && res.data.length > 0) {
          setBranches(res.data);
          if (!initialData?.branch?.id) {
            setBranchId((prev) => prev || String(res.data[0].id));
          }
          if (!initialData?.pg?.id && res.data[0].pg_id) {
            setPgId((prev) => prev || String(res.data[0].pg_id));
          }
        }
      })
      .catch(() => { });

    return () => {
      isMounted = false;
    };
  }, [initialData]);

  // If in edit mode with an existing resident ID, fetch full resident details for building and floor display
  useEffect(() => {
    if (initialData?.resident?.id && !selectedResident) {
      let isMounted = true;
      residentService
        .getResidentById(initialData.resident.id)
        .then((detail) => {
          if (!isMounted || !detail) return;
          setSelectedResident({
            id: detail.id,
            name: detail.name,
            email: detail.email,
            phone: detail.phone,
            gender: detail.gender || '',
            status: detail.status || 'active',
            room_no: detail.room_info?.room_no || initialData.room?.room_no || '',
            room_type: detail.room_info?.room_type || initialData.room?.room_type || '',
            building_name: detail.room_info?.building_name || '',
            floor_name: detail.room_info?.floor_name || '',
            floor_number: detail.room_info?.floor_number,
            branch_id: initialData.branch?.id,
            created_at: detail.created_at || '',
            updated_at: detail.updated_at || '',
            role: detail.role || 'resident',
          });
        })
        .catch(() => { });

      return () => {
        isMounted = false;
      };
    }
  }, [initialData, selectedResident]);

  // When a resident is selected from ResidentDropdown
  const handleResidentSelect = (resident: Resident | null) => {
    setSelectedResident(resident);
    if (resident) {
      setSelectedResidentId(resident.id);
      setResidentName(resident.name);
      if (resident.room_no) {
        setRoomNo(resident.room_no);
      }
      if (resident.branch_id) {
        setBranchId(String(resident.branch_id));
        const matched = branches.find((b) => b.id === resident.branch_id);
        if (matched?.pg_id) {
          setPgId(String(matched.pg_id));
        }
      } else if (branches.length > 0) {
        setBranchId((prev) => prev || String(branches[0].id));
      }
      if (errors.resident_id) {
        setErrors((prev) => ({ ...prev, resident_id: '' }));
      }
    } else {
      setSelectedResidentId(null);
      setResidentName('');
      setRoomNo('');
    }
  };

  // Photo upload handlers
  const handlePhotoSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, photo: 'Please select a valid image (PNG or JPG)' }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, photo: 'File size must be under 5MB' }));
      return;
    }
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.photo;
      return copy;
    });
    setPhotoFile(file);
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    if (photoPreview && photoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Phone Validation & Input Handlers
  const validateVisitorPhone = (phone: string): string => {
    const trimmed = phone.trim();
    if (!trimmed) {
      return 'Visitor phone no. is required';
    }

    const hasPlus = trimmed.startsWith('+');
    const digits = trimmed.replace(/\D/g, '');

    if (digits.length === 0) {
      return 'Please enter a valid phone number';
    }

    if (hasPlus) {
      if (digits.length < 10) {
        return 'Phone number with country code must be at least 10 digits';
      }
      if (digits.length > 13) {
        return 'Phone number cannot exceed 13 digits';
      }
    } else {
      if (digits.length < 10) {
        return 'Phone number must be at least 10 digits';
      }
      if (digits.length > 10) {
        return 'Phone number cannot exceed 10 digits';
      }
    }

    return '';
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const hasPlus = raw.startsWith('+');
    const digitsOnly = raw.replace(/\D/g, '');

    const maxDigits = hasPlus ? 13 : 10;
    const limited = digitsOnly.slice(0, maxDigits);
    const formatted = hasPlus ? `+${limited}` : limited;

    setVisitorPhone(formatted);
    if (errors.visitor_phone) {
      const err = validateVisitorPhone(formatted);
      setErrors((prev) => ({ ...prev, visitor_phone: err }));
    }
  };

  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      e.ctrlKey ||
      e.metaKey ||
      [
        'Backspace',
        'Tab',
        'Enter',
        'Escape',
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
        'Delete',
        'Home',
        'End',
      ].includes(e.key)
    ) {
      return;
    }

    if (
      e.key === '+' &&
      e.currentTarget.selectionStart === 0 &&
      !e.currentTarget.value.includes('+')
    ) {
      return;
    }

    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handlePhoneBlur = () => {
    const err = validateVisitorPhone(visitorPhone);
    setErrors((prev) => ({ ...prev, visitor_phone: err }));
  };

  // Form submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!visitorName.trim()) {
      newErrors.visitor_name = 'Visitor name is required';
    }
    if (!selectedResidentId && !residentName.trim()) {
      newErrors.resident_id = 'Please select a host resident';
    }
    const phoneErr = validateVisitorPhone(visitorPhone);
    if (phoneErr) {
      newErrors.visitor_phone = phoneErr;
    }
    if (!purpose.trim()) {
      newErrors.purpose = 'Purpose is required';
    }
    if (!visitDate.trim()) {
      newErrors.visit_date = 'Visit date is required';
    } else {
      const vDate = parseDateString(visitDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (!isEdit && vDate && vDate < today) {
        newErrors.visit_date = 'Visit date cannot be in the past';
      }
    }
    if (visitDate.trim() && validUntil.trim()) {
      const vDate = parseDateString(visitDate);
      const uDate = parseDateString(validUntil);
      if (vDate && uDate && uDate < vDate) {
        newErrors.valid_until = 'Valid until date cannot be before visit date';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const apiVisitDate = convertDateStringToApiFormat(visitDate);
      const apiValidUntil = convertDateStringToApiFormat(validUntil || visitDate);

      // Build multipart/form-data according to visitor API specification
      const formData = new FormData();
      formData.append('visitor_name', visitorName.trim());
      formData.append('visitor_phone', visitorPhone.trim());
      formData.append('purpose', purpose);
      formData.append('visit_date', apiVisitDate);
      formData.append('valid_until', apiValidUntil);
      if (entryTime.trim()) {
        formData.append('entry_time', entryTime.trim());
      }
      // Dynamically resolve PG and Branch IDs from auth user, selected resident, and branch list
      const currentUser = authService.getCurrentUser();
      const matchedBranch = branches.find(
        (b) => String(b.id) === String(selectedResident?.branch_id || branchId)
      ) || (branches.length > 0 ? branches[0] : null);

      const effectivePgId =
        initialData?.pg?.id ||
        matchedBranch?.pg_id ||
        pgId ||
        currentUser?.pg?.id ||
        (currentUser as any)?.pg_id;

      const effectiveBranchId =
        selectedResident?.branch_id ||
        branchId ||
        matchedBranch?.id ||
        initialData?.branch?.id;

      const resId = selectedResidentId || initialData?.resident?.id;
      if (resId) {
        formData.append('resident_id', String(resId));
      }
      if (effectivePgId) {
        formData.append('pg_id', String(effectivePgId));
      }
      if (effectiveBranchId) {
        formData.append('branch_id', String(effectiveBranchId));
      }
      if (selectedResident?.room_id || initialData?.room?.id) {
        formData.append('room_id', String(selectedResident?.room_id || initialData?.room?.id));
      }
      if (adminNotes.trim()) {
        formData.append('admin_notes', adminNotes.trim());
      }
      formData.append('status', status);

      // Photo handling: upload new file, or explicitly remove if cleared in edit mode
      if (photoFile) {
        formData.append('visitor_photo', photoFile);
        formData.append('photo', photoFile);
      } else if (isEdit && !photoPreview) {
        formData.append('visitor_photo', 'null');
        formData.append('photo', 'null');
      }

      if (isEdit && initialData?.id) {
        await visitorService.updateVisitor(initialData.id, formData);
      } else {
        await visitorService.createVisitor(formData);
        resetFormRef.current();
      }

      // Successfully saved! Note: apiClient automatically displays backend response toast message.
      router.push('/visitors');
    } catch (err) {
      console.warn('Visitor form submission failed:', err);
      // apiClient handles toast error display automatically
    } finally {
      setIsSubmitting(false);
    }
  };

  const purposeOptions = [
    { label: 'Meeting', value: 'Meeting' },
    { label: 'Personal Visit', value: 'Personal Visit' },
    { label: 'Delivery', value: 'Delivery' },
    { label: 'Maintenance', value: 'Maintenance' },
    { label: 'Other', value: 'Other' },
  ];

  // Derived details for read-only Resident location display
  const matchedBranch = branches.find((b) => String(b.id) === String(branchId));
  const displayBranchName =
    selectedResident?.branch_id && branches.find((b) => b.id === selectedResident.branch_id)?.name
      ? branches.find((b) => b.id === selectedResident.branch_id)?.name
      : initialData?.branch?.name || matchedBranch?.name || 'Main Branch';

  const displayBuildingName = selectedResident?.building_name || 'Main Building';

  const displayFloorName =
    selectedResident?.floor_name ||
    (selectedResident?.floor_number !== undefined && selectedResident?.floor_number !== null
      ? `Floor ${selectedResident.floor_number}`
      : '—');

  const displayRoomNo =
    selectedResident?.room_no ||
    initialData?.room?.room_no ||
    roomNo ||
    '—';

  const hasResidentDetails = Boolean(
    selectedResidentId ||
    selectedResident ||
    initialData?.resident ||
    initialData?.room?.room_no
  );

  return (
    <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 max-w-[1400px] w-full mx-auto space-y-6 bg-[#F7F7F5] min-h-screen">
      {/* Page Header */}
      <PageHeader
        backHref="/visitors"
        backTitle="Back to Visitor Records"
        title={isEdit ? 'Edit Visitor' : 'Add Visitor'}
        subtitle={isEdit ? 'Update visitor details and access pass.' : 'Add a new visitor.'}
        onBackClick={!isEdit ? () => resetFormRef.current() : undefined}
      />

      {/* Main 2-Column Form Card */}
      <form onSubmit={handleSubmit} noValidate autoComplete="off">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left Column: Visitor & Resident Core Information */}
          <div className="space-y-4">
            {/* Visitor name */}
            <TextInput
              label="Visitor name"
              required
              placeholder="Enter visitor name"
              value={visitorName}
              onChange={(e) => {
                setVisitorName(e.target.value);
                if (errors.visitor_name) setErrors((prev) => ({ ...prev, visitor_name: '' }));
              }}
              error={errors.visitor_name}
            />

            {/* Resident selection dropdown */}
            <div className="space-y-2 w-full">
              <label className="text-xs sm:text-sm font-semibold text-gray-800 block">
                Resident name <span className="text-[#175C46]">*</span>
              </label>
              <ResidentDropdown
                selectedResidentId={selectedResidentId}
                selectedResidentName={residentName}
                placeholder="Select host resident..."
                onSelect={handleResidentSelect}
                hasError={!!errors.resident_id}
              />
              {errors.resident_id && (
                <p className="text-[11px] text-rose-500 mt-0.5">{errors.resident_id}</p>
              )}

              {/* Read-only Resident Location Details card (Branch, Building, Floor, Room) */}
              {hasResidentDetails && (
                <div className="p-3.5 rounded-xl border border-gray-100 bg-[#FAFBFB] flex flex-wrap items-center gap-x-6 gap-y-2.5 text-xs shadow-2xs mt-1.5 transition-all animate-in fade-in">
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-400 font-medium">Branch:</span>
                    <span className="font-semibold text-gray-800">{displayBranchName}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-400 font-medium">Building:</span>
                    <span className="font-semibold text-gray-800">{displayBuildingName}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-400 font-medium">Floor:</span>
                    <span className="font-semibold text-gray-800">{displayFloorName}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-400 font-medium">Room:</span>
                    <span className="font-bold text-[#175C46] bg-[#E8F8F0] px-2 py-0.5 rounded border border-[#C6ECD9]">
                      {displayRoomNo}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Visitor phone no. */}
            <TextInput
              label="Visitor phone no."
              required
              type="tel"
              inputMode="tel"
              placeholder="Enter 10-digit phone no."
              maxLength={visitorPhone.startsWith('+') ? 14 : 10}
              value={visitorPhone}
              onChange={handlePhoneChange}
              onKeyDown={handlePhoneKeyDown}
              onBlur={handlePhoneBlur}
              error={errors.visitor_phone}
            />

            {/* Purpose */}
            <Dropdown
              label="Purpose"
              required
              placeholder="Select purpose"
              options={purposeOptions}
              value={purpose}
              onChange={(e) => {
                setPurpose(e.target.value);
                if (errors.purpose) setErrors((prev) => ({ ...prev, purpose: '' }));
              }}
              error={errors.purpose}
            />
          </div>

          {/* Right Column: Photo, Visit Date / Valid Until & Time */}
          <div className="space-y-4">
            {/* Attach Visitor photo (Optional) */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-semibold text-gray-800 block">
                Attach Visitor photo <span className="text-gray-400 font-normal">(Optional)</span>
              </label>

              {/* Hidden native input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handlePhotoSelect(e.target.files[0]);
                  }
                }}
              />

              {/* Dropzone container */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handlePhotoSelect(e.dataTransfer.files[0]);
                  }
                }}
                className={`w-full min-h-[175px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-5 text-center cursor-pointer transition-all bg-white ${isDragging
                    ? 'border-[#175C46] bg-[#175C46]/5'
                    : photoPreview
                      ? 'border-gray-200'
                      : 'border-gray-300 hover:border-[#175C46] hover:bg-gray-50/50'
                  }`}
              >
                {photoPreview ? (
                  <div className="relative w-full flex flex-col items-center">
                    <div className="w-28 h-28 rounded-xl overflow-hidden relative shadow-sm border border-gray-100">
                      <Image
                        src={photoPreview}
                        alt="Uploaded visitor photo"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="mt-2.5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="text-xs font-semibold text-[#175C46] hover:underline cursor-pointer"
                      >
                        Change Photo
                      </button>
                      <span className="text-gray-300">•</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemovePhoto();
                        }}
                        className="text-xs font-semibold text-rose-500 hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-11 h-11 rounded-full bg-[#175C46]/10 text-[#175C46] flex items-center justify-center">
                      <svg
                        className="w-5 h-5 stroke-current"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.75"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs sm:text-sm font-semibold text-gray-700">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-[11px] text-gray-400">
                        JPG, PNG • Max 5MB
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {errors.photo && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.photo}</p>
              )}
            </div>

            {/* Visit Date & Valid Until (Right side below photo dropzone) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 w-full">
                <label className="text-xs sm:text-sm font-semibold text-gray-800 block">
                  Visit Date <span className="text-[#175C46]">*</span>
                </label>
                <AppDatePicker
                  value={visitDate}
                  minDate={minVisitDate}
                  maxDate={maxVisitDate}
                  onChange={(val) => {
                    setVisitDate(val);
                    if (!validUntil || validUntil === visitDate) {
                      setValidUntil(val);
                    } else if (val && validUntil) {
                      const vD = parseDateString(val);
                      const uD = parseDateString(validUntil);
                      if (vD && uD && vD > uD) {
                        setValidUntil(val);
                      }
                    }
                    if (errors.visit_date) setErrors((prev) => ({ ...prev, visit_date: '' }));
                    if (errors.valid_until) setErrors((prev) => ({ ...prev, valid_until: '' }));
                  }}
                  placeholder="Select visit date"
                  dateFormat="dd/mm/yy"
                  hasError={!!errors.visit_date}
                />
                {errors.visit_date && (
                  <p className="text-[11px] text-rose-500 mt-0.5">{errors.visit_date}</p>
                )}
              </div>

              <div className="space-y-1.5 w-full">
                <label className="text-xs sm:text-sm font-semibold text-gray-800 block">
                  Valid until
                </label>
                <AppDatePicker
                  value={validUntil}
                  minDate={minValidUntilDate}
                  onChange={(val) => {
                    setValidUntil(val);
                    if (val && visitDate) {
                      const vD = parseDateString(visitDate);
                      const uD = parseDateString(val);
                      if (vD && uD && uD < vD) {
                        setVisitDate(val);
                      }
                    }
                    if (errors.valid_until) setErrors((prev) => ({ ...prev, valid_until: '' }));
                  }}
                  placeholder="Select valid until"
                  dateFormat="dd/mm/yy"
                  hasError={!!errors.valid_until}
                />
                {errors.valid_until && (
                  <p className="text-[11px] text-rose-500 mt-0.5">{errors.valid_until}</p>
                )}
              </div>
            </div>

            {/* Entry time (interactive time selection) & Admin Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 w-full">
                <label className="text-xs sm:text-sm font-semibold text-gray-800 block">
                  Entry time
                </label>
                <AppTimePicker
                  value={entryTime}
                  onChange={(val) => setEntryTime(val)}
                  placeholder="Select entry time"
                />
              </div>

              <TextInput
                label="Admin notes"
                placeholder="Enter admin notes or remarks..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Full-width Save Button spanning the entire container width */}
        <div className="pt-6 w-full">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#175C46] hover:bg-[#124937] disabled:opacity-60 text-white font-semibold py-3.5 px-6 rounded-xl transition-all shadow-2xs text-sm cursor-pointer flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {isEdit ? 'Updating Visitor...' : 'Save'}
              </>
            ) : (
              isEdit ? 'Update Visitor' : 'Save'
            )}
          </button>
        </div>
      </form>
    </main>
  );
};
