'use client';

import React from 'react';
import { RoomDistributionItem } from '@/types/dashboard';

interface RoomDistributionChartProps {
  totalResidents?: number;
  distribution?: RoomDistributionItem[];
}

const defaultColors = [
  '#175C46', // Single (Deep Green)
  '#2563EB', // Double (Blue)
  '#D97706', // Triple (Amber)
  '#DC2626', // Others (Red)
];

export const RoomDistributionChart: React.FC<RoomDistributionChartProps> = ({
  totalResidents = 0,
  distribution = [],
}) => {
  // SVG Donut geometry
  const size = 220;
  const strokeWidth = 32;
  const radius = (size - strokeWidth) / 2; // 94px
  const circumference = 2 * Math.PI * radius; // ~590.62px
  const center = size / 2; // 110px

  // Pure functional calculation of offsets from live API data
  const segments = distribution.map((item, index) => {
    const previousPercentageSum = distribution
      .slice(0, index)
      .reduce((acc, curr) => acc + curr.percentage, 0);

    const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((previousPercentageSum / 100) * circumference);
    const color = defaultColors[index % defaultColors.length];

    return {
      ...item,
      strokeDasharray,
      strokeDashoffset,
      color,
    };
  });

  return (
    <div className="room-dist-container bg-white rounded-2xl border border-gray-100/90 p-4 sm:p-5 xl:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between w-full h-full min-w-0 overflow-hidden">
      {/* Header matching Figma */}
      <div className="mb-2 shrink-0">
        <h3 className="text-base sm:text-[17px] font-bold text-gray-900 tracking-tight">
          Room Type Distribution
        </h3>
      </div>

      {/* Donut and Legend Container - Adaptive and responsive to any container width */}
      <div className="room-dist-layout flex-1 flex flex-col items-center justify-center gap-4 sm:gap-5 xl:gap-7 my-auto py-2 w-full min-w-0">
        {/* Donut SVG with Center Metric */}
        <div className="relative w-32 h-32 sm:w-36 sm:h-36 lg:w-36 lg:h-36 xl:w-44 xl:h-44 2xl:w-48 2xl:h-48 max-w-full aspect-square shrink-0">
          <svg className="w-full h-full -rotate-90 transform" viewBox={`0 0 ${size} ${size}`}>
            {/* Background Base Ring */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke="#F3F4F6"
              strokeWidth={strokeWidth}
            />

            {/* Segment Arcs */}
            {segments.map((item) => (
              <circle
                key={item.type}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={item.color}
                strokeWidth={strokeWidth}
                strokeDasharray={item.strokeDasharray}
                strokeDashoffset={item.strokeDashoffset}
                className="transition-all duration-500 ease-out"
              />
            ))}
          </svg>

          {/* Centered Donut Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-2">
            <span className="text-2xl sm:text-3xl xl:text-4xl font-bold text-gray-900 leading-none">
              {totalResidents}
            </span>
            <span className="text-[11px] sm:text-xs text-gray-400 font-medium mt-1 leading-tight">
              Total Residents
            </span>
          </div>
        </div>

        {/* Legend List matching Figma */}
        <div className="flex flex-col justify-center gap-2.5 sm:gap-3 xl:gap-3.5 w-full sm:w-auto min-w-0 max-w-[220px] shrink-0">
          {segments.map((item) => (
            <div
              key={item.type}
              className="flex items-center justify-between text-xs sm:text-[13px] gap-3 sm:gap-4"
            >
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <span
                  className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shrink-0 shadow-2xs"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-gray-700 font-medium text-xs sm:text-[13px] truncate">
                  {item.type}
                </span>
              </div>
              <div className="text-right whitespace-nowrap shrink-0">
                <span className="font-bold text-gray-900 text-xs sm:text-[13px]">
                  {item.count}
                </span>
                <span className="text-gray-400 font-normal text-xs sm:text-[12px] ml-1">
                  ({item.percentage}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
