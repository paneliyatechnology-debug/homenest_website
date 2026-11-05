'use client';

import React from 'react';
import { AgreementStats } from '@/types/agreement';

interface AgreementStatsCardsProps {
  stats: AgreementStats;
}

export const AgreementStatsCards: React.FC<AgreementStatsCardsProps> = ({ stats }) => {
  const cards = [
    {
      label: 'Agreements',
      value: stats.total_agreements ?? stats.total ?? 0,
      textColor: 'text-[#175C46]',
      bgCircle: 'bg-[#E8F8F0] text-[#175C46]',
      icon: (
        <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      label: 'Draft',
      value: stats.draft ?? 0,
      textColor: 'text-[#2563EB]',
      bgCircle: 'bg-[#EFF6FF] text-[#2563EB]',
      icon: (
        <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
    },
    {
      label: 'Pending Sign',
      value: stats.pending_sign ?? stats.pending ?? 0,
      textColor: 'text-[#D97706]',
      bgCircle: 'bg-[#FEF7E0] text-[#D97706]',
      icon: (
        <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 12v3m0 0l-1.5-1.5M12 15l1.5-1.5" />
        </svg>
      ),
    },
    {
      label: 'Signed',
      value: stats.signed ?? 0,
      textColor: 'text-[#175C46]',
      bgCircle: 'bg-[#E8F8F0] text-[#175C46]',
      icon: (
        <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      label: 'Expired',
      value: stats.expired ?? 0,
      textColor: 'text-[#DC2626]',
      bgCircle: 'bg-[#FDF2F2] text-[#DC2626]',
      icon: (
        <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4 w-full">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white rounded-2xl border border-gray-100/90 px-4 py-4 sm:px-5 sm:py-4.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center gap-3.5 hover:shadow-xs transition-all"
        >
          {/* Round Circle Icon Badge matching Figma */}
          <div
            className={`w-12 h-12 rounded-full ${card.bgCircle} flex items-center justify-center shrink-0`}
          >
            {card.icon}
          </div>

          {/* Text & Count matching Figma */}
          <div className="min-w-0 flex flex-col justify-center">
            <span className={`text-[12px] sm:text-[13px] font-medium ${card.textColor} tracking-tight truncate`}>
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
