'use client';

import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { StaffMember, StaffStatus } from '@/types/staff';
import { staffService } from '@/services/staff.service';
import { StatusBadge, ModalHeader } from '@/components/ui';

interface StaffStatusModalProps {
  visible: boolean;
  onHide: () => void;
  staff: StaffMember | null;
  onSuccess: (updatedStatus: StaffStatus) => void;
  onError?: (message: string) => void;
}

const STATUS_CHOICES: {
  value: StaffStatus;
  label: string;
  description: string;
  badgeStyle: string;
}[] = [
    {
      value: 'active',
      label: 'Active',
      description: 'Staff member is on duty and available for assignments.',
      badgeStyle: 'bg-[#E8F8F0] text-[#175C46]',
    },
    {
      value: 'on_leave',
      label: 'On Leave',
      description: 'Staff member is temporarily away or on scheduled leave.',
      badgeStyle: 'bg-[#FEF7E6] text-[#B06000]',
    },
    {
      value: 'inactive',
      label: 'Inactive',
      description: 'Staff member is currently inactive or off-duty.',
      badgeStyle: 'bg-[#FDF2F2] text-[#DC2626]',
    },
  ];

export const StaffStatusModal: React.FC<StaffStatusModalProps> = ({
  visible,
  onHide,
  staff,
  onSuccess,
  onError,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<StaffStatus>(() => {
    return (staff?.status as StaffStatus) || 'active';
  });
  const [prevStaffId, setPrevStaffId] = useState<number | null>(staff?.id ?? null);
  const [prevVisible, setPrevVisible] = useState(visible);
  const [loading, setLoading] = useState(false);

  // Synchronize selection during render phase when visibility or staff member changes
  if (visible !== prevVisible || (staff && staff.id !== prevStaffId)) {
    setPrevVisible(visible);
    setPrevStaffId(staff?.id ?? null);
    setSelectedStatus((staff?.status as StaffStatus) || 'active');
  }

  const handleClose = () => {
    if (staff) {
      setSelectedStatus((staff.status as StaffStatus) || 'active');
    }
    onHide();
  };

  if (!staff) return null;

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await staffService.updateStaffStatus(staff.id, selectedStatus);
      onSuccess(selectedStatus);
      handleClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update staff status';
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      visible={visible}
      onHide={handleClose}
      modal
      draggable={false}
      resizable={false}
      className="w-full max-w-[460px] mx-4 rounded-2xl overflow-hidden shadow-2xl border-0 font-sans"
      header={
        <ModalHeader
          title="Change Staff Status"
          subtitle={
            <>
              Update working status for <span className="font-semibold text-gray-800">{staff.name}</span>
            </>
          }
          iconBg="bg-amber-50 text-amber-600"
          icon={
            <svg
              className="w-5 h-5 stroke-current"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          }
        />
      }
    >
      <div className="space-y-4 pt-1">
        {/* Current Status banner */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs">
          <span className="text-gray-500 font-medium">Current Status:</span>
          <StatusBadge status={staff.status} />
        </div>

        {/* Options List */}
        <div className="space-y-2.5">
          {STATUS_CHOICES.map((choice) => {
            const isSelected = selectedStatus === choice.value;
            return (
              <div
                key={choice.value}
                onClick={() => setSelectedStatus(choice.value)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${isSelected
                  ? 'border-[#175C46] bg-[#E8F8F0]/30 shadow-2xs'
                  : 'border-gray-200/90 hover:border-gray-300 hover:bg-gray-50/50'
                  }`}
              >
                {/* Radio Circle */}
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-all ${isSelected
                    ? 'border-[#175C46] bg-[#175C46]'
                    : 'border-gray-300 bg-white'
                    }`}
                >
                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-semibold text-gray-900">
                      {choice.label}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${choice.badgeStyle}`}
                    >
                      {choice.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-normal">
                    {choice.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-5 py-2.5 text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200/80 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpdate}
            disabled={loading}
            className="px-6 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#175C46] hover:bg-[#124B38] active:bg-[#0E3B2C] rounded-xl transition-colors shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Updating...</span>
              </>
            ) : (
              <span>Update Status</span>
            )}
          </button>
        </div>
      </div>
    </Dialog>
  );
};
