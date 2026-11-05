'use client';

import React from 'react';
import { BranchStats } from '@/types/branch';

interface BranchStatsCardsProps {
  stats: BranchStats;
}

export const BranchStatsCards: React.FC<BranchStatsCardsProps> = ({ stats }) => {
  const cards = [
    {
      label: 'Total Branches',
      value: stats.total_branches ?? 0,
      textColor: 'text-[#175C46]',
      bgCircle: 'bg-[#E8F8F0] text-[#175C46]',
      icon: (
        <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      ),
    },
    {
      label: 'Active',
      value: stats.active ?? 0,
      textColor: 'text-[#2563EB]',
      bgCircle: 'bg-[#EFF6FF] text-[#2563EB]',
      icon: (
        <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Under Maintenance',
      value: stats.maintenance ?? 0,
      textColor: 'text-[#D97706]',
      bgCircle: 'bg-[#FEF7E0] text-[#D97706]',
      icon: (
        <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"
          />
        </svg>
      ),
    },
    {
      label: 'Upcoming',
      value: stats.upcoming ?? 0,
      textColor: 'text-[#DC2626]',
      bgCircle: 'bg-[#FDF2F2] text-[#DC2626]',
      icon: (
        <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white rounded-2xl border border-gray-100/90 px-5 py-4.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center gap-4 hover:shadow-xs transition-all"
        >
          {/* Circular Icon Badge */}
          <div className={`w-12 h-12 rounded-full ${card.bgCircle} flex items-center justify-center shrink-0`}>
            {card.icon}
          </div>

          {/* Label and Count */}
          <div className="min-w-0 flex flex-col justify-center">
            <span className={`text-[12px] sm:text-[13px] font-medium ${card.textColor} tracking-tight truncate`}>
              {card.label}
            </span>
            <span className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight leading-tight mt-0.5">
              {Number(card.value).toLocaleString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

