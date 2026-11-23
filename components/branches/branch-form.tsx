'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Branch } from '@/types/branch';
import { branchService } from '@/services/branch.service';
import { PageHeader, TextInput, RadioGroup, PhotoUpload, BrandLoader } from '@/components/ui';
import { toast } from '@/lib/toast';

export interface BranchFormData {
  name: string;
  location: string;
  total_rooms: string;
  status: 'active' | 'maintenance' | 'upcoming';
  photoFile: File | null;
  photoPreview: string | null;
}

export const initialBranchFormData: BranchFormData = {
  name: '',
  location: '',
  total_rooms: '',
  status: 'active',
  photoFile: null,
  photoPreview: null,
};

export const buildBranchFormData = (data?: Branch | null): BranchFormData => ({
  name: data?.name || '',
  location: data?.location || '',
  total_rooms: data?.total_rooms !== undefined ? String(data.total_rooms) : '',
  status: (data?.status as 'active' | 'maintenance' | 'upcoming') || 'active',
  photoFile: null,
  photoPreview: data?.branch_photo_url || data?.branch_photo || null,
});

interface BranchFormProps {
  initialData?: Branch | null;
  mode: 'create' | 'edit';
}

const STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Under Maintenance', value: 'maintenance' },
  { label: 'Upcoming', value: 'upcoming' },
];

export const BranchForm: React.FC<BranchFormProps> = ({ initialData, mode }) => {
  const router = useRouter();

  const isEdit = mode === 'edit';

  // Centralized Form State
  const [formData, setFormData] = useState<BranchFormData>(() =>
    buildBranchFormData(initialData)
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
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Reusable Field Change Handler for custom controls (radios, files, dates)
  const handleFieldChange = <K extends keyof BranchFormData>(
    field: K,
    value: BranchFormData[K]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field as string]) {
      setErrors((prev) => ({ ...prev, [field as string]: '' }));
    }
  };

  // Reset form to clean defaults (or record values if in edit mode)
  const resetForm = useCallback(() => {
    setFormData(buildBranchFormData(isEdit ? initialData : null));
    setErrors({});
  }, [isEdit, initialData]);

  const [prevBranchId, setPrevBranchId] = useState<number | null>(initialData?.id ?? null);

  // Synchronize on initialData changes in edit mode during render phase
  if (isEdit && initialData && initialData.id !== prevBranchId) {
    setPrevBranchId(initialData.id);
    setFormData(buildBranchFormData(initialData));
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

  // Form Validation using Centralized State
  const validate = (): boolean => {
    const errs: { [key: string]: string } = {};

    if (!formData.name.trim()) errs.name = 'Branch name is required';
    if (!formData.location.trim()) errs.location = 'Location is required';
    if (!formData.total_rooms.trim()) {
      errs.total_rooms = 'Total rooms is required';
    } else if (isNaN(Number(formData.total_rooms)) || Number(formData.total_rooms) <= 0) {
      errs.total_rooms = 'Please enter a valid positive number';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Handle Submit using Centralized State
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.warn('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = new FormData();
      payload.append('name', formData.name.trim());
      payload.append('location', formData.location.trim());
      payload.append('total_rooms', String(Number(formData.total_rooms)));
      payload.append('status', formData.status);

      if (!isEdit) {
        payload.append('pg_id', '1');
      }

      if (formData.photoFile) {
        payload.append('branch_photo', formData.photoFile);
      } else if (isEdit && !formData.photoPreview) {
        // Explicitly send 'null' so backend knows the existing image was removed
        payload.append('branch_photo', 'null');
      }

      if (isEdit && initialData?.id) {
        await branchService.updateBranch(initialData.id, payload);
      } else {
        await branchService.createBranch(payload);
        resetForm();
      }

      router.push('/settings/branches');
      router.refresh();
    } catch {
      // Backend error toast is handled automatically by apiClient; input data is preserved
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-5 sm:space-y-6">
      {/* Professional Brand Loader Overlay when submitting */}
      {isSubmitting && (
        <BrandLoader
          overlay
          message={isEdit ? 'Updating branch details...' : 'Saving new branch...'}
        />
      )}

      {/* Top Header matching Figma: Back Arrow (no border/bg) + Title & Subtitle */}
      <PageHeader
        title={isEdit ? 'Edit Branch' : 'Add Branch'}
        subtitle={isEdit ? 'Update branch details.' : 'Add a new Branch.'}
        backHref="/settings/branches"
        backTitle="Back to Branch Management"
        onBackClick={() => {
          if (!isEdit) resetForm();
        }}
      />

      {/* Form Content Container matching Figma */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Form Fields (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Branch name * */}
            <TextInput
              label="Branch name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter branch name"
              error={errors.name}
            />

            {/* Location * & Total rooms * */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextInput
                label="Location"
                name="location"
                required
                value={formData.location}
                onChange={handleChange}
                placeholder="Enter branch location or area"
                error={errors.location}
              />

              <TextInput
                label="Total rooms"
                name="total_rooms"
                required
                type="number"
                min="1"
                value={formData.total_rooms}
                onChange={handleChange}
                placeholder="Enter total rooms"
                error={errors.total_rooms}
              />
            </div>

            {/* Status * (Radio Group) */}
            <RadioGroup
              label="Status"
              name="status"
              required
              value={formData.status}
              onChange={(val) =>
                handleFieldChange('status', val as 'active' | 'maintenance' | 'upcoming')
              }
              options={STATUS_OPTIONS}
            />
          </div>

          {/* Right Column: Attach Branch Photo Upload Box (5 cols) */}
          <div className="lg:col-span-5">
            <PhotoUpload
              label="Attach Branch photo"
              optional
              previewUrl={formData.photoPreview}
              file={formData.photoFile}
              shape="rounded"
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
