'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';

export interface PhotoUploadProps {
  /** Label displayed above the upload dropzone */
  label?: string;
  /** Whether the field is optional (renders "(Optional)" tag) */
  optional?: boolean;
  /** Whether the field is required (renders red/brand asterisk) */
  required?: boolean;
  /** Current image preview URL (either object URL or remote URL) */
  previewUrl: string | null;
  /** Current File object if a local file was chosen */
  file?: File | null;
  /** Visual shape of the preview: 'circle' for user profiles, 'rounded' for property/branch cards */
  shape?: 'circle' | 'rounded';
  /** Max allowable file size in Megabytes (defaults to 5) */
  maxSizeMB?: number;
  /** MIME types accepted by file input */
  acceptedTypes?: string;
  /** Optional error text to display below the dropzone */
  error?: string;
  /** Optional helper text */
  helperText?: string;
  /** Additional container styling */
  className?: string;
  /** Callback fired when a valid image file is selected or dropped */
  onSelectFile: (file: File) => void;
  /** Callback fired when the photo is removed */
  onRemove: () => void;
  /** Optional callback fired when client-side validation fails */
  onError?: (errorMessage: string) => void;
}

export const PhotoUpload: React.FC<PhotoUploadProps> = ({
  label = 'Attach photo',
  optional = true,
  required = false,
  previewUrl,
  file,
  shape = 'circle',
  maxSizeMB = 5,
  acceptedTypes = 'image/png,image/jpeg,image/jpg',
  error,
  helperText,
  className = '',
  onSelectFile,
  onRemove,
  onError,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (selectedFile: File) => {
    // Validate file type
    if (!selectedFile.type.startsWith('image/')) {
      const msg = 'Please upload a valid image file (JPG, PNG).';
      onError?.(msg);
      return;
    }

    // Validate size
    if (selectedFile.size > maxSizeMB * 1024 * 1024) {
      const msg = `Photo must be less than ${maxSizeMB}MB.`;
      onError?.(msg);
      return;
    }

    onSelectFile(selectedFile);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onRemove();
  };

  return (
    <div className={`space-y-1.5 w-full ${className}`}>
      {/* Field Label */}
      {label && (
        <label className="text-xs sm:text-sm font-semibold text-gray-700 block">
          {label}{' '}
          {required && <span className="text-[#175C46] font-bold">*</span>}
          {optional && !required && (
            <span className="text-gray-400 font-normal">(Optional)</span>
          )}
        </label>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes}
        onChange={handleInputChange}
        className="hidden"
      />

      {previewUrl ? (
        /* Card state when photo is attached - cleanly styled matching HomeNest UI */
        <div className="h-[260px] border border-gray-200 bg-gradient-to-b from-[#F7FAF8] to-white rounded-2xl p-5 flex flex-col items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.03)] relative">
          {/* Top Status Tag */}
          <div className="w-full flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#EBF7F2] text-[#175C46]">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Photo Attached
            </span>
            {file ? (
              <span
                className="text-[11px] text-gray-400 font-medium truncate max-w-[140px] cursor-pointer"
                title={file.name}
              >
                {(file.size / 1024 / 1024).toFixed(1)} MB
              </span>
            ) : (
              <span className="text-[11px] text-gray-400 font-medium">Saved</span>
            )}
          </div>

          {/* Centered Preview with hover change effect */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`relative overflow-hidden border-4 border-white shadow-md ring-2 ring-[#175C46]/20 cursor-pointer group transition-transform hover:scale-[1.02] ${
              shape === 'circle'
                ? 'w-28 h-28 rounded-full'
                : 'w-44 h-28 rounded-xl'
            }`}
            title="Click to change photo"
          >
            <Image
              src={previewUrl}
              alt="Photo Preview"
              fill
              className="object-cover transition-transform group-hover:scale-105"
              unoptimized
            />
            <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[11px] font-medium gap-0.5">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
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
              <span>Change</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 w-full justify-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-all flex items-center gap-1.5 shadow-2xs hover:border-gray-300 cursor-pointer"
            >
              <svg
                className="w-3.5 h-3.5 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              <span>Change Photo</span>
            </button>
            <button
              type="button"
              onClick={handleRemoveClick}
              className="px-3.5 py-1.5 rounded-xl border border-red-200 bg-red-50/60 hover:bg-red-100 text-xs font-semibold text-red-600 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <svg
                className="w-3.5 h-3.5 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
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
            setIsDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragging(false);
          }}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`h-[260px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-4 cursor-pointer transition-all bg-gray-50/40 text-center relative overflow-hidden group ${
            isDragging
              ? 'border-[#175C46] bg-emerald-50/30'
              : 'border-gray-200 hover:border-[#175C46] hover:bg-emerald-50/10'
          }`}
        >
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-[#EBF7F2] text-[#175C46] flex items-center justify-center mb-2.5 transition-transform group-hover:scale-110">
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
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
            <p className="text-xs sm:text-sm font-semibold text-gray-700">
              Click to upload or drag and drop
            </p>
            <p className="text-[11px] text-gray-400 mt-1">
              JPG, PNG &bull; Max {maxSizeMB}MB
            </p>
          </div>
        </div>
      )}

      {/* Validation Error Message */}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

      {/* Helper Text */}
      {!error && helperText && (
        <p className="text-[11px] text-gray-400 mt-1">{helperText}</p>
      )}
    </div>
  );
};

