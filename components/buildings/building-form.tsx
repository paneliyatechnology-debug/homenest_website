'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Building, BuildingFormData, BuildingFloorInput } from '@/types/building';
import { Branch } from '@/types/branch';
import { buildingService } from '@/services/building.service';
import { branchService } from '@/services/branch.service';
import {
  PageHeader,
  TextInput,
  Dropdown,
  BrandLoader,
} from '@/components/ui';
import { toast } from '@/lib/toast';

interface BuildingFormProps {
  initialData?: Building | null;
  mode: 'create' | 'edit';
}

export const initialBuildingFormData: BuildingFormData = {
  branch_id: '',
  name: '',
  floors: [
    { floor_number: 1, name: '1st Floor' },
  ],
};

export const buildBuildingFormData = (data?: Building | null): BuildingFormData => ({
  branch_id: data?.branch_id !== undefined && data?.branch_id !== null ? String(data.branch_id) : '',
  name: data?.name || '',
  floors:
    data?.floors && data.floors.length > 0
      ? data.floors.map((f) => ({
          id: f.id !== undefined ? String(f.id) : undefined,
          floor_number: f.floor_number,
          name: f.name,
        }))
      : [{ floor_number: 1, name: '1st Floor' }],
});

const getOrdinalFloorName = (num: number): string => {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = num % 100;
  const suffix = suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0];
  return `${num}${suffix} Floor`;
};

