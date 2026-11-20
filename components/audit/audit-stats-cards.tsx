'use client';

import React from 'react';
import { AuditStats } from '@/types/audit';
import { StatCard, StatCardGrid } from '@/components/ui';

interface AuditStatsCardsProps {
  stats: AuditStats;
}

// Activity Pulse Wave Icon matching Card 1 in Figma
const ActivityPulseIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3.5 12h4l2.5-5 3.5 10 2.5-5h4.5" />
  </svg>
);

// Calendar Icon with Top Rings, Header Divider & Event Square matching Cards 2, 3, 4 in Figma
const CalendarCardIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Calendar Body */}
    <rect
      x="3.5"
      y="5"
      width="17"
      height="15"
      rx="2.5"
      stroke="currentColor"
      strokeWidth="2"
    />
    {/* Top Rings */}
    <path
      d="M8 2.5V5.5M16 2.5V5.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    {/* Header Divider Line */}
    <path
      d="M3.5 9.5H20.5"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    {/* Small Day / Event Square */}
    <rect
      x="7.5"
      y="13"
      width="3.5"
      height="3.5"
      rx="0.6"
      fill="currentColor"
    />
  </svg>
);

export const AuditStatsCards: React.FC<AuditStatsCardsProps> = ({ stats }) => {
  const cards = [
    {
      label: 'Total Activities',
      value: stats.total_activities ?? stats.total ?? stats.total_audits ?? 0,
      textColor: 'text-[#175C46]',
      bgCircle: 'bg-[#E8F8F0] text-[#175C46]',
      icon: <ActivityPulseIcon className="w-5 h-5 text-[#175C46]" />,
    },
    {
      label: 'Today',
      value: stats.today ?? stats.today_activities ?? stats.today_audits ?? 0,
      textColor: 'text-[#2563EB]',
      bgCircle: 'bg-[#EFF6FF] text-[#2563EB]',
      icon: <CalendarCardIcon className="w-5 h-5 text-[#2563EB]" />,
    },
    {
      label: 'Last 7 Days',
      value: stats.last_7_days ?? stats.last_7_days_activities ?? stats.last_7_days_audits ?? 0,
      textColor: 'text-[#D97706]',
      bgCircle: 'bg-[#FEF7E0] text-[#D97706]',
      icon: <CalendarCardIcon className="w-5 h-5 text-[#D97706]" />,
    },
    {
      label: 'Last 30 Days',
      value: stats.last_30_days ?? stats.last_30_days_activities ?? stats.last_30_days_audits ?? 0,
      textColor: 'text-[#DC2626]',
      bgCircle: 'bg-[#FDF2F2] text-[#DC2626]',
      icon: <CalendarCardIcon className="w-5 h-5 text-[#DC2626]" />,
    },
  ];

  return (
    <StatCardGrid columns={4}>
      {cards.map((card) => (
        <StatCard
          key={card.label}
          label={card.label}
          value={Number(card.value).toLocaleString()}
          icon={card.icon}
          iconBg={card.bgCircle}
          labelColor={card.textColor}
        />
      ))}
    </StatCardGrid>
  );
};
