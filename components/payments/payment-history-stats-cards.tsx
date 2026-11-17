'use client';

import React from 'react';
import { PaymentStats } from '@/types/payment';
import { formatCurrency } from './payment-overview-stats-cards';

interface PaymentHistoryStatsCardsProps {
  stats: PaymentStats;
}

export const PaymentHistoryStatsCards: React.FC<PaymentHistoryStatsCardsProps> = ({ stats }) => {
  const cards = [
    {
      label: 'Total Transactions',
      value: Number(stats.total_transactions ?? 0).toLocaleString('en-IN'),
      iconBg: 'bg-[#E8F8F0] text-[#175C46]',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
    },
    {
      label: 'TotalCollected',
      value: formatCurrency(stats.collected),
      iconBg: 'bg-[#E8F8F0] text-[#175C46]',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      label: 'Total Pending',
      value: formatCurrency(stats.total_pending ?? stats.pending_dues),
      iconBg: 'bg-[#FEF7E6] text-[#B06000]',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Total Refunded',
      value: formatCurrency(stats.total_refunded),
      iconBg: 'bg-[#FDF2F2] text-[#DC2626]',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a5 5 0 015 5v2M3 10l5-5m-5 5l5 5" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 w-full">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white rounded-2xl border border-gray-100 p-4.5 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center gap-4 hover:shadow-xs transition-all min-h-[96px]"
        >
          <div
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full ${card.iconBg} flex items-center justify-center shrink-0`}
          >
            {card.icon}
          </div>
          <div className="min-w-0 flex flex-col justify-center">
            <span className="text-xs sm:text-[13px] font-medium text-gray-500 tracking-tight truncate">
              {card.label}
            </span>
            <span className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight leading-tight mt-0.5">
              {card.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
