'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Toast } from 'primereact/toast';
import { Branch } from '@/types/branch';
import { branchService } from '@/services/branch.service';
import { PageHeader, TextInput, RadioGroup, PhotoUpload, BrandLoader } from '@/components/ui';

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
  const toastRef = useRef<Toast>(null);

  const isEdit = mode === 'edit';

  // Form Fields
  const [name, setName] = useState<string>(initialData?.name || '');
  const [location, setLocation] = useState<string>(initialData?.location || '');
  const [totalRooms, setTotalRooms] = useState<string>(
    initialData?.total_rooms !== undefined ? String(initialData.total_rooms) : ''
  );
  const [status, setStatus] = useState<'active' | 'maintenance' | 'upcoming'>(
    (initialData?.status as 'active' | 'maintenance' | 'upcoming') || 'active'
  );

  // Photo state
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    initialData?.branch_photo_url || initialData?.branch_photo || null
  );

  // Validation & Loading
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);


  // Form Validation
  const validate = (): boolean => {
    const errs: { [key: string]: string } = {};

    if (!name.trim()) errs.name = 'Branch name is required';
    if (!location.trim()) errs.location = 'Location is required';
    if (!totalRooms.trim()) {
      errs.totalRooms = 'Total rooms is required';
    } else if (isNaN(Number(totalRooms)) || Number(totalRooms) <= 0) {
      errs.totalRooms = 'Please enter a valid positive number';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Handle Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toastRef.current?.show({
        severity: 'warn',
        summary: 'Missing Fields',
        detail: 'Please fill in all required fields.',
        life: 3000,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('location', location.trim());
      formData.append('total_rooms', String(Number(totalRooms)));
      formData.append('status', status);

      if (!isEdit) {
        formData.append('pg_id', '1');
      }

      if (photoFile) {
        formData.append('branch_photo', photoFile);
      } else if (isEdit && !photoPreview) {
        // Explicitly send 'null' so backend knows the existing image was removed
        formData.append('branch_photo', 'null');
      }

      if (isEdit && initialData?.id) {
        const res = await branchService.updateBranch(initialData.id, formData);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(
            'homenest_flash_toast',
            JSON.stringify({
              severity: 'success',
              summary: 'Branch Updated',
              detail: res.message || 'Branch updated successfully',
            })
          );
        }
      } else {
        const res = await branchService.createBranch(formData);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(
            'homenest_flash_toast',
            JSON.stringify({
              severity: 'success',
              summary: 'Branch Created',
              detail: res.message || 'Branch created successfully',
            })
          );
        }
      }

      router.push('/dashboard/settings/branches');
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
      {/* Professional Brand Loader Overlay when submitting */}
      {isSubmitting && (
        <BrandLoader
          overlay
          message={isEdit ? 'Updating branch details...' : 'Saving new branch...'}
        />
      )}
      <Toast ref={toastRef} position="top-right" />

      {/* Top Header matching Figma: Back Arrow (no border/bg) + Title & Subtitle */}
      <PageHeader
        title={isEdit ? 'Edit Branch' : 'Add Branch'}
        subtitle={isEdit ? 'Update branch details.' : 'Add a new Branch.'}
        backHref="/dashboard/settings/branches"
        backTitle="Back to Branch Management"
      />

      {/* Form Content Container matching Figma */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Form Fields (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Branch name * */}
            <TextInput
              label="Branch name"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
              }}
              placeholder="Enter branch name"
              error={errors.name}
            />

            {/* Location * & Total rooms * */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextInput
                label="Location"
                required
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  if (errors.location) setErrors((prev) => ({ ...prev, location: '' }));
                }}
                placeholder="Enter location"
                error={errors.location}
              />

              <TextInput
                label="Total rooms"
                required
                type="number"
                min="1"
                value={totalRooms}
                onChange={(e) => {
                  setTotalRooms(e.target.value);
                  if (errors.totalRooms) setErrors((prev) => ({ ...prev, totalRooms: '' }));
                }}
                placeholder="Enter total rooms"
                error={errors.totalRooms}
              />
            </div>

            {/* Status * (Radio Group) */}
            <RadioGroup
              label="Status"
              required
              name="status"
              value={status}
              onChange={(val) => setStatus(val as 'active' | 'maintenance' | 'upcoming')}
              options={STATUS_OPTIONS}
            />
          </div>

          {/* Right Column: Attach Branch Photo Upload Box (5 cols) */}
          <div className="lg:col-span-5">
            <PhotoUpload
              label="Attach Branch photo"
              optional
              previewUrl={photoPreview}
              file={photoFile}
              shape="rounded"
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
            <span>Save</span>
          </button>
        </div>
      </form>
    </div>
  );
};
