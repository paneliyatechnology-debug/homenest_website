'use client';

import React from 'react';
import { Dialog } from 'primereact/dialog';
import { LaundryRequest } from '@/types/laundry';
import { StatusBadge, ModalHeader } from '@/components/ui';

interface LaundryDetailsModalProps {
  visible: boolean;
  onHide: () => void;
  request: LaundryRequest | null;
  onEdit?: (request: LaundryRequest) => void;
  onUpdateStatus?: (request: LaundryRequest) => void;
  onAssignStaff?: (request: LaundryRequest) => void;
}

export const LaundryDetailsModal: React.FC<LaundryDetailsModalProps> = ({
  visible,
  onHide,
  request,
  onEdit,
  onUpdateStatus,
  onAssignStaff,
}) => {
  if (!request) return null;

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      modal
      draggable={false}
      resizable={false}
      className="w-full max-w-2xl mx-4 rounded-2xl overflow-hidden shadow-2xl border-0 font-sans"
      header={
        <ModalHeader
          title={
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
                {request.request_number}
              </h2>
              <StatusBadge status={request.status} label={request.status} />
              {request.is_billed ? (
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Billed {request.payment_id ? `(#${request.payment_id})` : ''}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  Unbilled
                </span>
              )}
            </div>
          }
          subtitle={`Created on ${request.created_at}`}
          icon={
            <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
            </svg>
          }
        />
      }
      contentClassName="p-5 sm:p-6 space-y-5 bg-gray-50/50 max-h-[75vh] overflow-y-auto"
      footer={
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100 bg-white">
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onHide();
                  onEdit(request);
                }}
                className="h-9 px-3.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
                Edit
              </button>
            )}
            {onAssignStaff && (
              <button
                type="button"
                onClick={() => {
                  onHide();
                  onAssignStaff(request);
                }}
                className="h-9 px-3.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                </svg>
                Assign Staff
              </button>
            )}
            {onUpdateStatus && (
              <button
                type="button"
                onClick={() => {
                  onHide();
                  onUpdateStatus(request);
                }}
                className="h-9 px-3.5 text-xs font-semibold text-[#175C46] bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200 rounded-xl shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Update Status
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onHide}
            className="h-9 px-4 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      }
    >
      {/* Resident Info Card */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-2xs space-y-3">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          Resident & Room Information
        </h3>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-emerald-50 text-[#175C46] font-bold text-sm flex items-center justify-center shrink-0 border border-emerald-200/60">
              {request.resident?.name ? request.resident.name.charAt(0).toUpperCase() : 'R'}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{request.resident?.name || 'Resident'}</p>
              <p className="text-xs text-gray-500 font-medium">
                {request.resident?.phone || 'No phone'} • {request.resident?.email || 'No email'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-800 text-xs font-semibold">
              {request.room?.room_no ? `Room ${request.room.room_no}` : 'No room'}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-[#175C46] text-xs font-semibold">
              {request.branch_name || 'Main Branch'}
            </span>
          </div>
        </div>
      </div>

      {/* Schedule & Assignment Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-2xs space-y-1.5">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
            Pickup / Schedule
          </span>
          <p className="text-sm font-semibold text-gray-900">
            {request.pickup_schedule || request.pickup_date}
          </p>
          <p className="text-xs text-gray-500">
            Type: <span className="font-medium text-gray-700">{request.request_type}</span>
            {request.service_subtype && (
              <> • <span className="font-medium text-gray-700">{request.service_subtype}</span></>
            )}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-2xs space-y-1.5">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
            Assigned Staff
          </span>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {request.assigned_staff?.name || request.assigned_name || 'Unassigned'}
              </p>
              {request.assigned_staff?.phone && (
                <p className="text-xs text-gray-500">{request.assigned_staff.phone}</p>
              )}
            </div>
            {request.assigned_staff ? (
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" title="Assigned" />
            ) : (
              <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                Pending Assign
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Items Breakdown Table */}
      {request.items && request.items.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-2xs">
          <div className="px-4 py-3 bg-gray-50/70 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Items Cleaned / Requested
            </span>
            <span className="text-xs font-semibold text-gray-500">
              {request.total_items_count || request.items.length} Total Items
            </span>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                <th className="py-2.5 px-4">Item Name</th>
                <th className="py-2.5 px-4 text-center">Unit Rate</th>
                <th className="py-2.5 px-4 text-center">Quantity</th>
                <th className="py-2.5 px-4 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs">
              {request.items.map((item, idx) => (
                <tr key={`${item.name}-${idx}`} className="hover:bg-gray-50/50">
                  <td className="py-2.5 px-4 font-semibold text-gray-900">{item.name}</td>
                  <td className="py-2.5 px-4 text-center text-gray-600">₹{item.rate}</td>
                  <td className="py-2.5 px-4 text-center font-bold text-gray-900">{item.quantity}</td>
                  <td className="py-2.5 px-4 text-right font-bold text-gray-900">
                    ₹{item.total ?? item.rate * item.quantity}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-100 bg-gray-50/60 font-bold text-xs text-gray-900">
                <td colSpan={3} className="py-3 px-4 text-right uppercase tracking-wider">
                  Total Amount
                </td>
                <td className="py-3 px-4 text-right text-sm text-[#175C46]">
                  ₹{request.total_amount}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Special Instructions & Notes */}
      <div className="space-y-3">
        {request.special_instructions && (
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Resident Special Instructions
            </span>
            <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">
              {request.special_instructions}
            </p>
          </div>
        )}

        {request.admin_notes && (
          <div className="bg-emerald-50/50 rounded-xl border border-emerald-100/70 p-4 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-[#175C46] uppercase tracking-wider block">
              Admin & Fulfillment Notes
            </span>
            <p className="text-xs text-emerald-900 leading-relaxed whitespace-pre-line font-medium">
              {request.admin_notes}
            </p>
          </div>
        )}
      </div>
    </Dialog>
  );
};
