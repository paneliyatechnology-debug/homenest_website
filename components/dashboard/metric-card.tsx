'use client';

import React from 'react';
import { MetricValue } from '@/types/dashboard';

interface MetricCardProps {
  title: string;
  data: MetricValue;
  icon: React.ReactNode;
  iconBgColor: string;
  iconShape?: 'circle' | 'rounded';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  data,
  icon,
  iconBgColor,
  iconShape = 'circle',
}) => {
  const isUp = data.trend === 'up';

  // Format currency values (e.g. Monthly revenue, Pending dues) with Rupee symbol
  const isCurrency =
    title.toLowerCase().includes('revenue') ||
    title.toLowerCase().includes('dues') ||
    title.toLowerCase().includes('payment');

  const rawFormatted = data.formatted?.trim();
  let displayValue: string;
  if (rawFormatted) {
    displayValue = rawFormatted.startsWith('₹')
      ? rawFormatted
      : isCurrency
      ? `₹ ${rawFormatted}`
      : rawFormatted;
  } else if (isCurrency) {
    displayValue = `₹ ${data.value.toLocaleString('en-IN')}`;
  } else {
    displayValue = data.value.toLocaleString();
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100/90 p-2.5 sm:p-3 xl:p-4.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between transition-all hover:shadow-sm min-w-0">
      {/* Top Header: Circular/Rounded Icon Badge & Title matching Figma */}
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
        <div
          className={`w-6.5 h-6.5 sm:w-7 sm:h-7 xl:w-8 xl:h-8 ${
            iconShape === 'rounded' ? 'rounded-lg' : 'rounded-full'
          } ${iconBgColor} flex items-center justify-center shrink-0`}
        >
          {icon}
        </div>
        <span className="text-[11px] sm:text-xs xl:text-[13px] font-medium text-gray-700 truncate min-w-0">
          {title}
        </span>
      </div>

      {/* Main Metric Value */}
      <div className="my-1 sm:my-1.5 xl:my-2">
        <h3 className="text-base sm:text-lg lg:text-xl xl:text-[25px] font-bold text-gray-900 tracking-tight leading-tight truncate">
          {displayValue}
        </h3>
      </div>

      {/* Bottom Trend & Comparison matching Figma: Stacked Vertically */}
      <div className="flex flex-col items-start gap-0.5 sm:gap-1 min-w-0">
        <span
          className={`inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 xl:px-2.5 py-0.5 rounded-full text-[9.5px] sm:text-[10px] xl:text-[11px] font-semibold ${
            isUp
              ? 'bg-[#E6F4EA] text-[#137333]'
              : 'bg-[#FCE8E6] text-[#C5221F]'
          }`}
        >
          <span className="text-[9px] sm:text-[10px] leading-none">{isUp ? '↑' : '↓'}</span>
          <span>{Math.abs(data.change_percentage)}%</span>
        </span>
        <span className="text-[9.5px] sm:text-[10px] xl:text-[11px] text-gray-400 font-normal truncate max-w-full">
          {data.comparison_label || 'vs. last month'}
        </span>
      </div>
    </div>
  );
};


