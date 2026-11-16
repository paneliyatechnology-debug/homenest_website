'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { StaffMember, StaffStatus } from '@/types/staff';
import { Branch } from '@/types/branch';
import { staffService } from '@/services/staff.service';
import { branchService } from '@/services/branch.service';
import {
  PageHeader,
  TextInput,
  RadioGroup,
  PhotoUpload,
  BrandLoader,
  Dropdown,
  MultiSelectDropdown,
} from '@/components/ui';
import { toast } from '@/lib/toast';

export interface StaffFormData {
  name: string;
  staff_role: string;
  branch_ids: number[];
  email: string;
  phone: string;
  status: StaffStatus;
  photoFile: File | null;
  photoPreview: string | null;
}

export const initialStaffFormData: StaffFormData = {
  name: '',
  staff_role: '',
  branch_ids: [],
  email: '',
  phone: '',
  status: 'active',
  photoFile: null,
  photoPreview: null,
};

export const buildStaffFormData = (data?: StaffMember | null): StaffFormData => ({
  name: data?.name || '',
  staff_role: data?.staff_role || data?.role || '',
  branch_ids:
    data?.branches && data.branches.length > 0
      ? data.branches.map((b) => b.id)
      : [],
  email: data?.email || '',
  phone: data?.phone || '',
  status: (data?.status as StaffStatus) || 'active',
  photoFile: null,
  photoPreview:
    data?.profile_photo_url ||
    data?.photo_url ||
    data?.profile_photo ||
    data?.photo ||
    null,
});

interface StaffFormProps {
  initialData?: StaffMember | null;
  mode: 'create' | 'edit';
}

const STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'On Leave', value: 'on_leave' },
  { label: 'Inactive', value: 'inactive' },
];

export const STAFF_ROLE_OPTIONS = [
  { label: 'Branch Manager', value: 'BRANCH_MANAGER' },
  { label: 'Kitchen Staff', value: 'KITCHEN_STAFF' },
  { label: 'Housekeeping', value: 'HOUSEKEEPING' },
  { label: 'Security Guard', value: 'SECURITY_GUARD' },
  { label: 'Accountant', value: 'ACCOUNTANT' },
  { label: 'Warden', value: 'WARDEN' },
  { label: 'Maintenance', value: 'MAINTENANCE' },
];

