'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppDatePicker, toInputDate, parseDateString } from '@/components/ui/app-date-picker';
import { PageHeader, Dropdown, PhotoUpload, BrandLoader } from '@/components/ui';
import { residentService } from '@/services/resident.service';
import { toast } from '@/lib/toast';
import {
  ResidentDetail,
  Branch,
  Building,
  Floor,
  RoomOption,
} from '@/types/resident';

/**
 * Properties accepted by the ResidentForm component.
 */
export interface ResidentFormProps {
  /** Mode of the form: 'create' for new resident onboarding, 'edit' for existing resident update */
  mode: 'create' | 'edit';
  /** Unique ID of the resident when editing */
  residentId?: string | number;
  /** Pre-populated resident details loaded from backend API */
  initialData?: ResidentDetail | null;
}

/**
 * Internal state shape representing all editable fields across the form sections.
 */
interface FormState {
  name: string;
  email: string;
  phone: string;
  gender: string;
  status: string;
  date_of_birth: string;
  nationality: string;
  marital_status: string;
  occupation: string;
  branch_id: number | string;
  building_id: number | string;
  floor_id: number | string;
  room_id: number | string;
  room_no: string;
  room_type: string;
  bed_number: string;
  monthly_rent: number | string;
  security_deposit: number | string;
  maintenance_amount: number | string;
  check_in_date: string;
  check_out_date: string;
  // Address fields
  address_line_1: string;
  city: string;
  state: string;
  pincode: string;
  // Emergency contact fields
  emergency_contact_name: string;
  emergency_contact_relationship: string;
  emergency_contact_phone: string;
  // Account / stay settings
  password?: string;
  pg_id: number | string;
  subscription_plan_id: number | string;
}



interface FormInitialDataSource extends Partial<ResidentDetail> {
  name?: string;
  email?: string;
  phone?: string;
  gender?: string;
  status?: string;
  branch_id?: number | string | null;
  building_id?: number | string | null;
  floor_id?: number | string | null;
  room_id?: number | string | null;
  room_no?: string | null;
  room_type?: string | null;
  bed_number?: string | null;
  monthly_rent?: number | string | null;
  security_deposit?: number | string | null;
  maintenance_amount?: number | string | null;
  check_in_date?: string | null;
  check_out_date?: string | null;
  address_line_1?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | number | null;
  emergency_contact_name?: string | null;
  emergency_contact_relationship?: string | null;
  emergency_contact_phone?: string | null;
  date_of_birth?: string | null;
  nationality?: string | null;
  marital_status?: string | null;
  occupation?: string | null;
  branch_name?: string | null;
  building_name?: string | null;
  floor_name?: string | null;
  photo_url?: string | null;
  aadhar_card?: string | null;
  address_proof?: string | null;
  education_certificate?: string | null;
  agreement_file?: string | null;
  agreement?: string | null;
  signature?: string | null;
  pg_id?: number | string | null;
  subscription_plan_id?: string | number | null;
}

/**
 * Builds the initial form state. Returns blank defaults for 'create' mode
 * or maps existing nested API fields for 'edit' mode.
 */
function buildInitialFormData(initialData?: ResidentDetail | null): FormState {
  if (!initialData) {
    return {
      name: '',
      email: '',
      phone: '',
      gender: '',
      status: '',
      date_of_birth: '',
      nationality: '',
      marital_status: '',
      occupation: '',
      branch_id: '',
      building_id: '',
      floor_id: '',
      room_id: '',
      room_no: '',
      room_type: '',
      bed_number: '',
      monthly_rent: '',
      security_deposit: '',
      maintenance_amount: '',
      check_in_date: '',
      check_out_date: '',
      address_line_1: '',
      city: '',
      state: '',
      pincode: '',
      emergency_contact_name: '',
      emergency_contact_relationship: '',
      emergency_contact_phone: '',
      password: '',
      pg_id: '',
      subscription_plan_id: '1',
    };
  }

  // Support both nested structured format (personal_info, contact_info, room_info)
  // and flat top-level user fields returned from backend
  const raw = initialData as FormInitialDataSource;
  const personal = initialData.personal_info;
  const contact = initialData.contact_info;
  const room = initialData.room_info;

  return {
    name: initialData.name || personal?.name || raw.name || '',
    email: initialData.email || contact?.email || raw.email || '',
    phone: initialData.phone || contact?.phone || raw.phone || '',
    gender: (initialData.gender || personal?.gender || raw.gender || 'male').toLowerCase(),
    status: (initialData.status || room?.current_status || raw.status || 'active').toLowerCase(),
    date_of_birth: toInputDate(personal?.date_of_birth || raw.date_of_birth),
    nationality: personal?.nationality || raw.nationality || 'Indian',
    marital_status: (personal?.marital_status || raw.marital_status || 'single').toLowerCase(),
    occupation: personal?.occupation || raw.occupation || '',

    branch_id: room?.branch_id ? String(room.branch_id) : (raw.branch_id ? String(raw.branch_id) : ''),
    building_id: room?.building_id ? String(room.building_id) : (raw.building_id ? String(raw.building_id) : ''),
    floor_id: room?.floor_id ? String(room.floor_id) : (raw.floor_id ? String(raw.floor_id) : ''),
    room_id: room?.room_id ? String(room.room_id) : (raw.room_id ? String(raw.room_id) : ''),
    room_no: room?.room_no || raw.room_no || '',
    room_type: (room?.room_type || raw.room_type || '').toLowerCase(),
    bed_number: room?.bed_number || raw.bed_number || '',
    monthly_rent:
      room?.monthly_rent !== undefined && room.monthly_rent !== null
        ? String(room.monthly_rent)
        : raw.monthly_rent !== undefined && raw.monthly_rent !== null
          ? String(raw.monthly_rent)
          : '',
    security_deposit:
      room?.security_deposit !== undefined && room.security_deposit !== null
        ? String(room.security_deposit)
        : raw.security_deposit !== undefined && raw.security_deposit !== null
          ? String(raw.security_deposit)
          : '',
    maintenance_amount:
      raw.maintenance_amount !== undefined && raw.maintenance_amount !== null
        ? String(raw.maintenance_amount)
        : '',
    check_in_date: toInputDate(room?.check_in_date || raw.check_in_date),
    check_out_date: toInputDate(room?.check_out_date || raw.check_out_date),

    address_line_1:
      contact?.address_line_1 ||
      contact?.address ||
      raw.address_line_1 ||
      raw.address ||
      '',
    city: contact?.city || raw.city || '',
    state: contact?.state || raw.state || '',
    pincode: contact?.pincode ? String(contact.pincode) : (raw.pincode ? String(raw.pincode) : ''),
    emergency_contact_name:
      contact?.emergency_contact_name || raw.emergency_contact_name || '',
    emergency_contact_relationship:
      contact?.emergency_contact_relationship || raw.emergency_contact_relationship || '',
    emergency_contact_phone:
      contact?.emergency_contact_phone || raw.emergency_contact_phone || '',
    password: '',
    pg_id: room?.pg_id ? String(room.pg_id) : (raw.pg_id ? String(raw.pg_id) : ''),
    subscription_plan_id: String(raw.subscription_plan_id || '1'),
  };
}

/**
 * ResidentForm handles resident onboarding (creation) and profile editing.
 * Features:
 * - Real-time client-side validation with red borders and inline error hints
 * - Dynamic cascading dropdowns (Branch -> Building -> Floor -> Room)
 * - Automatic room type assignment and financial defaults
 * - Drag-and-drop file upload for profile photos and resident KYC documents
 * - Automatic form cleanup on navigation and unmount
 */
