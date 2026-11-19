'use client';

import React from 'react';
import { ComplaintStats } from '@/types/complaint';

interface ComplaintStatsCardsProps {
  stats: ComplaintStats;
  loading?: boolean;
}

export const ComplaintStatsCards: React.FC<ComplaintStatsCardsProps> = ({
  stats,
  loading = false,
}) => {
  const total = stats.total_complaints ?? stats.total ?? 0;
  const pending = stats.pending_complaints ?? stats.pending ?? stats.open_complaints ?? stats.open ?? 0;
  const inProgress = stats.in_progress_complaints ?? stats.in_progress ?? 0;
  const resolved = stats.resolved_complaints ?? stats.resolved ?? 0;
  const overdue = stats.overdue_complaints ?? stats.overdue ?? 0;

  const cards = [
    {
      label: 'Total Complaints',
      value: total,
      iconBg: 'bg-[#E8F8F0] text-[#175C46]',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      label: 'Pending',
      value: pending,
      iconBg: 'bg-[#FEF7E6] text-[#B06000]',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'In Progress',
      value: inProgress,
      iconBg: 'bg-[#FEF7E6] text-[#B06000]',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
    },
    {
      label: 'Resolved',
      value: resolved,
      iconBg: 'bg-[#E8F8F0] text-[#175C46]',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Over due',
      value: overdue,
      iconBg: 'bg-[#FDF2F2] text-[#DC2626]',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4 w-full">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center gap-3.5 hover:shadow-xs transition-all min-h-[92px]"
        >
          <div
            className={`w-11 h-11 rounded-xl ${card.iconBg} flex items-center justify-center shrink-0`}
          >
            {card.icon}
          </div>
          <div className="min-w-0 flex flex-col justify-center">
            <span className="text-xs font-medium text-gray-500 tracking-tight truncate">
              {card.label}
            </span>
            <span className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mt-0.5">
              {loading ? '—' : Number(card.value).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
