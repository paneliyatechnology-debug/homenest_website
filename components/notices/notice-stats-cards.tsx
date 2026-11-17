'use client';

import React from 'react';
import { NoticeStats } from '@/types/notice';

interface NoticeStatsCardsProps {
  stats: NoticeStats;
  loading?: boolean;
}

export const NoticeStatsCards: React.FC<NoticeStatsCardsProps> = ({
  stats,
  loading = false,
}) => {
  const cards = [
    {
      label: 'Total Notices',
      value: stats.total_notices ?? 0,
      iconBg: 'bg-[#E8F8F0] text-[#175C46]',
      icon: (
        <svg className="w-6 h-6 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      ),
    },
    {
      label: 'Drafts',
      value: stats.drafts ?? 0,
      iconBg: 'bg-[#E8F1FD] text-[#2563EB]',
      icon: (
        <svg className="w-6 h-6 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
    },
    {
      label: 'Scheduled',
      value: stats.scheduled ?? 0,
      iconBg: 'bg-[#FEF7E6] text-[#B06000]',
      icon: (
        <svg className="w-6 h-6 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l1.5 1.5" />
        </svg>
      ),
    },
    {
      label: 'Sent',
      value: stats.sent ?? 0,
      iconBg: 'bg-[#E8F8F0] text-[#175C46]',
      icon: (
        <svg className="w-6 h-6 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
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
            <span className="text-xs font-semibold text-gray-500 truncate">
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