export const ResidentForm: React.FC<ResidentFormProps> = ({
  mode,
  residentId,
  initialData,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // File input refs
  const aadharInputRef = useRef<HTMLInputElement>(null);
  const addressProofInputRef = useRef<HTMLInputElement>(null);
  const educationCertInputRef = useRef<HTMLInputElement>(null);
  const agreementFileInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<FormState>(() => {
    const base = buildInitialFormData(initialData);
    if (mode === 'create' && searchParams) {
      const qBranchId = searchParams.get('branch_id');
      const qBuildingId = searchParams.get('building_id');
      const qFloorId = searchParams.get('floor_id');
      const qRoomId = searchParams.get('room_id');
      const qRoomNo = searchParams.get('room_no');
      const qRoomType = searchParams.get('room_type');
      const qRent = searchParams.get('monthly_rent') || searchParams.get('rent');
      const qDeposit = searchParams.get('security_deposit');

      if (qBranchId) base.branch_id = qBranchId;
      if (qBuildingId) base.building_id = qBuildingId;
      if (qFloorId) base.floor_id = qFloorId;
      if (qRoomId) base.room_id = qRoomId;
      if (qRoomNo) base.room_no = qRoomNo;
      if (qRoomType) base.room_type = qRoomType.toLowerCase();
      if (qRent) base.monthly_rent = qRent;
      if (qDeposit) base.security_deposit = qDeposit;
    }
    return base;
  });

  // Synchronize URL search parameters into formData on mount or whenever query params update
  useEffect(() => {
    if (mode !== 'create') return;

    const qBranchId = searchParams?.get('branch_id');
    const qBuildingId = searchParams?.get('building_id');
    const qFloorId = searchParams?.get('floor_id');
    const qRoomId = searchParams?.get('room_id');
    const qRoomNo = searchParams?.get('room_no');
    const qRoomType = searchParams?.get('room_type');
    const qRent = searchParams?.get('monthly_rent') || searchParams?.get('rent');
    const qDeposit = searchParams?.get('security_deposit');

    const hasRoomQueryParams = Boolean(
      qBranchId || qBuildingId || qFloorId || qRoomId || qRoomType || qRent || qDeposit
    );

    if (hasRoomQueryParams) {
      setFormData((prev) => ({
        ...prev,
        branch_id: qBranchId || '',
        building_id: qBuildingId || '',
        floor_id: qFloorId || '',
        room_id: qRoomId || '',
        room_no: qRoomNo || '',
        room_type: (qRoomType || '').toLowerCase(),
        monthly_rent: qRent || '',
        security_deposit: qDeposit || '',
      }));
    } else {
      // If there are no room query parameters (e.g. creating a new resident from resident list page),
      // ensure all fields start completely blank without any prefilled or default values.
      resetAllFields();
    }
  }, [searchParams, mode]);

  // Cascading dropdown lists
  const [branches, setBranches] = useState<Branch[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [rooms, setRooms] = useState<RoomOption[]>([]);

  // Loading states for cascaded dropdowns
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingBuildings, setLoadingBuildings] = useState(false);
  const [loadingFloors, setLoadingFloors] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);

  // File states
  const rawInitial = initialData as FormInitialDataSource;
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    initialData?.profile_photo_url || initialData?.profile_photo || rawInitial?.photo_url || null
  );

  const [aadharFile, setAadharFile] = useState<File | null>(null);
  const [addressProofFile, setAddressProofFile] = useState<File | null>(null);
  const [educationCertFile, setEducationCertFile] = useState<File | null>(null);
  const [agreementFile, setAgreementFile] = useState<File | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [existingAadhar, setExistingAadhar] = useState<string | null>(
    initialData?.documents?.aadhar_card || rawInitial?.aadhar_card || null
  );
  const [existingAddressProof, setExistingAddressProof] = useState<string | null>(
    initialData?.documents?.address_proof || rawInitial?.address_proof || null
  );
  const [existingEducationCert, setExistingEducationCert] = useState<string | null>(
    initialData?.documents?.education_certificate || rawInitial?.education_certificate || null
  );
  const [existingAgreementFile, setExistingAgreementFile] = useState<string | null>(
    initialData?.documents?.agreement_file || rawInitial?.agreement_file || rawInitial?.agreement || null
  );
  const [existingSignature, setExistingSignature] = useState<string | null>(
    initialData?.documents?.signature || rawInitial?.signature || null
  );

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Multi-step form navigation state & definitions
  const [activeStep, setActiveStep] = useState<number>(0);

  const STEPS = [
    { id: 'personal', title: 'Personal & Room', subtitle: 'Basic info & room' },
    { id: 'address', title: 'Address & Contact', subtitle: 'Address & emergency' },
    { id: 'financials', title: 'Stay & Financials', subtitle: 'Bed allocation & rent' },
    { id: 'documents', title: 'Documents & KYC', subtitle: 'ID proofs & signature' },
  ];

  // Maximum Date of Birth allowed: yesterday (disables today and all future dates)
  const maxDobDate = useMemo(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999);
    return yesterday;
  }, []);

  // Minimum Check-out Date allowed: check_in_date (disables all dates before selected check-in date)
  const minCheckoutDate = useMemo(() => {
    if (!formData.check_in_date || !formData.check_in_date.trim()) return null;
    const d = parseDateString(formData.check_in_date);
    if (!d) return null;
    d.setHours(0, 0, 0, 0);
    return d;
  }, [formData.check_in_date]);

  // Maximum Check-in Date allowed: check_out_date (disables all dates after selected check-out date)
  const maxCheckinDate = useMemo(() => {
    if (!formData.check_out_date || !formData.check_out_date.trim()) return null;
    const d = parseDateString(formData.check_out_date);
    if (!d) return null;
    d.setHours(23, 59, 59, 999);
    return d;
  }, [formData.check_out_date]);

  const step0Fields = [
    'name',
    'branch_id',
    'building_id',
    'floor_id',
    'room_id',
    'room_type',
    'phone',
    'gender',
    'status',
    'nationality',
    'marital_status',
    'occupation',
    'date_of_birth',
    'check_in_date',
    'check_out_date',
    'email',
  ];

  const step1Fields = ['pincode', 'emergency_contact_phone'];
  const step2Fields = ['bed_number', 'monthly_rent', 'security_deposit'];

  const validateStep = (stepIdx: number): boolean => {
    const newErrors: Record<string, string> = { ...errors };
    let hasError = false;

    if (stepIdx === 0) {
      if (!formData.name.trim()) {
        newErrors.name = 'Resident name is required.';
        hasError = true;
      }
      if (!formData.branch_id) {
        newErrors.branch_id = 'Branch is required.';
        hasError = true;
      }
      if (!formData.building_id) {
        newErrors.building_id = 'Building is required.';
        hasError = true;
      }
      if (!formData.floor_id) {
        newErrors.floor_id = 'Floor is required.';
        hasError = true;
      }
      if (!formData.room_id) {
        newErrors.room_id = 'Resident room no. is required.';
        hasError = true;
      }
      if (!formData.room_type.trim()) {
        newErrors.room_type = 'Resident room type is required.';
        hasError = true;
      }
      if (!formData.phone.trim()) {
        newErrors.phone = 'Resident phone number is required.';
        hasError = true;
      } else if (!/^(\+91[\-\s]?)?[6-9]\d{9}$/.test(formData.phone.trim())) {
        newErrors.phone = 'Please provide a valid 10-digit mobile number starting with 6-9.';
        hasError = true;
      }
      if (!formData.gender) {
        newErrors.gender = 'Gender is required.';
        hasError = true;
      }
      if (!formData.status) {
        newErrors.status = 'Status is required.';
        hasError = true;
      }
      if (!formData.nationality.trim()) {
        newErrors.nationality = 'Nationality is required.';
        hasError = true;
      }
      if (!formData.marital_status.trim()) {
        newErrors.marital_status = 'Marital status is required.';
        hasError = true;
      }
      if (!formData.occupation.trim()) {
        newErrors.occupation = 'Occupation is required.';
        hasError = true;
      }
      if (formData.date_of_birth && formData.date_of_birth.trim()) {
        const parsedDob = parseDateString(formData.date_of_birth);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (parsedDob && parsedDob >= today) {
          newErrors.date_of_birth = 'Date of birth must be before today (today and future dates are not allowed).';
          hasError = true;
        }
      }
      if (!formData.check_in_date.trim()) {
        newErrors.check_in_date = 'Check in date is required.';
        hasError = true;
      }
      if (formData.check_in_date.trim() && formData.check_out_date && formData.check_out_date.trim()) {
        const inDate = parseDateString(formData.check_in_date);
        const outDate = parseDateString(formData.check_out_date);
        if (inDate && outDate && outDate < inDate) {
          newErrors.check_out_date = 'Check out date cannot be before check in date.';
          hasError = true;
        }
      }
      if (!formData.email.trim()) {
        newErrors.email = 'E-mail is required.';
        hasError = true;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        newErrors.email = 'Please enter a valid email address.';
        hasError = true;
      }
    } else if (stepIdx === 1) {
      if (formData.pincode && formData.pincode.trim()) {
        if (!/^[1-9][0-9]{5}$/.test(formData.pincode.trim())) {
          newErrors.pincode = 'Please enter a valid 6-digit Indian PIN code.';
          hasError = true;
        }
      }
      if (formData.emergency_contact_phone && formData.emergency_contact_phone.trim()) {
        if (!/^(\+91[\-\s]?)?[6-9]\d{9}$/.test(formData.emergency_contact_phone.trim())) {
          newErrors.emergency_contact_phone = 'Please provide a valid 10-digit emergency mobile number starting with 6-9.';
          hasError = true;
        }
      }
    } else if (stepIdx === 2) {
      if (!formData.bed_number.trim()) {
        newErrors.bed_number = 'Bed number is required.';
        hasError = true;
      }
      if (
        formData.monthly_rent === '' ||
        formData.monthly_rent === undefined ||
        formData.monthly_rent === null ||
        String(formData.monthly_rent).trim() === ''
      ) {
        newErrors.monthly_rent = 'Monthly rent is required.';
        hasError = true;
      } else if (isNaN(Number(formData.monthly_rent)) || Number(formData.monthly_rent) < 0) {
        newErrors.monthly_rent = 'Monthly rent must be a valid non-negative amount.';
        hasError = true;
      }
    }

    setErrors(newErrors);

    if (hasError) {
      const firstErrorField = Object.keys(newErrors).find((f) =>
        stepIdx === 0
          ? step0Fields.includes(f)
          : stepIdx === 1
          ? step1Fields.includes(f)
          : step2Fields.includes(f)
      );
      if (firstErrorField) {
        setTimeout(() => {
          const el = document.querySelector(`[name="${firstErrorField}"]`);
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 50);
      }
      return false;
    }

    return true;
  };

  const isStepComplete = (stepIdx: number): boolean => {
    if (stepIdx === 0) {
      return Boolean(
        formData.name.trim() &&
        formData.branch_id &&
        formData.building_id &&
        formData.floor_id &&
        formData.room_id &&
        formData.room_type &&
        formData.phone.trim() &&
        formData.gender &&
        formData.status &&
        formData.nationality.trim() &&
        formData.marital_status.trim() &&
        formData.occupation.trim() &&
        formData.check_in_date.trim() &&
        formData.email.trim() &&
        !step0Fields.some((f) => !!errors[f])
      );
    }
    if (stepIdx === 1) {
      return Boolean(
        (formData.address_line_1.trim() || formData.city.trim() || formData.emergency_contact_name.trim()) &&
        !step1Fields.some((f) => !!errors[f])
      );
    }
    if (stepIdx === 2) {
      return Boolean(
        formData.bed_number.trim() &&
        String(formData.monthly_rent).trim() !== '' &&
        !step2Fields.some((f) => !!errors[f])
      );
    }
    if (stepIdx === 3) {
      return Boolean(
        photoFile ||
        photoPreview ||
        aadharFile ||
        existingAadhar ||
        signatureFile ||
        existingSignature
      );
    }
    return false;
  };

  const hasStepError = (stepIdx: number): boolean => {
    if (stepIdx === 0) return step0Fields.some((f) => !!errors[f]);
    if (stepIdx === 1) return step1Fields.some((f) => !!errors[f]);
    if (stepIdx === 2) return step2Fields.some((f) => !!errors[f]);
    return false;
  };

  const handleNextStep = () => {
    if (activeStep === 0) {
      if (!validateStep(0)) {
        toast.warn('Please fill in all required fields marked in red.');
        return;
      }
      setActiveStep(1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (activeStep === 1) {
      if (!validateStep(1)) {
        toast.warn('Please correct the errors before proceeding.');
        return;
      }
      setActiveStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (activeStep === 2) {
      if (!validateStep(2)) {
        toast.warn('Please fill in bed number and monthly rent.');
        return;
      }
      setActiveStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    if (activeStep > 0) {
      setActiveStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const clearError = (field: string) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  };

  const getInputClass = (fieldName: string, extraClasses = '') =>
    `w-full h-11 px-4 py-2.5 bg-white border ${errors[fieldName]
      ? 'border-red-500 focus:ring-1 focus:ring-red-500 focus:border-red-500 text-red-900 placeholder-red-300'
      : 'border-gray-200 focus:ring-1 focus:ring-[#175C46] focus:border-[#175C46] text-gray-900 placeholder-gray-400'
    } rounded-xl text-sm focus:outline-none transition-all ${extraClasses}`;


  const renderFieldError = (fieldName: string) => {
    if (!errors[fieldName]) return null;
    return (
      <p className="text-xs text-red-500 mt-1.5 font-medium flex items-center gap-1">
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{errors[fieldName]}</span>
      </p>
    );
  };

  // 1. Fetch Branches on mount
  useEffect(() => {
    let isMounted = true;
    setLoadingBranches(true);
    residentService
      .getBranches({ limit: 50 })
      .then((res) => {
        if (isMounted) {
          setBranches(res.data);
          setLoadingBranches(false);
          if (res.data?.length > 0 && res.data[0].pg_id) {
            setFormData((prev) => ({
              ...prev,
              pg_id: prev.pg_id || String(res.data[0].pg_id),
            }));
          }
        }
      })
      .catch(() => {
        if (isMounted) setLoadingBranches(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch Buildings when branch_id changes
  useEffect(() => {
    let isMounted = true;
    if (!formData.branch_id) {
      setBuildings([]);
      setLoadingBuildings(false);
      return;
    }

    setLoadingBuildings(true);
    residentService
      .getBuildings(formData.branch_id)
      .then((data) => {
        if (isMounted) {
          setBuildings(data);
          setLoadingBuildings(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoadingBuildings(false);
      });

    return () => {
      isMounted = false;
    };
  }, [formData.branch_id]);

  // 3. Fetch Floors when building_id changes
  useEffect(() => {
    let isMounted = true;
    if (!formData.building_id) {
      setFloors([]);
      setLoadingFloors(false);
      return;
    }

    setLoadingFloors(true);
    residentService
      .getFloors(formData.building_id)
      .then((data) => {
        if (isMounted) {
          setFloors(data);
          setLoadingFloors(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoadingFloors(false);
      });

    return () => {
      isMounted = false;
    };
  }, [formData.building_id]);

  // 4. Fetch Rooms when building_id, floor_id, and branch_id are available
  useEffect(() => {
    let isMounted = true;
    if (!formData.branch_id || !formData.building_id || !formData.floor_id) {
      setRooms([]);
      setLoadingRooms(false);
      return;
    }

    setLoadingRooms(true);
    residentService
      .getRooms({
        branch_id: formData.branch_id,
        building_id: formData.building_id,
        floor_id: formData.floor_id,
      })
      .then((data) => {
        if (isMounted) {
          setRooms(data);
          setLoadingRooms(false);
          setFormData((prev) => {
            const currentRoomId = prev.room_id;
            if (!currentRoomId) return prev;
            const matched = data.find((r) => String(r.id) === String(currentRoomId));
            if (matched) {
              return {
                ...prev,
                room_no: prev.room_no || matched.room_no || matched.room_number || '',
                room_type: prev.room_type || (matched.room_type || matched.type || '').toLowerCase(),
                monthly_rent: prev.monthly_rent || matched.monthly_rent || matched.rent || '',
                security_deposit: prev.security_deposit || matched.security_deposit || '',
              };
            }
            return prev;
          });
        }
      })
      .catch(() => {
        if (isMounted) setLoadingRooms(false);
      });

    return () => {
      isMounted = false;
    };
  }, [formData.branch_id, formData.building_id, formData.floor_id, formData.room_id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name } = e.target;
    let { value } = e.target;
    if (name === 'phone' || name === 'emergency_contact_phone') {
      const hasPlus = value.startsWith('+');
      const digitsOnly = value.replace(/\D/g, '').slice(0, 13);
      value = hasPlus ? `+${digitsOnly}` : digitsOnly;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
    clearError(name);
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
      return;
    }

    const input = e.currentTarget;
    const hasSelection =
      (input.selectionEnd ?? 0) - (input.selectionStart ?? 0) > 0;
    const maxLen = input.value.startsWith('+') ? 14 : 13;
    if (!hasSelection && input.value.length >= maxLen) {
      e.preventDefault();
    }
  };

  // Branch Selection: cascades and resets downstream selections
  const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const branchId = e.target.value;
    setFormData((prev) => ({
      ...prev,
      branch_id: branchId,
      building_id: '',
      floor_id: '',
      room_id: '',
      room_no: '',
      room_type: '',
    }));
    clearError('branch_id');
    setBuildings([]);
    setFloors([]);
    setRooms([]);
  };

  // Building Selection: cascades and resets floor/room selections
  const handleBuildingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const buildingId = e.target.value;
    setFormData((prev) => ({
      ...prev,
      building_id: buildingId,
      floor_id: '',
      room_id: '',
      room_no: '',
      room_type: '',
    }));
    clearError('building_id');
    setFloors([]);
    setRooms([]);
  };

  // Floor Selection: cascades and resets room selection
  const handleFloorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const floorId = e.target.value;
    setFormData((prev) => ({
      ...prev,
      floor_id: floorId,
      room_id: '',
      room_no: '',
      room_type: '',
    }));
    clearError('floor_id');
    setRooms([]);
  };

  // Room Selection: automatically sets room_no and room_type
  const handleRoomChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const roomId = e.target.value;
    const selectedRoom = rooms.find((r) => String(r.id) === String(roomId));

    if (selectedRoom) {
      const roomNo = selectedRoom.room_no || selectedRoom.room_number || selectedRoom.name || '';
      const roomType = (selectedRoom.room_type || selectedRoom.type || 'single').toLowerCase();

      setFormData((prev) => ({
        ...prev,
        room_id: selectedRoom.id,
        room_no: roomNo,
        room_type: roomType,
        monthly_rent: selectedRoom.monthly_rent || selectedRoom.rent || prev.monthly_rent,
        security_deposit: selectedRoom.security_deposit || prev.security_deposit,
      }));
      if (selectedRoom.monthly_rent || selectedRoom.rent) {
        clearError('monthly_rent');
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        room_id: roomId,
        room_no: '',
        room_type: '',
      }));
    }
    clearError('room_id');
    clearError('room_type');
  };

  const resetAllFields = () => {
    setActiveStep(0);
    setErrors({});
    setFormData({
      name: '',
      email: '',
      phone: '',
      gender: '',
      status: '',
      date_of_birth: '',
      nationality: '',
      marital_status: '',
      occupation: '',
      branch_id: '',
      building_id: '',
      floor_id: '',
      room_id: '',
      room_no: '',
      room_type: '',
      bed_number: '',
      monthly_rent: '',
      security_deposit: '',
      maintenance_amount: '',
      check_in_date: '',
      check_out_date: '',
      address_line_1: '',
      city: '',
      state: '',
      pincode: '',
      emergency_contact_name: '',
      emergency_contact_relationship: '',
      emergency_contact_phone: '',
      password: '',
      pg_id: '',
      subscription_plan_id: '1',
    });
    setBuildings([]);
    setFloors([]);
    setRooms([]);
    setPhotoFile(null);
    setPhotoPreview(null);
    setAadharFile(null);
    setAddressProofFile(null);
    setEducationCertFile(null);
    setAgreementFile(null);
    setSignatureFile(null);

    // Reset file input DOM values
    if (aadharInputRef.current) aadharInputRef.current.value = '';
    if (addressProofInputRef.current) addressProofInputRef.current.value = '';
    if (educationCertInputRef.current) educationCertInputRef.current.value = '';
    if (agreementFileInputRef.current) agreementFileInputRef.current.value = '';
    if (signatureInputRef.current) signatureInputRef.current.value = '';
  };


  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 1. Resident Name
    if (!formData.name.trim()) {
      newErrors.name = 'Resident name is required.';
    }

    // 2. Branch
    if (!formData.branch_id) {
      newErrors.branch_id = 'Branch is required.';
    }

    // 3. Building
    if (!formData.building_id) {
      newErrors.building_id = 'Building is required.';
    }

    // 4. Floor
    if (!formData.floor_id) {
      newErrors.floor_id = 'Floor is required.';
    }

    // 5. Room No
    if (!formData.room_id) {
      newErrors.room_id = 'Resident room no. is required.';
    }

    // 6. Room Type
    if (!formData.room_type.trim()) {
      newErrors.room_type = 'Resident room type is required.';
    }

    // 7. Phone
    if (!formData.phone.trim()) {
      newErrors.phone = 'Resident phone number is required.';
    } else if (!/^(\+91[\-\s]?)?[6-9]\d{9}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Please provide a valid 10-digit mobile number starting with 6-9.';
    }

    // 8. Gender
    if (!formData.gender) {
      newErrors.gender = 'Gender is required.';
    }

    // 9. Status
    if (!formData.status) {
      newErrors.status = 'Status is required.';
    }

    // 10. Nationality
    if (!formData.nationality.trim()) {
      newErrors.nationality = 'Nationality is required.';
    }

    // 11. Marital Status
    if (!formData.marital_status.trim()) {
      newErrors.marital_status = 'Marital status is required.';
    }

    // 12. Occupation
    if (!formData.occupation.trim()) {
      newErrors.occupation = 'Occupation is required.';
    }

    // 13. Check In Date & Check Out Date
    if (!formData.check_in_date.trim()) {
      newErrors.check_in_date = 'Check in date is required.';
    }
    if (formData.check_in_date.trim() && formData.check_out_date && formData.check_out_date.trim()) {
      const inDate = parseDateString(formData.check_in_date);
      const outDate = parseDateString(formData.check_out_date);
      if (inDate && outDate && outDate < inDate) {
        newErrors.check_out_date = 'Check out date cannot be before check in date.';
      }
    }

    // 14. Email
    if (!formData.email.trim()) {
      newErrors.email = 'E-mail is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    // 15. Bed Number
    if (!formData.bed_number.trim()) {
      newErrors.bed_number = 'Bed number is required.';
    }

    // 16. Monthly Rent
    if (
      formData.monthly_rent === '' ||
      formData.monthly_rent === undefined ||
      formData.monthly_rent === null ||
      String(formData.monthly_rent).trim() === ''
    ) {
      newErrors.monthly_rent = 'Monthly rent is required.';
    } else if (isNaN(Number(formData.monthly_rent)) || Number(formData.monthly_rent) < 0) {
      newErrors.monthly_rent = 'Monthly rent must be a valid non-negative amount.';
    }

    // Address pincode check (if provided)
    if (formData.pincode && formData.pincode.trim()) {
      if (!/^[1-9][0-9]{5}$/.test(formData.pincode.trim())) {
        newErrors.pincode = 'Please enter a valid 6-digit Indian PIN code.';
      }
    }

    // Emergency phone check (if provided)
    if (formData.emergency_contact_phone && formData.emergency_contact_phone.trim()) {
      if (!/^(\+91[\-\s]?)?[6-9]\d{9}$/.test(formData.emergency_contact_phone.trim())) {
        newErrors.emergency_contact_phone = 'Please provide a valid 10-digit emergency mobile number starting with 6-9.';
      }
    }

    // Date of Birth check (if provided, must be in the past)
    if (formData.date_of_birth && formData.date_of_birth.trim()) {
      const parsedDob = parseDateString(formData.date_of_birth);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (parsedDob && parsedDob >= today) {
        newErrors.date_of_birth = 'Date of birth must be before today (today and future dates are not allowed).';
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstField = Object.keys(newErrors)[0];
      if (step0Fields.includes(firstField)) {
        setActiveStep(0);
      } else if (step1Fields.includes(firstField)) {
        setActiveStep(1);
      } else if (step2Fields.includes(firstField)) {
        setActiveStep(2);
      } else {
        setActiveStep(3);
      }

      setTimeout(() => {
        const targetElement = document.querySelector(`[name="${firstField}"]`);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          (targetElement as HTMLElement).focus?.();
        }
      }, 50);

      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validateForm()) {
      toast.warn('Please fill in all required fields marked in red.');
      return;
    }

    setSubmitting(true);

    try {
      const fd = new FormData();

      // Core Personal & Stay Data
      fd.append('name', formData.name.trim());
      fd.append('email', formData.email.trim());
      fd.append('phone', formData.phone.trim());
      fd.append('gender', formData.gender);
      fd.append('status', formData.status);
      fd.append('date_of_birth', formData.date_of_birth ? formData.date_of_birth : '');
      fd.append('nationality', formData.nationality || 'Indian');
      fd.append('marital_status', formData.marital_status || 'single');
      fd.append('occupation', formData.occupation ? formData.occupation.trim() : '');

      // Room & Hierarchy Allocation
      if (formData.branch_id) fd.append('branch_id', String(formData.branch_id));
      if (formData.building_id) fd.append('building_id', String(formData.building_id));
      if (formData.floor_id) fd.append('floor_id', String(formData.floor_id));
      if (formData.room_id) fd.append('room_id', String(formData.room_id));
      if (formData.room_no) fd.append('room_no', formData.room_no);
      if (formData.room_type) fd.append('room_type', formData.room_type);
      fd.append('bed_number', formData.bed_number.trim());
      fd.append('monthly_rent', String(formData.monthly_rent).trim());
      if (formData.security_deposit !== '' && formData.security_deposit !== undefined && formData.security_deposit !== null) {
        fd.append('security_deposit', String(formData.security_deposit).trim());
      } else {
        fd.append('security_deposit', '0');
      }

      // Dates and Maintenance
      if (formData.check_in_date) {
        fd.append('check_in_date', formData.check_in_date);
      }
      fd.append('check_out_date', formData.check_out_date ? formData.check_out_date : '');
      if (formData.maintenance_amount !== undefined && formData.maintenance_amount !== null && String(formData.maintenance_amount).trim() !== '') {
        fd.append('maintenance_amount', String(formData.maintenance_amount).trim());
      }

      // Address Fields
      fd.append('address_line_1', formData.address_line_1 ? formData.address_line_1.trim() : '');
      fd.append('address', formData.address_line_1 ? formData.address_line_1.trim() : '');
      fd.append('city', formData.city ? formData.city.trim() : '');
      fd.append('state', formData.state ? formData.state.trim() : '');
      fd.append('pincode', formData.pincode ? formData.pincode.trim() : '');

      // Emergency Contact Fields
      fd.append('emergency_contact_name', formData.emergency_contact_name ? formData.emergency_contact_name.trim() : '');
      fd.append('emergency_contact_relationship', formData.emergency_contact_relationship ? formData.emergency_contact_relationship.trim() : '');
      fd.append('emergency_contact_phone', formData.emergency_contact_phone ? formData.emergency_contact_phone.trim() : '');

      // Role, PG ID & Subscription Plan ID - in BOTH create and edit mode!
      fd.append('role', 'resident');
      const selectedBranch = branches.find((b) => String(b.id) === String(formData.branch_id));
      const effectivePgId = selectedBranch?.pg_id || formData.pg_id || initialData?.room_info?.pg_id || (initialData as FormInitialDataSource)?.pg_id;
      if (effectivePgId) {
        fd.append('pg_id', String(effectivePgId));
      }
      if (formData.subscription_plan_id) {
        fd.append('subscription_plan_id', String(formData.subscription_plan_id));
      }

      // Terms accepted
      const hasSignatureOrAgreement = Boolean(
        signatureFile ||
        existingSignature ||
        agreementFile ||
        existingAgreementFile
      );
      if (hasSignatureOrAgreement) {
        fd.append('terms_accepted', 'true');
      }

      // Create-mode specifics
      if (mode === 'create') {
        if (formData.password?.trim()) {
          fd.append('password', formData.password.trim());
        } else {
          fd.append('password', 'password123');
        }
      }

      // Attached Files & Explicit Removal Handlers ('null' sent in edit mode if removed)
      if (photoFile) {
        fd.append('profile_photo', photoFile);
      } else if (mode === 'edit' && !photoPreview) {
        fd.append('profile_photo', 'null');
      }

      if (aadharFile) {
        fd.append('aadhar_card', aadharFile);
      } else if (mode === 'edit' && !existingAadhar) {
        fd.append('aadhar_card', 'null');
      }

      if (addressProofFile) {
        fd.append('address_proof', addressProofFile);
      } else if (mode === 'edit' && !existingAddressProof) {
        fd.append('address_proof', 'null');
      }

      if (educationCertFile) {
        fd.append('education_certificate', educationCertFile);
      } else if (mode === 'edit' && !existingEducationCert) {
        fd.append('education_certificate', 'null');
      }

      if (agreementFile) {
        fd.append('agreement_file', agreementFile);
      } else if (mode === 'edit' && !existingAgreementFile) {
        fd.append('agreement_file', 'null');
      }

      if (signatureFile) {
        fd.append('signature', signatureFile);
      } else if (mode === 'edit' && !existingSignature) {
        fd.append('signature', 'null');
      }

      if (mode === 'create') {
        await residentService.createResident(fd);
        resetAllFields();
        router.push('/residents');
      } else if (residentId) {
        await residentService.updateResident(residentId, fd);
        resetAllFields();
        router.push('/residents');
      }
    } catch (err: unknown) {
      console.error('Failed to save resident:', err);
      const message =
        err instanceof Error
          ? err.message
          : (err as { message?: string })?.message || 'Failed to save resident details';
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 max-w-[1600px] w-full mx-auto space-y-6 bg-[#F7F7F5]">
      {/* Professional Brand Loader Overlay when submitting */}
      {submitting && (
        <BrandLoader
          overlay
          message={mode === 'edit' ? 'Updating resident profile...' : 'Saving new resident...'}
        />
      )}

      {/* Top Header matching Figma screenshot */}
      <PageHeader
        title={mode === 'edit' ? 'Edit Resident Profile' : 'Create New Resident'}
        subtitle={mode === 'edit' ? 'Update resident information and room allocation.' : 'Create a new resident.'}
        backHref="/residents"
        onBackClick={() => {
          if (mode === 'create') {
            resetAllFields();
          }
        }}
        backTitle="Go back"
      />

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-500 hover:text-red-700 font-bold"
          >
            &times;
          </button>
        </div>
      )}

      {/* Stepper Navigation matching project design system */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-2 shadow-2xs">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {STEPS.map((step, idx) => {
            const isActive = activeStep === idx;
            const isCompleted = isStepComplete(idx);
            const hasError = hasStepError(idx);

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveStep(idx)}
                className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all cursor-pointer relative ${
                  isActive
                    ? 'bg-[#EBF7F2] text-[#175C46] ring-1 ring-[#175C46]/30 shadow-2xs'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                    isActive
                      ? 'bg-[#175C46] text-white shadow-xs'
                      : isCompleted
                      ? 'bg-emerald-100 text-[#175C46]'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {isCompleted ? (
                    <svg className="w-4 h-4 text-[#175C46]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    idx + 1
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-semibold truncate leading-tight">
                    {step.title}
                  </p>
                  <p
                    className={`text-[11px] truncate mt-0.5 ${
                      isActive ? 'text-[#175C46]/80 font-medium' : 'text-gray-400 font-normal'
                    }`}
                  >
                    {step.subtitle}
                  </p>
                </div>
                {hasError && (
                  <span
                    className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0 absolute top-2 right-2 ring-2 ring-white"
                    title="Missing or invalid fields in this step"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Form Card Container */}
      <form onSubmit={handleSubmit} noValidate autoComplete="off" className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 shadow-xs space-y-6">
          {/* STEP 1: Personal & Profile Info */}
          <div className={activeStep === 0 ? 'block space-y-6' : 'hidden'}>
            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
                Personal Information & Room Allocation
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Enter resident personal details, assign PG branch, and choose a room.
              </p>
            </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Fields Column (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Resident name */}
              <div>
                <label className="text-xs sm:text-sm font-semibold text-gray-700 block mb-1.5">
                  Resident name <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  className={getInputClass('name')}
                />
                {renderFieldError('name')}
              </div>

              {/* Dependent Dropdown Row 1: Branch & Building */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Branch Dropdown */}
                <Dropdown
                  label="Branch"
                  required
                  name="branch_id"
                  value={formData.branch_id}
                  onChange={handleBranchChange}
                  error={errors.branch_id}
                  placeholder="Select branch"
                  rightBadge={
                    loadingBranches ? (
                      <span className="text-[10px] text-gray-400">Loading...</span>
                    ) : undefined
                  }
                  options={[
                    ...(formData.branch_id && !branches.some((b) => String(b.id) === String(formData.branch_id))
                      ? [{
                          label: searchParams?.get('branch_name') || initialData?.room_info?.branch_name || (initialData as FormInitialDataSource)?.branch_name || `Branch ${formData.branch_id}`,
                          value: formData.branch_id,
                        }]
                      : []),
                    ...branches.map((b) => ({
                      label: b.name,
                      value: b.id,
                    })),
                  ]}
                />

                {/* Building Dropdown (dependent on branch) */}
                <Dropdown
                  label="Building"
                  required
                  name="building_id"
                  value={formData.building_id}
                  onChange={handleBuildingChange}
                  disabled={!formData.branch_id}
                  error={errors.building_id}
                  placeholder={
                    !formData.branch_id
                      ? 'Select branch first'
                      : loadingBuildings && buildings.length === 0
                        ? 'Loading buildings...'
                        : 'Select building'
                  }
                  rightBadge={
                    loadingBuildings ? (
                      <span className="text-[10px] text-gray-400">Loading...</span>
                    ) : undefined
                  }
                  options={[
                    ...(formData.building_id && !buildings.some((b) => String(b.id) === String(formData.building_id))
                      ? [{
                          label: searchParams?.get('building_name') || initialData?.room_info?.building_name || (initialData as FormInitialDataSource)?.building_name || `Building ${formData.building_id}`,
                          value: formData.building_id,
                        }]
                      : []),
                    ...buildings.map((b) => ({
                      label: b.name || b.building_name || `Building ${b.id}`,
                      value: b.id,
                    })),
                  ]}
                />
              </div>

              {/* Dependent Dropdown Row 2: Floor & Room */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Floor Dropdown (dependent on building) */}
                <Dropdown
                  label="Floor"
                  required
                  name="floor_id"
                  value={formData.floor_id}
                  onChange={handleFloorChange}
                  disabled={!formData.building_id}
                  error={errors.floor_id}
                  placeholder={
                    !formData.building_id
                      ? 'Select building first'
                      : loadingFloors && floors.length === 0
                        ? 'Loading floors...'
                        : 'Select floor'
                  }
                  rightBadge={
                    loadingFloors ? (
                      <span className="text-[10px] text-gray-400">Loading...</span>
                    ) : undefined
                  }
                  options={[
                    ...(formData.floor_id && !floors.some((f) => String(f.id) === String(formData.floor_id))
                      ? [{
                          label: searchParams?.get('floor_name') || initialData?.room_info?.floor_name || (initialData as FormInitialDataSource)?.floor_name || `Floor ${formData.floor_id}`,
                          value: formData.floor_id,
                        }]
                      : []),
                    ...floors.map((f) => ({
                      label: f.floor_name || f.name || `Floor ${f.floor_number ?? f.id}`,
                      value: f.id,
                    })),
                  ]}
                />

                {/* Room Dropdown (dependent on floor, building, branch) */}
                <Dropdown
                  label="Resident Room no."
                  required
                  name="room_id"
                  value={formData.room_id}
                  onChange={handleRoomChange}
                  disabled={!formData.floor_id}
                  error={errors.room_id}
                  placeholder={
                    !formData.floor_id
                      ? 'Select floor first'
                      : loadingRooms && rooms.length === 0
                        ? 'Loading rooms...'
                        : 'Select room no.'
                  }
                  rightBadge={
                    loadingRooms ? (
                      <span className="text-[10px] text-gray-400">Loading...</span>
                    ) : undefined
                  }
                  options={[
                    ...(formData.room_id && !rooms.some((r) => String(r.id) === String(formData.room_id))
                      ? [{
                          label: `${formData.room_no || 'Room'} ${formData.room_type ? `(${formData.room_type})` : ''}`.trim(),
                          value: formData.room_id,
                        }]
                      : []),
                    ...rooms.map((r) => ({
                      label: `${r.room_no || r.room_number || r.name} ${r.room_type || r.type ? `(${r.room_type || r.type})` : ''}`,
                      value: r.id,
                    })),
                  ]}
                />
              </div>

              {/* Dependent Dropdown Row 3: Room Type (auto set) & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Room Type Dropdown - Auto populated on room select */}
                <Dropdown
                  label="Resident room type"
                  required
                  name="room_type"
                  value={formData.room_type}
                  onChange={handleChange}
                  error={errors.room_type}
                  placeholder="Select room type"
                  rightBadge={
                    formData.room_type ? (
                      <span className="text-[10px] text-[#175C46] font-medium bg-[#EBF7F2] px-2 py-0.5 rounded-full">
                        Auto-set from room
                      </span>
                    ) : undefined
                  }
                  options={[
                    { label: 'Single', value: 'single' },
                    { label: 'Double', value: 'double' },
                    { label: 'Triple', value: 'triple' },
                    { label: 'Four', value: 'four' },
                  ]}
                />

                {/* Phone */}
                <div>
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 block mb-1.5">
                    Resident phone no. <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="tel"
                    inputMode="tel"
                    name="phone"
                    maxLength={formData.phone.startsWith('+') ? 14 : 13}
                    value={formData.phone}
                    onChange={handleChange}
                    onKeyDown={handlePhoneKeyDown}
                    placeholder="Enter phone no. (10 to 13 digits)"
                    className={getInputClass('phone')}
                  />
                  {renderFieldError('phone')}
                </div>
              </div>
            </div>

            {/* Right Attach Photo Column (5 cols) */}
            <div className="lg:col-span-5">
              <PhotoUpload
                label="Attach Profile photo"
                optional
                previewUrl={photoPreview}
                file={photoFile}
                shape="circle"
                onSelectFile={(file) => {
                  setPhotoFile(file);
                  setPhotoPreview(URL.createObjectURL(file));
                }}
                onRemove={() => {
                  setPhotoFile(null);
                  setPhotoPreview(null);
                }}
                onError={(msg) => {
                  toast.warn(msg);
                }}
              />
            </div>
          </div>

          {/* Row: Date of Birth, Gender & Status all in one row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start pt-1">
            {/* Date of Birth */}
            <div>
              <label className="text-xs sm:text-sm font-semibold text-gray-700 block mb-1.5">
                Date of Birth
              </label>
              <AppDatePicker
                name="date_of_birth"
                value={formData.date_of_birth}
                maxDate={maxDobDate}
                onChange={(val) => {
                  setFormData((prev) => ({ ...prev, date_of_birth: val }));
                  clearError('date_of_birth');
                }}
                placeholder="dd-mm-yyyy"
                hasError={!!errors.date_of_birth}
              />
              {renderFieldError('date_of_birth')}
            </div>

            {/* Gender */}
            <div>
              <label className="text-xs sm:text-sm font-semibold text-gray-700 block mb-2">
                Gender <span className="text-red-500 font-bold">*</span>
              </label>
              <div className="flex items-center gap-5 pt-2">
                {[
                  { label: 'Male', value: 'male' },
                  { label: 'Female', value: 'female' },
                  { label: 'Other', value: 'other' },
                ].map((item) => (
                  <label key={item.value} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 select-none">
                    <input
                      type="radio"
                      name="gender"
                      value={item.value}
                      checked={formData.gender === item.value}
                      onChange={handleChange}
                      className="accent-[#175C46] w-4 h-4 cursor-pointer"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
              {renderFieldError('gender')}
            </div>

            {/* Status */}
            <div>
              <label className="text-xs sm:text-sm font-semibold text-gray-700 block mb-2">
                Status <span className="text-red-500 font-bold">*</span>
              </label>
              <div className="flex items-center gap-5 pt-2">
                {[
                  { label: 'Active', value: 'active' },
                  { label: 'Pending', value: 'pending' },
                  { label: 'Inactive', value: 'inactive' },
                ].map((item) => (
                  <label key={item.value} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 select-none">
                    <input
                      type="radio"
                      name="status"
                      value={item.value}
                      checked={formData.status === item.value}
                      onChange={handleChange}
                      className="accent-[#175C46] w-4 h-4 cursor-pointer"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
              {renderFieldError('status')}
            </div>
          </div>

          {/* Row: Nationality, Marital status, Occupation */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Nationality */}
            <Dropdown
              label="Nationality"
              required
              name="nationality"
              value={formData.nationality}
              onChange={handleChange}
              error={errors.nationality}
              placeholder="Select nationality"
              options={[
                { label: 'Indian', value: 'Indian' },
                { label: 'American', value: 'American' },
                { label: 'British', value: 'British' },
                { label: 'Canadian', value: 'Canadian' },
                { label: 'Australian', value: 'Australian' },
                { label: 'Other', value: 'Other' },
              ]}
            />

            {/* Marital status */}
            <Dropdown
              label="Marital status"
              required
              name="marital_status"
              value={formData.marital_status}
              onChange={handleChange}
              error={errors.marital_status}
              placeholder="Select marital status"
              options={[
                { label: 'Single', value: 'single' },
                { label: 'Married', value: 'married' },
                { label: 'Other', value: 'other' },
              ]}
            />

            {/* Occupation */}
            <div>
              <label className="text-xs sm:text-sm font-semibold text-gray-700 block mb-1.5">
                Occupation <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                type="text"
                name="occupation"
                value={formData.occupation}
                onChange={handleChange}
                placeholder="Enter occupation"
                className={getInputClass('occupation')}
              />
              {renderFieldError('occupation')}
            </div>
          </div>

          {/* Row: Check in date, Check out date, E-mail */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Check in date */}
            <div>
              <label className="text-xs sm:text-sm font-semibold text-gray-700 block mb-1.5">
                Check in date <span className="text-red-500 font-bold">*</span>
              </label>
              <AppDatePicker
                name="check_in_date"
                value={formData.check_in_date}
                onChange={(val) => {
                  setFormData((prev) => {
                    const next = { ...prev, check_in_date: val };
                    if (val && prev.check_out_date) {
                      const inD = parseDateString(val);
                      const outD = parseDateString(prev.check_out_date);
                      if (inD && outD && inD > outD) {
                        next.check_out_date = '';
                      }
                    }
                    return next;
                  });
                  clearError('check_in_date');
                  clearError('check_out_date');
                }}
                maxDate={maxCheckinDate}
                placeholder="dd-mm-yyyy"
                hasError={!!errors.check_in_date}
              />
              {renderFieldError('check_in_date')}
            </div>

            {/* Check out date */}
            <div>
              <label className="text-xs sm:text-sm font-semibold text-gray-700 block mb-1.5">
                Check out date
              </label>
              <AppDatePicker
                name="check_out_date"
                value={formData.check_out_date}
                onChange={(val) => {
                  setFormData((prev) => {
                    const next = { ...prev, check_out_date: val };
                    if (val && prev.check_in_date) {
                      const inDate = parseDateString(prev.check_in_date);
                      const outDate = parseDateString(val);
                      if (inDate && outDate && inDate > outDate) {
                        next.check_in_date = '';
                      }
                    }
                    return next;
                  });
                  clearError('check_out_date');
                  clearError('check_in_date');
                  if (val && formData.check_in_date) {
                    const inDate = parseDateString(formData.check_in_date);
                    const outDate = parseDateString(val);
                    if (inDate && outDate && outDate < inDate) {
                      setErrors((prevErr) => ({
                        ...prevErr,
                        check_out_date: 'Check out date cannot be before check in date.',
                      }));
                    }
                  }
                }}
                minDate={minCheckoutDate}
                placeholder="dd-mm-yyyy"
                hasError={!!errors.check_out_date}
              />
              {renderFieldError('check_out_date')}
            </div>

            {/* E-mail */}
            <div>
              <label className="text-xs sm:text-sm font-semibold text-gray-700 block mb-1.5">
                E-mail <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email address"
                className={getInputClass('email')}
              />
              {renderFieldError('email')}
            </div>
          </div>
        </div>

      {/* STEP 2: Address & Emergency Contacts */}
      <div className={activeStep === 1 ? 'block space-y-6' : 'hidden'}>
        <div className="border-b border-gray-100 pb-4">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
            Address & Emergency Contacts
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Enter permanent residential address and emergency contact details.
          </p>
        </div>

        {/* Address Details */}
        <div className="space-y-4">
          <div className="pb-1">
            <h3 className="text-sm sm:text-base font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#175C46]" />
              Permanent / Current Address
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs sm:text-sm font-semibold text-gray-700 block mb-1.5">
                Address Line 1
              </label>
              <input
                type="text"
                name="address_line_1"
                value={formData.address_line_1}
                onChange={handleChange}
                placeholder="Enter street address / society"
                className={getInputClass('address_line_1')}
              />
              {renderFieldError('address_line_1')}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="text-xs sm:text-sm font-semibold text-gray-700 block mb-1.5">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Enter city"
                  className={getInputClass('city')}
                />
                {renderFieldError('city')}
              </div>

              <div>
                <label className="text-xs sm:text-sm font-semibold text-gray-700 block mb-1.5">State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="Enter state"
                  className={getInputClass('state')}
                />
                {renderFieldError('state')}
              </div>

              <div>
                <label className="text-xs sm:text-sm font-semibold text-gray-700 block mb-1.5">Pincode</label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  placeholder="Enter 6-digit pincode"
                  className={getInputClass('pincode')}
                />
                {renderFieldError('pincode')}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Emergency Contact Details */}
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <div className="pb-1">
            <h3 className="text-sm sm:text-base font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#175C46]" />
              Emergency Contact
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="text-xs sm:text-sm font-semibold text-gray-700 block mb-1.5">Contact Name</label>
              <input
                type="text"
                name="emergency_contact_name"
                value={formData.emergency_contact_name}
                onChange={handleChange}
                placeholder="Enter emergency contact name"
                className={getInputClass('emergency_contact_name')}
              />
              {renderFieldError('emergency_contact_name')}
            </div>

            <div>
              <label className="text-xs sm:text-sm font-semibold text-gray-700 block mb-1.5">Relationship</label>
              <input
                type="text"
                name="emergency_contact_relationship"
                value={formData.emergency_contact_relationship}
                onChange={handleChange}
                placeholder="Enter relationship (e.g. Parent, Guardian)"
                className={getInputClass('emergency_contact_relationship')}
              />
              {renderFieldError('emergency_contact_relationship')}
            </div>

            <div>
              <label className="text-xs sm:text-sm font-semibold text-gray-700 block mb-1.5">Emergency Phone</label>
              <input
                type="tel"
                inputMode="tel"
                name="emergency_contact_phone"
                maxLength={formData.emergency_contact_phone.startsWith('+') ? 14 : 13}
                value={formData.emergency_contact_phone}
                onChange={handleChange}
                onKeyDown={handlePhoneKeyDown}
                placeholder="Enter emergency phone (10 to 13 digits)"
                className={getInputClass('emergency_contact_phone')}
              />
              {renderFieldError('emergency_contact_phone')}
            </div>
          </div>
        </div>
      </div>

      {/* STEP 3: Room Stay & Financials */}
      <div className={activeStep === 2 ? 'block space-y-6' : 'hidden'}>
        <div className="border-b border-gray-100 pb-4">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
            Stay Duration & Financial Agreement
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Confirm bed assignment, monthly rental fee, and refundable deposit terms.
          </p>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="text-xs sm:text-sm font-semibold text-gray-700 block mb-1.5">
                Bed Number <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                type="text"
                name="bed_number"
                value={formData.bed_number}
                onChange={handleChange}
                placeholder="Enter bed number (e.g. Bed-1)"
                className={getInputClass('bed_number')}
              />
              {renderFieldError('bed_number')}
            </div>

            <div>
              <label className="text-xs sm:text-sm font-semibold text-gray-700 block mb-1.5">
                Monthly Rent (₹) <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                type="number"
                name="monthly_rent"
                min="0"
                value={formData.monthly_rent}
                onChange={handleChange}
                placeholder="Enter monthly rent"
                className={getInputClass('monthly_rent')}
              />
              {renderFieldError('monthly_rent')}
            </div>

            <div>
              <label className="text-xs sm:text-sm font-semibold text-gray-700 block mb-1.5">Security Deposit (₹)</label>
              <input
                type="number"
                name="security_deposit"
                value={formData.security_deposit}
                onChange={handleChange}
                placeholder="Enter security deposit"
                className={getInputClass('security_deposit')}
              />
              {renderFieldError('security_deposit')}
            </div>
          </div>

          {/* Stay & Financial Summary Preview Card */}
          <div className="p-4 sm:p-5 rounded-xl bg-[#F7F7F5] border border-gray-200/80 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Assigned Room & Bed</span>
              <p className="text-xs sm:text-sm font-semibold text-gray-900 mt-0.5">
                {formData.room_no ? `${formData.room_no} (${formData.room_type || 'Room'})` : 'No room selected'} &bull; {formData.bed_number || 'Bed pending'}
              </p>
            </div>
            <div>
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Monthly Rental</span>
              <p className="text-xs sm:text-sm font-bold text-[#175C46] mt-0.5">
                {formData.monthly_rent ? `₹ ${Number(formData.monthly_rent).toLocaleString('en-IN')}` : '₹ 0'}
              </p>
            </div>
            <div>
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Security Deposit</span>
              <p className="text-xs sm:text-sm font-bold text-gray-900 mt-0.5">
                {formData.security_deposit ? `₹ ${Number(formData.security_deposit).toLocaleString('en-IN')}` : '₹ 0'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* STEP 4: Documents & Signature Uploads */}
      <div className={activeStep === 3 ? 'block space-y-6' : 'hidden'}>
        <div className="border-b border-gray-100 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
              Resident Documents & Digital Signature
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Upload resident identification proof, tenant agreement, and signature files.
            </p>
          </div>
          <span className="text-xs text-gray-400">PDF, JPG, PNG &bull; Max 5MB</span>
        </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {/* 1. Aadhaar Card */}
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/40 hover:bg-white hover:border-[#175C46] transition-all space-y-3">
              <input
                ref={aadharInputRef}
                type="file"
                accept=".pdf,image/png,image/jpeg,image/jpg"
                onChange={(e) => e.target.files && setAadharFile(e.target.files[0])}
                className="hidden"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900">Aadhaar Card</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600">PDF / IMG</span>
              </div>

              {aadharFile ? (
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-2">
                  <span className="text-xs text-emerald-800 font-medium truncate">{aadharFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setAadharFile(null)}
                    className="text-emerald-700 hover:text-emerald-900 text-sm font-bold"
                  >
                    &times;
                  </button>
                </div>
              ) : existingAadhar ? (
                <div className="p-2.5 rounded-lg bg-white border border-gray-200 flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-600 truncate">{existingAadhar}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] text-emerald-600 font-semibold">Uploaded</span>
                    <button
                      type="button"
                      onClick={() => setExistingAadhar(null)}
                      title="Remove document"
                      className="text-gray-400 hover:text-rose-600 text-sm font-bold ml-1 cursor-pointer"
                    >
                      &times;
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400">No file uploaded</p>
              )}

              <button
                type="button"
                onClick={() => aadharInputRef.current?.click()}
                className="w-full py-2 px-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <svg className="w-3.5 h-3.5 text-gray-500 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span>{aadharFile || existingAadhar ? 'Replace File' : 'Upload File'}</span>
              </button>
            </div>

            {/* 2. Address Proof */}
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/40 hover:bg-white hover:border-[#175C46] transition-all space-y-3">
              <input
                ref={addressProofInputRef}
                type="file"
                accept=".pdf,image/png,image/jpeg,image/jpg"
                onChange={(e) => e.target.files && setAddressProofFile(e.target.files[0])}
                className="hidden"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900">Address Proof</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600">PDF / IMG</span>
              </div>

              {addressProofFile ? (
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-2">
                  <span className="text-xs text-emerald-800 font-medium truncate">{addressProofFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setAddressProofFile(null)}
                    className="text-emerald-700 hover:text-emerald-900 text-sm font-bold"
                  >
                    &times;
                  </button>
                </div>
              ) : existingAddressProof ? (
                <div className="p-2.5 rounded-lg bg-white border border-gray-200 flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-600 truncate">{existingAddressProof}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] text-emerald-600 font-semibold">Uploaded</span>
                    <button
                      type="button"
                      onClick={() => setExistingAddressProof(null)}
                      title="Remove document"
                      className="text-gray-400 hover:text-rose-600 text-sm font-bold ml-1 cursor-pointer"
                    >
                      &times;
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400">No file uploaded</p>
              )}

              <button
                type="button"
                onClick={() => addressProofInputRef.current?.click()}
                className="w-full py-2 px-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <svg className="w-3.5 h-3.5 text-gray-500 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span>{addressProofFile || existingAddressProof ? 'Replace File' : 'Upload File'}</span>
              </button>
            </div>

            {/* 3. Education Certificate */}
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/40 hover:bg-white hover:border-[#175C46] transition-all space-y-3">
              <input
                ref={educationCertInputRef}
                type="file"
                accept=".pdf,image/png,image/jpeg,image/jpg"
                onChange={(e) => e.target.files && setEducationCertFile(e.target.files[0])}
                className="hidden"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900">Education Certificate</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600">PDF / IMG</span>
              </div>

              {educationCertFile ? (
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-2">
                  <span className="text-xs text-emerald-800 font-medium truncate">{educationCertFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setEducationCertFile(null)}
                    className="text-emerald-700 hover:text-emerald-900 text-sm font-bold"
                  >
                    &times;
                  </button>
                </div>
              ) : existingEducationCert ? (
                <div className="p-2.5 rounded-lg bg-white border border-gray-200 flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-600 truncate">{existingEducationCert}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] text-emerald-600 font-semibold">Uploaded</span>
                    <button
                      type="button"
                      onClick={() => setExistingEducationCert(null)}
                      title="Remove document"
                      className="text-gray-400 hover:text-rose-600 text-sm font-bold ml-1 cursor-pointer"
                    >
                      &times;
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400">No file uploaded</p>
              )}

              <button
                type="button"
                onClick={() => educationCertInputRef.current?.click()}
                className="w-full py-2 px-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <svg className="w-3.5 h-3.5 text-gray-500 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span>{educationCertFile || existingEducationCert ? 'Replace File' : 'Upload File'}</span>
              </button>
            </div>

            {/* 4. Agreement File (Optional) */}
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/40 hover:bg-white hover:border-[#175C46] transition-all space-y-3">
              <input
                ref={agreementFileInputRef}
                type="file"
                accept=".pdf,image/png,image/jpeg,image/jpg"
                onChange={(e) => e.target.files && setAgreementFile(e.target.files[0])}
                className="hidden"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900">Agreement File</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600">PDF / IMG</span>
              </div>

              {agreementFile ? (
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-2">
                  <span className="text-xs text-emerald-800 font-medium truncate">{agreementFile.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAgreementFile(null);
                      if (agreementFileInputRef.current) agreementFileInputRef.current.value = '';
                    }}
                    className="text-emerald-700 hover:text-emerald-900 text-sm font-bold"
                  >
                    &times;
                  </button>
                </div>
              ) : existingAgreementFile ? (
                <div className="p-2.5 rounded-lg bg-white border border-gray-200 flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-600 truncate">{existingAgreementFile}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] text-emerald-600 font-semibold">Uploaded</span>
                    <button
                      type="button"
                      onClick={() => setExistingAgreementFile(null)}
                      title="Remove document"
                      className="text-gray-400 hover:text-rose-600 text-sm font-bold ml-1 cursor-pointer"
                    >
                      &times;
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400">No file uploaded</p>
              )}

              <button
                type="button"
                onClick={() => agreementFileInputRef.current?.click()}
                className="w-full py-2 px-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <svg className="w-3.5 h-3.5 text-gray-500 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span>{agreementFile || existingAgreementFile ? 'Replace File' : 'Upload File'}</span>
              </button>
            </div>

            {/* 5. Resident Signature */}
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/40 hover:bg-white hover:border-[#175C46] transition-all space-y-3">
              <input
                ref={signatureInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={(e) => e.target.files && setSignatureFile(e.target.files[0])}
                className="hidden"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900">Resident Signature</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600">PNG / JPG</span>
              </div>

              {signatureFile ? (
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-2">
                  <span className="text-xs text-emerald-800 font-medium truncate">{signatureFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setSignatureFile(null)}
                    className="text-emerald-700 hover:text-emerald-900 text-sm font-bold"
                  >
                    &times;
                  </button>
                </div>
              ) : existingSignature ? (
                <div className="p-2.5 rounded-lg bg-white border border-gray-200 flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-600 truncate">{existingSignature}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] text-emerald-600 font-semibold">Uploaded</span>
                    <button
                      type="button"
                      onClick={() => setExistingSignature(null)}
                      title="Remove signature"
                      className="text-gray-400 hover:text-rose-600 text-sm font-bold ml-1 cursor-pointer"
                    >
                      &times;
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400">No signature uploaded</p>
              )}

              <button
                type="button"
                onClick={() => signatureInputRef.current?.click()}
                className="w-full py-2 px-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <svg className="w-3.5 h-3.5 text-gray-500 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <span>{signatureFile || existingSignature ? 'Replace Signature' : 'Upload Signature'}</span>
              </button>
            </div>
          </div>
        </div>

      {/* Action Footer Navigation Bar - Responsive */}
      <div className="pt-6 border-t border-gray-100">
        {/* Mobile View (< sm) */}
        <div className="flex flex-col gap-2.5 sm:hidden">
          {/* Primary Action Button (Continue or Final Submit) */}
          {activeStep < 3 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="w-full h-11 rounded-xl bg-[#175C46] hover:bg-[#124B38] text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-[0.99]"
            >
              <span>Continue</span>
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-11 rounded-xl bg-[#175C46] hover:bg-[#124B38] text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap active:scale-[0.99]"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span>{mode === 'edit' ? 'Save Changes' : 'Create Resident'}</span>
            </button>
          )}

          {/* Secondary Actions Row (Back and/or Save Resident) */}
          {(activeStep > 0 || activeStep < 3) && (
            <div className={`grid ${activeStep > 0 && activeStep < 3 ? 'grid-cols-2' : 'grid-cols-1'} gap-2.5 w-full`}>
              {activeStep > 0 && (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="w-full h-10 px-3 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs whitespace-nowrap active:scale-[0.99]"
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Back</span>
                </button>
              )}

              {activeStep < 3 && (
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 shadow-2xs whitespace-nowrap flex items-center justify-center active:scale-[0.99]"
                >
                  {mode === 'edit' ? 'Save Changes' : 'Save Resident'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Desktop View (>= sm) */}
        <div className="hidden sm:flex items-center justify-between gap-3">
          <div>
            {activeStep > 0 && (
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-5 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs whitespace-nowrap"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {activeStep < 3 && (
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 shadow-2xs whitespace-nowrap"
              >
                {mode === 'edit' ? 'Save Changes' : 'Save Resident'}
              </button>
            )}

            {activeStep < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-6 py-2.5 rounded-xl bg-[#175C46] hover:bg-[#124B38] text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <span>Continue</span>
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-2.5 rounded-xl bg-[#175C46] hover:bg-[#124B38] text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>{mode === 'edit' ? 'Save Changes' : 'Create Resident'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  </form>
    </main>
  );
};
