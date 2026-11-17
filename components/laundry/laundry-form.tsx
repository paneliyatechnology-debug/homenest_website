'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LaundryRequest,
  LaundryStatus,
  LaundryCatalogItem,
  LaundryOrderItem,
} from '@/types/laundry';
import { laundryService } from '@/services/laundry.service';
import { residentService } from '@/services/resident.service';
import { staffService } from '@/services/staff.service';
import { Resident } from '@/types/resident';
import { StaffMember } from '@/types/staff';
import { Dropdown, AppDatePicker, AppTimePicker } from '@/components/ui';
import { useResetOnNavigation } from '@/hooks';

export interface LaundryFormProps {
  mode?: 'create' | 'edit';
  requestId?: number | string;
  initialData?: LaundryRequest | null;
}

/**
 * Normalizes any date string (DD-MM-YYYY, DD/MM/YYYY, ISO, datetime) into strict YYYY-MM-DD format
 */
export function normalizeDateToYYYYMMDD(dateStr?: string | null): string {
  if (!dateStr || !dateStr.trim()) return '';
  const clean = dateStr.trim();

  // Strip any trailing time like ' 00:00' or ' 14:30:00'
  const dateOnly = clean.split(' ')[0].split('T')[0];

  // If already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
    return dateOnly;
  }

  // If in DD-MM-YYYY or DD/MM/YYYY format
  const dmyMatch = dateOnly.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // If in YYYY/MM/DD format
  const ymdMatch = dateOnly.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, '0');
    const day = ymdMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Fallback to JS Date constructor (e.g. for "17 Nov 2026")
  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return dateOnly;
}

