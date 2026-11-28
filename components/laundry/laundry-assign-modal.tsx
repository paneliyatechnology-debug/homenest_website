'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { LaundryRequest } from '@/types/laundry';
import { StaffMember } from '@/types/staff';
import { staffService } from '@/services/staff.service';
import { laundryService } from '@/services/laundry.service';
import { Dropdown } from '@/components/ui';

interface LaundryAssignModalProps {
  visible: boolean;
  onHide: () => void;
  request: LaundryRequest | null;
  onSuccess?: () => void;
}

export const LaundryAssignModal: React.FC<LaundryAssignModalProps> = ({
  visible,
  onHide,
  request,
  onSuccess,
}) => {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>(() =>
    request?.assigned_staff?.id ? String(request.assigned_staff.id) : ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    let isMounted = true;
    staffService
      .getStaffList({ limit: 100 })
      .then((res) => {
        if (!isMounted) return;
        setStaffList(res.data || []);
      })
      .catch((err) => console.warn('Failed to load staff list:', err));

    return () => {
      isMounted = false;
    };
  }, [visible]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request?.id || isSubmitting) return;

    if (!selectedStaffId) {
      setError('Please select a staff member');
      return;
    }

    try {
      setIsSubmitting(true);
      await laundryService.assignStaff(request.id, Number(selectedStaffId));
      if (onSuccess) onSuccess();
      onHide();
    } catch {
      // apiClient handles backend errors
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!request) return null;

  const staffOptions = staffList.map((s) => ({
    label: `${s.name} ${s.staff_role ? `(${s.staff_role})` : ''}`,
    value: String(s.id),
  }));

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      modal
      draggable={false}
      resizable={false}
      className="w-full max-w-md mx-4 rounded-2xl overflow-hidden shadow-2xl border-0 font-sans"
      header={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E8F8F0] text-[#175C46] flex items-center justify-center shrink-0 shadow-2xs">
            <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
              Assign Staff Member
            </h2>
            <p className="text-xs text-gray-500 font-normal">
              Order {request.request_number} • {request.resident?.name}
            </p>
          </div>
        </div>
      }
      contentClassName="p-5 sm:p-6 bg-white space-y-4"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
            Select Staff <span className="text-red-500 font-bold">*</span>
          </label>
          <Dropdown
            options={staffOptions}
            value={selectedStaffId}
            onChange={(e) => {
              setSelectedStaffId(e.target.value);
              if (error) setError('');
            }}
            placeholder={staffList.length === 0 ? 'Loading staff list...' : 'Choose staff member'}
            disabled={isSubmitting}
            className="w-full"
          />
          {error && <p className="text-[11px] text-red-500 mt-1 font-medium">{error}</p>}
        </div>

        {selectedStaffId && (
          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-100/70 text-[#175C46] font-bold text-xs flex items-center justify-center shrink-0">
              {staffList.find((s) => String(s.id) === selectedStaffId)?.name.charAt(0) || 'S'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-900 truncate">
                {staffList.find((s) => String(s.id) === selectedStaffId)?.name}
              </p>
              <p className="text-[11px] text-gray-500">
                {staffList.find((s) => String(s.id) === selectedStaffId)?.phone || 'No phone'}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onHide}
            className="h-10 px-4 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="h-10 px-5 text-xs font-semibold text-white bg-[#175C46] hover:bg-[#124b38] rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Assign Staff'
            )}
          </button>
        </div>
      </form>
    </Dialog>
  );
};
