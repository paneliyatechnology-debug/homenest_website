'use client';

import React from 'react';

export type StatusVariant =
  | 'active'
  | 'maintenance'
  | 'under_maintenance'
  | 'upcoming'
  | 'pending'
  | 'pending_sign'
  | 'inactive'
  | 'signed'
  | 'draft'
  | 'expired'
  | 'on_leave'
  | 'on leave'
  | 'paid'
  | 'completed'
  | 'overdue'
  | 'refunded'
  | 'failed'
  | string;

export interface StatusBadgeProps {
  status?: StatusVariant;
  label?: string;
  variant?: 'branch' | 'default';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status = 'active',
  label,
  variant = 'default',
  className = '',
}) => {
  const normalized = String(status || '').toLowerCase().trim();

  let badgeStyle = 'bg-gray-100 text-gray-700';
  let displayLabel = label || status || 'Active';

  // Branch specific palette matching Figma pixel-for-pixel
  if (
    variant === 'branch' ||
    normalized === 'maintenance' ||
    normalized === 'under_maintenance' ||
    normalized === 'under maintenance' ||
    normalized === 'upcoming'
  ) {
    if (normalized === 'active') {
      badgeStyle = 'bg-[#E8F1FD] text-[#2563EB]';
      displayLabel = label || 'Active';
    } else if (
      normalized === 'maintenance' ||
      normalized === 'under_maintenance' ||
      normalized === 'under maintenance'
    ) {
      badgeStyle = 'bg-[#FEF7E0] text-[#D97706]';
      displayLabel = label || 'Under maintenance';
    } else if (normalized === 'upcoming') {
      badgeStyle = 'bg-[#FDF2F2] text-[#DC2626]';
      displayLabel = label || 'Upcoming';
    }
  } else {
    // Resident / Agreement / Payment / General palette matching Figma
    if (
      normalized === 'active' ||
      normalized === 'signed' ||
      normalized === 'paid' ||
      normalized === 'completed' ||
      normalized === 'success' ||
      normalized === 'resolved' ||
      normalized === 'in_office' ||
      normalized === 'in office' ||
      normalized === 'approved' ||
      normalized === 'sent'
    ) {
      badgeStyle = 'bg-[#E8F8F0] text-[#175C46]';
      displayLabel =
        label ||
        (normalized === 'in_office' || normalized === 'in office'
          ? 'In Office'
          : normalized === 'approved'
          ? 'Approved'
          : normalized === 'signed'
          ? 'Signed'
          : normalized === 'completed'
          ? 'Completed'
          : normalized === 'paid'
          ? 'Paid'
          : normalized === 'resolved'
          ? 'Resolved'
          : normalized === 'sent'
          ? 'Sent'
          : 'Active');
    } else if (
      normalized === 'pending' ||
      normalized === 'pending_sign' ||
      normalized === 'pending signature' ||
      normalized === 'pending_approval' ||
      normalized === 'pending approval' ||
      normalized === 'unpaid' ||
      normalized === 'in_progress' ||
      normalized === 'in progress' ||
      normalized === 'scheduled'
    ) {
      badgeStyle = 'bg-[#FEF7E6] text-[#B06000]';
      displayLabel =
        label ||
        (normalized === 'in_progress' || normalized === 'in progress'
          ? 'In Progress'
          : normalized === 'scheduled'
          ? 'Scheduled'
          : normalized === 'pending_approval' || normalized === 'pending approval'
          ? 'Pending'
          : 'Pending');
    } else if (normalized === 'left') {
      badgeStyle = 'bg-[#FDF2F2] text-[#DC2626]';
      displayLabel = label || 'Left';
    } else if (normalized === 'open') {
      badgeStyle = 'bg-[#E8F1FD] text-[#2563EB]';
      displayLabel = label || 'Open';
    } else if (normalized === 'high') {
      badgeStyle = 'bg-[#FDF2F2] text-[#DC2626]';
      displayLabel = label || 'High';
    } else if (normalized === 'medium') {
      badgeStyle = 'bg-[#FEF7E6] text-[#B06000]';
      displayLabel = label || 'Medium';
    } else if (normalized === 'low') {
      badgeStyle = 'bg-[#E8F1FD] text-[#2563EB]';
      displayLabel = label || 'Low';
    } else if (normalized === 'closed') {
      badgeStyle = 'bg-gray-100 text-gray-700';
      displayLabel = label || 'Closed';
    } else if (normalized === 'overdue') {
      badgeStyle = 'bg-[#FDF2F2] text-[#DC2626]';
      displayLabel = label || 'Overdue';
    } else if (normalized === 'refunded' || normalized === 'refund') {
      badgeStyle = 'bg-[#FEE2E2]/60 text-[#DC2626]';
      displayLabel = label || 'Refunded';
    } else if (normalized === 'failed') {
      badgeStyle = 'bg-[#FEF2F2] text-[#991B1B] border border-red-200/60';
      displayLabel = label || 'Failed';
    } else if (normalized === 'expired' || normalized === 'inactive') {
      badgeStyle = 'bg-[#FDF2F2] text-[#DC2626]';
      displayLabel = label || (normalized === 'expired' ? 'Expired' : 'Inactive');
    } else if (normalized === 'on_leave' || normalized === 'on leave') {
      badgeStyle = 'bg-[#FEF7E6] text-[#B06000]';
      displayLabel = label || 'On Leave';
    } else if (normalized === 'draft') {
      badgeStyle = 'bg-[#EFF6FF] text-[#2563EB]';
      displayLabel = label || 'Draft';
    }
  }

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold capitalize tracking-tight select-none ${badgeStyle} ${className}`}
    >
      {displayLabel}
    </span>
  );
};
