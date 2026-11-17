'use client';

import React from 'react';
import { BuildingStats } from '@/types/building';

interface BuildingStatsCardsProps {
  stats: BuildingStats;
}

export const BuildingStatsCards: React.FC<BuildingStatsCardsProps> = ({ stats }) => {
  const cards = [
    {
      label: 'Total Buildings',
      value: stats.total_buildings,
      iconBg: 'bg-[#E8F8F0]',
      iconColor: 'text-[#175C46]',
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
      label: 'Total Floors',
      value: stats.total_floors,
      iconBg: 'bg-[#EFF6FF]',
      iconColor: 'text-[#2563EB]',
      icon: (
        <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      ),
    },
    {
      label: 'Total Rooms',
      value: stats.total_rooms,
      iconBg: 'bg-[#ECFDF5]',
      iconColor: 'text-[#059669]',
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
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100/80 shadow-2xs flex items-center gap-3.5 transition-shadow hover:shadow-xs"
        >
          <div
            className={`w-11 h-11 rounded-full ${card.iconBg} ${card.iconColor} flex items-center justify-center shrink-0`}
          >
            {card.icon}
          </div>

          <div className="min-w-0">
            <span className="text-xs font-medium text-gray-500 block truncate">
              {card.label}
            </span>
            <span className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight leading-tight block">
              {card.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
