'use client';

import React from 'react';
import { FoodFeedbackSummary } from '@/types/food-menu';

interface FoodFeedbackSummaryCardsProps {
  summary: FoodFeedbackSummary;
  loading?: boolean;
}

export const FoodFeedbackSummaryCards: React.FC<FoodFeedbackSummaryCardsProps> = ({
  summary,
  loading = false,
}) => {
  const avg = Number(summary?.average_rating || 0);
  const total = Number(summary?.total_reviews || 0);

  const meals = summary?.meals || {
    breakfast: { total: 0, average_rating: 0 },
    lunch: { total: 0, average_rating: 0 },
    dinner: { total: 0, average_rating: 0 },
  };

  const stars = summary?.stars || {
    '1': { count: 0, percentage: 0 },
    '2': { count: 0, percentage: 0 },
    '3': { count: 0, percentage: 0 },
    '4': { count: 0, percentage: 0 },
    '5': { count: 0, percentage: 0 },
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-36 bg-gray-100 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 1. Overall Rating Card */}
      <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-xs flex flex-col justify-between">
        <div>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Overall Resident Satisfaction
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-4xl font-extrabold text-gray-900 tracking-tight">
              {avg.toFixed(1)}
            </span>
            <span className="text-sm font-semibold text-gray-400">/ 5.0</span>
          </div>

          <div className="flex items-center gap-1 text-amber-400 mt-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <svg
                key={s}
                className={`w-4 h-4 ${
                  s <= Math.round(avg) ? 'fill-amber-400' : 'fill-gray-200 text-gray-200'
                }`}
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
            <span className="text-xs font-medium text-gray-500 ml-1.5">
              Based on {total} resident {total === 1 ? 'review' : 'reviews'}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>Branch</span>
          <span className="font-semibold text-gray-800">{summary?.branch_name || 'All'}</span>
        </div>
      </div>

      {/* 2. Meal-wise Breakdown */}
      <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-xs flex flex-col justify-between">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Ratings by Meal Category
        </span>

        <div className="space-y-2.5">
          {/* Breakfast */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50/50 border border-amber-100/60">
            <div className="flex items-center gap-2">
              <span className="text-base">☀️</span>
              <div>
                <p className="text-xs font-bold text-gray-800">Breakfast</p>
                <p className="text-[10px] text-gray-400">{meals.breakfast.total} ratings</p>
              </div>
            </div>
            <div className="flex items-center gap-1 font-bold text-xs text-amber-700 bg-white px-2.5 py-1 rounded-lg border border-amber-200/50">
              <span>{meals.breakfast.average_rating ? meals.breakfast.average_rating.toFixed(1) : '—'}</span>
              <span className="text-amber-400">★</span>
            </div>
          </div>

          {/* Lunch */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-orange-50/50 border border-orange-100/60">
            <div className="flex items-center gap-2">
              <span className="text-base">🍲</span>
              <div>
                <p className="text-xs font-bold text-gray-800">Lunch</p>
                <p className="text-[10px] text-gray-400">{meals.lunch.total} ratings</p>
              </div>
            </div>
            <div className="flex items-center gap-1 font-bold text-xs text-orange-700 bg-white px-2.5 py-1 rounded-lg border border-orange-200/50">
              <span>{meals.lunch.average_rating ? meals.lunch.average_rating.toFixed(1) : '—'}</span>
              <span className="text-amber-400">★</span>
            </div>
          </div>

          {/* Dinner */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-indigo-50/50 border border-indigo-100/60">
            <div className="flex items-center gap-2">
              <span className="text-base">🌙</span>
              <div>
                <p className="text-xs font-bold text-gray-800">Dinner</p>
                <p className="text-[10px] text-gray-400">{meals.dinner.total} ratings</p>
              </div>
            </div>
            <div className="flex items-center gap-1 font-bold text-xs text-indigo-700 bg-white px-2.5 py-1 rounded-lg border border-indigo-200/50">
              <span>{meals.dinner.average_rating ? meals.dinner.average_rating.toFixed(1) : '—'}</span>
              <span className="text-amber-400">★</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Star Distribution Progress Bars */}
      <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-xs flex flex-col justify-between">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Star Rating Distribution
        </span>

        <div className="space-y-1.5">
          {(['5', '4', '3', '2', '1'] as const).map((num) => {
            const starData = stars[num] || { count: 0, percentage: 0 };
            return (
              <div key={num} className="flex items-center gap-2 text-xs">
                <span className="w-6 font-semibold text-gray-600 flex items-center gap-0.5">
                  {num} <span className="text-amber-400 text-[10px]">★</span>
                </span>
                <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, starData.percentage))}%` }}
                  />
                </div>
                <span className="w-10 text-right text-[11px] text-gray-400 font-medium">
                  {starData.count}
                </span>
              </div>
            );
          })}
        </div>

        <p className="text-[11px] text-gray-400 mt-2 text-right">
          {stars['5'].percentage}% positive 5★ rating
        </p>
      </div>
    </div>
  );
};
