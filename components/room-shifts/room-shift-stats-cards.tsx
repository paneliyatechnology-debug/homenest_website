'use client';

import React from 'react';
import { RoomShiftStats } from '@/types/room-shift';
import { StatCard, StatCardGrid } from '@/components/ui';

interface RoomShiftStatsCardsProps {
  stats: RoomShiftStats;
  loading?: boolean;
}

export const RoomShiftStatsCards: React.FC<RoomShiftStatsCardsProps> = ({
  stats,
  loading = false,
}) => {
  const cards = [
    {
      label: 'Total Requests',
      value: stats.total_requests ?? stats.total ?? 0,
      labelColor: 'text-[#175C46]',
      iconBg: 'bg-[#E8F8F0] text-[#175C46]',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      ),
    },
    {
      label: 'Approved',
      value: stats.approved ?? 0,
      labelColor: 'text-[#2563EB]',
      iconBg: 'bg-[#E8F1FD] text-[#2563EB]',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Pending',
      value: stats.pending ?? 0,
      labelColor: 'text-[#D97706]',
      iconBg: 'bg-[#FFF7E8] text-[#D97706]',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Rejected',
      value: stats.rejected ?? 0,
      labelColor: 'text-[#DC2626]',
      iconBg: 'bg-[#FDF2F2] text-[#DC2626]',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <StatCardGrid columns={4}>
      {cards.map((card) => (
        <StatCard
          key={card.label}
          label={card.label}
          value={loading ? '—' : card.value}
          icon={card.icon}
          iconBg={card.iconBg}
          labelColor={card.labelColor}
        />
      ))}
    </StatCardGrid>
  );
};
