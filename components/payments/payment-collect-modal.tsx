'use client';

import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import {
  PaymentRecord,
  PaymentMethod,
  PAYMENT_METHOD_LABELS,
  formatCurrency,
} from '@/types/payment';
import { paymentService } from '@/services/payment.service';
import { Dropdown, ModalHeader, PhotoUpload } from '@/components/ui';

interface PaymentCollectModalProps {
  visible: boolean;
  onHide: () => void;
  onSuccess: () => void;
  payment: PaymentRecord | null;
}

export const PaymentCollectModal: React.FC<PaymentCollectModalProps> = ({
  visible,
  onHide,
  onSuccess,
  payment,
}) => {
  const [sessionKey, setSessionKey] = useState(0);

  const handleClose = () => {
    setSessionKey((k) => k + 1);
    onHide();
  };

  const handleSuccess = () => {
    setSessionKey((k) => k + 1);
    onSuccess();
    onHide();
  };

  if (!payment && !visible) return null;

  return (
    <Dialog
      visible={visible}
      onHide={handleClose}
      header={
        <ModalHeader
          title="Record Payment Collection"
          subtitle="Collect dues and mark invoice as paid"
          iconBg="bg-[#EBF7F2] text-[#175C46]"
          icon={
            <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      }
      style={{ width: '95vw', maxWidth: '520px' }}
      contentClassName="max-h-[85vh] overflow-y-auto p-5 sm:p-6 bg-white"
      modal
      className="payment-collect-modal font-sans"
      dismissableMask
      baseZIndex={1000}
    >
      {visible && payment && (
        <PaymentCollectContent
          key={`collect-${sessionKey}-${payment.id}`}
          payment={payment}
          onHide={handleClose}
          onSuccess={handleSuccess}
        />
      )}
    </Dialog>
  );
};

interface PaymentCollectContentProps {
  payment: PaymentRecord;
  onHide: () => void;
  onSuccess: () => void;
}

const PaymentCollectContent: React.FC<PaymentCollectContentProps> = ({
  payment,
  onHide,
  onSuccess,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    (payment.payment_method as PaymentMethod) || 'upi'
  );
  const [upiRefNo, setUpiRefNo] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [details, setDetails] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dueAmount = payment
    ? (payment.amount || 0) - (payment.paid_amount || 0)
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!paymentMethod) {
      setError('Please select a payment method');
      return;
    }

    if (paymentMethod === 'upi' && upiRefNo.trim() && upiRefNo.trim().length !== 12) {
      setError('Transaction ID must be exactly 12 digits');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append('payment_method', paymentMethod);

      if (upiRefNo.trim()) {
        fd.append('upi_ref_no', upiRefNo.trim());
      }
      if (note.trim()) {
        fd.append('note', note.trim());
        fd.append('notes', note.trim());
      }
      if (details.trim()) {
        fd.append('payment_method_details', details.trim());
      }
      if (imageFile) {
        fd.append('image', imageFile);
      }

      await paymentService.collectPayment(payment.id, fd);
      onSuccess();
    } catch (err: unknown) {
      console.error('Failed to collect payment:', err);
      const apiErr = err as { message?: string };
      setError(apiErr?.message || 'Failed to record payment collection');
    } finally {
      setSubmitting(false);
    }
  };

  const methodOptions = Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => ({
    label,
    value: key,
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-1">
      {/* Invoice Summary Card */}
      <div className="p-3.5 bg-gray-50/80 rounded-2xl border border-gray-100 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[11px] font-semibold text-gray-400 block uppercase tracking-wider">
            Invoice #{payment.id}
          </span>
          <h4 className="text-xs sm:text-sm font-bold text-gray-900 truncate mt-0.5">
            {payment.title}
          </h4>
          {payment.resident?.name && (
            <span className="text-[11px] text-gray-500 block truncate mt-0.5">
              Resident: <strong className="text-gray-700">{payment.resident.name}</strong>
            </span>
          )}
        </div>
        <div className="text-right shrink-0">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">
            Due Amount
          </span>
          <span className="text-base sm:text-lg font-extrabold text-red-600 block leading-tight mt-0.5">
            {formatCurrency(dueAmount > 0 ? dueAmount : payment.amount)}
          </span>
        </div>
      </div>

      {error && (
        <div className="p-2.5 rounded-xl bg-red-50 text-red-700 text-xs font-medium border border-red-200">
          {error}
        </div>
      )}

      {/* Payment Method */}
      <div>
        <label className="block text-xs font-semibold text-gray-800 mb-1.5">
          Payment Method <span className="text-red-500">*</span>
        </label>
        <Dropdown
          value={paymentMethod}
          onChange={(e) => {
            setPaymentMethod(e.target.value as PaymentMethod);
            if (error) setError(null);
          }}
          options={methodOptions}
          placeholder="Select payment method"
        />
      </div>

      {/* Transaction ID (Visible when method is UPI) */}
      {paymentMethod === 'upi' && (
        <div>
          <label className="block text-xs font-semibold text-gray-800 mb-1.5">
            Transaction ID
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={12}
            value={upiRefNo}
            onChange={(e) => {
              const numericVal = e.target.value.replace(/\D/g, '').slice(0, 12);
              setUpiRefNo(numericVal);
              if (error) setError(null);
            }}
            placeholder="Enter 12-digit transaction ID"
            className="w-full h-11 px-4 bg-white border border-gray-200/90 hover:border-gray-300 focus:border-[#175C46] focus:ring-1 focus:ring-[#175C46] rounded-xl text-xs sm:text-sm focus:outline-none transition-all shadow-2xs text-gray-800 font-mono"
          />
          <p className="text-[11px] text-gray-400 mt-1">
            12-digit transaction ID from Google Pay, PhonePe, Paytm, etc.
          </p>
        </div>
      )}

      {/* Payment Method Details (For non-UPI methods) */}
      {paymentMethod !== 'upi' && (
        <div>
          <label className="block text-xs font-semibold text-gray-800 mb-1.5">
            Payment Reference / Transaction Details <span className="text-gray-400 font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            value={details}
            onChange={(e) => {
              setDetails(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Enter payment reference or transaction details"
            className="w-full h-11 px-4 bg-white border border-gray-200/90 hover:border-gray-300 focus:border-[#175C46] focus:ring-1 focus:ring-[#175C46] rounded-xl text-xs sm:text-sm focus:outline-none transition-all shadow-2xs text-gray-800 font-sans"
          />
        </div>
      )}

      {/* Note / Remarks */}
      <div>
        <label className="block text-xs font-semibold text-gray-800 mb-1.5">
          Payment Note / Remarks <span className="text-gray-400 font-normal">(Optional)</span>
        </label>
        <textarea
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Enter payment notes or remarks..."
          className="w-full px-4 py-2.5 bg-white border border-gray-200/90 hover:border-gray-300 focus:border-[#175C46] focus:ring-1 focus:ring-[#175C46] rounded-xl text-xs sm:text-sm focus:outline-none transition-all shadow-2xs text-gray-800 font-sans resize-none"
        />
      </div>

      {/* Payment Proof / Receipt Image Upload */}
      <div>
        <PhotoUpload
          label="Payment Proof / Receipt Screenshot"
          optional
          shape="rounded"
          previewUrl={imagePreview}
          file={imageFile}
          onSelectFile={(f) => {
            setImageFile(f);
            setImagePreview(URL.createObjectURL(f));
            if (error) setError(null);
          }}
          onRemove={() => {
            setImageFile(null);
            setImagePreview(null);
          }}
          onError={(msg) => setError(msg)}
          helperText="Upload receipt screenshot or bank transfer confirmation (PNG, JPG, up to 5MB)"
        />
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
          <span>Confirm & Mark as Paid</span>
        </button>
      </div>
    </form>
  );
};
