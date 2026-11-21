'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { authService } from '@/services/auth.service';
import { User, PGDetails } from '@/types/auth';
import {
  PageHeader,
  TextInput,
  RadioGroup,
  PhotoUpload,
  Dropdown,
  BrandLoader,
} from '@/components/ui';
import { resolveFileUrl } from '@/lib/file-utils';
import { toast } from '@/lib/toast';

export interface ProfileFormData {
  // Owner Personal Details
  name: string;
  email: string;
  phone: string;
  gender: 'male' | 'female' | 'other' | '';
  address: string;
  profilePhotoFile: File | null;
  profilePhotoPreview: string | null;

  // PG Facility Details
  pg_name: string;
  pg_type: 'boys' | 'girls' | 'coed' | 'other' | '';
  pg_phone: string;
  pg_address: string;
  pg_city: string;
  pg_state: string;
  pg_pincode: string;
  total_rooms: string | number;
  total_beds: string | number;
  amenities: string[];
  rules: string;
  status: 'active' | 'inactive' | '';
  logoFile: File | null;
  logoPreview: string | null;

  // Bank & UPI Settlement Details
  pg_upi_id: string;
  pg_bank_name: string;
  pg_account_number: string;
  pg_ifsc_code: string;
  pg_account_holder_name: string;
}

const DEFAULT_PROFILE_FORM_DATA: ProfileFormData = {
  name: '',
  email: '',
  phone: '',
  gender: '',
  address: '',
  profilePhotoFile: null,
  profilePhotoPreview: null,

  pg_name: '',
  pg_type: '',
  pg_phone: '',
  pg_address: '',
  pg_city: '',
  pg_state: '',
  pg_pincode: '',
  total_rooms: '',
  total_beds: '',
  amenities: [],
  rules: '',
  status: '',
  logoFile: null,
  logoPreview: null,

  pg_upi_id: '',
  pg_bank_name: '',
  pg_account_number: '',
  pg_ifsc_code: '',
  pg_account_holder_name: '',
};

const COMMON_AMENITIES = [
  'Wi-Fi',
  'AC',
  'Meals',
  'Laundry',
  'Housekeeping',
  'CCTV',
  'Power Backup',
  'Geyser',
  'Gym',
  'RO Water',
  'Security Guard',
  'Attached Washroom',
  'Refrigerator',
  'TV',
  'Parking',
];

const GENDER_OPTIONS = [
  { label: 'Female', value: 'female' },
  { label: 'Male', value: 'male' },
  { label: 'Other', value: 'other' },
];

const PG_TYPE_OPTIONS = [
  { label: 'Girls PG', value: 'girls' },
  { label: 'Boys PG', value: 'boys' },
  { label: 'Co-Ed / Unisex', value: 'coed' },
  { label: 'Other', value: 'other' },
];

const PG_STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
];

