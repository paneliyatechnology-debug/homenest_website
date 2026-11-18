'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Dialog } from 'primereact/dialog';
import { FoodMenuItem, MealType } from '@/types/food-menu';
import { foodMenuService } from '@/services/food-menu.service';
import { Branch } from '@/types/branch';
import { branchService } from '@/services/branch.service';
import { Dropdown, AppDatePicker } from '@/components/ui';

interface FoodMenuFormModalProps {
  visible: boolean;
  onHide: () => void;
  onSuccess: () => void;
  initialItem?: FoodMenuItem | null;
  defaultDate?: string;
  defaultMealType?: MealType;
  defaultBranchId?: number | string;
  branches?: Branch[];
}

// Helper to format date string to YYYY-MM-DD
function formatDateToYYYYMMDD(d?: string | Date): string {
  if (!d) {
    const now = new Date();
    return now.toISOString().slice(0, 10);
  }
  if (typeof d === 'string') {
    // Check if "DD/MM/YYYY" or "DD-MM-YYYY"
    const clean = d.split(' ')[0];
    const slashParts = clean.split('/');
    if (slashParts.length === 3 && slashParts[0].length === 2 && slashParts[2].length === 4) {
      return `${slashParts[2]}-${slashParts[1]}-${slashParts[0]}`;
    }
    const parts = clean.split('-');
    if (parts.length === 3 && parts[0].length === 2 && parts[2].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return clean;
  }
  return d.toISOString().slice(0, 10);
}

// Helper to convert time strings ("08:00 AM", "8:00 AM", "08:00") into HTML5 <input type="time"> value ("HH:mm")
function toTimeInputValue(timeStr?: string | null): string {
  if (!timeStr || !timeStr.trim()) return '';
  const clean = timeStr.trim();

  // If already in 24-hour "HH:mm" format
  const match24 = clean.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const h = String(parseInt(match24[1], 10)).padStart(2, '0');
    return `${h}:${match24[2]}`;
  }

  // If 12-hour format with AM/PM (e.g. "08:00 AM", "07:30 pm")
  const match12 = clean.match(/^(\d{1,2}):(\d{2})(?:\s*([AP]M))?$/i);
  if (!match12) return clean;

  let hours = parseInt(match12[1], 10);
  const minutes = match12[2];
  const ampm = match12[3] ? match12[3].toUpperCase() : null;

  if (ampm === 'PM' && hours < 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;

  return `${String(hours).padStart(2, '0')}:${minutes}`;
}

// Helper to convert HTML5 <input type="time"> value ("HH:mm", e.g. "08:00", "14:30") into API format ("08:00 AM", "02:30 PM")
function toApiTimeString(timeStr?: string | null): string {
  if (!timeStr || !timeStr.trim()) return '';
  const clean = timeStr.trim();

  // If already in 12-hour format with AM/PM
  if (/([AP]M)$/i.test(clean)) {
    return clean;
  }

  const match = clean.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return clean;

  const hours24 = parseInt(match[1], 10);
  const minutes = match[2];
  const ampm = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;

  return `${String(hours12).padStart(2, '0')}:${minutes} ${ampm}`;
}

export const FoodMenuFormModal: React.FC<FoodMenuFormModalProps> = ({
  visible,
  onHide,
  onSuccess,
  initialItem,
  defaultDate,
  defaultMealType,
  defaultBranchId,
  branches: propBranches,
}) => {
  const [fetchedBranches, setFetchedBranches] = useState<Branch[]>([]);

  useEffect(() => {
    if (visible && (!propBranches || propBranches.length === 0)) {
      branchService
        .getBranches({ limit: 100 })
        .then((res) => {
          if (res?.data && res.data.length > 0) {
            setFetchedBranches(res.data);
          }
        })
        .catch((err) => console.warn('Failed to load branches:', err));
    }
  }, [visible, propBranches]);

  const branches = propBranches && propBranches.length > 0 ? propBranches : fetchedBranches;

  const effectiveBranchId = (() => {
    if (initialItem?.branch_id) return String(initialItem.branch_id);
    if (defaultBranchId && defaultBranchId !== 'all') {
      const found = branches.find((b) => String(b.id) === String(defaultBranchId));
      if (found) return String(found.id);
    }
    if (branches.length > 0) return String(branches[0].id);
    return '';
  })();

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#EBF7F2] text-[#175C46] flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">
              {initialItem ? 'Edit Menu Item' : 'Add Food Menu Item'}
            </h3>
            <p className="text-xs text-gray-500">
              {initialItem
                ? 'Update dining item, timings & included items'
                : 'Schedule a meal for resident breakfast, lunch or dinner'}
            </p>
          </div>
        </div>
      }
      style={{ width: '92vw', maxWidth: '640px' }}
      modal
      className="food-menu-modal"
      dismissableMask
      baseZIndex={1000}
    >
      {visible && (
        <FoodMenuFormContent
          key={initialItem ? `edit-${initialItem.id}` : `create-${defaultDate || 'now'}-${defaultMealType || 'b'}-${effectiveBranchId}`}
          initialItem={initialItem}
          defaultDate={defaultDate}
          defaultMealType={defaultMealType}
          defaultBranchId={defaultBranchId}
          branches={branches}
          onHide={onHide}
          onSuccess={onSuccess}
        />
      )}
    </Dialog>
  );
};

