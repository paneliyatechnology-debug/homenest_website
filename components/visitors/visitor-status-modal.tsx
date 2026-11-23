'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Visitor } from '@/types/visitor';
import { visitorService } from '@/services/visitor.service';
import { StatusBadge, ModalHeader } from '@/components/ui';

interface VisitorStatusModalProps {
  visible: boolean;
  onHide: () => void;
  visitor: Visitor | null;
  onSuccess: (updated: Visitor) => void;
}

const STATUS_OPTIONS: {
  value: string;
  label: string;
  description: string;
  badgeStyle: string;
}[] = [
  {
    value: 'approved',
    label: 'Approved',
    description: 'Visitor pass approved by management or host.',
    badgeStyle: 'bg-[#E8F8F0] text-[#175C46]',
  },
  {
    value: 'rejected',
    label: 'Rejected',
    description: 'Visitor entry or request has been rejected.',
    badgeStyle: 'bg-[#FFF1F2] text-[#E11D48]',
  },
];

export const VisitorStatusModal: React.FC<VisitorStatusModalProps> = ({
  visible,
  onHide,
  visitor,
  onSuccess,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>(() => {
    return visitor?.status === 'rejected' ? 'rejected' : 'approved';
  });
  const [adminNotes, setAdminNotes] = useState<string>(() => {
    return visitor?.admin_notes || '';
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && visitor) {
      setSelectedStatus(visitor.status === 'rejected' ? 'rejected' : 'approved');
      setAdminNotes(visitor.admin_notes || '');
    }
  }, [visible, visitor]);

  const handleClose = () => {
    if (visitor) {
      setSelectedStatus(visitor.status === 'rejected' ? 'rejected' : 'approved');
      setAdminNotes(visitor.admin_notes || '');
    }
    onHide();
  };

  const handleConfirm = async () => {
    if (!visitor) return;
    try {
      setLoading(true);
      const res = await visitorService.updateVisitorStatus(visitor.id, {
        status: selectedStatus,
        admin_notes: adminNotes.trim() || undefined,
      });

      const updated = res?.data || {
        ...visitor,
        status: selectedStatus,
        admin_notes: adminNotes.trim(),
        is_on_site: selectedStatus === 'approved',
      };

      onSuccess(updated);
      handleClose();
    } catch (err) {
      console.warn('Status update failed:', err);
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
      className="w-full max-w-[480px] mx-4 rounded-2xl overflow-hidden shadow-2xl border-0 font-sans"
      header={
        <ModalHeader
          title="Change Visitor Status"
          subtitle={
            visitor?.visitor_name ? (
              <>
                <span className="font-semibold text-gray-800">{visitor.visitor_name}</span>
                {visitor.pass_code ? ` • ${visitor.pass_code}` : ''}
              </>
            ) : (
              'Update status & access record'
            )
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
      <div className="space-y-4 pt-1 text-xs sm:text-sm">
        {/* Current status banner */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs">
          <span className="text-gray-500 font-medium">Current Status:</span>
          {visitor && <StatusBadge status={visitor.status} />}
        </div>

        {/* Status Options */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-700 block">
            Select New Status
          </label>
          <div className="space-y-2">
            {STATUS_OPTIONS.map((opt) => {
              const isSelected = selectedStatus === opt.value;
              const isRejected = opt.value === 'rejected';
              return (
                <div
                  key={opt.value}
                  onClick={() => setSelectedStatus(opt.value)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                    isSelected
                      ? isRejected
                        ? 'border-red-500 bg-red-50/30 shadow-2xs'
                        : 'border-[#175C46] bg-[#E8F8F0]/30 shadow-2xs'
                      : 'border-gray-200/90 hover:border-gray-300 hover:bg-gray-50/50'
                  }`}
                >
                  {/* Custom Radio Circle */}
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                      isSelected
                        ? isRejected
                          ? 'border-red-600 bg-red-600'
                          : 'border-[#175C46] bg-[#175C46]'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>

                  {/* Details */}
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-semibold text-gray-900">
                        {opt.label}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${opt.badgeStyle}`}
                      >
                        {opt.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-normal">
                      {opt.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Admin notes field */}
        <div className="space-y-1.5 pt-1">
          <label className="text-xs font-semibold text-gray-700 block">
            Admin Notes / Remarks
          </label>
          <input
            type="text"
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="Enter admin notes or remarks..."
            className="w-full h-11 px-4 py-2.5 rounded-xl border border-gray-200/90 hover:border-gray-300 text-xs sm:text-sm text-gray-800 focus:border-[#175C46] focus:ring-1 focus:ring-[#175C46] transition-all shadow-2xs focus:outline-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm font-semibold text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200/80 rounded-xl transition-colors cursor-pointer disabled:opacity-50 text-center"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#175C46] hover:bg-[#124B38] active:bg-[#0E3B2C] active:scale-[0.99] rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
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
