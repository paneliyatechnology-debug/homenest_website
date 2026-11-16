'use client';

import React from 'react';
import Image from 'next/image';
import { Dialog } from 'primereact/dialog';
import { StaffMember } from '@/types/staff';
import { StatusBadge } from '@/components/ui';

interface StaffDetailsModalProps {
  visible: boolean;
  onHide: () => void;
  staff: StaffMember | null;
}

export const StaffDetailsModal: React.FC<StaffDetailsModalProps> = ({
  visible,
  onHide,
  staff,
}) => {
  if (!staff) return null;

  const photoUrl = staff.profile_photo_url || staff.photo_url || staff.profile_photo || staff.photo;

  const branchList: string[] = staff.branches && staff.branches.length > 0
    ? staff.branches.map((b) => b.name).filter(Boolean)
    : staff.branch_names
    ? staff.branch_names.split(',').map((s) => s.trim()).filter(Boolean)
    : staff.branch_name
    ? [staff.branch_name.trim()]
    : [];

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#E8F8F0] text-[#175C46] flex items-center justify-center font-bold text-sm">
            {staff.name ? staff.name.charAt(0).toUpperCase() : 'S'}
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 leading-tight">{staff.name}</h3>
            <p className="text-xs text-gray-500 capitalize">{staff.staff_role?.replace(/_/g, ' ') || 'Staff Member'}</p>
          </div>
        </div>
      }
      style={{ width: '480px' }}
      modal
      className="p-fluid rounded-2xl overflow-hidden font-sans"
    >
      <div className="space-y-5 pt-1">
        {/* Profile Card Header */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50/70 border border-gray-100">
          <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 border-2 border-white shadow-sm bg-[#EBF7F2] flex items-center justify-center text-[#175C46] font-bold text-lg relative">
            {photoUrl ? (
              <Image
                src={photoUrl}
                alt={staff.name}
                width={64}
                height={64}
                className="w-full h-full object-cover"
                unoptimized
              />
            ) : (
              <span>{staff.name?.slice(0, 2).toUpperCase() || 'ST'}</span>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-gray-900 text-sm truncate">{staff.name}</span>
              <StatusBadge status={staff.status} />
            </div>
            <p className="text-xs text-gray-500 font-medium">
              ID: <span className="font-mono text-gray-700 font-semibold">#{staff.id}</span>
            </p>
            <p className="text-xs text-[#175C46] font-semibold">
              Role: {staff.staff_role?.replace(/_/g, ' ') || staff.role || '—'}
            </p>
          </div>
        </div>

        {/* Contact & Assignment Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
          <div className="p-3 bg-white rounded-xl border border-gray-100 space-y-1">
            <span className="text-gray-400 font-medium block">Phone number</span>
            <a
              href={`tel:${staff.phone}`}
              className="font-semibold text-gray-800 hover:text-[#175C46] flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>{staff.phone || '—'}</span>
            </a>
          </div>

          <div className="p-3 bg-white rounded-xl border border-gray-100 space-y-1">
            <span className="text-gray-400 font-medium block">Email address</span>
            <a
              href={`mailto:${staff.email}`}
              className="font-semibold text-gray-800 hover:text-[#175C46] truncate block"
              title={staff.email}
            >
              {staff.email || '—'}
            </a>
          </div>

          <div className="p-3 bg-white rounded-xl border border-gray-100 space-y-1.5 sm:col-span-2">
            <span className="text-gray-400 font-medium block">Assigned Branches</span>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {branchList.length === 0 ? (
                <span className="text-gray-500 font-medium">All Branches</span>
              ) : (
                branchList.map((branch, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-[#E8F8F0] text-[#175C46] border border-[#175C46]/20"
                  >
                    {branch}
                  </span>
                ))
              )}
            </div>
          </div>

          <div className="p-3 bg-white rounded-xl border border-gray-100 space-y-1">
            <span className="text-gray-400 font-medium block">Joined Date</span>
            <span className="font-semibold text-gray-700 block">{staff.created_at || '—'}</span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-gray-100 space-y-1">
            <span className="text-gray-400 font-medium block">Last Updated</span>
            <span className="font-semibold text-gray-700 block">{staff.updated_at || '—'}</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onHide}
            className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </Dialog>
  );
};