interface FoodMenuFormContentProps {
  initialItem?: FoodMenuItem | null;
  defaultDate?: string;
  defaultMealType?: MealType;
  defaultBranchId?: number | string;
  branches: Branch[];
  onHide: () => void;
  onSuccess: () => void;
}

const FoodMenuFormContent: React.FC<FoodMenuFormContentProps> = ({
  initialItem,
  defaultDate,
  defaultMealType,
  defaultBranchId,
  branches,
  onHide,
  onSuccess,
}) => {
  const isEdit = Boolean(initialItem);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initial states directly initialized without effect cascades
  const [branchId, setBranchId] = useState<string>(() => {
    if (initialItem?.branch_id) return String(initialItem.branch_id);
    if (defaultBranchId && defaultBranchId !== 'all') {
      const found = branches.find((b) => String(b.id) === String(defaultBranchId));
      if (found) return String(found.id);
    }
    if (branches.length > 0) return String(branches[0].id);
    return '';
  });

  const [menuDate, setMenuDate] = useState<string>(() => {
    if (initialItem?.menu_date) return formatDateToYYYYMMDD(initialItem.menu_date);
    return defaultDate ? formatDateToYYYYMMDD(defaultDate) : formatDateToYYYYMMDD();
  });

  const [mealType, setMealType] = useState<MealType>(() => {
    return initialItem?.meal_type || defaultMealType || 'breakfast';
  });

  const [name, setName] = useState<string>(() => initialItem?.name || '');
  const [description, setDescription] = useState<string>(() => initialItem?.description || '');

  // Native time inputs use 24-hr "HH:mm" (e.g. "08:00", "10:30")
  const [startTime, setStartTime] = useState<string>(() => {
    if (initialItem?.start_time) return toTimeInputValue(initialItem.start_time);
    if (defaultMealType === 'lunch') return '12:30';
    if (defaultMealType === 'dinner') return '19:30';
    return '08:00';
  });

  const [endTime, setEndTime] = useState<string>(() => {
    if (initialItem?.end_time) return toTimeInputValue(initialItem.end_time);
    if (defaultMealType === 'lunch') return '14:30';
    if (defaultMealType === 'dinner') return '21:30';
    return '10:30';
  });

  const [includedItems, setIncludedItems] = useState<string>(() => initialItem?.included_items || '');
  const [isActive, setIsActive] = useState<boolean>(() => initialItem?.is_active ?? true);
  const sortOrder = initialItem?.sort_order ?? 0;

  // Image states
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    () => initialItem?.image_url || initialItem?.image || null
  );

  // Submission & Validation states
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update time suggestion if meal type changes in create mode
  const handleMealTypeChange = (type: MealType) => {
    setMealType(type);
    if (!isEdit) {
      if (type === 'breakfast') {
        setStartTime('08:00');
        setEndTime('10:30');
      } else if (type === 'lunch') {
        setStartTime('12:30');
        setEndTime('14:30');
      } else if (type === 'dinner') {
        setStartTime('19:30');
        setEndTime('21:30');
      }
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!branchId) errs.branchId = 'Branch is required';
    if (!menuDate) errs.menuDate = 'Menu date is required';
    if (!name.trim()) errs.name = 'Menu item name is required';
    if (!startTime.trim()) errs.startTime = 'Start time is required';
    if (!endTime.trim()) errs.endTime = 'End time is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('branch_id', branchId);
      fd.append('menu_date', menuDate);
      fd.append('meal_type', mealType);
      fd.append('name', name.trim());
      if (description.trim()) {
        fd.append('description', description.trim());
      }
      // Formatted to API requirement e.g. "08:00 AM", "10:30 AM"
      fd.append('start_time', toApiTimeString(startTime));
      fd.append('end_time', toApiTimeString(endTime));
      if (includedItems.trim()) {
        fd.append('included_items', includedItems.trim());
      }
      fd.append('is_active', String(isActive));
      fd.append('sort_order', String(sortOrder));

      if (imageFile) {
        fd.append('image', imageFile);
      } else if (isEdit && !imagePreview) {
        fd.append('image', 'null');
      }

      if (isEdit && initialItem) {
        await foodMenuService.updateFoodMenuItem(initialItem.id, fd);
      } else {
        await foodMenuService.createFoodMenuItem(fd);
      }

      onSuccess();
      onHide();
    } catch (err) {
      console.error('Failed to save food menu item:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-1">
      {/* 1. Meal Type at the very top */}
      <div>
        <label className="block text-xs font-semibold text-gray-800 mb-1.5">
          Meal Type <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-gray-100 rounded-xl">
          {(
            [
              { type: 'breakfast', label: 'Breakfast', icon: '☀️' },
              { type: 'lunch', label: 'Lunch', icon: '🍲' },
              { type: 'dinner', label: 'Dinner', icon: '🌙' },
            ] as const
          ).map((item) => {
            const selected = mealType === item.type;
            return (
              <button
                key={item.type}
                type="button"
                onClick={() => handleMealTypeChange(item.type)}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selected
                    ? 'bg-white text-[#175C46] shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Photo on Left + (Branch, Date, Item Name) on Right */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch pb-3.5 border-b border-gray-100">
        {/* Square Food Photo (1:1 format) */}
        <div className="w-32 sm:w-36 shrink-0 flex flex-col mx-auto sm:mx-0">
          <label className="block text-xs font-semibold text-gray-800 mb-1.5 text-center sm:text-left">
            Food Photo
          </label>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />

          {imagePreview && imagePreview !== 'null' && imagePreview !== 'undefined' ? (
            <div className="relative flex-1 w-full min-h-[124px] rounded-2xl border border-gray-200 overflow-hidden bg-gray-50 group shadow-2xs">
              <Image
                src={imagePreview}
                alt="Food Preview"
                fill
                className="object-cover"
                unoptimized
              />
              {/* Quick remove cross button on top-right */}
              <button
                type="button"
                onClick={handleRemoveImage}
                title="Remove photo"
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 hover:bg-red-600 text-white flex items-center justify-center transition-colors shadow-xs z-10 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              {/* Hover overlay with Change action */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white"
              >
                <svg className="w-5 h-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-[11px] font-semibold">Change Photo</span>
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 w-full min-h-[124px] rounded-2xl border-2 border-dashed border-gray-200 hover:border-[#175C46] flex flex-col items-center justify-center p-3 text-center text-gray-500 hover:text-[#175C46] bg-gray-50/70 hover:bg-emerald-50/20 transition-all cursor-pointer group shadow-2xs"
            >
              <div className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-400 group-hover:text-[#175C46] group-hover:border-[#175C46]/30 shadow-2xs transition-colors mb-1.5">
                <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-gray-700 group-hover:text-[#175C46] block leading-tight">
                Upload Photo
              </span>
              <span className="text-[10px] text-gray-400 block mt-0.5">Square 1:1</span>
            </div>
          )}
        </div>

        {/* Right Columns: Branch & Date + Item Name */}
        <div className="flex-1 min-w-0 flex flex-col justify-between gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-800 mb-1.5">
                Branch <span className="text-red-500">*</span>
              </label>
              <Dropdown
                value={branchId}
                onChange={(e) => {
                  setBranchId(e.target.value);
                  if (errors.branchId) setErrors((prev) => ({ ...prev, branchId: '' }));
                }}
                error={errors.branchId}
                options={branches.map((b) => ({
                  label: b.name,
                  value: b.id,
                }))}
                placeholder="Select branch"
              />
            </div>

            <div>
              <label htmlFor="food-menu-form-menu-date" className="block text-xs font-semibold text-gray-800 mb-1.5">
                Menu Date <span className="text-red-500">*</span>
              </label>
              <AppDatePicker
                id="food-menu-form-menu-date"
                value={menuDate}
                onChange={(val) => {
                  setMenuDate(val);
                  if (errors.menuDate) setErrors((prev) => ({ ...prev, menuDate: '' }));
                }}
                dateFormat="dd/mm/yy"
                placeholder="dd/mm/yyyy"
                hasError={Boolean(errors.menuDate)}
                appendTo={typeof document !== 'undefined' ? document.body : undefined}
              />
              {errors.menuDate && <p className="text-[11px] text-red-500 mt-1">{errors.menuDate}</p>}
            </div>
          </div>

          {/* Item Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-800 mb-1.5">
              Item Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
              }}
              placeholder="e.g. Aloo Paratha with Curd & Pickle"
              className={`w-full h-11 px-4 bg-white border ${
                errors.name
                  ? 'border-red-500'
                  : 'border-gray-200/90 hover:border-gray-300 focus:border-[#175C46] focus:ring-1 focus:ring-[#175C46]'
              } rounded-xl text-xs sm:text-sm focus:outline-none transition-all shadow-2xs text-gray-800 placeholder-gray-400 font-sans`}
            />
            {errors.name && <p className="text-[11px] text-red-500 mt-1">{errors.name}</p>}
          </div>
        </div>
      </div>

      {/* Start Time & End Time */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-800 mb-1.5">
            Serving Start Time <span className="text-red-500">*</span>
          </label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => {
              setStartTime(e.target.value);
              if (errors.startTime) setErrors((prev) => ({ ...prev, startTime: '' }));
            }}
            className={`w-full h-11 px-4 bg-white border ${
              errors.startTime
                ? 'border-red-500'
                : 'border-gray-200/90 hover:border-gray-300 focus:border-[#175C46] focus:ring-1 focus:ring-[#175C46]'
            } rounded-xl text-xs sm:text-sm focus:outline-none transition-all shadow-2xs text-gray-800 font-sans`}
          />
          {errors.startTime && <p className="text-[11px] text-red-500 mt-1">{errors.startTime}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-800 mb-1.5">
            Serving End Time <span className="text-red-500">*</span>
          </label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => {
              setEndTime(e.target.value);
              if (errors.endTime) setErrors((prev) => ({ ...prev, endTime: '' }));
            }}
            className={`w-full h-11 px-4 bg-white border ${
              errors.endTime
                ? 'border-red-500'
                : 'border-gray-200/90 hover:border-gray-300 focus:border-[#175C46] focus:ring-1 focus:ring-[#175C46]'
            } rounded-xl text-xs sm:text-sm focus:outline-none transition-all shadow-2xs text-gray-800 font-sans`}
          />
          {errors.endTime && <p className="text-[11px] text-red-500 mt-1">{errors.endTime}</p>}
        </div>
      </div>

      {/* Included Items */}
      <div>
        <label className="block text-xs font-semibold text-gray-800 mb-1.5">
          Included Accompaniments / Beverages
        </label>
        <input
          type="text"
          value={includedItems}
          onChange={(e) => setIncludedItems(e.target.value)}
          placeholder="e.g. Hot Tea, Fresh Curd, Mixed Pickle, Salad"
          className="w-full h-11 px-4 bg-white border border-gray-200/90 hover:border-gray-300 focus:border-[#175C46] focus:ring-1 focus:ring-[#175C46] rounded-xl text-xs sm:text-sm focus:outline-none transition-all shadow-2xs text-gray-800 placeholder-gray-400 font-sans"
        />
        <p className="text-[11px] text-gray-400 mt-1">Separate complementary items by commas.</p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-semibold text-gray-800 mb-1.5">
          Description / Special Notes
        </label>
        <textarea
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Freshly prepared wheat flatbread stuffed with spiced potatoes and butter"
          className="w-full p-3.5 bg-white border border-gray-200/90 hover:border-gray-300 focus:border-[#175C46] focus:ring-1 focus:ring-[#175C46] rounded-xl text-xs sm:text-sm focus:outline-none transition-all shadow-2xs text-gray-800 placeholder-gray-400 font-sans resize-none"
        />
      </div>

      {/* Active Checkbox */}
      <div className="pt-1">
        <label className="flex items-center gap-3 cursor-pointer select-none p-3 rounded-xl bg-gray-50/80 hover:bg-gray-100/70 border border-gray-200/70 transition-colors">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 rounded text-[#175C46] focus:ring-[#175C46] accent-[#175C46] shrink-0"
          />
          <div>
            <span className="text-xs font-bold text-gray-800 block">
              Active (Visible on Resident Portal)
            </span>
            <span className="text-[11px] text-gray-500 block">
              When checked, residents can view this meal on their dining schedule.
            </span>
          </div>
        </label>
      </div>

      {/* Modal Action Buttons */}
      <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onHide}
          disabled={submitting}
          className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2 rounded-xl bg-[#175C46] hover:bg-[#134e3b] text-white text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
        >
          {submitting && (
            <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          )}
          <span>{isEdit ? 'Save Changes' : 'Add to Menu'}</span>
        </button>
      </div>
    </form>
  );
};
