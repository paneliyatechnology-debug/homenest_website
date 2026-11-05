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
    // Resident / Agreement / General palette matching Figma
    if (normalized === 'active' || normalized === 'signed') {
      badgeStyle = 'bg-[#E8F8F0] text-[#175C46]';
      displayLabel = label || (normalized === 'signed' ? 'Signed' : 'Active');
    } else if (
      normalized === 'pending' ||
      normalized === 'pending_sign' ||
      normalized === 'pending signature'
    ) {
      badgeStyle = 'bg-[#FEF7E6] text-[#B06000]';
      displayLabel = label || 'Pending';
    } else if (normalized === 'expired' || normalized === 'inactive') {
      badgeStyle = 'bg-[#FDF2F2] text-[#DC2626]';
      displayLabel = label || (normalized === 'expired' ? 'Expired' : 'Inactive');
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
