'use client';

import React from 'react';
import { RoomStats } from '@/types/room';

interface RoomStatsCardsProps {
  stats: RoomStats;
}

export const RoomStatsCards: React.FC<RoomStatsCardsProps> = ({ stats }) => {
  const cards = [
    {
      label: 'Total Rooms',
      value: stats.total_rooms,
      labelColor: 'text-[#175C46]',
      iconBg: 'bg-[#E8F8F0]',
      iconColor: 'text-[#175C46]',
      icon: (
        <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 7v11m0-4h18m0-7v11M3 11a3 3 0 013-3h3a3 3 0 013 3v3H3v-3z"
          />
        </svg>
      ),
    },
    {
      label: 'Occupied',
      value: stats.occupied,
      labelColor: 'text-[#10B981]',
      iconBg: 'bg-[#EBF7F2]',
      iconColor: 'text-[#10B981]',
      icon: (
        <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      ),
    },
    {
      label: 'Vacant',
      value: stats.vacant,
      labelColor: 'text-[#3B82F6]',
      iconBg: 'bg-[#EFF6FF]',
      iconColor: 'text-[#3B82F6]',
      icon: (
        <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      label: 'Maintenance',
      value: stats.maintenance,
      labelColor: 'text-[#D97706]',
      iconBg: 'bg-[#FFFBEB]',
      iconColor: 'text-[#D97706]',
      icon: (
        <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
          />
        </svg>
      ),
    },
    {
      label: 'Out of service',
      value: stats.out_of_service,
      labelColor: 'text-[#E11D48]',
      iconBg: 'bg-[#FFF1F2]',
      iconColor: 'text-[#E11D48]',
      icon: (
        <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100/80 shadow-2xs flex items-center gap-3.5 transition-shadow hover:shadow-xs"
        >
          <div
            className={`w-11 h-11 rounded-full ${card.iconBg} ${card.iconColor} flex items-center justify-center shrink-0 shadow-2xs`}
          >
            {card.icon}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-semibold text-gray-500 block truncate">
              {card.label}
            </span>
            <span className="text-xl sm:text-2xl font-bold text-gray-900 block tracking-tight mt-0.5">
              {card.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

