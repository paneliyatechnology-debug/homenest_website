'use client';

import React from 'react';
import Image from 'next/image';
import { DailyFoodMenu, FoodMenuItem, MealType } from '@/types/food-menu';
import { StatusBadge, formatDateToDDMMYYYY } from '@/components/ui';

interface FoodMenuDayCardProps {
  dayMenu: DailyFoodMenu;
  onAddItem: (date: string, mealType: MealType) => void;
  onViewDetails: (item: FoodMenuItem) => void;
  onEditItem: (item: FoodMenuItem) => void;
  onDeleteItem: (item: FoodMenuItem) => void;
  onViewFeedback: (item: FoodMenuItem) => void;
  showBranchBadge?: boolean;
}

export const FoodMenuDayCard: React.FC<FoodMenuDayCardProps> = ({
  dayMenu,
  onAddItem,
  onViewDetails,
  onEditItem,
  onDeleteItem,
  onViewFeedback,
  showBranchBadge = false,
}) => {
  // Check if date is today
  const isToday = (() => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      return dayMenu.date === today;
    } catch {
      return false;
    }
  })();

  // Format date display (e.g. "18/11/2026")
  const formatDateDisplay = (dateStr: string) => {
    return formatDateToDDMMYYYY(dateStr);
  };

  const mealSections: Array<{
    type: MealType;
    label: string;
    icon: string;
    accentBg: string;
    accentText: string;
    accentBorder: string;
    items: FoodMenuItem[];
  }> = [
    {
      type: 'breakfast',
      label: 'Breakfast',
      icon: '☀️',
      accentBg: 'bg-amber-50/60',
      accentText: 'text-amber-800',
      accentBorder: 'border-amber-200/60',
      items: dayMenu.meals?.breakfast || [],
    },
    {
      type: 'lunch',
      label: 'Lunch',
      icon: '🍲',
      accentBg: 'bg-orange-50/60',
      accentText: 'text-orange-800',
      accentBorder: 'border-orange-200/60',
      items: dayMenu.meals?.lunch || [],
    },
    {
      type: 'dinner',
      label: 'Dinner',
      icon: '🌙',
      accentBg: 'bg-indigo-50/60',
      accentText: 'text-indigo-800',
      accentBorder: 'border-indigo-200/60',
      items: dayMenu.meals?.dinner || [],
    },
  ];

  return (
    <div
      className={`rounded-2xl border transition-all ${
        isToday
          ? 'bg-white border-[#175C46] shadow-md ring-1 ring-[#175C46]/20'
          : 'bg-white border-gray-100 shadow-2xs hover:border-gray-200'
      } flex flex-col overflow-hidden`}
    >
      {/* Day Header */}
      <div
        className={`px-4 py-3 flex items-center justify-between border-b ${
          isToday ? 'bg-[#EBF7F2] border-[#175C46]/20' : 'bg-gray-50/80 border-gray-100'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-extrabold capitalize text-gray-900">
            {dayMenu.day_of_week}
          </span>
          <span className="text-xs font-medium text-gray-500">
            {formatDateDisplay(dayMenu.date)}
          </span>
          {isToday && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#175C46] text-white">
              Today
            </span>
          )}
        </div>

        <span className="text-[11px] font-semibold text-gray-400 bg-white px-2 py-0.5 rounded-md border border-gray-200">
          {dayMenu.total_items} {dayMenu.total_items === 1 ? 'item' : 'items'}
        </span>
      </div>

      {/* Meals Grid */}
      <div className="p-4 space-y-4 flex-1">
        {mealSections.map((section) => (
          <div key={section.type} className="space-y-2">
            {/* Section Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{section.icon}</span>
                <span className="text-xs font-bold text-gray-800 tracking-tight">
                  {section.label}
                </span>
                <span className="text-[10px] font-semibold text-gray-400">
                  ({section.items.length})
                </span>
              </div>

              <button
                type="button"
                onClick={() => onAddItem(dayMenu.date, section.type)}
                className="text-[11px] font-semibold text-[#175C46] hover:text-[#134e3b] hover:bg-[#EBF7F2] px-2 py-0.5 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>+ Add</span>
              </button>
            </div>

            {/* Meal Items */}
            {section.items.length === 0 ? (
              <div
                onClick={() => onAddItem(dayMenu.date, section.type)}
                className="p-3 rounded-xl border border-dashed border-gray-200 hover:border-[#175C46] bg-gray-50/30 hover:bg-[#EBF7F2]/20 flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-[#175C46] transition-all cursor-pointer select-none group"
              >
                <svg
                  className="w-3.5 h-3.5 group-hover:scale-110 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span>No {section.label.toLowerCase()} scheduled</span>
              </div>
            ) : (
              <div className="space-y-2">
                {section.items.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border ${section.accentBorder} ${section.accentBg} transition-all space-y-2 hover:shadow-xs`}
                  >
                    {/* Item Top Info */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        {item.image_url && item.image_url !== 'null' && item.image_url !== 'undefined' && item.image_url.trim() !== '' ? (
                          <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-black/10 bg-white">
                            <Image
                              src={item.image_url}
                              alt={item.name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="w-11 h-11 rounded-lg bg-white/80 border border-black/5 flex items-center justify-center shrink-0 text-base shadow-2xs">
                            {section.icon}
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-xs font-bold text-gray-900 leading-snug truncate">
                              {item.name}
                            </h4>
                            {showBranchBadge && item.branch_name && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white/90 text-gray-600 border border-black/10 shrink-0">
                                {item.branch_name}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] font-medium text-gray-500 flex items-center gap-1 mt-0.5">
                            <svg className="w-3 h-3 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>
                              {item.start_time} - {item.end_time}
                            </span>
                          </p>
                        </div>
                      </div>

                      <StatusBadge status={item.is_active ? 'active' : 'inactive'} />
                    </div>

                    {/* Description note */}
                    {item.description && (
                      <p className="text-[11px] text-gray-600 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}

                    {/* Included Items Pills */}
                    {item.included_items && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {item.included_items.split(',').map((inc, idx) => {
                          const clean = inc.trim();
                          if (!clean) return null;
                          return (
                            <span
                              key={idx}
                              className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/90 text-gray-700 border border-black/5 shadow-2xs"
                            >
                              + {clean}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="flex items-center justify-between pt-1 border-t border-black/5">
                      <button
                        type="button"
                        onClick={() => onViewFeedback(item)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 hover:text-amber-800 bg-white/80 hover:bg-white px-2 py-1 rounded-md border border-amber-200/50 transition-colors cursor-pointer shadow-2xs"
                      >
                        <span className="text-amber-500">★</span>
                        <span>Resident Reviews</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onViewDetails(item)}
                          title="View Details"
                          className="w-7 h-7 rounded-lg bg-white/80 hover:bg-white border border-black/5 text-gray-600 hover:text-gray-900 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                        >
                          <svg className="w-3.5 h-3.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>

                        <button
                          type="button"
                          onClick={() => onEditItem(item)}
                          title="Edit Item"
                          className="w-7 h-7 rounded-lg bg-white/80 hover:bg-white border border-black/5 text-gray-600 hover:text-[#175C46] flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                        >
                          <svg className="w-3.5 h-3.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeleteItem(item)}
                          title="Delete Item"
                          className="w-7 h-7 rounded-lg bg-white/80 hover:bg-white border border-black/5 text-gray-600 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                        >
                          <svg className="w-3.5 h-3.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
