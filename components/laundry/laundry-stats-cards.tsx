'use client';

import React from 'react';
import { LaundryStats } from '@/types/laundry';

interface LaundryStatsCardsProps {
  stats: LaundryStats;
  loading?: boolean;
}

export const LaundryStatsCards: React.FC<LaundryStatsCardsProps> = ({ stats, loading = false }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {/* 1. Total Requests */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#E8F8F0] text-[#175C46] flex items-center justify-center shrink-0 shadow-2xs">
            <svg className="w-6 h-6 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
            </svg>
          </div>
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-500">Total Requests</p>
            {loading ? (
              <div className="h-7 w-16 bg-gray-100 rounded-md animate-pulse mt-1" />
            ) : (
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mt-0.5">
                {stats.total_requests ?? stats.total ?? 0}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 2. In Progress */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#E8F1FD] text-[#2563EB] flex items-center justify-center shrink-0 shadow-2xs">
            <svg className="w-6 h-6 stroke-current animate-spin-slow" fill="none" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v3m0 9v3m7.5-7.5h-3m-9 0h-3m12.728-5.728l-2.122 2.122m-8.486 8.486l-2.122 2.122m12.728 0l-2.122-2.122m-8.486-8.486l-2.122-2.122" />
            </svg>
          </div>
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-500">In Progress</p>
            {loading ? (
              <div className="h-7 w-16 bg-gray-100 rounded-md animate-pulse mt-1" />
            ) : (
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mt-0.5">
                {stats.in_progress ?? 0}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 3. Pending */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#FEF7E6] text-[#B06000] flex items-center justify-center shrink-0 shadow-2xs">
            <svg className="w-6 h-6 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-500">Pending</p>
            {loading ? (
              <div className="h-7 w-16 bg-gray-100 rounded-md animate-pulse mt-1" />
            ) : (
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mt-0.5">
                {stats.pending ?? 0}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 4. Completed */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#E8F8F0] text-[#175C46] flex items-center justify-center shrink-0 shadow-2xs">
            <svg className="w-6 h-6 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-500">Completed</p>
            {loading ? (
              <div className="h-7 w-16 bg-gray-100 rounded-md animate-pulse mt-1" />
            ) : (
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mt-0.5">
                {stats.completed ?? 0}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
