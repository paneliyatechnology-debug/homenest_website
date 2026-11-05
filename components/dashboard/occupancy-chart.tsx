'use client';

import React from 'react';
import { OccupancyMonthData } from '@/types/dashboard';

interface OccupancyChartProps {
  timeframe?: string;
  data?: OccupancyMonthData[];
}

export const OccupancyChart: React.FC<OccupancyChartProps> = ({
  timeframe = 'Last 6 months',
  data = [],
}) => {
  // Y-axis tick values from 100% down to 20% matching Figma
  const yAxisTicks = [
    { label: '100%', y: 20 },
    { label: '80%', y: 65 },
    { label: '60%', y: 110 },
    { label: '40%', y: 155 },
    { label: '20%', y: 200 },
  ];

  // Chart bounds matching viewBox 0 0 580 235
  const paddingLeft = 45;
  const paddingRight = 35;
  const bottomY = 200;
  const topY = 20;
  const chartWidth = 580 - paddingLeft - paddingRight;
  const chartHeight = bottomY - topY; // 180px

  // Compute dynamic coordinates directly from the live API response
  const points =
    Array.isArray(data) && data.length > 0
      ? data.map((item, index) => {
          const x =
            paddingLeft + (index / Math.max(data.length - 1, 1)) * chartWidth;
          // Clamp rate between 20% and 100%
          const rate = Math.max(20, Math.min(100, item.occupancy_rate));
          const y = bottomY - ((rate - 20) / 80) * chartHeight;
          return {
            x,
            y,
            month: item.month,
            rate: item.occupancy_rate,
          };
        })
      : [];

  // Generate smooth Catmull-Rom cubic bezier curve connecting all data points
  let splinePath = '';
  if (points.length > 0) {
    splinePath = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = i > 0 ? points[i - 1] : points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i < points.length - 2 ? points[i + 2] : p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      splinePath += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
  }

  // Generate closed area path for the gradient fill
  const firstX = points[0]?.x ?? paddingLeft;
  const lastX = points[points.length - 1]?.x ?? paddingLeft + chartWidth;
  const areaPath = splinePath
    ? `${splinePath} L ${lastX.toFixed(1)} ${bottomY} L ${firstX.toFixed(1)} ${bottomY} Z`
    : '';

  return (
    <div className="bg-white rounded-2xl border border-gray-100/90 p-4 sm:p-5 xl:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between w-full h-full">
      {/* Header matching Figma */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-bold text-gray-900 tracking-tight">
          Occupancy Rate
        </h3>
        <span className="text-xs text-gray-400 font-normal">{timeframe}</span>
      </div>

      {/* Responsive SVG Chart rendering dynamic API trend data */}
      <div className="relative w-full flex-1 flex items-center justify-center min-h-[200px] sm:min-h-[220px]">
        <svg viewBox="0 0 580 235" className="w-full h-full max-h-[260px] overflow-visible">
          <defs>
            <linearGradient id="occupancyApiGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#175C46" stopOpacity="0.35" />
              <stop offset="70%" stopColor="#175C46" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#175C46" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines & Y-axis labels */}
          {yAxisTicks.map((tick) => (
            <g key={tick.label}>
              <text
                x="32"
                y={tick.y + 4}
                textAnchor="end"
                className="fill-gray-400 text-[11px] font-sans"
              >
                {tick.label}
              </text>
              <line
                x1={paddingLeft}
                y1={tick.y}
                x2={paddingLeft + chartWidth}
                y2={tick.y}
                stroke="#F1F3F5"
                strokeWidth="1"
              />
            </g>
          ))}

          {/* Dynamic Smooth Gradient Area Fill */}
          {areaPath && <path d={areaPath} fill="url(#occupancyApiGradient)" />}

          {/* Dynamic Continuous Flowing Spline Line */}
          {splinePath && (
            <path
              d={splinePath}
              fill="none"
              stroke="#175C46"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Dynamic Data Point Dots & Percentage Labels from API */}
          {points.map((pt) => (
            <g key={`point-${pt.month}`}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r="3.5"
                fill="#ffffff"
                stroke="#175C46"
                strokeWidth="2"
              />
              <text
                x={pt.x}
                y={pt.y - 7}
                textAnchor="middle"
                className="fill-[#175C46] text-[10px] font-semibold font-sans"
              >
                {pt.rate}%
              </text>
            </g>
          ))}

          {/* Dynamic X-axis Month Labels from API */}
          {points.map((pt) => (
            <text
              key={pt.month}
              x={pt.x}
              y="225"
              textAnchor="middle"
              className="fill-gray-500 text-[11px] font-normal font-sans"
            >
              {pt.month}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
};
