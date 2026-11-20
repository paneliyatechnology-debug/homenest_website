'use client';

import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { CheckoutDetails, CheckoutListItem, CheckoutStatus, UpdateCheckoutStatusPayload } from '@/types/checkout';
import { checkoutService } from '@/services/checkout.service';
import { ModalHeader } from '@/components/ui';

interface CheckoutStatusModalProps {
  visible: boolean;
  onHide: () => void;
  checkout: CheckoutDetails | CheckoutListItem | null;
  onSuccess: () => void;
}

export const CheckoutStatusModal: React.FC<CheckoutStatusModalProps> = ({
  visible,
  onHide,
  checkout,
  onSuccess,
}) => {
  const initialStatus = (checkout?.status as CheckoutStatus) || 'approved';
  const initialRefund = 'refund' in (checkout || {})
    ? (checkout as CheckoutListItem).refund
    : (checkout as CheckoutDetails)?.financials?.display_refund ?? 0;

  const [status, setStatus] = useState<CheckoutStatus>(initialStatus);
  const [roomInspected, setRoomInspected] = useState<boolean>(true);
  const [keyReturned, setKeyReturned] = useState<boolean>(true);
  const [nocIssued, setNocIssued] = useState<boolean>(true);
  const [refundProcessed, setRefundProcessed] = useState<boolean>(true);
  const [refundAmount, setRefundAmount] = useState<number>(initialRefund || 0);
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!checkout) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      const payload: UpdateCheckoutStatusPayload = {
        status,
        clearance_room_inspected: roomInspected,
        clearance_key_returned: keyReturned,
        noc_issued: nocIssued,
        refund_amount: Number(refundAmount) || 0,
        refund_processed: refundProcessed,
        admin_notes: adminNotes.trim() || undefined,
      };

      await checkoutService.updateCheckoutStatus(checkout.id, payload);
      onSuccess();
      onHide();
    } catch {
      // apiClient handles toast notifications
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      modal
      draggable={false}
      resizable={false}
      className="w-full max-w-lg mx-4 rounded-2xl overflow-hidden shadow-2xl border-0 font-sans"
      header={
        <ModalHeader
          title="Review & Process Clearance"
          subtitle={`${checkout.resident.name} • Checkout Request #${checkout.id}`}
          icon={
            <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      }
      contentClassName="p-5 sm:p-6 bg-white space-y-4"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Status Option Radios */}
        <div>
          <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
            Approval Status <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { key: 'approved', label: 'Approved', color: 'border-emerald-300 bg-emerald-50/50 text-[#175C46]' },
              { key: 'in_progress', label: 'In Progress', color: 'border-blue-300 bg-blue-50/50 text-blue-700' },
              { key: 'pending', label: 'Pending', color: 'border-amber-300 bg-amber-50/50 text-amber-800' },
              { key: 'rejected', label: 'Rejected', color: 'border-rose-300 bg-rose-50/50 text-rose-700' },
            ].map((s) => (
              <label
                key={s.key}
                className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                  status === s.key ? s.color + ' ring-1 ring-current font-bold' : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <input
                  type="radio"
                  name="checkoutStatus"
                  value={s.key}
                  checked={status === s.key}
                  onChange={() => setStatus(s.key as CheckoutStatus)}
                  className="w-4 h-4 text-[#175C46] focus:ring-[#175C46]"
                />
                <span className="text-xs">{s.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Clearance Checklist Checkboxes */}
        <div className="pt-2 border-t border-gray-100 space-y-2">
          <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">
            Departure Clearances
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label className="p-2.5 rounded-xl border border-gray-200 hover:border-gray-300 bg-gray-50/50 flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-gray-800">
              <input
                type="checkbox"
                checked={roomInspected}
                onChange={(e) => setRoomInspected(e.target.checked)}
                className="w-4 h-4 rounded text-[#175C46] focus:ring-[#175C46]"
              />
              Room Inspected
            </label>

            <label className="p-2.5 rounded-xl border border-gray-200 hover:border-gray-300 bg-gray-50/50 flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-gray-800">
              <input
                type="checkbox"
                checked={keyReturned}
                onChange={(e) => setKeyReturned(e.target.checked)}
                className="w-4 h-4 rounded text-[#175C46] focus:ring-[#175C46]"
              />
              Key Returned
            </label>

            <label className="p-2.5 rounded-xl border border-gray-200 hover:border-gray-300 bg-gray-50/50 flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-gray-800">
              <input
                type="checkbox"
                checked={nocIssued}
                onChange={(e) => setNocIssued(e.target.checked)}
                className="w-4 h-4 rounded text-[#175C46] focus:ring-[#175C46]"
              />
              Issue NOC
            </label>

            <label className="p-2.5 rounded-xl border border-gray-200 hover:border-gray-300 bg-gray-50/50 flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-gray-800">
              <input
                type="checkbox"
                checked={refundProcessed}
                onChange={(e) => setRefundProcessed(e.target.checked)}
                className="w-4 h-4 rounded text-[#175C46] focus:ring-[#175C46]"
              />
              Refund Processed
            </label>
          </div>
        </div>

        {/* Refund Amount Input */}
        <div>
          <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1.5">
            Approved Refund Amount (₹)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">
              ₹
            </span>
            <input
              type="number"
              min="0"
              step="1"
              value={refundAmount}
              onChange={(e) => setRefundAmount(parseFloat(e.target.value) || 0)}
              className="w-full h-11 pl-8 pr-3.5 rounded-xl border border-gray-200 text-xs sm:text-sm font-bold text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#175C46]/20 focus:border-[#175C46]"
            />
          </div>
        </div>

        {/* Admin Notes */}
        <div>
          <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1.5">
            Admin & Fulfillment Notes <span className="text-gray-400 font-normal">(Optional)</span>
          </label>
          <textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            rows={3}
            placeholder="e.g. Room inspected, key returned, NOC issued and refund approved"
            className="w-full p-3 rounded-xl border border-gray-200 text-xs sm:text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#175C46]/20 focus:border-[#175C46] resize-none"
          />
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onHide}
            className="h-10 px-4 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="h-10 px-5 text-xs font-bold text-white bg-[#175C46] hover:bg-[#124b38] rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Save & Apply'
            )}
          </button>
        </div>
      </form>
    </Dialog>
  );
};
