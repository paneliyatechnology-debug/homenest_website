'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import { AppDatePicker } from '@/components/ui/app-date-picker';
import { residentService } from '@/services/resident.service';
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
interface ResidentFormProps {
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

/**
 * Normalizes backend date strings (DD-MM-YYYY, YYYY-MM-DD, or ISO strings)
 * into standard YYYY-MM-DD format for internal form storage and date pickers.
 */
function toInputDate(val?: string | null): string {
  if (!val) return '';
  const cleanVal = val.split(' ')[0];
  const parts = cleanVal.split('-');
  if (parts.length === 3 && parts[0].length === 2 && parts[2].length === 4) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return cleanVal;
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
      gender: 'male',
      status: 'active',
      date_of_birth: '',
      nationality: 'Indian',
      marital_status: 'single',
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
      pg_id: '1',
      subscription_plan_id: '1',
    };
  }

  return {
    name: initialData.name || initialData.personal_info?.name || '',
    email: initialData.email || initialData.contact_info?.email || '',
    phone: initialData.phone || initialData.contact_info?.phone || '',
    gender: (initialData.gender || initialData.personal_info?.gender || 'male').toLowerCase(),
    status: (initialData.status || initialData.room_info?.current_status || 'active').toLowerCase(),
    date_of_birth: toInputDate(initialData.personal_info?.date_of_birth),
    nationality: initialData.personal_info?.nationality || 'Indian',
    marital_status: (initialData.personal_info?.marital_status || 'single').toLowerCase(),
    occupation: initialData.personal_info?.occupation || '',
    branch_id: initialData.room_info?.branch_id || '1',
    building_id: initialData.room_info?.building_id || '1',
    floor_id: initialData.room_info?.floor_id || '2',
    room_id: initialData.room_info?.room_id || '1',
    room_no: initialData.room_info?.room_no || 'A-201',
    room_type: (initialData.room_info?.room_type || 'single').toLowerCase(),
    bed_number: initialData.room_info?.bed_number || 'Bed-1',
    monthly_rent: String(initialData.room_info?.monthly_rent ?? 9000),
    security_deposit: String(initialData.room_info?.security_deposit ?? 9000),
    maintenance_amount: '1000',
    check_in_date: toInputDate(initialData.room_info?.check_in_date),
    check_out_date: toInputDate(initialData.room_info?.check_out_date),
    address_line_1:
      initialData.contact_info?.address_line_1 ||
      initialData.contact_info?.address ||
      '',
    city: initialData.contact_info?.city || '',
    state: initialData.contact_info?.state || '',
    pincode: initialData.contact_info?.pincode || '',
    emergency_contact_name: initialData.contact_info?.emergency_contact_name || '',
    emergency_contact_relationship: initialData.contact_info?.emergency_contact_relationship || '',
    emergency_contact_phone: initialData.contact_info?.emergency_contact_phone || '',
    password: '',
    pg_id: initialData.room_info?.pg_id || '1',
    subscription_plan_id: '1',
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
  const toastRef = useRef<Toast>(null);

  // File input refs
  const profilePhotoInputRef = useRef<HTMLInputElement>(null);
  const aadharInputRef = useRef<HTMLInputElement>(null);
  const addressProofInputRef = useRef<HTMLInputElement>(null);
  const educationCertInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<FormState>(() => buildInitialFormData(initialData));

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
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(initialData?.profile_photo_url || null);
  const [isPhotoDragging, setIsPhotoDragging] = useState(false);

  const [aadharFile, setAadharFile] = useState<File | null>(null);
  const [addressProofFile, setAddressProofFile] = useState<File | null>(null);
  const [educationCertFile, setEducationCertFile] = useState<File | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [existingAadhar, setExistingAadhar] = useState<string | null>(initialData?.documents?.aadhar_card || null);
  const [existingAddressProof, setExistingAddressProof] = useState<string | null>(initialData?.documents?.address_proof || null);
  const [existingEducationCert, setExistingEducationCert] = useState<string | null>(initialData?.documents?.education_certificate || null);
  const [existingSignature, setExistingSignature] = useState<string | null>(initialData?.documents?.signature || null);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearError = (field: string) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  };

  const getInputClass = (fieldName: string, extraClasses = '') =>
    `w-full h-11 px-4 py-2.5 bg-white border ${
      errors[fieldName]
        ? 'border-red-500 focus:ring-1 focus:ring-red-500 focus:border-red-500 text-red-900 placeholder-red-300'
        : 'border-gray-200 focus:ring-1 focus:ring-[#175C46] focus:border-[#175C46] text-gray-900 placeholder-gray-400'
    } rounded-xl text-sm focus:outline-none transition-all ${extraClasses}`;

  const getSelectClass = (fieldName: string, extraClasses = '') =>
    `w-full h-11 appearance-none px-4 py-2.5 bg-white border ${
      errors[fieldName]
        ? 'border-red-500 focus:ring-1 focus:ring-red-500 focus:border-red-500 text-red-900'
        : 'border-gray-200 focus:ring-1 focus:ring-[#175C46] focus:border-[#175C46] text-gray-900'
    } rounded-xl text-sm focus:outline-none transition-all pr-10 cursor-pointer disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed ${extraClasses}`;

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
    residentService
      .getBranches({ limit: 50 })
      .then((res) => {
        if (isMounted) {
          setBranches(res.data);
          setLoadingBranches(false);
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
    if (!formData.branch_id) return;

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
    if (!formData.building_id) return;

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
    if (!formData.branch_id || !formData.building_id || !formData.floor_id) return;

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
        }
      })
      .catch(() => {
        if (isMounted) setLoadingRooms(false);
      });

    return () => {
      isMounted = false;
    };
  }, [formData.branch_id, formData.building_id, formData.floor_id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    clearError(name);
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
    setErrors({});
    setFormData({
      name: '',
      email: '',
      phone: '',
      gender: 'male',
      status: 'active',
      date_of_birth: '',
      nationality: 'Indian',
      marital_status: 'single',
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
      pg_id: '1',
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
    setSignatureFile(null);

    // Reset file input DOM values
    if (profilePhotoInputRef.current) profilePhotoInputRef.current.value = '';
    if (aadharInputRef.current) aadharInputRef.current.value = '';
    if (addressProofInputRef.current) addressProofInputRef.current.value = '';
    if (educationCertInputRef.current) educationCertInputRef.current.value = '';
    if (signatureInputRef.current) signatureInputRef.current.value = '';
  };

  // Clean all fields when navigating away or unmounting in create mode
  useEffect(() => {
    return () => {
      if (mode === 'create') {
        resetAllFields();
      }
    };
  }, [mode]);

  const handlePhotoSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toastRef.current?.show({
        severity: 'warn',
        summary: 'Invalid File',
        detail: 'Please upload an image file (JPG, PNG).',
        life: 3000,
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toastRef.current?.show({
        severity: 'warn',
        summary: 'File Too Large',
        detail: 'Profile photo must be less than 5MB.',
        life: 3000,
      });
      return;
    }
    setPhotoFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPhotoPreview(objectUrl);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handlePhotoSelect(e.target.files[0]);
    }
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
    } else {
      const cleanPhone = formData.phone.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        newErrors.phone = 'Please enter a valid 10-digit phone number.';
      }
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

    // 13. Check In Date
    if (!formData.check_in_date.trim()) {
      newErrors.check_in_date = 'Check in date is required.';
    }

    // 14. Email
    if (!formData.email.trim()) {
      newErrors.email = 'E-mail is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    // Address pincode check (if provided)
    if (formData.pincode && formData.pincode.trim()) {
      const cleanPin = formData.pincode.replace(/\D/g, '');
      if (cleanPin.length < 4) {
        newErrors.pincode = 'Please enter a valid pincode.';
      }
    }

    // Emergency phone check (if provided)
    if (formData.emergency_contact_phone && formData.emergency_contact_phone.trim()) {
      const cleanEmPhone = formData.emergency_contact_phone.replace(/\D/g, '');
      if (cleanEmPhone.length < 10) {
        newErrors.emergency_contact_phone = 'Please enter a valid 10-digit phone number.';
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstField = Object.keys(newErrors)[0];
      const targetElement = document.querySelector(`[name="${firstField}"]`);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validateForm()) {
      toastRef.current?.show({
        severity: 'warn',
        summary: 'Required Fields Missing',
        detail: 'Please fill in all required fields marked in red.',
        life: 4000,
      });
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
      if (formData.date_of_birth) {
        fd.append('date_of_birth', formData.date_of_birth);
      }
      fd.append('nationality', formData.nationality);
      fd.append('marital_status', formData.marital_status);
      fd.append('occupation', formData.occupation.trim());

      // Room & Hierarchy Allocation
      if (formData.branch_id) fd.append('branch_id', String(formData.branch_id));
      if (formData.building_id) fd.append('building_id', String(formData.building_id));
      if (formData.floor_id) fd.append('floor_id', String(formData.floor_id));
      if (formData.room_id) fd.append('room_id', String(formData.room_id));
      if (formData.room_no) fd.append('room_no', formData.room_no);
      if (formData.room_type) fd.append('room_type', formData.room_type);
      fd.append('bed_number', formData.bed_number || 'Bed-1');
      fd.append('monthly_rent', String(formData.monthly_rent || 9000));
      fd.append('security_deposit', String(formData.security_deposit || 9000));

      // Address Fields
      if (formData.address_line_1) {
        fd.append('address_line_1', formData.address_line_1.trim());
      }
      if (formData.city) {
        fd.append('city', formData.city.trim());
      }
      if (formData.state) {
        fd.append('state', formData.state.trim());
      }
      if (formData.pincode) {
        fd.append('pincode', formData.pincode.trim());
      }

      // Emergency Contact Fields
      if (formData.emergency_contact_name) {
        fd.append('emergency_contact_name', formData.emergency_contact_name.trim());
      }
      if (formData.emergency_contact_relationship) {
        fd.append('emergency_contact_relationship', formData.emergency_contact_relationship.trim());
      }
      if (formData.emergency_contact_phone) {
        fd.append('emergency_contact_phone', formData.emergency_contact_phone.trim());
      }

      // Create-mode specifics
      if (mode === 'create') {
        fd.append('role', 'resident');
        if (formData.check_in_date) {
          fd.append('check_in_date', formData.check_in_date);
        }
        fd.append('pg_id', String(formData.pg_id || 1));
        fd.append('maintenance_amount', String(formData.maintenance_amount || 1000));
        fd.append('address', formData.address_line_1 || '');
        fd.append('check_out_date', formData.check_out_date || '');
        fd.append('subscription_plan_id', String(formData.subscription_plan_id || 1));
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

      if (signatureFile) {
        fd.append('signature', signatureFile);
      } else if (mode === 'edit' && !existingSignature) {
        fd.append('signature', 'null');
      }

      if (mode === 'create') {
        await residentService.createResident(fd);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(
            'homenest_flash_toast',
            JSON.stringify({
              severity: 'success',
              summary: 'Resident Created',
              detail: 'New resident profile was created successfully.',
            })
          );
        }
        router.push('/dashboard/residents?toast=created');
        resetAllFields();
      } else if (residentId) {
        await residentService.updateResident(residentId, fd);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(
            'homenest_flash_toast',
            JSON.stringify({
              severity: 'success',
              summary: 'Resident Updated',
              detail: 'Resident profile was updated successfully.',
            })
          );
        }
        router.push('/dashboard/residents?toast=updated');
        resetAllFields();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save resident details.';
      setErrorMessage(msg);
      toastRef.current?.show({
        severity: 'error',
        summary: 'Error Saving Resident',
        detail: msg,
        life: 4000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 max-w-[1600px] w-full mx-auto space-y-6 bg-[#F7F7F5]">
      <Toast ref={toastRef} position="top-right" />

      {/* Top Header matching Figma screenshot */}
      <div className="flex items-start gap-3.5">
        <Link
          href={mode === 'edit' && residentId ? `/dashboard/residents/${residentId}` : '/dashboard/residents'}
          onClick={() => {
            if (mode === 'create') {
              resetAllFields();
            }
          }}
          className="text-gray-900 hover:text-gray-600 transition-colors inline-flex items-center justify-center shrink-0 mt-0.5 sm:mt-1 cursor-pointer"
          title="Go back"
        >
          <svg className="w-6 h-6 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2.25">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            {mode === 'edit' ? 'Edit Resident Profile' : 'Create New Resident'}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-normal mt-0.5">
            {mode === 'edit' ? 'Update resident information and room allocation.' : 'Create a new resident.'}
          </p>
        </div>
      </div>

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

      {/* Form Card Container matching Figma layout */}
      <form onSubmit={handleSubmit} noValidate autoComplete="off" className="space-y-8">
        {/* Section 1: Personal & Profile Info */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Fields Column (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Resident name */}
              <div>
                <label className="text-xs sm:text-sm font-semibold text-gray-700 block mb-1.5">
                  Resident name <span className="text-[#175C46] font-bold">*</span>
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
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs sm:text-sm font-semibold text-gray-700 block">
                      Branch <span className="text-[#175C46] font-bold">*</span>
                    </label>
                    {loadingBranches && (
                      <span className="text-[10px] text-gray-400">Loading...</span>
                    )}
                  </div>
                  <div className="relative">
                    <select
                      name="branch_id"
                      value={formData.branch_id}
                      onChange={handleBranchChange}
                      className={getSelectClass('branch_id')}
                    >
                      <option value="" disabled>Select branch</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                    <svg className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  {renderFieldError('branch_id')}
                </div>

                {/* Building Dropdown (dependent on branch) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs sm:text-sm font-semibold text-gray-700 block">
                      Building <span className="text-[#175C46] font-bold">*</span>
                    </label>
                    {loadingBuildings && (
                      <span className="text-[10px] text-gray-400">Loading...</span>
                    )}
                  </div>
                  <div className="relative">
                    <select
                      name="building_id"
                      value={formData.building_id}
                      onChange={handleBuildingChange}
                      disabled={!formData.branch_id || loadingBuildings}
                      className={getSelectClass('building_id')}
                    >
                      <option value="" disabled>
                        {loadingBuildings
                          ? 'Loading buildings...'
                          : !formData.branch_id
                          ? 'Select branch first'
                          : 'Select building'}
                      </option>
                      {buildings.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name || b.building_name}
                        </option>
                      ))}
                    </select>
                    <svg className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  {renderFieldError('building_id')}
                </div>
              </div>

              {/* Dependent Dropdown Row 2: Floor & Room */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Floor Dropdown (dependent on building) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs sm:text-sm font-semibold text-gray-700 block">
                      Floor <span className="text-[#175C46] font-bold">*</span>
                    </label>
                    {loadingFloors && (
                      <span className="text-[10px] text-gray-400">Loading...</span>
                    )}
                  </div>
                  <div className="relative">
                    <select
                      name="floor_id"
                      value={formData.floor_id}
                      onChange={handleFloorChange}
                      disabled={!formData.building_id || loadingFloors}
                      className={getSelectClass('floor_id')}
                    >
                      <option value="" disabled>
                        {loadingFloors
                          ? 'Loading floors...'
                          : !formData.building_id
                          ? 'Select building first'
                          : 'Select floor'}
                      </option>
                      {floors.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.floor_name || f.name || `Floor ${f.floor_number ?? f.id}`}
                        </option>
                      ))}
                    </select>
                    <svg className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  {renderFieldError('floor_id')}
                </div>

                {/* Room Dropdown (dependent on floor, building, branch) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs sm:text-sm font-semibold text-gray-700 block">
                      Resident Room no. <span className="text-[#175C46] font-bold">*</span>
                    </label>
                    {loadingRooms && (
                      <span className="text-[10px] text-gray-400">Loading...</span>
                    )}
                  </div>
                  <div className="relative">
                    <select
                      name="room_id"
                      value={formData.room_id}
                      onChange={handleRoomChange}
                      disabled={!formData.floor_id || loadingRooms}
                      className={getSelectClass('room_id')}
                    >
                      <option value="" disabled>
                        {loadingRooms
                          ? 'Loading rooms...'
                          : !formData.floor_id
                          ? 'Select floor first'
                          : 'Select room no.'}
                      </option>
                      {rooms.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.room_no || r.room_number || r.name} {r.room_type || r.type ? `(${r.room_type || r.type})` : ''}
                        </option>
                      ))}
                    </select>
                    <svg className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  {renderFieldError('room_id')}
                </div>
              </div>

              {/* Dependent Dropdown Row 3: Room Type (auto set) & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Room Type Dropdown - Auto populated on room select */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs sm:text-sm font-semibold text-gray-700 block">
                      Resident room type <span className="text-[#175C46] font-bold">*</span>
                    </label>
                    {formData.room_type && (
                      <span className="text-[10px] text-[#175C46] font-medium bg-[#EBF7F2] px-2 py-0.5 rounded-full">
                        Auto-set from room
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <select
                      name="room_type"
                      value={formData.room_type}
                      onChange={handleChange}
                      className={getSelectClass('room_type')}
                    >
                      <option value="" disabled>Select room type</option>
                      <option value="single">Single</option>
                      <option value="double">Double</option>
                      <option value="triple">Triple</option>
                      <option value="four">Four</option>
                    </select>
                    <svg className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  {renderFieldError('room_type')}
                </div>

                {/* Phone */}
                <div>
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 block mb-1.5">
                    Resident phone no. <span className="text-[#175C46] font-bold">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter 10-digit phone number"
                    className={getInputClass('phone')}
                  />
                  {renderFieldError('phone')}
                </div>
              </div>
            </div>

            {/* Right Attach Photo Column (5 cols) */}
            <div className="lg:col-span-5">
              <label className="text-xs sm:text-sm font-semibold text-gray-700 block mb-1.5">
                Attach Profile photo <span className="text-gray-400 font-normal">(Optional)</span>
              </label>

              <input
                ref={profilePhotoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleFileChange}
                className="hidden"
              />

              {photoPreview ? (
                /* Card state when photo is attached - cleanly styled matching HomeNest UI */
                <div className="h-[260px] border border-gray-200 bg-gradient-to-b from-[#F7FAF8] to-white rounded-2xl p-5 flex flex-col items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.03)] relative">
                  {/* Top Status Tag */}
                  <div className="w-full flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#EBF7F2] text-[#175C46]">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Photo Attached
                    </span>
                    {photoFile && (
                      <span className="text-[11px] text-gray-400 font-medium truncate max-w-[140px] cursor-pointer" title={photoFile.name}>
                        {(photoFile.size / 1024 / 1024).toFixed(1)} MB
                      </span>
                    )}
                  </div>

                  {/* Centered Avatar with hover change effect */}
                  <div
                    onClick={() => profilePhotoInputRef.current?.click()}
                    className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-md ring-2 ring-[#175C46]/20 cursor-pointer group"
                    title="Click to change photo"
                  >
                    <Image
                      src={photoPreview}
                      alt="Profile Preview"
                      width={112}
                      height={112}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[11px] font-medium gap-0.5">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>Change</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2.5 w-full justify-center">
                    <button
                      type="button"
                      onClick={() => profilePhotoInputRef.current?.click()}
                      className="px-3.5 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-all flex items-center gap-1.5 shadow-2xs hover:border-gray-300 cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      <span>Change Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoFile(null);
                        setPhotoPreview(null);
                        if (profilePhotoInputRef.current) profilePhotoInputRef.current.value = '';
                      }}
                      className="px-3.5 py-1.5 rounded-xl border border-red-200 bg-red-50/60 hover:bg-red-100 text-xs font-semibold text-red-600 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Dropzone state when no photo is attached */
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsPhotoDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsPhotoDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsPhotoDragging(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handlePhotoSelect(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => profilePhotoInputRef.current?.click()}
                  className={`h-[260px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-4 cursor-pointer transition-all bg-gray-50/40 text-center relative overflow-hidden group ${
                    isPhotoDragging
                      ? 'border-[#175C46] bg-emerald-50/30'
                      : 'border-gray-200 hover:border-[#175C46] hover:bg-emerald-50/10'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-[#EBF7F2] text-[#175C46] flex items-center justify-center mb-2.5 transition-transform group-hover:scale-110">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-gray-700">Click to upload or drag and drop</p>
                    <p className="text-[11px] text-gray-400 mt-1">JPG, PNG &bull; Max 5MB</p>
                  </div>
                </div>
              )}
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
                Gender <span className="text-[#175C46] font-bold">*</span>
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
                Status <span className="text-[#175C46] font-bold">*</span>
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
            <div>
              <label className="text-xs sm:text-sm font-semibold text-gray-700 block mb-1.5">
                Nationality <span className="text-[#175C46] font-bold">*</span>
              </label>
              <div className="relative">
                <select
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleChange}
                  className={getSelectClass('nationality')}
                >
                  <option value="" disabled>Select nationality</option>
                  <option value="Indian">Indian</option>
                  <option value="American">American</option>
                  <option value="British">British</option>
                  <option value="Canadian">Canadian</option>
                  <option value="Australian">Australian</option>
                  <option value="Other">Other</option>
                </select>
                <svg className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {renderFieldError('nationality')}
            </div>

            {/* Marital status */}
            <div>
              <label className="text-xs sm:text-sm font-semibold text-gray-700 block mb-1.5">
                Marital status <span className="text-[#175C46] font-bold">*</span>
              </label>
              <div className="relative">
                <select
                  name="marital_status"
                  value={formData.marital_status}
                  onChange={handleChange}
                  className={getSelectClass('marital_status')}
                >
                  <option value="" disabled>Select marital status</option>
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="other">Other</option>
                </select>
                <svg className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {renderFieldError('marital_status')}
            </div>

            {/* Occupation */}
            <div>
              <label className="text-xs sm:text-sm font-semibold text-gray-700 block mb-1.5">
                Occupation <span className="text-[#175C46] font-bold">*</span>
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
                Check in date <span className="text-[#175C46] font-bold">*</span>
              </label>
              <AppDatePicker
                name="check_in_date"
                value={formData.check_in_date}
                onChange={(val) => {
                  setFormData((prev) => ({ ...prev, check_in_date: val }));
                  clearError('check_in_date');
                }}
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
                  setFormData((prev) => ({ ...prev, check_out_date: val }));
                  clearError('check_out_date');
                }}
                placeholder="dd-mm-yyyy"
                hasError={!!errors.check_out_date}
              />
              {renderFieldError('check_out_date')}
            </div>

            {/* E-mail */}
            <div>
              <label className="text-xs sm:text-sm font-semibold text-gray-700 block mb-1.5">
                E-mail <span className="text-[#175C46] font-bold">*</span>
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

        {/* Section 2: Contact & Address Details */}
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <div className="pb-1">
            <h3 className="text-sm sm:text-base font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#175C46]" />
              Address Details
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
                name="emergency_contact_phone"
                value={formData.emergency_contact_phone}
                onChange={handleChange}
                placeholder="Enter 10-digit emergency contact phone"
                className={getInputClass('emergency_contact_phone')}
              />
              {renderFieldError('emergency_contact_phone')}
            </div>
          </div>
        </div>

        {/* Section 4: Room Stay & Financials */}
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <div className="pb-1">
            <h3 className="text-sm sm:text-base font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#175C46]" />
              Stay & Financial Details
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="text-xs sm:text-sm font-semibold text-gray-700 block mb-1.5">Bed Number</label>
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
              <label className="text-xs sm:text-sm font-semibold text-gray-700 block mb-1.5">Monthly Rent (₹)</label>
              <input
                type="number"
                name="monthly_rent"
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
        </div>

        {/* Section 5: Documents & Signature Uploads */}
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <div className="pb-1 flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#175C46]" />
              Resident Documents & Signature
            </h3>
            <span className="text-xs text-gray-400">PDF, JPG, PNG &bull; Max 5MB</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <span>{aadharFile || initialData?.documents?.aadhar_card ? 'Replace File' : 'Upload File'}</span>
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
                <span>{addressProofFile || initialData?.documents?.address_proof ? 'Replace File' : 'Upload File'}</span>
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
                <span>{educationCertFile || initialData?.documents?.education_certificate ? 'Replace File' : 'Upload File'}</span>
              </button>
            </div>

            {/* 4. Resident Signature */}
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
                <span>{signatureFile || initialData?.documents?.signature ? 'Replace Signature' : 'Upload Signature'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Primary Save Action Button */}
        <div className="pt-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 px-6 bg-[#175C46] hover:bg-[#124B38] text-white text-base font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <ProgressSpinner style={{ width: '20px', height: '20px' }} strokeWidth="4" />
                <span>{mode === 'edit' ? 'Updating Resident...' : 'Saving Resident...'}</span>
              </>
            ) : (
              <span>{mode === 'edit' ? 'Save Changes' : 'Save'}</span>
            )}
          </button>
        </div>
      </form>
    </main>
  );
};
