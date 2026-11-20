/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useEffect, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import {
  PaymentRecord,
  formatPaymentType,
  formatPaymentMethod,
  formatCurrency,
} from '@/types/payment';
import { paymentService } from '@/services/payment.service';
import { StatusBadge, ModalHeader } from '@/components/ui';
import { resolveFileUrl } from '@/lib/file-utils';
import { AttachmentPreviewModal } from '@/components/ui/attachment-preview-modal';

interface PaymentDetailsModalProps {
  visible: boolean;
  onHide: () => void;
  paymentId?: number | string | null;
  payment?: PaymentRecord | null;
  onDownloadReceipt?: (payment: PaymentRecord) => void;
}

export const PaymentDetailsModal: React.FC<PaymentDetailsModalProps> = ({
  visible,
  onHide,
  paymentId,
  payment,
  onDownloadReceipt,
}) => {
  const targetId = paymentId ?? payment?.id ?? null;

  const [prevTargetId, setPrevTargetId] = useState<number | string | null>(null);
  const [fetchedPayment, setFetchedPayment] = useState<PaymentRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Synchronize state during render phase when visible / targetId changes
  if (visible && targetId !== prevTargetId) {
    setPrevTargetId(targetId);
    setFetchedPayment(null);
    setLoading(true);
    setError(null);
  } else if (!visible && prevTargetId !== null) {
    setPrevTargetId(null);
    setFetchedPayment(null);
    setLoading(false);
    setError(null);
  }

  // Fetch fresh payment details from single payment GET API whenever modal opens
  useEffect(() => {
    if (!visible || !targetId) return;

    let isMounted = true;
    paymentService
      .getPaymentById(targetId)
      .then((data) => {
        if (!isMounted) return;
        setFetchedPayment(data || payment || null);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setLoading(false);
        // Fall back to provided payment prop if available
        if (payment) {
          setFetchedPayment(payment);
        } else {
          setError(err?.message || 'Failed to load payment details.');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [visible, targetId, payment]);

  if (!visible) return null;

  const current = fetchedPayment || payment;
  const resident = current?.resident;
  const breakdown = current?.breakdown;

  const formatMethod = (method?: string | null) => {
    return formatPaymentMethod(method);
  };

  // Resolve payment proof image URL
  const rawImage =
    current?.image_url ||
    (current?.image
      ? current.image.startsWith('http')
        ? current.image
        : `uploads/payments/${current.image}`
      : null);
  const paymentImageUrl = rawImage ? resolveFileUrl(rawImage) : null;

  const imageAttachments = paymentImageUrl
    ? [
        {
          id: current?.id || 1,
          file_url: paymentImageUrl,
          filename: current?.image || `payment-${current?.id || 'proof'}.jpg`,
        },
      ]
    : [];

  return (
    <>
      <Dialog
        visible={visible}
        onHide={onHide}
        header={
          <ModalHeader
            title={
              <div className="flex items-center gap-2.5">
                <h3 className="text-base font-bold text-gray-900 leading-tight">
                  Payment Details
                </h3>
                {current && <StatusBadge status={current.status} />}
              </div>
            }
            subtitle={current?.title || (targetId ? `Payment #${targetId}` : '')}
            iconShape="circle"
            icon={
              <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />
        }
        style={{ width: '640px', maxWidth: '95vw' }}
        contentClassName="max-h-[85vh] overflow-y-auto p-5 sm:p-6 bg-white"
        modal
        className="p-fluid rounded-2xl overflow-hidden font-sans"
        dismissableMask
        baseZIndex={1000}
      >
        {loading ? (
          <div className="py-14 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-[#175C46]/20 border-t-[#175C46] rounded-full animate-spin" />
            <p className="text-xs text-gray-500 font-medium">Loading payment details...</p>
          </div>
        ) : error || !current ? (
          <div className="py-10 text-center space-y-2">
            <p className="text-xs text-rose-500 font-medium">
              {error || 'Payment details could not be found.'}
            </p>
            <button
              type="button"
              onClick={onHide}
              className="px-4 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="space-y-4 pt-1 text-xs">
            {/* Top Amount Banner */}
            <div className="bg-[#E8F8F0]/40 border border-[#175C46]/10 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
                  Total Amount
                </span>
                <div className="text-2xl font-bold text-[#175C46] tracking-tight mt-0.5">
                  {formatCurrency(current.amount)}
                </div>
              </div>
              {current.paid_amount > 0 ? (
                <div className="text-right">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
                    Paid Amount
                  </span>
                  <div className="text-lg font-bold text-gray-900 tracking-tight mt-0.5">
                    {formatCurrency(current.paid_amount)}
                  </div>
                </div>
              ) : (
                <div className="text-right">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                    Pending Due
                  </span>
                  <div className="text-lg font-bold text-amber-600 tracking-tight mt-0.5">
                    {formatCurrency(current.amount)}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-gray-50/70 p-3.5 rounded-xl border border-gray-100">
              <div>
                <span className="text-gray-400 block font-medium">Transaction ID</span>
                <span className="text-gray-800 font-semibold mt-0.5 block truncate">
                  {current.transaction_id || `TXN${String(current.id).padStart(6, '0')}`}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block font-medium">Receipt No.</span>
                <span className="text-gray-800 font-semibold mt-0.5 block truncate">
                  {current.receipt_no || '—'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block font-medium">Payment Type</span>
                <span className="text-gray-800 font-semibold mt-0.5 block">
                  {formatPaymentType(current.payment_type)}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block font-medium">Payment Method</span>
                <span className="text-gray-800 font-semibold mt-0.5 block">
                  {formatMethod(current.payment_method)}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block font-medium">Due Date</span>
                <span className="text-gray-800 font-semibold mt-0.5 block">
                  {current.due_date || '—'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block font-medium">Paid At</span>
                <span className="text-gray-800 font-semibold mt-0.5 block">
                  {current.paid_at || '—'}
                </span>
              </div>

              {/* UPI Details if available */}
              {current.upi_id && (
                <div className="col-span-1 sm:col-span-2">
                  <span className="text-gray-400 block font-medium">UPI ID</span>
                  <span className="text-gray-800 font-semibold mt-0.5 block truncate font-mono text-[11px]">
                    {current.upi_id}
                  </span>
                </div>
              )}
              {current.upi_ref_no && (
                <div>
                  <span className="text-gray-400 block font-medium">UPI Ref / UTR No.</span>
                  <span className="text-gray-800 font-semibold mt-0.5 block truncate font-mono text-[11px]">
                    {current.upi_ref_no}
                  </span>
                </div>
              )}

              {/* Billing Period if available */}
              {current.billing_period && (current.billing_period.start || current.billing_period.end) && (
                <div className="col-span-2 sm:col-span-3">
                  <span className="text-gray-400 block font-medium">Billing Period</span>
                  <span className="text-gray-800 font-semibold mt-0.5 block">
                    {[current.billing_period.start, current.billing_period.end].filter(Boolean).join(' to ')}
                  </span>
                </div>
              )}
            </div>

            {/* Resident & Room Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Resident Card */}
              <div className="p-3.5 rounded-xl border border-gray-100 bg-white space-y-2">
                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Resident Details
                </h4>
                <div className="flex items-center gap-3">
                  {resident?.profile_photo_url ? (
                    <img
                      src={resolveFileUrl(resident.profile_photo_url)}
                      alt={resident.name || 'Resident'}
                      className="w-9 h-9 rounded-full object-cover border border-gray-200 shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#175C46]/10 text-[#175C46] font-bold text-xs flex items-center justify-center shrink-0">
                      {resident?.name ? resident.name.charAt(0).toUpperCase() : 'R'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                      {resident?.name || 'Unknown Resident'}
                    </div>
                    <div className="text-[11px] text-gray-500 truncate">{resident?.email || '—'}</div>
                    <div className="text-[11px] text-gray-500 truncate">{resident?.phone || '—'}</div>
                  </div>
                </div>
              </div>

              {/* Room Card */}
              <div className="p-3.5 rounded-xl border border-gray-100 bg-white space-y-1.5">
                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Room & Stay
                </h4>
                <div className="flex justify-between">
                  <span className="text-gray-500">Room No:</span>
                  <span className="font-semibold text-gray-800">
                    {current.room_no
                      ? current.bed_number
                        ? `${current.room_no} (Bed ${current.bed_number})`
                        : current.room_no
                      : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Room Type:</span>
                  <span className="font-semibold text-gray-800 capitalize">{current.room_type || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Building / Floor:</span>
                  <span className="font-semibold text-gray-800 truncate max-w-[140px]">
                    {[current.building_name, current.floor_name || (current.floor_number ? `Floor ${current.floor_number}` : '')]
                      .filter(Boolean)
                      .join(' • ') || '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Branch:</span>
                  <span className="font-semibold text-gray-800 truncate max-w-[140px]">
                    {current.branch_name || current.pg_name || '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Amount Breakdown if present */}
            {breakdown && (
              <div className="p-3.5 rounded-xl border border-gray-100 bg-white space-y-1.5">
                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Breakdown
                </h4>
                <div className="divide-y divide-gray-100">
                  {breakdown.rent !== undefined && breakdown.rent > 0 && (
                    <div className="py-1.5 flex justify-between">
                      <span className="text-gray-600">Rent</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(breakdown.rent)}</span>
                    </div>
                  )}
                  {breakdown.security_deposit !== undefined && breakdown.security_deposit > 0 && (
                    <div className="py-1.5 flex justify-between">
                      <span className="text-gray-600">Security Deposit</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(breakdown.security_deposit)}</span>
                    </div>
                  )}
                  {breakdown.maintenance !== undefined && breakdown.maintenance > 0 && (
                    <div className="py-1.5 flex justify-between">
                      <span className="text-gray-600">Maintenance</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(breakdown.maintenance)}</span>
                    </div>
                  )}
                  {breakdown.electricity !== undefined && breakdown.electricity > 0 && (
                    <div className="py-1.5 flex justify-between">
                      <span className="text-gray-600">Electricity</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(breakdown.electricity)}</span>
                    </div>
                  )}
                  {breakdown.laundry !== undefined && breakdown.laundry > 0 && (
                    <div className="py-1.5 flex justify-between">
                      <span className="text-gray-600">Laundry</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(breakdown.laundry)}</span>
                    </div>
                  )}
                  {breakdown.other !== undefined && breakdown.other > 0 && (
                    <div className="py-1.5 flex justify-between">
                      <span className="text-gray-600">Other Charges</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(breakdown.other)}</span>
                    </div>
                  )}
                  <div className="pt-2 flex justify-between font-bold text-xs text-gray-900">
                    <span>Total</span>
                    <span className="text-[#175C46]">{formatCurrency(current.amount)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Proof / Receipt Image Attachment */}
            {paymentImageUrl && (
              <div className="p-3.5 rounded-xl border border-gray-100 bg-white space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-[#175C46]/10 text-[#175C46] flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h4 className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                      Payment Proof / Receipt Screenshot
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreviewOpen(true)}
                    className="text-[11px] font-semibold text-[#175C46] hover:text-[#124B38] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Enlarge</span>
                    <svg className="w-3 h-3 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </button>
                </div>

                <div
                  onClick={() => setPreviewOpen(true)}
                  className="group relative rounded-xl border border-gray-200 overflow-hidden bg-gray-50 cursor-pointer flex flex-col items-center justify-center hover:border-[#175C46]/40 transition-all shadow-2xs"
                >
                  <img
                    src={paymentImageUrl}
                    alt="Payment receipt proof"
                    className="w-full max-h-56 sm:max-h-64 object-contain transition-transform duration-300 group-hover:scale-[1.01]"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white">
                    <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm">
                      <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                      <span>Click to preview image</span>
                    </div>
                  </div>
                </div>

                {current.image && (
                  <div className="flex items-center justify-between text-[11px] text-gray-400 px-0.5">
                    <span className="truncate max-w-[280px] font-mono text-[10px]">{current.image}</span>
                    <a
                      href={paymentImageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-[#175C46] hover:underline font-semibold"
                    >
                      Open original file
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            {current.notes && (
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-[11px] font-bold text-gray-400 block uppercase tracking-wider mb-0.5">
                  Notes
                </span>
                <p className="text-gray-700">{current.notes}</p>
              </div>
            )}

            {/* Footer Actions */}
            <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onHide}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
              {onDownloadReceipt && current && (
                <button
                  type="button"
                  onClick={() => onDownloadReceipt(current)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#175C46] hover:bg-[#124b38] rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Receipt
                </button>
              )}
            </div>
          </div>
        )}
      </Dialog>

      {/* Full Size Image Preview Modal */}
      {paymentImageUrl && (
        <AttachmentPreviewModal
          visible={previewOpen}
          onHide={() => setPreviewOpen(false)}
          attachments={imageAttachments}
        />
      )}
    </>
  );
};
