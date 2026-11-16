'use client';

import React from 'react';
import { StaffStats } from '@/types/staff';

interface StaffStatsCardsProps {
  stats: StaffStats;
}

export const StaffStatsCards: React.FC<StaffStatsCardsProps> = ({ stats }) => {
  const cards = [
    {
      label: 'Total Staff',
      value: stats.total_staff ?? stats.total ?? 0,
      textColor: 'text-[#175C46]',
      bgCircle: 'bg-[#E8F8F0] text-[#175C46]',
      icon: (
        <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
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
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      label: 'On Leave',
      value: stats.on_leave ?? 0,
      textColor: 'text-[#D97706]',
      bgCircle: 'bg-[#FEF7E0] text-[#D97706]',
      icon: (
        <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
      ),
    },
    {
      label: 'Inactive',
      value: stats.inactive ?? 0,
      textColor: 'text-[#DC2626]',
      bgCircle: 'bg-[#FDF2F2] text-[#DC2626]',
      icon: (
        <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
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

