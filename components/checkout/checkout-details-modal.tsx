'use client';

import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { CheckoutDetails } from '@/types/checkout';
import { StatusBadge, ModalHeader } from '@/components/ui';

interface CheckoutDetailsModalProps {
  visible: boolean;
  onHide: () => void;
  checkout: CheckoutDetails | null;
  onOpenStatusModal?: (checkout: CheckoutDetails) => void;
}

export const CheckoutDetailsModal: React.FC<CheckoutDetailsModalProps> = ({
  visible,
  onHide,
  checkout,
  onOpenStatusModal,
}) => {
  const [showDuesBreakdown, setShowDuesBreakdown] = useState(false);

  if (!checkout) return null;

  const duesList = checkout.financials?.dues_breakdown || [];

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      modal
      draggable={false}
      resizable={false}
      className="w-full max-w-3xl mx-4 rounded-2xl overflow-hidden shadow-2xl border-0 font-sans"
      header={
        <ModalHeader
          title={
            <div className="flex items-center gap-2.5">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
                Departure & Refund Review
              </h2>
              <StatusBadge status={checkout.status} label={checkout.status} />
            </div>
          }
          subtitle={`Checkout Request #${checkout.id} • Created on ${checkout.created_at}`}
          icon={
            <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
          }
        />
      }
      contentClassName="p-5 sm:p-6 space-y-6 bg-gray-50/50 max-h-[78vh] overflow-y-auto"
      footer={
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100 bg-white">
          <div className="flex items-center gap-2">
            {onOpenStatusModal && (
              <button
                type="button"
                onClick={() => {
                  onHide();
                  onOpenStatusModal(checkout);
                }}
                className="h-9 px-4 text-xs font-bold text-white bg-[#175C46] hover:bg-[#124b38] rounded-xl shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
                Review & Process Clearance
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onHide}
            className="h-9 px-4 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl shadow-2xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      }
    >
      {/* Resident & Stay Overview Card */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-2xs grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#175C46] font-bold text-base flex items-center justify-center shrink-0 border border-emerald-100">
            {checkout.resident.name ? checkout.resident.name.charAt(0).toUpperCase() : 'R'}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-gray-900 truncate">
              {checkout.resident.name}
            </h3>
            <p className="text-xs text-gray-500">{checkout.resident.phone || 'No phone'}</p>
            <p className="text-xs text-gray-500 truncate">{checkout.resident.email || 'No email'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs border-t md:border-t-0 md:border-l border-gray-100 md:pl-4 pt-3 md:pt-0">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Branch & Room
            </span>
            <p className="font-semibold text-gray-900 mt-0.5">
              {checkout.stay.room_no || '—'} ({checkout.stay.room_type || 'Room'})
            </p>
            <p className="text-[11px] text-gray-500">
              {checkout.stay.branch_name} {checkout.stay.bed_no ? `• ${checkout.stay.bed_no}` : ''}
            </p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Departure Date
            </span>
            <p className="font-semibold text-rose-600 mt-0.5">
              {checkout.departure_date}
            </p>
            <p className="text-[11px] text-gray-500">
              In: {checkout.stay.check_in_date || '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Reason & Notes */}
      {(checkout.reason || checkout.additional_notes) && (
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-2xs space-y-1.5">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
            Departure Reason & Notes
          </span>
          <p className="text-xs font-semibold text-gray-900">
            {checkout.reason || 'General Vacate Request'}
          </p>
          {checkout.additional_notes && (
            <p className="text-xs text-gray-600 italic">
              &quot;{checkout.additional_notes}&quot;
            </p>
          )}
        </div>
      )}

      {/* Financials & Refund Calculation */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-bold text-gray-900">
            Financial Clearance & Refund Calculation
          </h3>
          {duesList.length > 0 && (
            <button
              type="button"
              onClick={() => setShowDuesBreakdown(!showDuesBreakdown)}
              className="text-xs font-semibold text-[#175C46] hover:underline cursor-pointer flex items-center gap-1"
            >
              {showDuesBreakdown ? 'Hide Dues Breakdown' : `View Dues Breakdown (${duesList.length})`}
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
              Security Deposit
            </span>
            <p className="text-base sm:text-lg font-bold text-gray-900 mt-0.5">
              ₹{checkout.financials?.deposit_amount ?? 0}
            </p>
          </div>

          <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/80">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
              Pending Dues
            </span>
            <p className="text-base sm:text-lg font-bold text-amber-700 mt-0.5">
              ₹{checkout.financials?.dues_amount ?? 0}
            </p>
          </div>

          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/80">
            <span className="text-[10px] font-bold text-[#175C46] uppercase tracking-wider block">
              Calculated Refund
            </span>
            <p className="text-base sm:text-lg font-bold text-[#175C46] mt-0.5">
              ₹{checkout.financials?.display_refund ?? checkout.financials?.refund_amount ?? 0}
            </p>
          </div>
        </div>

        {/* Dues Breakdown Expandable Table */}
        {showDuesBreakdown && duesList.length > 0 && (
          <div className="mt-3 border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 animate-fade-in">
            <div className="bg-gray-50 px-3.5 py-2 text-[11px] font-bold text-gray-700 uppercase tracking-wider flex justify-between">
              <span>Unpaid Invoices Breakdown</span>
              <span>Amount</span>
            </div>
            {duesList.map((due) => (
              <div key={due.id} className="px-3.5 py-2 text-xs flex items-center justify-between bg-white">
                <div>
                  <p className="font-semibold text-gray-900">{due.title}</p>
                  <p className="text-[11px] text-gray-500">
                    Type: <span className="capitalize">{due.payment_type}</span> • Due: {due.due_date}
                  </p>
                </div>
                <span className="font-bold text-amber-700">₹{due.amount}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Clearance Checklist */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-2xs space-y-3">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
          Clearance Verification Checklist
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className={`p-3 rounded-xl border flex items-center gap-2.5 ${
            checkout.clearance_checklist?.room_inspection
              ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
              : 'bg-gray-50 border-gray-200 text-gray-600'
          }`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
              checkout.clearance_checklist?.room_inspection ? 'bg-[#175C46] text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              {checkout.clearance_checklist?.room_inspection ? '✓' : '×'}
            </span>
            <span className="text-xs font-semibold">Room Inspection</span>
          </div>

          <div className={`p-3 rounded-xl border flex items-center gap-2.5 ${
            checkout.clearance_checklist?.return_room_key
              ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
              : 'bg-gray-50 border-gray-200 text-gray-600'
          }`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
              checkout.clearance_checklist?.return_room_key ? 'bg-[#175C46] text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              {checkout.clearance_checklist?.return_room_key ? '✓' : '×'}
            </span>
            <span className="text-xs font-semibold">Room Key Returned</span>
          </div>

          <div className={`p-3 rounded-xl border flex items-center gap-2.5 ${
            checkout.clearance_checklist?.no_pending_dues
              ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
              : 'bg-gray-50 border-gray-200 text-gray-600'
          }`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
              checkout.clearance_checklist?.no_pending_dues ? 'bg-[#175C46] text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              {checkout.clearance_checklist?.no_pending_dues ? '✓' : '×'}
            </span>
            <span className="text-xs font-semibold">No Pending Dues</span>
          </div>
        </div>
      </div>

      {/* 5-Step Departure Timeline */}
      {checkout.timeline && checkout.timeline.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-2xs space-y-3">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
            Departure & Clearance Progress Timeline
          </span>
          <div className="space-y-2.5">
            {checkout.timeline.map((item) => {
              const isCompleted = item.status === 'completed';
              return (
                <div key={item.step} className="flex items-center justify-between text-xs py-1">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                      isCompleted ? 'bg-[#175C46] text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {isCompleted ? '✓' : item.step}
                    </div>
                    <span className={`font-semibold ${isCompleted ? 'text-gray-900' : 'text-gray-500'}`}>
                      {item.title}
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-500">
                    {item.timestamp}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Review Information & Admin Notes */}
      {checkout.review_info && (checkout.review_info.reviewed_by || checkout.review_info.admin_notes) && (
        <div className="bg-emerald-50/60 rounded-xl border border-emerald-100 p-4 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-[#175C46] uppercase tracking-wider block">
            Approval Review & Fulfillment Notes
          </span>
          {checkout.review_info.reviewed_by && (
            <p className="text-xs text-emerald-950 font-semibold">
              Reviewed by: {checkout.review_info.reviewed_by} {checkout.review_info.reviewed_at ? `on ${checkout.review_info.reviewed_at}` : ''}
            </p>
          )}
          {checkout.review_info.admin_notes && (
            <p className="text-xs text-emerald-900 mt-1 leading-relaxed whitespace-pre-line">
              {checkout.review_info.admin_notes}
            </p>
          )}
        </div>
      )}
    </Dialog>
  );
};
