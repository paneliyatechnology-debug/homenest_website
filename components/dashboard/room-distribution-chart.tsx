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
  // SVG Donut geometry - Enlarged to 220px with bold 32px stroke matching Figma
  const size = 220;
  const strokeWidth = 32;
  const radius = (size - strokeWidth) / 2; // 94px
  const circumference = 2 * Math.PI * radius; // ~590.62px
  const center = size / 2; // 110px

  // Pure functional immutable calculation of offsets from live API data
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
    <div className="bg-white rounded-2xl border border-gray-100/90 p-4 sm:p-5 xl:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between w-full h-full">
      {/* Header matching Figma */}
      <div className="mb-2">
        <h3 className="text-base sm:text-[17px] font-bold text-gray-900 tracking-tight">
          Room Type Distribution
        </h3>
      </div>

      {/* Donut and Legend Container - Centered, Responsive, and Filling Space */}
      <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 lg:gap-7 xl:gap-12 my-auto py-2 w-full">
        {/* Donut SVG with Center Metric */}
        <div className="relative w-[190px] h-[190px] sm:w-[215px] sm:h-[215px] xl:w-[230px] xl:h-[230px] shrink-0">
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
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-3xl sm:text-4xl xl:text-[42px] font-bold text-gray-900 leading-none">
              {totalResidents}
            </span>
            <span className="text-xs sm:text-[13px] text-gray-400 font-medium mt-1 sm:mt-1.5">
              Total Residents
            </span>
          </div>
        </div>

        {/* Legend List matching Figma */}
        <div className="flex flex-col justify-center gap-3.5 sm:gap-4 xl:gap-5 w-full sm:w-auto min-w-[160px] sm:min-w-[180px] xl:min-w-[200px]">
          {segments.map((item) => (
            <div
              key={item.type}
              className="flex items-center justify-between text-xs sm:text-sm gap-4"
            >
              <div className="flex items-center gap-2.5 sm:gap-3">
                <span
                  className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-gray-700 font-medium text-xs sm:text-[13.5px]">
                  {item.type}
                </span>
              </div>
              <div className="text-right">
                <span className="font-bold text-gray-900 text-xs sm:text-[13.5px]">
                  {item.count}
                </span>
                <span className="text-gray-400 font-normal text-xs sm:text-[13px] ml-1.5">
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
