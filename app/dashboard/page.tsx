'use client';

import React, { useEffect, useState } from 'react';
import { ProgressSpinner } from 'primereact/progressspinner';
import { dashboardService } from '@/services/dashboard.service';
import { DashboardData } from '@/types/dashboard';
import { MetricCard } from '@/components/dashboard/metric-card';
import { OccupancyChart } from '@/components/dashboard/occupancy-chart';
import { RoomDistributionChart } from '@/components/dashboard/room-distribution-chart';
import { RecentActivityList } from '@/components/dashboard/recent-activity-list';

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    // Fetch live dashboard metrics from GET /dashboard
    dashboardService
      .getDashboardData()
      .then((data) => {
        if (isMounted) {
          setDashboardData(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setErrorMessage(
            err instanceof Error ? err.message : 'Failed to retrieve operations data'
          );
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Loading state using PrimeReact ProgressSpinner
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-3">
          <ProgressSpinner
            style={{ width: '38px', height: '38px' }}
            strokeWidth="3"
            aria-label="Loading Operations Dashboard"
          />
          <span className="text-xs text-gray-500 font-medium tracking-wide">
            Loading Operations Dashboard...
          </span>
        </div>
      </div>
    );
  }

  // Error State Handling
  if (errorMessage || !dashboardData) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-sm text-center">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">Dashboard Unavailable</h2>
          <p className="text-xs text-gray-500 mb-5 leading-relaxed">
            {errorMessage || 'Unable to load dashboard data from backend server.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-2.5 px-4 bg-[#175c46] hover:bg-[#124b38] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const { metrics, occupancy_trend, room_distribution, recent_activity } = dashboardData;

  return (
    <main className="flex-1 px-3.5 sm:px-5 lg:px-7 py-3.5 sm:py-5 max-w-[1600px] w-full mx-auto space-y-4 sm:space-y-5 bg-[#F7F7F5]">
      {/* Page Title matching Figma */}
      <div className="space-y-0.5 sm:space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
          Operations Dashboard
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 font-normal">
          Here&apos;s what happening across your property today.
        </p>
      </div>

      {/* 5 Metrics Summary Cards Row in exact sequence matching Figma in 1 horizontal row */}
      <div
        className="metric-cards-row gap-2 sm:gap-2.5 lg:gap-3 xl:gap-4 w-full"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
        }}
      >
        {/* 1. Total Residents */}
        <MetricCard
          title="Total Residents"
          data={metrics.total_residents}
          iconBgColor="bg-[#EEF4FF] text-[#3B82F6]"
          iconShape="circle"
          icon={
            <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
        />

        {/* 2. Occupancy Rate */}
        <MetricCard
          title="Occupancy rate"
          data={metrics.occupancy_rate}
          iconBgColor="bg-[#E6F4EA] text-[#137333]"
          iconShape="circle"
          icon={
            <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          }
        />

        {/* 3. Monthly Revenue */}
        <MetricCard
          title="Monthly revenue"
          data={metrics.monthly_revenue}
          iconBgColor="bg-[#FEF7E0] text-[#B06000]"
          iconShape="rounded"
          icon={
            <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
              <rect x="2" y="6" width="20" height="12" rx="2" />
              <circle cx="12" cy="12" r="2.5" />
              <path d="M6 12h.01M18 12h.01" />
            </svg>
          }
        />

        {/* 4. Pending Dues */}
        <MetricCard
          title="Pending dues"
          data={metrics.pending_dues}
          iconBgColor="bg-[#FCE8E6] text-[#C5221F]"
          iconShape="circle"
          icon={
            <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
            </svg>
          }
        />

        {/* 5. Open Complaints */}
        <MetricCard
          title="Open complaints"
          data={metrics.open_complaints}
          iconBgColor="bg-[#FCE8E6] text-[#C5221F]"
          iconShape="circle"
          icon={
            <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
      </div>

      {/* Middle Section: Occupancy Spline Wave Chart & Room Type Distribution Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left 7 Columns: Occupancy Rate Area Wave Chart */}
        <div className="lg:col-span-7 flex min-w-0">
          <OccupancyChart
            timeframe={occupancy_trend.timeframe}
            data={occupancy_trend.data}
          />
        </div>

        {/* Right 5 Columns: Room Type Distribution Donut */}
        <div className="lg:col-span-5 flex min-w-0">
          <RoomDistributionChart
            totalResidents={room_distribution.total_residents}
            distribution={room_distribution.distribution}
          />
        </div>
      </div>

      {/* Bottom Section: Recent Activity List (2x2 Grid) */}
      <div>
        <RecentActivityList activities={recent_activity} />
      </div>
    </main>
  );
}