export const LaundryForm: React.FC<LaundryFormProps> = ({
  mode = 'create',
  requestId,
  initialData,
}) => {
  const router = useRouter();
  const isEdit = mode === 'edit';
  const targetId = requestId ?? initialData?.id;

  // Lookups
  const [residents, setResidents] = useState<Resident[]>(() => {
    if (initialData?.resident) {
      return [
        {
          id: initialData.resident.id,
          name: initialData.resident.name,
          room_no: initialData.room?.room_no,
          branch_id: initialData.branch_id,
        } as unknown as Resident,
      ];
    }
    return [];
  });

  const [staffList, setStaffList] = useState<StaffMember[]>(() => {
    if (initialData?.assigned_staff) {
      return [
        {
          id: initialData.assigned_staff.id,
          name: initialData.assigned_staff.name,
          staff_role: initialData.assigned_staff.role || 'Staff',
        } as unknown as StaffMember,
      ];
    }
    return [];
  });

  const [catalogItems, setCatalogItems] = useState<LaundryCatalogItem[]>(() => {
    if (initialData?.items && Array.isArray(initialData.items) && initialData.items.length > 0) {
      return initialData.items.map((it) => ({
        name: it.name,
        rate: it.rate ?? 0,
      }));
    }
    return [];
  });

  const [loadingLookups, setLoadingLookups] = useState(true);

  // Form Fields
  const [residentId, setResidentId] = useState<string>(() =>
    initialData?.resident?.id ? String(initialData.resident.id) : ''
  );
  const [requestType, setRequestType] = useState<string>(
    () => initialData?.request_type || 'Laundry'
  );
  const [serviceSubtype, setServiceSubtype] = useState<string>(
    () => initialData?.service_subtype || 'Wash & Fold'
  );
  const [pickupDate, setPickupDate] = useState<string>(() =>
    normalizeDateToYYYYMMDD(initialData?.pickup_date)
  );
  const [pickupTime, setPickupTime] = useState<string>(
    () => initialData?.pickup_time || '09:00 AM - 11:00 AM'
  );
  const [assignedTo, setAssignedTo] = useState<string>(() =>
    initialData?.assigned_staff?.id ? String(initialData.assigned_staff.id) : ''
  );
  const [status, setStatus] = useState<LaundryStatus>(() =>
    (initialData?.status as LaundryStatus) || 'pending'
  );
  const [specialInstructions, setSpecialInstructions] = useState<string>(
    () => initialData?.special_instructions || ''
  );

  // Laundry Items Quantities & Rates
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>(() => {
    const qtys: Record<string, number> = {};
    if (initialData?.items && Array.isArray(initialData.items)) {
      initialData.items.forEach((it) => {
        qtys[it.name] = it.quantity || 0;
      });
    }
    return qtys;
  });

  const [itemRates, setItemRates] = useState<Record<string, number>>(() => {
    const rates: Record<string, number> = {};
    if (initialData?.items && Array.isArray(initialData.items)) {
      initialData.items.forEach((it) => {
        if (it.rate !== undefined) rates[it.name] = it.rate;
      });
    }
    return rates;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form cleanly (used only on create mode navigation)
  const resetForm = useCallback(() => {
    if (isEdit) return;
    setResidentId('');
    setRequestType('Laundry');
    setServiceSubtype('Wash & Fold');
    setPickupDate('');
    setPickupTime('09:00 AM - 11:00 AM');
    setAssignedTo('');
    setStatus('pending');
    setSpecialInstructions('');
    setItemQuantities({});
    setErrors({});
  }, [isEdit]);

  useResetOnNavigation(resetForm, {
    resetOnUnmount: mode === 'create',
    resetOnBfcache: mode === 'create',
    resetOnPopstate: mode === 'create',
    cleanQueryToast: true,
  });

  // Load lookups on mount
  useEffect(() => {
    let isMounted = true;

    Promise.allSettled([
      residentService.getResidents({ limit: 100 }),
      staffService.getStaffList({ limit: 100 }),
      laundryService.getCatalog(),
    ])
      .then(([resRes, staffRes, catalogRes]) => {
        if (!isMounted) return;

        if (resRes.status === 'fulfilled' && resRes.value?.data) {
          const list = resRes.value.data;
          setResidents((prev) => {
            const combined = [...list];
            prev.forEach((p) => {
              if (!combined.some((c) => c.id === p.id)) {
                combined.unshift(p);
              }
            });
            return combined;
          });
        }

        if (staffRes.status === 'fulfilled' && staffRes.value?.data) {
          const list = staffRes.value.data;
          setStaffList((prev) => {
            const combined = [...list];
            prev.forEach((p) => {
              if (!combined.some((c) => c.id === p.id)) {
                combined.unshift(p);
              }
            });
            return combined;
          });
        }

        if (catalogRes.status === 'fulfilled' && catalogRes.value?.items) {
          const serverItems = catalogRes.value.items;
          const merged: LaundryCatalogItem[] = [...serverItems];

          // If in edit mode, ensure items from initialData exist in catalog
          if (initialData?.items && Array.isArray(initialData.items)) {
            initialData.items.forEach((it) => {
              if (!merged.some((m) => m.name.toLowerCase() === it.name.toLowerCase())) {
                merged.push({ name: it.name, rate: it.rate || 0 });
              }
            });
          }

          setCatalogItems(merged);

          // Update rates & preserve quantities
          setItemRates((prev) => {
            const newRates: Record<string, number> = { ...prev };
            merged.forEach((it) => {
              if (newRates[it.name] === undefined) {
                newRates[it.name] = it.rate;
              }
            });
            return newRates;
          });

          setItemQuantities((prev) => {
            const newQtys: Record<string, number> = { ...prev };
            merged.forEach((it) => {
              if (newQtys[it.name] === undefined) {
                newQtys[it.name] = 0;
              }
            });
            return newQtys;
          });

          if (!isEdit && catalogRes.value.pickup_time_slot && !pickupTime) {
            setPickupTime(catalogRes.value.pickup_time_slot);
          }
        }
      })
      .finally(() => {
        if (isMounted) setLoadingLookups(false);
      });

    return () => {
      isMounted = false;
    };
  }, [initialData, isEdit, pickupTime]);

  // Update item quantity
  const handleQuantityChange = (itemName: string, delta: number) => {
    setItemQuantities((prev) => {
      const current = prev[itemName] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [itemName]: next };
    });
  };

  // Compute live totals
  const { totalItemsCount, totalAmount } = useMemo(() => {
    let count = 0;
    let total = 0;

    catalogItems.forEach((it) => {
      const q = itemQuantities[it.name] || 0;
      const r = itemRates[it.name] ?? it.rate;
      if (q > 0) {
        count += q;
        total += q * r;
      }
    });

    return { totalItemsCount: count, totalAmount: total };
  }, [catalogItems, itemQuantities, itemRates]);

  // Validation
  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!residentId) {
      errs.residentId = 'Please select a resident';
    }
    if (!requestType) {
      errs.requestType = 'Please select a request type';
    }
    if (!pickupDate || !normalizeDateToYYYYMMDD(pickupDate)) {
      errs.pickupDate = 'Pickup date is required';
    }
    if (!status) {
      errs.status = 'Please select a status';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;

    try {
      setIsSubmitting(true);

      // Build items payload
      const itemsPayload: LaundryOrderItem[] =
        requestType === 'Laundry'
          ? catalogItems.map((it) => ({
              name: it.name,
              quantity: itemQuantities[it.name] || 0,
              rate: itemRates[it.name] ?? it.rate,
            }))
          : [];

      // Format pickup date strictly as YYYY-MM-DD
      const formattedDate = normalizeDateToYYYYMMDD(pickupDate);

      if (isEdit && targetId) {
        await laundryService.updateRequest(targetId, {
          resident_id: Number(residentId),
          request_type: requestType,
          service_subtype: requestType === 'Laundry' ? serviceSubtype : undefined,
          pickup_date: formattedDate,
          pickup_time: pickupTime.trim(),
          assigned_to: assignedTo ? Number(assignedTo) : undefined,
          status,
          special_instructions: specialInstructions.trim() || undefined,
          items: itemsPayload.length > 0 ? itemsPayload : undefined,
        });
      } else {
        await laundryService.createRequest({
          resident_id: Number(residentId),
          request_type: requestType,
          service_subtype: requestType === 'Laundry' ? serviceSubtype : undefined,
          pickup_date: formattedDate,
          pickup_time: pickupTime.trim(),
          assigned_to: assignedTo ? Number(assignedTo) : undefined,
          status,
          special_instructions: specialInstructions.trim() || undefined,
          items: itemsPayload.length > 0 ? itemsPayload : undefined,
        });
      }

      router.push('/dashboard/settings/services');
    } catch {
      // apiClient handles backend error alerts
    } finally {
      setIsSubmitting(false);
    }
  };

  // Options
  const residentOptions = residents.map((r) => ({
    label: `${r.name} ${r.room_no ? `(Room ${r.room_no})` : ''}`,
    value: String(r.id),
  }));

  const staffOptions = [
    { label: 'Unassigned (Assign later)', value: '' },
    ...staffList.map((s) => ({
      label: `${s.name} ${s.staff_role ? `(${s.staff_role})` : ''}`,
      value: String(s.id),
    })),
  ];

  const requestTypeOptions = [
    { label: 'Laundry', value: 'Laundry' },
    { label: 'Room Cleaning', value: 'Room Cleaning' },
    { label: 'Maintenance', value: 'Maintenance' },
    { label: 'Other', value: 'Other' },
  ];

  const subtypeOptions = [
    { label: 'Wash & Fold', value: 'Wash & Fold' },
    { label: 'Dry Cleaning', value: 'Dry Cleaning' },
    { label: 'Washing & Dry Cleaning', value: 'Washing & Dry Cleaning' },
    { label: 'Only Washing', value: 'Only Washing' },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-fade-in font-sans">
      {/* Top Header matching Figma pixel-for-pixel */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/settings/services"
          className="w-9 h-9 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-700 transition-colors shadow-2xs"
          title="Back to Requests"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            {isEdit ? 'Edit Service & Laundry Request' : 'Add New Service & Laundry Request'}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-normal mt-0.5">
            {isEdit
              ? `Update details for request #${initialData?.request_number || targetId}.`
              : 'Add a new service and laundry request.'}
          </p>
        </div>
      </div>

      {/* Main Form Card matching Figma */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-xs space-y-6">
        {/* Row 1: Resident Name & Request Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-1.5">
              Resident name <span className="text-red-500">*</span>
            </label>
            <Dropdown
              value={residentId}
              onChange={(e) => {
                setResidentId(e.target.value);
                if (errors.residentId) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.residentId;
                    return next;
                  });
                }
              }}
              options={residentOptions}
              placeholder={loadingLookups ? 'Loading residents...' : 'Select resident name'}
              error={errors.residentId}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-1.5">
              Request type <span className="text-red-500">*</span>
            </label>
            <Dropdown
              value={requestType}
              onChange={(e) => {
                setRequestType(e.target.value);
                if (errors.requestType) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.requestType;
                    return next;
                  });
                }
              }}
              options={requestTypeOptions}
              placeholder="Select request type"
              error={errors.requestType}
              className="w-full"
            />
          </div>
        </div>

        {/* Row 2: Subtype (Conditional for Laundry) */}
        {requestType === 'Laundry' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-1.5">
                Service Subtype
              </label>
              <Dropdown
                value={serviceSubtype}
                onChange={(e) => setServiceSubtype(e.target.value)}
                options={subtypeOptions}
                placeholder="Select service subtype"
                className="w-full"
              />
            </div>
          </div>
        )}

        {/* Row 3: Pick up date, Pick up time, Assign */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-1.5">
              Pick up date <span className="text-red-500">*</span>
            </label>
            <AppDatePicker
              value={pickupDate}
              onChange={(val) => {
                setPickupDate(val);
                if (errors.pickupDate) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.pickupDate;
                    return next;
                  });
                }
              }}
              placeholder="Select date"
              hasError={Boolean(errors.pickupDate)}
              className="w-full"
            />
            {errors.pickupDate && (
              <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.pickupDate}</p>
            )}
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-1.5">
              Pick up time
            </label>
            <AppTimePicker
              value={pickupTime}
              onChange={setPickupTime}
              placeholder="Select Time"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-1.5">
              Assign Staff
            </label>
            <Dropdown
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              options={staffOptions}
              placeholder={loadingLookups ? 'Loading staff...' : 'Select assign'}
              className="w-full"
            />
          </div>
        </div>

        {/* Row 4: Status * matching Figma radio selector */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">
            Status <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-wrap items-center gap-6 sm:gap-8 pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900">
              <input
                type="radio"
                name="status"
                value="completed"
                checked={status === 'completed'}
                onChange={() => setStatus('completed')}
                className="w-4 h-4 text-[#175C46] border-gray-300 focus:ring-[#175C46] cursor-pointer"
              />
              Completed
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900">
              <input
                type="radio"
                name="status"
                value="pending"
                checked={status === 'pending'}
                onChange={() => setStatus('pending')}
                className="w-4 h-4 text-[#175C46] border-gray-300 focus:ring-[#175C46] cursor-pointer"
              />
              Pending
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900">
              <input
                type="radio"
                name="status"
                value="in_progress"
                checked={status === 'in_progress'}
                onChange={() => setStatus('in_progress')}
                className="w-4 h-4 text-[#175C46] border-gray-300 focus:ring-[#175C46] cursor-pointer"
              />
              In Progress
            </label>
          </div>
          {errors.status && (
            <p className="text-[11px] text-red-500 mt-1.5 font-medium">{errors.status}</p>
          )}
        </div>

        {/* Laundry Item Selection Section */}
        {requestType === 'Laundry' && (
          <div className="pt-4 border-t border-gray-100 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Order Items & Quantities</h3>
                <p className="text-xs text-gray-500">
                  Select clothes and items to calculate total amount.
                </p>
              </div>

              {/* Total Calculation pill */}
              <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl px-4 py-2 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold text-[#175C46] uppercase tracking-wider block">
                    Calculated Total
                  </span>
                  <p className="text-base font-bold text-gray-900">
                    ₹{totalAmount} <span className="text-xs font-normal text-gray-500">({totalItemsCount} items)</span>
                  </p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#175C46] flex items-center justify-center font-bold text-sm">
                  ₹
                </div>
              </div>
            </div>

            {/* Catalog Items Counter */}
            {catalogItems.length > 0 && (
              <div className="space-y-2">
                <label className="block text-xs sm:text-sm font-semibold text-gray-900">
                  Select Items & Quantities (Optional)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {catalogItems.map((item) => {
                    const qty = itemQuantities[item.name] || 0;
                    const rate = itemRates[item.name] ?? item.rate;

                    return (
                      <div
                        key={item.name}
                        className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                          qty > 0
                            ? 'border-[#175C46] bg-emerald-50/20 shadow-2xs'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">{item.name}</p>
                          <p className="text-[11px] text-gray-500 font-medium">₹{rate} / piece</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 bg-gray-100 rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item.name, -1)}
                            disabled={qty <= 0}
                            className="w-7 h-7 rounded-md bg-white text-gray-700 hover:text-black flex items-center justify-center font-bold text-sm shadow-2xs transition-colors disabled:opacity-40 cursor-pointer"
                          >
                            -
                          </button>
                          <span className="w-7 text-center font-bold text-xs text-gray-900">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item.name, 1)}
                            className="w-7 h-7 rounded-md bg-[#175C46] text-white hover:bg-[#124b38] flex items-center justify-center font-bold text-sm shadow-2xs transition-colors cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Special Instructions Textarea */}
        <div className="pt-2">
          <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-1.5">
            Special Instructions <span className="text-gray-400 font-normal">(Optional)</span>
          </label>
          <textarea
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            rows={3}
            placeholder="e.g. Gentle wash, do not iron, return by Friday morning, etc."
            className="w-full p-3.5 rounded-xl border border-gray-200 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#175C46]/20 focus:border-[#175C46] transition-all resize-none"
          />
        </div>

        {/* Full-width Save / Update Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 bg-[#175C46] hover:bg-[#124b38] text-white font-bold text-sm rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isEdit ? (
              'Save Changes'
            ) : (
              'Save'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
