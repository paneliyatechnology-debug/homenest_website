'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Room, RoomStatus, BuildingItem, FloorItem } from '@/types/room';
import { Branch } from '@/types/branch';
import { roomService } from '@/services/room.service';
import { branchService } from '@/services/branch.service';
import {
  PageHeader,
  TextInput,
  RadioGroup,
  PhotoUpload,
  BrandLoader,
  Dropdown,
} from '@/components/ui';
import { toast } from '@/lib/toast';

export interface RoomFormData {
  room_no: string;
  room_type: string;
  branch_id: string;
  building_id: string;
  floor_id: string;
  status: RoomStatus | '';
  pg_id: string;
  photoFile: File | null;
  photoPreview: string | null;
}

export const initialRoomFormData: RoomFormData = {
  room_no: '',
  room_type: '',
  branch_id: '',
  building_id: '',
  floor_id: '',
  status: 'vacant',
  pg_id: '',
  photoFile: null,
  photoPreview: null,
};

export const buildRoomFormData = (data?: Room | null): RoomFormData => ({
  room_no: data?.room_no || '',
  room_type: data?.room_type || '',
  branch_id: data?.branch_id !== undefined && data?.branch_id !== null ? String(data.branch_id) : '',
  building_id: data?.building_id !== undefined && data?.building_id !== null ? String(data.building_id) : '',
  floor_id: data?.floor_id !== undefined && data?.floor_id !== null ? String(data.floor_id) : '',
  status: (data?.status as RoomStatus) || 'vacant',
  pg_id: data?.pg_id !== undefined && data?.pg_id !== null ? String(data.pg_id) : '',
  photoFile: null,
  photoPreview: data?.image_url || data?.image || null,
});

interface RoomFormProps {
  initialData?: Room | null;
  mode: 'create' | 'edit';
}

const ROOM_TYPE_OPTIONS = [
  { label: 'Single', value: 'single' },
  { label: 'Double Sharing', value: 'double' },
  { label: 'Triple Sharing', value: 'triple' },
  { label: 'Four Sharing', value: 'four' },
];

const STATUS_RADIO_OPTIONS = [
  { label: 'Occupies', value: 'occupied' },
  { label: 'Vacant', value: 'vacant' },
  { label: 'Maintenance', value: 'maintenance' },
  { label: 'Out of service', value: 'out_of_service' },
];