export const ProfileForm: React.FC = () => {
  const [formData, setFormData] = useState<ProfileFormData>(DEFAULT_PROFILE_FORM_DATA);
  const [initialData, setInitialData] = useState<ProfileFormData | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [customAmenity, setCustomAmenity] = useState<string>('');

  // Step-wise wizard navigation state & definitions
  const [activeStep, setActiveStep] = useState<number>(0);

  const STEPS = [
    { id: 'owner', title: 'Owner Information', subtitle: 'Credentials & personal info' },
    { id: 'facility', title: 'PG Facility Details', subtitle: 'Property identity & rules' },
    { id: 'banking', title: 'Bank & Settlement', subtitle: 'Payout accounts & UPI' },
  ];

  const populateFromUser = useCallback((user: User) => {
    setCurrentUser(user);
    const pg = user.pg as PGDetails | undefined;

    // Resolve initial owner profile photo
    const rawPhoto = user.profile_photo_url || user.profile_photo;
    const resolvedPhoto = rawPhoto ? resolveFileUrl(rawPhoto) : null;

    // Resolve initial PG logo
    const rawLogo = pg?.logo_url || pg?.logo;
    const resolvedLogo = rawLogo ? resolveFileUrl(rawLogo) : null;

    // Parse amenities strictly from API (if none from API, keep empty array)
    let initialAmenities: string[] = [];
    const rawAmenities = (pg as unknown as { amenities?: unknown })?.amenities;
    if (Array.isArray(rawAmenities)) {
      initialAmenities = rawAmenities.filter((item): item is string => typeof item === 'string');
    } else if (typeof rawAmenities === 'string' && rawAmenities.trim()) {
      try {
        const parsed = JSON.parse(rawAmenities);
        if (Array.isArray(parsed)) {
          initialAmenities = parsed.filter((item): item is string => typeof item === 'string');
        }
      } catch {
        initialAmenities = rawAmenities
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean);
      }
    }

    const data: ProfileFormData = {
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      gender: user.gender ? (user.gender.toLowerCase() as ProfileFormData['gender']) : '',
      address: user.address || '',
      profilePhotoFile: null,
      profilePhotoPreview: resolvedPhoto,

      pg_name: pg?.name || '',
      pg_type: pg?.type ? (pg.type.toLowerCase() as ProfileFormData['pg_type']) : '',
      pg_phone: pg?.phone || '',
      pg_address: pg?.address || '',
      pg_city: pg?.city || '',
      pg_state: pg?.state || '',
      pg_pincode: pg?.pincode || '',
      total_rooms: pg?.total_rooms !== undefined && pg?.total_rooms !== null ? pg.total_rooms : '',
      total_beds: pg?.total_beds !== undefined && pg?.total_beds !== null ? pg.total_beds : '',
      amenities: initialAmenities,
      rules: pg?.rules || '',
      status: pg?.status ? (pg.status.toLowerCase() as ProfileFormData['status']) : '',
      logoFile: null,
      logoPreview: resolvedLogo,

      pg_upi_id: pg?.pg_upi_id || pg?.bank_details?.pg_upi_id || '',
      pg_bank_name: pg?.pg_bank_name || pg?.bank_details?.pg_bank_name || '',
      pg_account_number: pg?.pg_account_number || pg?.bank_details?.pg_account_number || '',
      pg_ifsc_code: pg?.pg_ifsc_code || pg?.bank_details?.pg_ifsc_code || '',
      pg_account_holder_name:
        pg?.pg_account_holder_name || pg?.bank_details?.pg_account_holder_name || '',
    };

    setFormData(data);
    setInitialData(data);
  }, []);

  // Fetch Current Live User Profile on mount
  useEffect(() => {
    let isMounted = true;
    authService
      .getMe()
      .then((user) => {
        if (!isMounted) return;
        populateFromUser(user);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Failed to fetch user profile:', err);
        if (!isMounted) return;
        const stored = authService.getCurrentUser();
        if (stored) {
          populateFromUser(stored);
        }
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [populateFromUser]);

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

  const handleFieldChange = <K extends keyof ProfileFormData>(
    field: K,
    value: ProfileFormData[K]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field as string]) {
      setErrors((prev) => ({ ...prev, [field as string]: '' }));
    }
  };

  // Toggle Amenity chip
  const toggleAmenity = (amenity: string) => {
    setFormData((prev) => {
      const exists = prev.amenities.includes(amenity);
      const updated = exists
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity];
      return { ...prev, amenities: updated };
    });
  };

  // Add custom amenity
  const handleAddCustomAmenity = () => {
    const trimmed = customAmenity.trim();
    if (!trimmed) return;
    if (!formData.amenities.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        amenities: [...prev.amenities, trimmed],
      }));
    }
    setCustomAmenity('');
  };

  // Reset to initial values
  const handleReset = () => {
    if (initialData) {
      setFormData(initialData);
    }
    setErrors({});
    toast.info('Form has been reset to saved profile data.');
  };

  // Step Validation
  const validateStep = (stepIdx: number): boolean => {
    const newErrors: { [key: string]: string } = { ...errors };
    let hasError = false;

    if (stepIdx === 0) {
      if (!formData.name.trim()) {
        newErrors.name = 'Owner name is required';
        hasError = true;
      }
      if (formData.phone && !/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
        newErrors.phone = 'Please provide a valid 10-digit phone number';
        hasError = true;
      }
    } else if (stepIdx === 1) {
      if (!formData.pg_name.trim()) {
        newErrors.pg_name = 'PG facility name is required';
        hasError = true;
      }
      if (formData.pg_phone && !/^\d{10}$/.test(formData.pg_phone.replace(/\D/g, ''))) {
        newErrors.pg_phone = 'Please provide a valid 10-digit PG phone number';
        hasError = true;
      }
    }

    setErrors(newErrors);

    if (hasError) {
      const stepFields =
        stepIdx === 0
          ? ['name', 'phone']
          : stepIdx === 1
          ? ['pg_name', 'pg_phone']
          : [];
      const firstError = stepFields.find((f) => !!newErrors[f]);
      if (firstError) {
        setTimeout(() => {
          const el = document.querySelector(`[name="${firstError}"]`);
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 50);
      }
      return false;
    }

    return true;
  };

  // Step Completion Indicator
  const isStepComplete = (stepIdx: number): boolean => {
    if (stepIdx === 0) {
      return Boolean(formData.name.trim() && !errors.name && !errors.phone);
    }
    if (stepIdx === 1) {
      return Boolean(formData.pg_name.trim() && !errors.pg_name && !errors.pg_phone);
    }
    if (stepIdx === 2) {
      return Boolean(
        formData.pg_upi_id.trim() ||
        formData.pg_bank_name.trim() ||
        formData.pg_account_number.trim()
      );
    }
    return false;
  };

  // Step Error Indicator
  const hasStepError = (stepIdx: number): boolean => {
    if (stepIdx === 0) return Boolean(errors.name || errors.phone);
    if (stepIdx === 1) return Boolean(errors.pg_name || errors.pg_phone);
    if (stepIdx === 2) return Boolean(errors.pg_upi_id || errors.pg_bank_name || errors.pg_account_number || errors.pg_ifsc_code);
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
        toast.warn('Please fill in all required fields marked in red.');
        return;
      }
      setActiveStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    if (activeStep > 0) {
      setActiveStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleStepClick = (idx: number) => {
    if (idx > activeStep) {
      if (!validateStep(activeStep)) {
        toast.warn('Please resolve required fields before proceeding.');
        return;
      }
    }
    setActiveStep(idx);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Overall Validation
  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Owner name is required';
    }

    if (formData.phone && !/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Please provide a valid 10-digit phone number';
    }

    if (!formData.pg_name.trim()) {
      newErrors.pg_name = 'PG facility name is required';
    }

    if (formData.pg_phone && !/^\d{10}$/.test(formData.pg_phone.replace(/\D/g, ''))) {
      newErrors.pg_phone = 'Please provide a valid 10-digit PG phone number';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      if (newErrors.name || newErrors.phone) {
        setActiveStep(0);
      } else if (newErrors.pg_name || newErrors.pg_phone) {
        setActiveStep(1);
      }
      return false;
    }

    return true;
  };

  // Submit Handler -> PUT /api/v1/auth/update-pg
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;

    try {
      setIsSubmitting(true);

      const payload = new FormData();

      // Owner Fields (email sent as read-only value)
      payload.append('name', formData.name.trim());
      payload.append('email', formData.email.trim());

      if (formData.phone.trim()) {
        payload.append('phone', formData.phone.trim().replace(/\D/g, ''));
      } else if (initialData?.phone || currentUser?.phone) {
        payload.append('phone', 'null');
      }

      if (formData.gender) {
        payload.append('gender', formData.gender);
      } else if (initialData?.gender || currentUser?.gender) {
        payload.append('gender', 'null');
      }

      if (formData.address.trim()) {
        payload.append('address', formData.address.trim());
      } else if (initialData?.address || currentUser?.address) {
        payload.append('address', 'null');
      }

      if (formData.profilePhotoFile) {
        payload.append('profile_photo', formData.profilePhotoFile);
      } else if (!formData.profilePhotoPreview && (initialData?.profilePhotoPreview || currentUser?.profile_photo)) {
        payload.append('profile_photo', 'null');
      }

      // PG Facility Fields (pg_email completely removed)
      payload.append('pg_name', formData.pg_name.trim());

      if (formData.pg_type) {
        payload.append('pg_type', formData.pg_type);
      } else if (initialData?.pg_type || currentUser?.pg?.type) {
        payload.append('pg_type', 'null');
      }

      if (formData.pg_phone.trim()) {
        payload.append('pg_phone', formData.pg_phone.trim().replace(/\D/g, ''));
      } else if (initialData?.pg_phone || currentUser?.pg?.phone) {
        payload.append('pg_phone', 'null');
      }

      if (formData.pg_address.trim()) {
        payload.append('pg_address', formData.pg_address.trim());
      } else if (initialData?.pg_address || currentUser?.pg?.address) {
        payload.append('pg_address', 'null');
      }

      if (formData.pg_city.trim()) {
        payload.append('pg_city', formData.pg_city.trim());
      } else if (initialData?.pg_city || currentUser?.pg?.city) {
        payload.append('pg_city', 'null');
      }

      if (formData.pg_state.trim()) {
        payload.append('pg_state', formData.pg_state.trim());
      } else if (initialData?.pg_state || currentUser?.pg?.state) {
        payload.append('pg_state', 'null');
      }

      if (formData.pg_pincode.trim()) {
        payload.append('pg_pincode', formData.pg_pincode.trim());
      } else if (initialData?.pg_pincode || currentUser?.pg?.pincode) {
        payload.append('pg_pincode', 'null');
      }

      if (formData.total_rooms !== '') {
        payload.append('total_rooms', String(Number(formData.total_rooms)));
      } else if (initialData?.total_rooms !== '' && initialData?.total_rooms !== undefined) {
        payload.append('total_rooms', 'null');
      }

      if (formData.total_beds !== '') {
        payload.append('total_beds', String(Number(formData.total_beds)));
      } else if (initialData?.total_beds !== '' && initialData?.total_beds !== undefined) {
        payload.append('total_beds', 'null');
      }

      if (formData.amenities.length > 0) {
        payload.append('amenities', JSON.stringify(formData.amenities));
      } else if (initialData?.amenities && initialData.amenities.length > 0) {
        payload.append('amenities', 'null');
      }

      if (formData.rules.trim()) {
        payload.append('rules', formData.rules.trim());
      } else if (initialData?.rules || currentUser?.pg?.rules) {
        payload.append('rules', 'null');
      }

      if (formData.status) {
        payload.append('status', formData.status);
      } else if (initialData?.status || currentUser?.pg?.status) {
        payload.append('status', 'null');
      }

      if (formData.logoFile) {
        payload.append('logo', formData.logoFile);
      } else if (!formData.logoPreview && (initialData?.logoPreview || currentUser?.pg?.logo)) {
        payload.append('logo', 'null');
      }

      // Banking & UPI Payout Fields
      if (formData.pg_upi_id.trim()) {
        payload.append('pg_upi_id', formData.pg_upi_id.trim());
      } else if (initialData?.pg_upi_id || currentUser?.pg?.bank_details?.pg_upi_id || currentUser?.pg?.pg_upi_id) {
        payload.append('pg_upi_id', 'null');
      }

      if (formData.pg_bank_name.trim()) {
        payload.append('pg_bank_name', formData.pg_bank_name.trim());
      } else if (initialData?.pg_bank_name || currentUser?.pg?.bank_details?.pg_bank_name || currentUser?.pg?.pg_bank_name) {
        payload.append('pg_bank_name', 'null');
      }

      if (formData.pg_account_number.trim()) {
        payload.append('pg_account_number', formData.pg_account_number.trim());
      } else if (initialData?.pg_account_number || currentUser?.pg?.bank_details?.pg_account_number || currentUser?.pg?.pg_account_number) {
        payload.append('pg_account_number', 'null');
      }

      if (formData.pg_ifsc_code.trim()) {
        payload.append('pg_ifsc_code', formData.pg_ifsc_code.trim().toUpperCase());
      } else if (initialData?.pg_ifsc_code || currentUser?.pg?.bank_details?.pg_ifsc_code || currentUser?.pg?.pg_ifsc_code) {
        payload.append('pg_ifsc_code', 'null');
      }

      if (formData.pg_account_holder_name.trim()) {
        payload.append('pg_account_holder_name', formData.pg_account_holder_name.trim());
      } else if (initialData?.pg_account_holder_name || currentUser?.pg?.bank_details?.pg_account_holder_name || currentUser?.pg?.pg_account_holder_name) {
        payload.append('pg_account_holder_name', 'null');
      }

      // Execute PUT /api/v1/auth/update-pg
      await authService.updatePgProfile(payload);

      // Re-fetch updated user profile to synchronize cookies and topbar
      const freshUser = await authService.getMe();
      populateFromUser(freshUser);
    } catch (err: unknown) {
      console.error('Failed to update PG & owner profile:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <BrandLoader />
        <p className="text-xs text-gray-500 font-medium">Loading profile and PG facility details...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Brand Loader Overlay during submission */}
      {isSubmitting && <BrandLoader overlay message="Updating PG facility and owner profile..." />}

      {/* Top Header matching Figma UI */}
      <PageHeader
        title="Admin Profile & PG Settings"
        subtitle="Manage your personal owner credentials, PG facility details, and bank settlement payout."
        backHref="/dashboard"
        backTitle="Back to Dashboard"
      />

      {/* Step Navigation Wizard matching Resident Form style */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-2 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {STEPS.map((step, idx) => {
            const isActive = activeStep === idx;
            const isCompleted = isStepComplete(idx);
            const hasError = hasStepError(idx);

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => handleStepClick(idx)}
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

      {/* Main Step Card Container */}
      <form onSubmit={handleSubmit} noValidate autoComplete="off" className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 shadow-xs space-y-6">
          {/* STEP 1: OWNER INFORMATION */}
          <div className={activeStep === 0 ? 'block space-y-6' : 'hidden'}>
            <div className="border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EBF7F2] text-[#175C46]">
                  Step 1 of 3
                </span>
                <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
                  Owner Information
                </h2>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Personal identification and administrator account credentials.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Fields Column (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <TextInput
                    label="Owner Full Name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Sunita Mehra"
                    error={errors.name}
                  />

                  <TextInput
                    label="Owner Email Address"
                    name="email"
                    type="email"
                    required
                    disabled
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="e.g. sunita.mehra@example.com"
                    helperText="Email address is fixed and cannot be changed."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <TextInput
                    label="Phone Number"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="e.g. 9876543220"
                    error={errors.phone}
                  />

                  <RadioGroup
                    label="Gender"
                    name="gender"
                    options={GENDER_OPTIONS}
                    value={formData.gender}
                    onChange={(val) => handleFieldChange('gender', val as ProfileFormData['gender'])}
                  />
                </div>

                <div>
                  <label className="text-xs sm:text-sm font-semibold text-gray-800 block mb-1.5">
                    Residential / Office Address
                  </label>
                  <textarea
                    name="address"
                    rows={3}
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter full address, street, landmark, city"
                    className="w-full text-xs sm:text-sm rounded-xl border border-gray-200/90 bg-white p-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#175C46] focus:border-[#175C46] transition-colors shadow-2xs"
                  />
                </div>
              </div>

              {/* Right Photo Column (5 cols) */}
              <div className="lg:col-span-5">
                <PhotoUpload
                  label="Owner Profile Photo"
                  shape="rounded"
                  previewUrl={formData.profilePhotoPreview}
                  file={formData.profilePhotoFile}
                  helperText="JPG, PNG • Max 5MB. Displayed on topbar and receipts."
                  onSelectFile={(file) => {
                    const url = URL.createObjectURL(file);
                    setFormData((prev) => ({
                      ...prev,
                      profilePhotoFile: file,
                      profilePhotoPreview: url,
                    }));
                  }}
                  onRemove={() => {
                    setFormData((prev) => ({
                      ...prev,
                      profilePhotoFile: null,
                      profilePhotoPreview: null,
                    }));
                  }}
                />
              </div>
            </div>
          </div>

          {/* STEP 2: PG FACILITY CONFIGURATION */}
          <div className={activeStep === 1 ? 'block space-y-6' : 'hidden'}>
            <div className="border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EBF7F2] text-[#175C46]">
                  Step 2 of 3
                </span>
                <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
                  PG Facility Configuration
                </h2>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Property identity, contact number, capacity, amenities, and resident rules.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Fields Column (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <TextInput
                    label="PG Name"
                    name="pg_name"
                    required
                    value={formData.pg_name}
                    onChange={handleChange}
                    placeholder="e.g. HouseNest Sunshine PG"
                    error={errors.pg_name}
                  />

                  <Dropdown
                    label="PG Type"
                    name="pg_type"
                    placeholder="Select PG type"
                    value={formData.pg_type}
                    options={PG_TYPE_OPTIONS}
                    onChange={handleChange}
                  />
                </div>

                {/* PG Phone */}
                <div>
                  <TextInput
                    label="PG Phone Number"
                    name="pg_phone"
                    value={formData.pg_phone}
                    onChange={handleChange}
                    placeholder="e.g. 9876543221"
                    error={errors.pg_phone}
                  />
                </div>

                <div>
                  <label className="text-xs sm:text-sm font-semibold text-gray-800 block mb-1.5">
                    PG Facility Address
                  </label>
                  <input
                    type="text"
                    name="pg_address"
                    value={formData.pg_address}
                    onChange={handleChange}
                    placeholder="e.g. Plot 45, Near St. Xavier College"
                    className="w-full h-11 text-xs sm:text-sm rounded-xl border border-gray-200/90 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#175C46] focus:border-[#175C46] transition-colors shadow-2xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <TextInput
                    label="City"
                    name="pg_city"
                    value={formData.pg_city}
                    onChange={handleChange}
                    placeholder="e.g. Ahmedabad"
                  />

                  <TextInput
                    label="State"
                    name="pg_state"
                    value={formData.pg_state}
                    onChange={handleChange}
                    placeholder="e.g. Gujarat"
                  />

                  <TextInput
                    label="Pincode"
                    name="pg_pincode"
                    value={formData.pg_pincode}
                    onChange={handleChange}
                    placeholder="e.g. 380009"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                  <TextInput
                    label="Total Rooms"
                    name="total_rooms"
                    type="number"
                    min="0"
                    value={formData.total_rooms}
                    onChange={handleChange}
                    placeholder="e.g. 25"
                  />

                  <TextInput
                    label="Total Beds"
                    name="total_beds"
                    type="number"
                    min="0"
                    value={formData.total_beds}
                    onChange={handleChange}
                    placeholder="e.g. 50"
                  />

                  <RadioGroup
                    label="Status"
                    name="status"
                    options={PG_STATUS_OPTIONS}
                    value={formData.status}
                    onChange={(val) => handleFieldChange('status', val as ProfileFormData['status'])}
                  />
                </div>

                {/* Amenities Selector */}
                <div className="space-y-2 pt-2">
                  <label className="text-xs sm:text-sm font-semibold text-gray-800 block">
                    Included Amenities &amp; Facilities
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_AMENITIES.map((amenity) => {
                      const isSelected = formData.amenities.includes(amenity);
                      return (
                        <button
                          key={amenity}
                          type="button"
                          onClick={() => toggleAmenity(amenity)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-[#175C46] text-white shadow-2xs'
                              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {isSelected ? (
                            <svg className="w-3.5 h-3.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                          )}
                          <span>{amenity}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Add Custom Amenity */}
                  <div className="flex items-center gap-2 pt-1 max-w-sm">
                    <input
                      type="text"
                      value={customAmenity}
                      onChange={(e) => setCustomAmenity(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomAmenity();
                        }
                      }}
                      placeholder="Add custom amenity (e.g. Garden)"
                      className="flex-1 h-9 text-xs rounded-xl border border-gray-200/90 bg-white px-3 focus:outline-none focus:ring-1 focus:ring-[#175C46] placeholder-gray-400"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomAmenity}
                      className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-gray-700 rounded-xl transition-colors cursor-pointer shadow-2xs"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Rules & Policies */}
                <div className="pt-2">
                  <label className="text-xs sm:text-sm font-semibold text-gray-800 block mb-1.5">
                    Rules, Curfew &amp; Policies
                  </label>
                  <textarea
                    name="rules"
                    rows={3}
                    value={formData.rules}
                    onChange={handleChange}
                    placeholder="e.g. Curfew at 10:30 PM. No loud music after 11 PM."
                    className="w-full text-xs sm:text-sm rounded-xl border border-gray-200/90 bg-white p-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#175C46] focus:border-[#175C46] transition-colors shadow-2xs"
                  />
                </div>
              </div>

              {/* Right Logo Column (5 cols) */}
              <div className="lg:col-span-5">
                <PhotoUpload
                  label="PG Facility Brand Logo"
                  shape="rounded"
                  previewUrl={formData.logoPreview}
                  file={formData.logoFile}
                  helperText="JPG, PNG • Max 5MB. Displayed on resident app and receipts."
                  onSelectFile={(file) => {
                    const url = URL.createObjectURL(file);
                    setFormData((prev) => ({
                      ...prev,
                      logoFile: file,
                      logoPreview: url,
                    }));
                  }}
                  onRemove={() => {
                    setFormData((prev) => ({
                      ...prev,
                      logoFile: null,
                      logoPreview: null,
                    }));
                  }}
                />
              </div>
            </div>
          </div>

          {/* STEP 3: BANK & UPI SETTLEMENT DETAILS */}
          <div className={activeStep === 2 ? 'block space-y-6' : 'hidden'}>
            <div className="border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EBF7F2] text-[#175C46]">
                  Step 3 of 3
                </span>
                <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
                  Bank &amp; UPI Settlement Details
                </h2>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Payout account and UPI VPA used for resident collections and invoice receipts.
              </p>
            </div>

            <div className="max-w-4xl space-y-4">
              <div className="p-3.5 bg-emerald-50/60 border border-emerald-100/80 rounded-xl flex items-start gap-2.5 text-xs text-gray-700">
                <svg className="w-4 h-4 text-[#175C46] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  The UPI ID and bank account details below are used for collecting resident rent and utility payments online.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextInput
                  label="PG UPI ID (VPA)"
                  name="pg_upi_id"
                  value={formData.pg_upi_id}
                  onChange={handleChange}
                  placeholder="e.g. jasminkorat204@oksbi"
                />

                <TextInput
                  label="Bank Name"
                  name="pg_bank_name"
                  value={formData.pg_bank_name}
                  onChange={handleChange}
                  placeholder="e.g. State Bank of India"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextInput
                  label="Account Number"
                  name="pg_account_number"
                  value={formData.pg_account_number}
                  onChange={handleChange}
                  placeholder="e.g. 38291048592"
                />

                <TextInput
                  label="IFSC Code"
                  name="pg_ifsc_code"
                  value={formData.pg_ifsc_code}
                  onChange={(e) => {
                    handleFieldChange('pg_ifsc_code', e.target.value.toUpperCase());
                  }}
                  placeholder="e.g. SBIN0001234"
                />
              </div>

              <div className="max-w-md">
                <TextInput
                  label="Account Holder Name"
                  name="pg_account_holder_name"
                  value={formData.pg_account_holder_name}
                  onChange={handleChange}
                  placeholder="e.g. Jasmin Patel"
                />
              </div>
            </div>
          </div>

          {/* Action Footer Navigation Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-gray-100">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {activeStep > 0 && (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Back</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleReset}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs sm:text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
              >
                Reset
              </button>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              {/* Quick Save Option */}
              {activeStep < 2 && (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 sm:px-5 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                >
                  Save Changes
                </button>
              )}

              {activeStep < 2 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#175C46] hover:bg-[#124B38] text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Continue</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-8 py-2.5 rounded-xl bg-[#175C46] hover:bg-[#124B38] text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Save Profile &amp; PG Details</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