export const BuildingForm: React.FC<BuildingFormProps> = ({ initialData, mode }) => {
  const router = useRouter();
  const isEdit = mode === 'edit';

  // Master Data
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(true);

  // Centralized Form State
  const [formData, setFormData] = useState<BuildingFormData>(() =>
    buildBuildingFormData(initialData)
  );

  // Validation & Submission
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Change Handler for Building Fields
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Floor List Actions
  const handleAddFloor = () => {
    setFormData((prev) => {
      const highestNum = prev.floors.length > 0
        ? Math.max(...prev.floors.map((f) => Number(f.floor_number) || 0))
        : 0;
      const nextNumber = highestNum + 1;
      const newFloor: BuildingFloorInput = {
        floor_number: nextNumber,
        name: getOrdinalFloorName(nextNumber),
      };
      return {
        ...prev,
        floors: [...prev.floors, newFloor],
      };
    });
    if (errors.floors) {
      setErrors((prev) => ({ ...prev, floors: '' }));
    }
  };

  const handleRemoveFloor = (index: number) => {
    if (formData.floors.length <= 1) {
      toast.warn('A building must have at least one floor.');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      floors: prev.floors.filter((_, idx) => idx !== index),
    }));
  };

  const handleFloorChange = (
    index: number,
    field: 'name' | 'floor_number',
    value: string | number
  ) => {
    setFormData((prev) => {
      const updated = [...prev.floors];
      updated[index] = {
        ...updated[index],
        [field]: field === 'floor_number' ? Number(value) || 1 : value,
      };
      return {
        ...prev,
        floors: updated,
      };
    });
  };

  // Reset form callback
  const resetForm = useCallback(() => {
    setFormData(buildBuildingFormData(isEdit ? initialData : null));
    setErrors({});
  }, [isEdit, initialData]);

  // Synchronize initialData when changed
  const [prevBuildingId, setPrevBuildingId] = useState<number | null>(initialData?.id ?? null);
  if (isEdit && initialData && initialData.id !== prevBuildingId) {
    setPrevBuildingId(initialData.id);
    setFormData(buildBuildingFormData(initialData));
    setErrors({});
  }

  // Clear uncommitted state on unmount
  useEffect(() => {
    return () => {
      if (!isEdit) resetForm();
    };
  }, [isEdit, resetForm]);

  // Load branches
  useEffect(() => {
    let isMounted = true;
    branchService
      .getBranches({ limit: 50, status: 'all', sort_by: 'created_at', order: 'desc' })
      .then((res) => {
        if (!isMounted) return;
        setBranches(res.data);
        setLoadingBranches(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setLoadingBranches(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Form Validation
  const validate = (): boolean => {
    const errs: { [key: string]: string } = {};

    if (!formData.branch_id) {
      errs.branch_id = 'Please select a branch';
    }

    if (!formData.name.trim()) {
      errs.name = 'Building name is required';
    }

    if (!formData.floors || formData.floors.length === 0) {
      errs.floors = 'At least one floor configuration is required';
    } else {
      const emptyFloor = formData.floors.some((f) => !f.name.trim());
      if (emptyFloor) {
        errs.floors = 'All floors must have a valid name';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.warn('Please complete all required fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        branch_id: String(formData.branch_id),
        name: formData.name.trim(),
        floors: formData.floors.map((f) => ({
          ...(f.id ? { id: String(f.id) } : {}),
          floor_number: Number(f.floor_number),
          name: f.name.trim(),
        })),
      };

      if (isEdit && initialData?.id) {
        await buildingService.updateBuilding(initialData.id, payload);
      } else {
        await buildingService.createBuilding(payload);
        resetForm();
      }

      router.push('/rooms/buildings');
      router.refresh();
    } catch {
      // Handled by apiClient toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-5 sm:space-y-6">
      {isSubmitting && (
        <BrandLoader
          overlay
          message={isEdit ? 'Updating building details...' : 'Creating new building...'}
        />
      )}

      {/* Page Header */}
      <PageHeader
        title={isEdit ? 'Edit Building' : 'Add new building'}
        subtitle={isEdit ? 'Update building and floor configuration.' : 'Create a new building and configure its floors.'}
        backHref="/rooms/buildings"
        backTitle="Back to Buildings"
        onBackClick={() => {
          if (!isEdit) resetForm();
        }}
      />

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-6">
          {/* Row 1: Branch & Building Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Dropdown
              label="Branch"
              name="branch_id"
              required
              value={formData.branch_id}
              onChange={handleChange}
              disabled={loadingBranches}
              placeholder={loadingBranches ? 'Loading branches...' : 'Select branch'}
              options={branches.map((b) => ({
                label: b.name,
                value: String(b.id),
              }))}
              error={errors.branch_id}
            />

            <TextInput
              label="Building Name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter building name (e.g. Block A)"
              error={errors.name}
            />
          </div>

          {/* Section: Floor Configuration Builder */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs sm:text-sm font-semibold text-gray-800 block">
                  Floors Configuration <span className="text-[#175C46]">*</span>
                </label>
                <p className="text-[11px] text-gray-500">
                  Configure floor numbers and descriptive names for this building.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddFloor}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#E8F8F0] hover:bg-[#d5f3e5] text-[#175C46] font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Floor</span>
              </button>
            </div>

            {errors.floors && (
              <p className="text-xs text-rose-500 font-medium">{errors.floors}</p>
            )}

            {/* Floor List Rows */}
            <div className="space-y-3 pt-1">
              {formData.floors.map((floor, index) => (
                <div
                  key={index}
                  className="p-3.5 bg-gray-50/70 hover:bg-gray-50 rounded-xl border border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 transition-colors"
                >
                  <div className="flex items-center gap-2 sm:w-36 shrink-0">
                    <span className="w-7 h-7 rounded-lg bg-[#175C46] text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <div className="w-full">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={floor.floor_number}
                        onChange={(e) =>
                          handleFloorChange(index, 'floor_number', e.target.value)
                        }
                        className="w-full h-9 px-3 rounded-lg border border-gray-200 text-xs font-semibold text-gray-800 bg-white outline-none focus:border-[#175C46]"
                        placeholder="Floor #"
                        title="Floor Number"
                      />
                    </div>
                  </div>

                  <div className="flex-1">
                    <input
                      type="text"
                      value={floor.name}
                      onChange={(e) =>
                        handleFloorChange(index, 'name', e.target.value)
                      }
                      className="w-full h-9 px-3 rounded-lg border border-gray-200 text-xs font-medium text-gray-800 bg-white outline-none focus:border-[#175C46]"
                      placeholder={`e.g. ${getOrdinalFloorName(floor.floor_number || index + 1)}`}
                    />
                  </div>

                  {formData.floors.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveFloor(index)}
                      className="w-9 h-9 shrink-0 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer self-end sm:self-center"
                      title="Remove Floor"
                    >
                      <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Submit Button */}
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
