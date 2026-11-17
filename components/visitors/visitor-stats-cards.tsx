'use client';

import React from 'react';
import { VisitorStats } from '@/types/visitor';

interface VisitorStatsCardsProps {
  stats: VisitorStats;
  loading?: boolean;
}

export const VisitorStatsCards: React.FC<VisitorStatsCardsProps> = ({
  stats,
  loading = false,
}) => {
  const cards = [
    {
      label: 'Total Visitors',
      value: stats.total_visitors ?? 0,
      labelColor: 'text-[#175C46]',
      iconBg: 'bg-[#E8F8F0] text-[#175C46]',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      label: 'Today',
      value: stats.today ?? 0,
      labelColor: 'text-[#2563EB]',
      iconBg: 'bg-[#E8F1FD] text-[#2563EB]',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Active on-site',
      value: stats.active_on_site ?? 0,
      labelColor: 'text-[#B06000]',
      iconBg: 'bg-[#FEF7E6] text-[#B06000]',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      label: 'Pending Approval',
      value: stats.pending_approval ?? 0,
      labelColor: 'text-[#DC2626]',
      iconBg: 'bg-[#FDF2F2] text-[#DC2626]',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center gap-4 hover:shadow-xs transition-all"
        >
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${card.iconBg}`}
          >
            {card.icon}
          </div>
          <div className="flex flex-col min-w-0">
            <span className={`text-xs font-semibold ${card.labelColor} truncate`}>
              {card.label}
            </span>
            <span className="text-2xl font-bold text-gray-900 tracking-tight mt-0.5">
              {loading ? '—' : card.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
