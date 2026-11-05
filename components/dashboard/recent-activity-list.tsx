'use client';

import React from 'react';
import { RecentActivityItem } from '@/types/dashboard';

interface RecentActivityListProps {
  activities?: RecentActivityItem[];
}

export const RecentActivityList: React.FC<RecentActivityListProps> = ({
  activities = [],
}) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'maintenance':
        return (
          <div className="w-9 h-9 rounded-full bg-[#E6F4EA] text-[#175C46] flex items-center justify-center shrink-0">
            {/* Crossed tools / wrench icon matching Figma */}
            <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.77 3.77z" />
            </svg>
          </div>
        );
      case 'visitor':
        return (
          <div className="w-9 h-9 rounded-full bg-[#EEF4FF] text-[#3B82F6] flex items-center justify-center shrink-0">
            {/* Two persons / visitor icon */}
            <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        );
      case 'payment':
        return (
          <div className="w-9 h-9 rounded-full bg-[#EEF4FF] text-[#3B82F6] flex items-center justify-center shrink-0">
            {/* Invoice / receipt icon */}
            <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 14h6m-6-4h6m-9 9l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14z" />
            </svg>
          </div>
        );
      case 'complaint_resolved':
      default:
        return (
          <div className="w-9 h-9 rounded-full bg-[#E6F4EA] text-[#175C46] flex items-center justify-center shrink-0">
            {/* Shield with checkmark matching Figma */}
            <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
        );
    }
  };

  if (!activities || activities.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100/90 p-4 sm:p-5 xl:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] w-full">
        <div className="mb-3">
          <h3 className="text-base font-bold text-gray-900 tracking-tight">
            Recent Activity
          </h3>
        </div>
        <p className="text-xs text-gray-400 py-3">No recent activities found.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100/90 p-4 sm:p-5 xl:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] w-full">
      {/* Header matching Figma */}
      <div className="mb-3">
        <h3 className="text-base font-bold text-gray-900 tracking-tight">
          Recent Activity
        </h3>
      </div>

      {/* 2-Column Responsive Grid matching Figma */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3.5">
        {activities.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between py-1 transition-colors hover:bg-gray-50/60 rounded-lg px-1.5"
          >
            {/* Left: Icon & Title/Subtitle */}
            <div className="flex items-center gap-3 min-w-0">
              {getActivityIcon(item.type)}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
                  {item.title}
                </p>
                <p className="text-xs text-gray-400 font-normal truncate mt-0.5">
                  {item.subtitle}
                </p>
              </div>
            </div>

            {/* Right: Time Ago */}
            <span className="text-xs text-gray-400 font-normal shrink-0 pl-3">
              {item.time_ago}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
