'use client';

import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { LaundryRequest, LaundryStatus } from '@/types/laundry';
import { laundryService } from '@/services/laundry.service';

interface LaundryStatusModalProps {
  visible: boolean;
  onHide: () => void;
  request: LaundryRequest | null;
  onSuccess?: () => void;
}

export const LaundryStatusModal: React.FC<LaundryStatusModalProps> = ({
  visible,
  onHide,
  request,
  onSuccess,
}) => {
  const [status, setStatus] = useState<LaundryStatus>(() =>
    request?.status ? ((request.status.toLowerCase() as LaundryStatus) || 'in_progress') : 'in_progress'
  );
  const [adminNotes, setAdminNotes] = useState(() => request?.admin_notes || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request?.id || loading) return;

    try {
      setLoading(true);
      await laundryService.updateStatus(request.id, {
        status,
        admin_notes: adminNotes.trim(),
      });
      if (onSuccess) onSuccess();
      onHide();
    } catch {
      // apiClient handles backend errors
    } finally {
      setLoading(false);
    }
  };

  if (!request) return null;

  const statusOptions: { value: LaundryStatus; label: string; desc: string; color: string }[] = [
    {
      value: 'pending',
      label: 'Pending',
      desc: 'Order received and waiting for pickup or processing',
      color: 'border-amber-200 hover:border-amber-400 bg-amber-50/30',
    },
    {
      value: 'in_progress',
      label: 'In Progress',
      desc: 'Items collected, currently being washed or processed',
      color: 'border-blue-200 hover:border-blue-400 bg-blue-50/30',
    },
    {
      value: 'completed',
      label: 'Completed',
      desc: 'Cleaned, folded and delivered back to resident',
      color: 'border-emerald-200 hover:border-emerald-400 bg-emerald-50/30',
    },
    {
      value: 'cancelled',
      label: 'Cancelled',
      desc: 'Request cancelled by resident or administration',
      color: 'border-rose-200 hover:border-rose-400 bg-rose-50/30',
    },
  ];

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      modal
      draggable={false}
      resizable={false}
      className="w-full max-w-lg mx-4 rounded-2xl overflow-hidden shadow-2xl border-0 font-sans"
      header={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E8F8F0] text-[#175C46] flex items-center justify-center shrink-0 shadow-2xs">
            <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
              Update Request Status
            </h2>
            <p className="text-xs text-gray-500 font-normal">
              Order {request.request_number} • {request.resident?.name}
            </p>
          </div>
        </div>
      }
      contentClassName="p-5 sm:p-6 bg-white"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
            Select Status <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            {statusOptions.map((opt) => (
              <label
                key={opt.value}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  status === opt.value
                    ? 'border-[#175C46] bg-emerald-50/40 ring-1 ring-[#175C46]'
                    : opt.color
                }`}
              >
                <input
                  type="radio"
                  name="laundry_status"
                  value={opt.value}
                  checked={status === opt.value}
                  onChange={() => setStatus(opt.value)}
                  className="mt-0.5 text-[#175C46] focus:ring-[#175C46]"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-900">{opt.label}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
            Admin & Delivery Notes (Optional)
          </label>
          <textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            rows={3}
            placeholder="e.g. Laundry washed, folded, and returned to resident room."
            className="w-full p-3 rounded-xl border border-gray-200 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#175C46]/20 focus:border-[#175C46] transition-all resize-none"
          />
        </div>

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
            disabled={loading}
            className="h-10 px-5 text-xs font-semibold text-white bg-[#175C46] hover:bg-[#124b38] rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Save Status'
            )}
          </button>
        </div>
      </form>
    </Dialog>
  );
};
