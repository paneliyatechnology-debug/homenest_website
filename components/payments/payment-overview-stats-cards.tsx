'use client';

import React from 'react';
import { PaymentStats, formatCurrency } from '@/types/payment';

export { formatCurrency };

interface PaymentOverviewStatsCardsProps {
  stats: PaymentStats;
}

export const PaymentOverviewStatsCards: React.FC<PaymentOverviewStatsCardsProps> = ({ stats }) => {
  const collectedPct =
    stats.collected_percentage ??
    (stats.total_revenue > 0 ? Math.round((stats.collected / stats.total_revenue) * 100) : 0);
  const pendingPct =
    stats.pending_dues > 0 && stats.total_revenue > 0
      ? Math.round((stats.pending_dues / stats.total_revenue) * 100)
      : stats.pending_percentage ?? 0;
  const overduePct =
    stats.overdue > 0 && stats.total_revenue > 0
      ? Math.round((stats.overdue / stats.total_revenue) * 100)
      : stats.overdue_percentage ?? 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 w-full">
      {/* 1. Total Revenue Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4.5 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:shadow-xs transition-all min-h-[146px]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E8F8F0] flex items-center justify-center text-[#175C46] shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="text-xs sm:text-sm font-medium text-gray-700">Total Revenue</span>
        </div>

        <div className="mt-3.5">
          <div className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            {formatCurrency(stats.total_revenue)}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            <span className="inline-flex items-center font-semibold text-[#175C46]">
              <svg className="w-3.5 h-3.5 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              12%
            </span>
            <span className="text-gray-400 font-normal">vs. last month</span>
          </div>
        </div>
      </div>

      {/* 2. Collected Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4.5 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:shadow-xs transition-all min-h-[146px]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E8F8F0] flex items-center justify-center text-[#175C46] shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <span className="text-xs sm:text-sm font-medium text-gray-700">Collected</span>
        </div>

        <div className="mt-3.5">
          <div className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            {formatCurrency(stats.collected)}
          </div>
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs font-medium text-gray-500 mb-1">
              <span>{collectedPct}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-[#175C46] h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, collectedPct))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Pending Dues Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4.5 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:shadow-xs transition-all min-h-[146px]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FEF7E6] flex items-center justify-center text-[#B06000] shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-xs sm:text-sm font-medium text-gray-700">Pending Dues</span>
        </div>

        <div className="mt-3.5">
          <div className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            {formatCurrency(stats.pending_dues)}
          </div>
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs font-medium text-[#B06000] mb-1">
              <span>{pendingPct}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-[#F59E0B] h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, pendingPct))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Over due Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4.5 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:shadow-xs transition-all min-h-[146px]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FDF2F2] flex items-center justify-center text-[#DC2626] shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <span className="text-xs sm:text-sm font-medium text-gray-700">Over due</span>
        </div>

        <div className="mt-3.5">
          <div className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            {formatCurrency(stats.overdue)}
          </div>
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs font-medium text-[#DC2626] mb-1">
              <span>{overduePct}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-[#EF4444] h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, overduePct))}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