export const StaffForm: React.FC<StaffFormProps> = ({ initialData, mode }) => {
  const router = useRouter();
  const isEdit = mode === 'edit';

  // Branches list for dropdown
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(true);

  // Centralized Form State
  const [formData, setFormData] = useState<StaffFormData>(() =>
    buildStaffFormData(initialData)
  );

  // Validation & Loading
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    }
  };

  // Reusable Field Change Handler for custom controls (multi-select, radios, photos)
  const handleFieldChange = <K extends keyof StaffFormData>(
    field: K,
    value: StaffFormData[K]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field as string]) {
      setErrors((prev) => ({
        ...prev,
        [field as string]: validateField(field as string, value),
      }));
    }
  };

  // Reset form to clean defaults (or record values if in edit mode)
  const resetForm = useCallback(() => {
    setFormData(buildStaffFormData(isEdit ? initialData : null));
    setErrors({});
  }, [isEdit, initialData]);

  const [prevStaffMemberId, setPrevStaffMemberId] = useState<number | null>(
    initialData?.id ?? null
  );

  // Synchronize on initialData changes in edit mode during render phase
  if (isEdit && initialData && initialData.id !== prevStaffMemberId) {
    setPrevStaffMemberId(initialData.id);
    setFormData(buildStaffFormData(initialData));
    setErrors({});
  }

  // Reset form when navigating away (unmounting) in create mode
  useEffect(() => {
    return () => {
      if (!isEdit) {
        resetForm();
      }
    };
  }, [isEdit, resetForm]);

  // Reset on bfcache restore
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted && !isEdit) {
        resetForm();
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [isEdit, resetForm]);

  // Fetch branches for selection
  useEffect(() => {
    let isMounted = true;
    branchService
      .getBranches({ limit: 50 })
      .then((res) => {
        if (!isMounted) return;
        setBranches(res.data);
        setLoadingBranches(false);
      })
      .catch(() => {
        if (isMounted) setLoadingBranches(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Form Validation using Centralized State
  const validateField = (field: string, value: unknown): string => {
    switch (field) {
      case 'name': {
        const val = typeof value === 'string' ? value.trim() : '';
        if (!val) return 'Staff name is required';
        if (val.length < 2) return 'Staff name must be at least 2 characters';
        if (val.length > 100) return 'Staff name cannot exceed 100 characters';
        if (!/^[a-zA-Z\s.'-]+$/.test(val)) {
          return 'Staff name should only contain letters, spaces, and hyphens';
        }
        return '';
      }
      case 'staff_role': {
        if (!value) return 'Please select a staff role';
        return '';
      }
      case 'branch_ids': {
        const ids = Array.isArray(value) ? value : [];
        if (ids.length === 0) return 'Please select at least one branch';
        return '';
      }
      case 'email': {
        const val = typeof value === 'string' ? value.trim() : '';
        if (!isEdit && !val) return 'Email address is required';
        if (val && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val)) {
          return 'Please enter a valid email address (e.g. name@example.com)';
        }
        return '';
      }
      case 'phone': {
        const val = typeof value === 'string' ? value.trim() : '';
        if (!val) return 'Phone number is required';
        const cleaned = val.replace(/[\s\-()]/g, '');
        const isValid =
          /^[5-9]\d{9}$/.test(cleaned) ||
          /^\+91[5-9]\d{9}$/.test(cleaned) ||
          /^91[5-9]\d{9}$/.test(cleaned) ||
          /^0[5-9]\d{9}$/.test(cleaned) ||
          /^\+?[1-9]\d{9,14}$/.test(cleaned);
        if (!isValid) {
          return 'Please enter a valid 10-digit mobile number (e.g. 98765 25456 or +91 98765 25456)';
        }
        return '';
      }
      default:
        return '';
    }
  };

  const handleBlur = (field: string, value: unknown) => {
    const errorMsg = validateField(field, value);
    setErrors((prev) => ({
      ...prev,
      [field]: errorMsg,
    }));
  };

  const validate = (): boolean => {
    const errs: { [key: string]: string } = {};

    const nameErr = validateField('name', formData.name);
    if (nameErr) errs.name = nameErr;

    const roleErr = validateField('staff_role', formData.staff_role);
    if (roleErr) errs.staff_role = roleErr;

    const branchErr = validateField('branch_ids', formData.branch_ids);
    if (branchErr) errs.branch_ids = branchErr;

    const emailErr = validateField('email', formData.email);
    if (emailErr) errs.email = emailErr;

    const phoneErr = validateField('phone', formData.phone);
    if (phoneErr) errs.phone = phoneErr;

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Handle Submit using Centralized State
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.warn('Please check and correct the highlighted fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = new FormData();
      payload.append('name', formData.name.trim());
      payload.append('staff_role', formData.staff_role);
      payload.append('branch_ids', JSON.stringify(formData.branch_ids));
      payload.append('phone', formData.phone.trim());
      payload.append('status', formData.status);

      if (!isEdit) {
        payload.append('email', formData.email.trim().toLowerCase());
      }

      if (formData.photoFile) {
        payload.append('profile_photo', formData.photoFile);
      } else if (isEdit && !formData.photoPreview) {
        // Explicit removal
        payload.append('profile_photo', 'null');
      }

      if (isEdit && initialData?.id) {
        await staffService.updateStaff(initialData.id, payload);
      } else {
        await staffService.createStaff(payload);
        resetForm();
      }

      router.push('/dashboard/settings/staff');
      router.refresh();
    } catch {
      // Backend error toast is handled automatically by apiClient; input data is preserved
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-5 sm:space-y-6">
      {/* Brand Loader Overlay during submission */}
      {isSubmitting && (
        <BrandLoader
          overlay
          message={isEdit ? 'Updating staff profile...' : 'Saving new staff member...'}
        />
      )}

      {/* Top Header matching Figma: Back Arrow + Title & Subtitle */}
      <PageHeader
        title={isEdit ? 'Edit Staff' : 'Add Staff'}
        subtitle={isEdit ? 'Update staff details.' : 'Add a new staff.'}
        backHref="/dashboard/settings/staff"
        backTitle="Back to Staff Management"
        onBackClick={() => {
          if (!isEdit) resetForm();
        }}
      />

      {/* Form Content Container matching Figma */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Form Fields (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Staff name * */}
            <TextInput
              label="Staff name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              onBlur={() => handleBlur('name', formData.name)}
              placeholder="Enter staff name"
              error={errors.name}
            />

            {/* Staff role * & Branch * */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Dropdown
                label="Staff role"
                name="staff_role"
                required
                value={formData.staff_role}
                onChange={handleChange}
                onBlur={() => handleBlur('staff_role', formData.staff_role)}
                placeholder="Select role"
                options={STAFF_ROLE_OPTIONS}
                error={errors.staff_role}
              />

              <MultiSelectDropdown
                label="Branch"
                required
                values={formData.branch_ids}
                onChange={(newIds) => handleFieldChange('branch_ids', newIds)}
                placeholder={loadingBranches ? 'Loading branches...' : 'Select branch'}
                options={branches.map((b) => ({
                  label: b.name,
                  value: b.id,
                }))}
                error={errors.branch_ids}
              />
            </div>

            {/* E-mail * */}
            <TextInput
              label="E-mail"
              name="email"
              required={!isEdit}
              type="email"
              value={formData.email}
              disabled={isEdit}
              onChange={handleChange}
              onBlur={() => handleBlur('email', formData.email)}
              placeholder="Enter email address"
              error={errors.email}
              helperText={isEdit ? 'Email address cannot be changed after creation' : undefined}
            />

            {/* Phone no. * */}
            <TextInput
              label="Phone no."
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              onBlur={() => handleBlur('phone', formData.phone)}
              placeholder="Enter phone no."
              error={errors.phone}
            />

            {/* Status * (Radio Group) */}
            <RadioGroup
              label="Status"
              name="status"
              required
              value={formData.status}
              onChange={(val) => handleFieldChange('status', val as StaffStatus)}
              options={STATUS_OPTIONS}
            />
          </div>

          {/* Right Column: Attach Staff Photo Upload Box (5 cols) */}
          <div className="lg:col-span-5">
            <PhotoUpload
              label="Attach Staff photo"
              optional
              previewUrl={formData.photoPreview}
              file={formData.photoFile}
              shape="circle"
              onSelectFile={(file) => {
                setFormData((prev) => ({
                  ...prev,
                  photoFile: file,
                  photoPreview: URL.createObjectURL(file),
                }));
              }}
              onRemove={() => {
                setFormData((prev) => ({
                  ...prev,
                  photoFile: null,
                  photoPreview: null,
                }));
              }}
              onError={(msg) => {
                toast.error(msg);
              }}
            />
          </div>
        </div>

        {/* Full-Width Save Button matching Figma */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-[#175C46] hover:bg-[#124B38] text-white font-semibold rounded-xl text-xs sm:text-sm transition-colors shadow-xs cursor-pointer flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span>{isEdit ? 'Save Changes' : 'Save'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
