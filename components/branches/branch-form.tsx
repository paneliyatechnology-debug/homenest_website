'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Toast } from 'primereact/toast';
import { Branch } from '@/types/branch';
import { branchService } from '@/services/branch.service';

interface BranchFormProps {
  initialData?: Branch | null;
  mode: 'create' | 'edit';
}

export const BranchForm: React.FC<BranchFormProps> = ({ initialData, mode }) => {
  const router = useRouter();
  const toastRef = useRef<Toast>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const [isDragOver, setIsDragOver] = useState(false);

  // Validation & Loading
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle Photo selection
  const handlePhotoSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toastRef.current?.show({
        severity: 'error',
        summary: 'Invalid File',
        detail: 'Please upload an image file (JPG, PNG).',
        life: 3000,
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toastRef.current?.show({
        severity: 'error',
        summary: 'File Too Large',
        detail: 'Image size should not exceed 5MB.',
        life: 3000,
      });
      return;
    }

    setPhotoFile(file);
    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handlePhotoSelect(e.dataTransfer.files[0]);
    }
  };

  const handleRemovePhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

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

      router.push(`/dashboard/settings/branches?toast=${isEdit ? 'updated' : 'created'}`);
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
      <Toast ref={toastRef} position="top-right" />

      {/* Top Header matching Figma: Back Arrow + Title & Subtitle */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/settings/branches"
          title="Back to Branch Management"
          className="text-gray-900 hover:text-black flex items-center justify-center transition-colors cursor-pointer p-1 -ml-1 rounded-lg hover:bg-gray-100/60 shrink-0"
        >
          <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2.4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            {isEdit ? 'Edit Branch' : 'Add Branch'}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-normal mt-0.5">
            {isEdit ? 'Update branch details.' : 'Add a new Branch.'}
          </p>
        </div>
      </div>

      {/* Form Content Container matching Figma */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Form Fields (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Branch name * */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-semibold text-gray-800 block">
                Branch name <span className="text-[#175C46]">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                }}
                placeholder="Enter branch name"
                className={`w-full h-11 px-4 py-2.5 bg-white border ${
                  errors.name
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                    : 'border-gray-200/90 hover:border-gray-300 focus:border-[#175C46] focus:ring-1 focus:ring-[#175C46]'
                } rounded-xl text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none transition-all shadow-2xs font-sans`}
              />
              {errors.name && <p className="text-[11px] text-rose-500">{errors.name}</p>}
            </div>

            {/* Location * & Total rooms * */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-semibold text-gray-800 block">
                  Location <span className="text-[#175C46]">*</span>
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    if (errors.location) setErrors((prev) => ({ ...prev, location: '' }));
                  }}
                  placeholder="Enter location"
                  className={`w-full h-11 px-4 py-2.5 bg-white border ${
                    errors.location
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                      : 'border-gray-200/90 hover:border-gray-300 focus:border-[#175C46] focus:ring-1 focus:ring-[#175C46]'
                  } rounded-xl text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none transition-all shadow-2xs font-sans`}
                />
                {errors.location && <p className="text-[11px] text-rose-500">{errors.location}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-semibold text-gray-800 block">
                  Total rooms <span className="text-[#175C46]">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={totalRooms}
                  onChange={(e) => {
                    setTotalRooms(e.target.value);
                    if (errors.totalRooms) setErrors((prev) => ({ ...prev, totalRooms: '' }));
                  }}
                  placeholder="Enter total rooms"
                  className={`w-full h-11 px-4 py-2.5 bg-white border ${
                    errors.totalRooms
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                      : 'border-gray-200/90 hover:border-gray-300 focus:border-[#175C46] focus:ring-1 focus:ring-[#175C46]'
                  } rounded-xl text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none transition-all shadow-2xs font-sans`}
                />
                {errors.totalRooms && <p className="text-[11px] text-rose-500">{errors.totalRooms}</p>}
              </div>
            </div>

            {/* Status * (Radio Group matching Figma) */}
            <div className="space-y-2 pt-1">
              <label className="text-xs sm:text-sm font-semibold text-gray-800 block">
                Status <span className="text-[#175C46]">*</span>
              </label>
              <div className="flex flex-wrap items-center gap-6 pt-1">
                {/* Active */}
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="status"
                    value="active"
                    checked={status === 'active'}
                    onChange={() => setStatus('active')}
                    className="w-4 h-4 text-[#175C46] focus:ring-[#175C46] border-gray-300 cursor-pointer accent-[#175C46]"
                  />
                  <span className="text-xs sm:text-sm font-medium text-gray-700">Active</span>
                </label>

                {/* Under Maintenance */}
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="status"
                    value="maintenance"
                    checked={status === 'maintenance'}
                    onChange={() => setStatus('maintenance')}
                    className="w-4 h-4 text-[#175C46] focus:ring-[#175C46] border-gray-300 cursor-pointer accent-[#175C46]"
                  />
                  <span className="text-xs sm:text-sm font-medium text-gray-700">Under Maintenance</span>
                </label>

                {/* Upcoming */}
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="status"
                    value="upcoming"
                    checked={status === 'upcoming'}
                    onChange={() => setStatus('upcoming')}
                    className="w-4 h-4 text-[#175C46] focus:ring-[#175C46] border-gray-300 cursor-pointer accent-[#175C46]"
                  />
                  <span className="text-xs sm:text-sm font-medium text-gray-700">Upcoming</span>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Attach Branch Photo Upload Box matching Figma (5 cols) */}
          <div className="lg:col-span-5 space-y-1.5">
            <label className="text-xs sm:text-sm font-semibold text-gray-800 block">
              Attach Branch photo <span className="text-gray-400 font-normal">(Optional)</span>
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handlePhotoSelect(e.target.files[0]);
                }
              }}
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              className={`w-full min-h-[220px] rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-6 text-center cursor-pointer bg-white relative ${
                isDragOver
                  ? 'border-[#175C46] bg-[#E8F8F0]/30'
                  : 'border-gray-200/90 hover:border-gray-300'
              }`}
            >
              {photoPreview ? (
                <div className="relative w-full h-44 rounded-xl overflow-hidden group">
                  <Image
                    src={photoPreview}
                    alt="Branch Photo Preview"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="px-3 py-1.5 bg-white text-gray-900 rounded-lg text-xs font-semibold shadow-xs hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      Change Photo
                    </button>
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold shadow-xs hover:bg-rose-700 transition-colors cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Camera Icon in Mint Circle */}
                  <div className="w-12 h-12 rounded-full bg-[#E8F8F0] text-[#175C46] flex items-center justify-center mb-3 shrink-0 shadow-2xs">
                    <svg
                      className="w-6 h-6 stroke-current"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.8"
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
                  <span className="text-xs sm:text-sm font-semibold text-gray-700">
                    Click to upload or drag and drop
                  </span>
                  <span className="text-[11px] text-gray-400 mt-1">
                    JPG, PNG &bull; Max 5MB
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Full-Width Save Button matching Figma */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-[#175C46] hover:bg-[#124B38] text-white font-semibold rounded-xl text-xs sm:text-sm transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>{isEdit ? 'Updating Branch...' : 'Saving Branch...'}</span>
              </>
            ) : (
              <span>Save</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

