'use client';

import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import {
  PaymentRecord,
  PaymentStatus,
  formatCurrency,
  formatPaymentMethod,
} from '@/types/payment';
import { paymentService } from '@/services/payment.service';
import { StatusBadge, ModalHeader } from '@/components/ui';

interface PaymentStatusModalProps {
  visible: boolean;
  onHide: () => void;
  payment: PaymentRecord | null;
  onSuccess: (updated: PaymentRecord) => void;
  onError?: (message: string) => void;
}

const STATUS_CHOICES: {
  value: PaymentStatus;
  label: string;
  description: string;
  badgeStyle: string;
}[] = [
  {
    value: 'paid',
    label: 'Paid',
    description: 'Payment collected and verified in full. Issues receipt automatically.',
    badgeStyle: 'bg-[#E8F8F0] text-[#175C46]',
  },
  {
    value: 'pending',
    label: 'Pending',
    description: 'Invoice is awaiting resident collection or transaction clearance.',
    badgeStyle: 'bg-[#FEF7E6] text-[#B06000]',
  },
  {
    value: 'overdue',
    label: 'Overdue',
    description: 'Due date has elapsed and full payment has not yet been settled.',
    badgeStyle: 'bg-[#FDF2F2] text-[#DC2626]',
  },
  {
    value: 'failed',
    label: 'Failed',
    description: 'Transaction failed, payment rejected, or dishonored.',
    badgeStyle: 'bg-rose-50 text-rose-700',
  },
  {
    value: 'refunded',
    label: 'Refunded',
    description: 'Amount has been refunded back to the resident.',
    badgeStyle: 'bg-purple-50 text-purple-700',
  },
];

export const PaymentStatusModal: React.FC<PaymentStatusModalProps> = ({
  visible,
  onHide,
  payment,
  onSuccess,
  onError,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<PaymentStatus>(() => {
    return (payment?.status as PaymentStatus) || 'pending';
  });
  const [prevPaymentId, setPrevPaymentId] = useState<number | null>(payment?.id ?? null);
  const [prevVisible, setPrevVisible] = useState(visible);
  const [loading, setLoading] = useState(false);

  // Synchronize selection during render phase when visibility or payment record changes
  if (visible !== prevVisible || (payment && payment.id !== prevPaymentId)) {
    setPrevVisible(visible);
    setPrevPaymentId(payment?.id ?? null);
    setSelectedStatus((payment?.status as PaymentStatus) || 'pending');
  }

  const handleClose = () => {
    if (payment) {
      setSelectedStatus((payment.status as PaymentStatus) || 'pending');
    }
    onHide();
  };

  if (!payment) return null;

  const handleUpdate = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const updated = await paymentService.updatePaymentStatus(payment.id, {
        status: selectedStatus,
      });
      const resolved = updated || { ...payment, status: selectedStatus };
      onSuccess(resolved);
      handleClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update payment status';
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
      className="w-full max-w-[500px] mx-4 rounded-2xl overflow-hidden shadow-2xl border-0 font-sans"
      header={
        <ModalHeader
          title="Update Payment Status"
          subtitle={
            payment.resident?.name ? (
              <>
                Manage status for bill of{' '}
                <span className="font-semibold text-gray-800">{payment.resident.name}</span>
              </>
            ) : (
              payment.title || 'Manage bill status'
            )
          }
          iconBg="bg-emerald-50 text-[#175C46]"
          icon={
            <svg
              className="w-5 h-5 stroke-current"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.9"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
          }
        />
      }
    >
      <div className="space-y-4 pt-1">
        {/* Current Details Banner */}
        <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 font-medium">Invoice:</span>
            <span className="font-semibold text-gray-800">{payment.title || 'Bill'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500 font-medium">Total Amount:</span>
            <span className="font-bold text-gray-900">{formatCurrency(payment.amount)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500 font-medium">Payment Method:</span>
            <span className="font-medium text-gray-700">
              {payment.payment_method ? formatPaymentMethod(payment.payment_method) : '—'}
            </span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-gray-200/60">
            <span className="text-gray-500 font-medium">Current Status:</span>
            <StatusBadge status={payment.status} />
          </div>
        </div>

        {/* Options List */}
        <div className="space-y-2.5">
          {STATUS_CHOICES.map((choice) => {
            const isSelected = selectedStatus === choice.value;
            return (
              <div
                key={choice.value}
                onClick={() => setSelectedStatus(choice.value)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                  isSelected
                    ? 'border-[#175C46] bg-[#E8F8F0]/30 shadow-2xs'
                    : 'border-gray-200/90 hover:border-gray-300 hover:bg-gray-50/50'
                }`}
              >
                {/* Radio Circle */}
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                    isSelected
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
        <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpdate}
            disabled={loading || selectedStatus === payment.status}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#175C46] hover:bg-[#124B38] rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-3.5 h-3.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
            <span>Update Status</span>
          </button>
        </div>
      </div>
    </Dialog>
  );
};
