'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Toast } from 'primereact/toast';
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
  const toastRef = useRef<Toast>(null);
  const isEdit = mode === 'edit';

  // Branches list for dropdown
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(true);

  // Form Fields
  const [name, setName] = useState<string>(initialData?.name || '');
  const [staffRole, setStaffRole] = useState<string>(
    initialData?.staff_role || initialData?.role || ''
  );
  const [selectedBranchIds, setSelectedBranchIds] = useState<number[]>(() => {
    if (initialData?.branches && initialData.branches.length > 0) {
      return initialData.branches.map((b) => b.id);
    }
    return [];
  });
  const [email, setEmail] = useState<string>(initialData?.email || '');
  const [phone, setPhone] = useState<string>(initialData?.phone || '');
  const [status, setStatus] = useState<StaffStatus>(
    (initialData?.status as StaffStatus) || 'active'
  );

  // Photo state
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    initialData?.profile_photo_url ||
      initialData?.photo_url ||
      initialData?.profile_photo ||
      initialData?.photo ||
      null
  );

  // Validation & Loading
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Form Validation
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
      case 'staffRole': {
        if (!value) return 'Please select a staff role';
        return '';
      }
      case 'branch': {
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

    const nameErr = validateField('name', name);
    if (nameErr) errs.name = nameErr;

    const roleErr = validateField('staffRole', staffRole);
    if (roleErr) errs.staffRole = roleErr;

    const branchErr = validateField('branch', selectedBranchIds);
    if (branchErr) errs.branch = branchErr;

    const emailErr = validateField('email', email);
    if (emailErr) errs.email = emailErr;

    const phoneErr = validateField('phone', phone);
    if (phoneErr) errs.phone = phoneErr;

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Handle Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toastRef.current?.show({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please check and correct the highlighted fields.',
        life: 3000,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('staff_role', staffRole);
      formData.append('branch_ids', JSON.stringify(selectedBranchIds));
      formData.append('phone', phone.trim());
      formData.append('status', status);

      if (!isEdit) {
        formData.append('email', email.trim().toLowerCase());
      }

      if (photoFile) {
        formData.append('profile_photo', photoFile);
      } else if (isEdit && !photoPreview) {
        // Explicit removal
        formData.append('profile_photo', 'null');
      }

      if (isEdit && initialData?.id) {
        const res = await staffService.updateStaff(initialData.id, formData);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(
            'homenest_flash_toast',
            JSON.stringify({
              severity: 'success',
              summary: 'Staff Updated',
              detail: res.message || 'Staff updated successfully',
            })
          );
        }
      } else {
        const res = await staffService.createStaff(formData);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(
            'homenest_flash_toast',
            JSON.stringify({
              severity: 'success',
              summary: 'Staff Created',
              detail: res.message || 'Staff created successfully',
            })
          );
        }
      }

      router.push('/dashboard/settings/staff');
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Operation failed';
      toastRef.current?.show({
        severity: 'error',
        summary: isEdit ? 'Update Failed' : 'Creation Failed',
        detail: msg,
        life: 4000,
      });
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
      <Toast ref={toastRef} position="top-right" />

      {/* Top Header matching Figma: Back Arrow + Title & Subtitle */}
      <PageHeader
        title={isEdit ? 'Edit Staff' : 'Add Staff'}
        subtitle={isEdit ? 'Update staff details.' : 'Add a new staff.'}
        backHref="/dashboard/settings/staff"
        backTitle="Back to Staff Management"
      />

      {/* Form Content Container matching Figma */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Form Fields (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Staff name * */}
            <TextInput
              label="Staff name"
              required
              value={name}
              onChange={(e) => {
                const val = e.target.value;
                setName(val);
                if (errors.name) {
                  setErrors((prev) => ({ ...prev, name: validateField('name', val) }));
                }
              }}
              onBlur={() => handleBlur('name', name)}
              placeholder="Enter staff name"
              error={errors.name}
            />

            {/* Staff role * & Branch * */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Dropdown
                label="Staff role"
                required
                value={staffRole}
                onChange={(e) => {
                  const val = e.target.value;
                  setStaffRole(val);
                  if (errors.staffRole) {
                    setErrors((prev) => ({ ...prev, staffRole: validateField('staffRole', val) }));
                  }
                }}
                onBlur={() => handleBlur('staffRole', staffRole)}
                placeholder="Select role"
                options={STAFF_ROLE_OPTIONS}
                error={errors.staffRole}
              />

              <MultiSelectDropdown
                label="Branch"
                required
                values={selectedBranchIds}
                onChange={(newIds) => {
                  setSelectedBranchIds(newIds);
                  if (errors.branch) {
                    setErrors((prev) => ({ ...prev, branch: validateField('branch', newIds) }));
                  }
                }}
                placeholder={loadingBranches ? 'Loading branches...' : 'Select branch'}
                options={branches.map((b) => ({
                  label: b.name,
                  value: b.id,
                }))}
                error={errors.branch}
              />
            </div>

            {/* E-mail * */}
            <TextInput
              label="E-mail"
              required={!isEdit}
              type="email"
              value={email}
              disabled={isEdit}
              onChange={(e) => {
                const val = e.target.value;
                setEmail(val);
                if (errors.email) {
                  setErrors((prev) => ({ ...prev, email: validateField('email', val) }));
                }
              }}
              onBlur={() => handleBlur('email', email)}
              placeholder="Enter email address"
              error={errors.email}
              helperText={isEdit ? 'Email address cannot be changed after creation' : undefined}
            />

            {/* Phone no. * */}
            <TextInput
              label="Phone no."
              required
              value={phone}
              onChange={(e) => {
                const val = e.target.value;
                setPhone(val);
                if (errors.phone) {
                  setErrors((prev) => ({ ...prev, phone: validateField('phone', val) }));
                }
              }}
              onBlur={() => handleBlur('phone', phone)}
              placeholder="Enter phone no."
              error={errors.phone}
            />

            {/* Status * (Radio Group) */}
            <RadioGroup
              label="Status"
              required
              name="status"
              value={status}
              onChange={(val) => setStatus(val as StaffStatus)}
              options={STATUS_OPTIONS}
            />
          </div>

          {/* Right Column: Attach Staff Photo Upload Box (5 cols) */}
          <div className="lg:col-span-5">
            <PhotoUpload
              label="Attach Staff photo"
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
                toastRef.current?.show({
                  severity: 'error',
                  summary: 'Invalid Photo',
                  detail: msg,
                  life: 3000,
                });
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