export const RoomForm: React.FC<RoomFormProps> = ({ initialData, mode }) => {
  const router = useRouter();
  const isEdit = mode === 'edit';

  // Master Data Lists
  const [branches, setBranches] = useState<Branch[]>([]);
  const [buildings, setBuildings] = useState<BuildingItem[]>([]);
  const [floors, setFloors] = useState<FloorItem[]>([]);

  // Loading States
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [loadingBuildings, setLoadingBuildings] = useState(false);
  const [loadingFloors, setLoadingFloors] = useState(false);

  // Centralized Form State without hardcoded default values
  const [formData, setFormData] = useState<RoomFormData>(() =>
    buildRoomFormData(initialData)
  );

  // Validation & Submission
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reusable Single Change Handler for standard inputs
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

  // Cascading Handler: Branch Selection Change
  const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const branchId = e.target.value;
    const selectedBranch = branches.find((b) => String(b.id) === String(branchId));

    setFormData((prev) => ({
      ...prev,
      branch_id: branchId,
      pg_id: selectedBranch?.pg_id ? String(selectedBranch.pg_id) : prev.pg_id,
      building_id: '',
      floor_id: '',
    }));

    // Reset downstream options
    setFloors([]);

    if (errors.branch_id) {
      setErrors((prev) => ({ ...prev, branch_id: '' }));
    }

    if (!branchId) {
      setBuildings([]);
      return;
    }

    setLoadingBuildings(true);
    roomService
      .getBuildings(branchId)
      .then((data) => {
        setBuildings(data);
      })
      .catch(() => {
        setBuildings([]);
      })
      .finally(() => {
        setLoadingBuildings(false);
      });
  };

  // Cascading Handler: Building Selection Change
  const handleBuildingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const buildingId = e.target.value;

    setFormData((prev) => ({
      ...prev,
      building_id: buildingId,
      floor_id: '',
    }));

    if (errors.building_id) {
      setErrors((prev) => ({ ...prev, building_id: '' }));
    }

    if (!buildingId) {
      setFloors([]);
      return;
    }

    setLoadingFloors(true);
    roomService
      .getFloors(buildingId)
      .then((data) => {
        setFloors(data);
      })
      .catch(() => {
        setFloors([]);
      })
      .finally(() => {
        setLoadingFloors(false);
      });
  };

  // Cascading Handler: Floor Selection Change
  const handleFloorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const floorId = e.target.value;
    setFormData((prev) => ({
      ...prev,
      floor_id: floorId,
    }));
    if (errors.floor_id) {
      setErrors((prev) => ({ ...prev, floor_id: '' }));
    }
  };

  // Reusable Field Change Handler for custom controls (Radios, etc.)
  const handleFieldChange = <K extends keyof RoomFormData>(
    field: K,
    value: RoomFormData[K]
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

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setFormData(buildRoomFormData(isEdit ? initialData : null));
    setErrors({});
    if (!isEdit) {
      setBuildings([]);
      setFloors([]);
    }
  }, [isEdit, initialData]);

  const [prevRoomId, setPrevRoomId] = useState<number | null>(initialData?.id ?? null);

  // Synchronize on initialData changes in edit mode
  if (isEdit && initialData && initialData.id !== prevRoomId) {
    setPrevRoomId(initialData.id);
    setFormData(buildRoomFormData(initialData));
    setErrors({});
  }

  // Clear uncommitted state when navigating away
  useEffect(() => {
    return () => {
      if (!isEdit) {
        resetForm();
      }
    };
  }, [isEdit, resetForm]);

  // Load branches on mount, and pre-load downstream buildings & floors in edit mode
  useEffect(() => {
    let isMounted = true;

    // 1. Fetch Branches via API
    branchService
      .getBranches({ limit: 100 })
      .then((res) => {
        if (!isMounted) return;
        setBranches(res.data);
        setLoadingBranches(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setBranches([]);
        setLoadingBranches(false);
      });

    // 2. Pre-fetch buildings if editing an existing room with branch_id
    if (initialData?.branch_id) {
      roomService
        .getBuildings(initialData.branch_id)
        .then((bData) => {
          if (!isMounted) return;
          setBuildings(bData);
        })
        .catch(() => {
          if (!isMounted) return;
          setBuildings([]);
        });
    }

    // 3. Pre-fetch floors if editing an existing room with building_id
    if (initialData?.building_id) {
      roomService
        .getFloors(initialData.building_id)
        .then((fData) => {
          if (!isMounted) return;
          setFloors(fData);
        })
        .catch(() => {
          if (!isMounted) return;
          setFloors([]);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [initialData?.branch_id, initialData?.building_id]);

  // Validation
  const validateField = (field: string, value: unknown): string => {
    switch (field) {
      case 'room_no': {
        const val = typeof value === 'string' ? value.trim() : '';
        if (!val) return 'Room number is required';
        return '';
      }
      case 'branch_id': {
        if (!value) return 'Please select a branch';
        return '';
      }
      case 'building_id': {
        if (!value) return 'Please select a building';
        return '';
      }
      case 'floor_id': {
        if (!value) return 'Please select a floor';
        return '';
      }
      case 'room_type': {
        if (!value) return 'Please select room type';
        return '';
      }
      case 'status': {
        if (!value) return 'Please select a status';
        return '';
      }
      default:
        return '';
    }
  };

  const validate = (): boolean => {
    const errs: { [key: string]: string } = {};

    const roomErr = validateField('room_no', formData.room_no);
    if (roomErr) errs.room_no = roomErr;

    const branchErr = validateField('branch_id', formData.branch_id);
    if (branchErr) errs.branch_id = branchErr;

    const buildingErr = validateField('building_id', formData.building_id);
    if (buildingErr) errs.building_id = buildingErr;

    const floorErr = validateField('floor_id', formData.floor_id);
    if (floorErr) errs.floor_id = floorErr;

    const typeErr = validateField('room_type', formData.room_type);
    if (typeErr) errs.room_type = typeErr;

    const statusErr = validateField('status', formData.status);
    if (statusErr) errs.status = statusErr;

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Handle Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.warn('Please complete all required fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = new FormData();
      payload.append('room_no', formData.room_no.trim());
      payload.append('room_type', formData.room_type);
      payload.append('branch_id', formData.branch_id);
      payload.append('building_id', formData.building_id);
      payload.append('floor_id', formData.floor_id);
      payload.append('status', formData.status || 'vacant');
      if (formData.pg_id) {
        payload.append('pg_id', formData.pg_id);
      }

      if (formData.photoFile) {
        payload.append('image', formData.photoFile);
      } else if (isEdit && !formData.photoPreview) {
        payload.append('image', 'null');
      }

      if (isEdit && initialData?.id) {
        await roomService.updateRoom(initialData.id, payload);
      } else {
        await roomService.createRoom(payload);
        resetForm();
      }

      router.push('/dashboard/rooms');
      router.refresh();
    } catch {
      // Backend error toast handled automatically by apiClient
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper text/placeholders for dependent dropdowns
  const buildingPlaceholder = !formData.branch_id
    ? 'Select branch first'
    : loadingBuildings
    ? 'Loading buildings...'
    : buildings.length === 0
    ? 'No buildings available'
    : 'Select building';

  const floorPlaceholder = !formData.branch_id
    ? 'Select branch first'
    : !formData.building_id
    ? 'Select building first'
    : loadingFloors
    ? 'Loading floors...'
    : floors.length === 0
    ? 'No floors available'
    : 'Select floor';

  return (
    <div className="w-full space-y-5 sm:space-y-6">
      {isSubmitting && (
        <BrandLoader
          overlay
          message={isEdit ? 'Updating room details...' : 'Creating new room...'}
        />
      )}

      {/* Header matching Figma: Back arrow + Title & Subtitle */}
      <PageHeader
        title={isEdit ? 'Edit Room' : 'Add new room'}
        subtitle={isEdit ? 'Update room details.' : 'Add a new room.'}
        backHref="/dashboard/rooms"
        backTitle="Back to Room Inventory"
        onBackClick={() => {
          if (!isEdit) resetForm();
        }}
      />

      {/* Main Form Content Container matching Figma */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl p-5 sm:p-7 border border-gray-100 shadow-2xs space-y-6">
          {/* Row 1: Branch * & Room no. * */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Dropdown
              label="Branch"
              name="branch_id"
              required
              value={formData.branch_id}
              onChange={handleBranchChange}
              disabled={loadingBranches}
              placeholder={loadingBranches ? 'Loading branches...' : 'Select branch'}
              options={branches.map((b) => ({
                label: b.name,
                value: String(b.id),
              }))}
              error={errors.branch_id}
            />

            <TextInput
              label="Room no."
              name="room_no"
              required
              value={formData.room_no}
              onChange={handleChange}
              placeholder="Enter room no."
              error={errors.room_no}
            />
          </div>

          {/* Row 2: Building & Floor Cascading Dependent Select */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Dropdown
              label="Building"
              name="building_id"
              required
              value={formData.building_id}
              onChange={handleBuildingChange}
              disabled={!formData.branch_id || loadingBuildings}
              placeholder={buildingPlaceholder}
              options={buildings.map((b) => ({
                label: b.name,
                value: String(b.id),
              }))}
              error={errors.building_id}
            />

            <Dropdown
              label="Floor"
              name="floor_id"
              required
              value={formData.floor_id}
              onChange={handleFloorChange}
              disabled={!formData.building_id || loadingFloors}
              placeholder={floorPlaceholder}
              options={floors.map((f) => ({
                label: f.name || `Floor ${f.floor_number}`,
                value: String(f.id),
              }))}
              error={errors.floor_id}
            />
          </div>

          {/* Row 3: Room type * & Status * in one row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
            <Dropdown
              label="Room type"
              name="room_type"
              required
              value={formData.room_type}
              onChange={handleChange}
              placeholder="Select room type"
              options={ROOM_TYPE_OPTIONS}
              error={errors.room_type}
            />

            <div>
              <RadioGroup
                label="Status"
                name="status"
                required
                value={formData.status}
                onChange={(val) => handleFieldChange('status', val as RoomStatus)}
                options={STATUS_RADIO_OPTIONS}
                error={errors.status}
                className="!pt-0"
              />
            </div>
          </div>

          {/* Optional Room Photo Upload */}
          <div className="pt-2">
            <PhotoUpload
              label="Attach Room photo"
              optional
              previewUrl={formData.photoPreview}
              file={formData.photoFile}
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
