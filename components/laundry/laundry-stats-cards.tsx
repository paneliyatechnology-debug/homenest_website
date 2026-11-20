'use client';

import React from 'react';
import { LaundryStats } from '@/types/laundry';
import { StatCard, StatCardGrid } from '@/components/ui';

interface LaundryStatsCardsProps {
  stats: LaundryStats;
  loading?: boolean;
}

export const LaundryStatsCards: React.FC<LaundryStatsCardsProps> = ({ stats, loading = false }) => {
  return (
    <StatCardGrid columns={4}>
      {/* 1. Total Requests */}
      <StatCard
        label="Total Requests"
        value={stats.total_requests ?? stats.total ?? 0}
        loading={loading}
        iconShape="rounded"
        iconBg="bg-[#E8F8F0] text-[#175C46]"
        icon={
          <svg className="w-6 h-6 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
          </svg>
        }
      />

      {/* 2. In Progress */}
      <StatCard
        label="In Progress"
        value={stats.in_progress ?? 0}
        loading={loading}
        iconShape="rounded"
        iconBg="bg-[#E8F1FD] text-[#2563EB]"
        icon={
          <svg className="w-6 h-6 stroke-current animate-spin-slow" fill="none" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v3m0 9v3m7.5-7.5h-3m-9 0h-3m12.728-5.728l-2.122 2.122m-8.486 8.486l-2.122 2.122m12.728 0l-2.122-2.122m-8.486-8.486l-2.122-2.122" />
          </svg>
        }
      />

      {/* 3. Pending */}
      <StatCard
        label="Pending"
        value={stats.pending ?? 0}
        loading={loading}
        iconShape="rounded"
        iconBg="bg-[#FEF7E6] text-[#B06000]"
        icon={
          <svg className="w-6 h-6 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />

      {/* 4. Completed */}
      <StatCard
        label="Completed"
        value={stats.completed ?? 0}
        loading={loading}
        iconShape="rounded"
        iconBg="bg-[#E8F8F0] text-[#175C46]"
        icon={
          <svg className="w-6 h-6 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
    </StatCardGrid>
  );
};
