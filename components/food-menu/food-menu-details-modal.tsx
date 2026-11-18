'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Dialog } from 'primereact/dialog';
import { FoodMenuItem } from '@/types/food-menu';
import { foodMenuService } from '@/services/food-menu.service';
import { StatusBadge, formatDateToDDMMYYYY } from '@/components/ui';

interface FoodMenuDetailsModalProps {
  visible: boolean;
  onHide: () => void;
  itemId?: number | string | null;
  initialItem?: FoodMenuItem | null;
  onEdit?: (item: FoodMenuItem) => void;
  onViewFeedback?: (item: FoodMenuItem) => void;
}

export const FoodMenuDetailsModal: React.FC<FoodMenuDetailsModalProps> = ({
  visible,
  onHide,
  itemId,
  initialItem,
  onEdit,
  onViewFeedback,
}) => {
  const targetId = itemId ?? initialItem?.id ?? null;

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E8F8F0] text-[#175C46] flex items-center justify-center font-bold text-sm shrink-0">
            <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"
              />
            </svg>
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-gray-900 leading-tight truncate">
              {initialItem?.name || 'Food Menu Details'}
            </h3>
            <p className="text-xs text-gray-500 capitalize">
              {initialItem?.meal_type ? `${initialItem.meal_type} Meal` : 'Dining Details'}
              {initialItem?.branch_name ? ` • ${initialItem.branch_name}` : ''}
            </p>
          </div>
        </div>
      }
      style={{ width: '92vw', maxWidth: '540px' }}
      modal
      className="food-menu-modal font-sans"
      dismissableMask
    >
      {visible && targetId && (
        <FoodMenuDetailsContent
          key={String(targetId)}
          targetId={targetId}
          initialItem={initialItem}
          onHide={onHide}
          onEdit={onEdit}
          onViewFeedback={onViewFeedback}
        />
      )}
    </Dialog>
  );
};

interface FoodMenuDetailsContentProps {
  targetId: number | string;
  initialItem?: FoodMenuItem | null;
  onHide: () => void;
  onEdit?: (item: FoodMenuItem) => void;
  onViewFeedback?: (item: FoodMenuItem) => void;
}

const FoodMenuDetailsContent: React.FC<FoodMenuDetailsContentProps> = ({
  targetId,
  initialItem,
  onHide,
  onEdit,
  onViewFeedback,
}) => {
  const [item, setItem] = useState<FoodMenuItem | null>(initialItem || null);
  const [loading, setLoading] = useState<boolean>(!initialItem);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    foodMenuService
      .getFoodMenuItemById(targetId)
      .then((data) => {
        if (!isMounted) return;
        if (data) {
          setItem((prev) => ({
            ...data,
            branch_name: data.branch_name || prev?.branch_name,
          }));
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn(`Failed to fetch details for menu #${targetId}:`, err);
        if (!initialItem) {
          setError('Failed to load menu details.');
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [targetId, initialItem]);

  if (loading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-[#175C46]/20 border-t-[#175C46] rounded-full animate-spin" />
        <p className="text-xs text-gray-500 font-medium">Loading full menu details...</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="py-12 text-center space-y-3">
        <p className="text-xs text-rose-500 font-medium">{error || 'Menu details not found.'}</p>
        <button
          type="button"
          onClick={onHide}
          className="px-4 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs transition-colors cursor-pointer"
        >
          Close
        </button>
      </div>
    );
  }

  const rawPhoto = item.image_url || item.image;
  const photoUrl =
    rawPhoto && rawPhoto !== 'null' && rawPhoto !== 'undefined' && rawPhoto.trim() !== ''
      ? rawPhoto.trim()
      : null;
  const mealIcon = item.meal_type === 'breakfast' ? '☀️' : item.meal_type === 'lunch' ? '🍲' : '🌙';

  return (
    <div className="space-y-4 pt-1">
      {/* Photo Banner */}
      <div className="w-full h-44 rounded-xl overflow-hidden bg-gray-100 relative border border-gray-100 shadow-2xs">
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={item.name}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-[#EBF7F2] text-[#175C46] gap-2">
            <span className="text-4xl">{mealIcon}</span>
            <span className="text-xs font-bold text-gray-800">{item.name}</span>
            <span className="text-[11px] text-gray-500 capitalize">
              {item.meal_type} Serving: {item.start_time} - {item.end_time}
            </span>
          </div>
        )}
      </div>

      {/* Quick Summary Header */}
      <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50/70 border border-gray-100">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm">{mealIcon}</span>
            <h4 className="text-sm font-bold text-gray-900 capitalize">
              {item.name}
            </h4>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            <span className="capitalize font-semibold text-gray-700">{item.meal_type}</span>
            {' • '}
            <span>{item.start_time} - {item.end_time}</span>
          </p>
        </div>

        <StatusBadge status={item.is_active ? 'active' : 'inactive'} />
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="p-3 bg-white rounded-xl border border-gray-100 space-y-1">
          <span className="text-gray-400 font-medium block">Branch</span>
          <span className="font-semibold text-gray-800 block truncate">
            {item.branch_name || 'Main Branch'}
          </span>
        </div>

        <div className="p-3 bg-white rounded-xl border border-gray-100 space-y-1">
          <span className="text-gray-400 font-medium block">Menu Date</span>
          <span className="font-semibold text-gray-800 block capitalize">
            {formatDateToDDMMYYYY(item.menu_date) || item.day_of_week || '—'}
            {item.day_of_week && (
              <span className="text-gray-400 font-normal ml-1">({item.day_of_week})</span>
            )}
          </span>
        </div>

        <div className="p-3 bg-white rounded-xl border border-gray-100 space-y-1">
          <span className="text-gray-400 font-medium block">Serving Hours</span>
          <span className="font-semibold text-gray-800 block">
            {item.start_time} - {item.end_time}
          </span>
        </div>

        <div className="p-3 bg-white rounded-xl border border-gray-100 space-y-1">
          <span className="text-gray-400 font-medium block">Resident Feedback</span>
          <span className={`font-semibold block ${item.is_feedback_open ? 'text-emerald-700' : 'text-gray-500'}`}>
            {item.is_feedback_open ? '● Open for Reviews' : '○ Closed'}
          </span>
        </div>

        <div className="p-3 bg-white rounded-xl border border-gray-100 space-y-1">
          <span className="text-gray-400 font-medium block">Last Updated</span>
          <span className="font-semibold text-gray-800 block truncate">
            {item.updated_at
              ? formatDateToDDMMYYYY(item.updated_at)
              : item.created_at
              ? formatDateToDDMMYYYY(item.created_at)
              : 'Recently'}
          </span>
        </div>
      </div>

      {/* Accompaniments / Beverages */}
      {item.included_items && (
        <div className="p-3 bg-white rounded-xl border border-gray-100 space-y-1.5">
          <span className="text-xs text-gray-400 font-medium block">
            Included Accompaniments & Beverages
          </span>
          <div className="flex flex-wrap gap-1.5">
            {item.included_items.split(',').map((inc, i) => {
              const clean = inc.trim();
              if (!clean) return null;
              return (
                <span
                  key={i}
                  className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-emerald-50 text-[#175C46] border border-emerald-200/60"
                >
                  + {clean}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Description / Special Notes */}
      {item.description && (
        <div className="p-3 bg-white rounded-xl border border-gray-100 space-y-1">
          <span className="text-xs text-gray-400 font-medium block">
            Description & Special Notes
          </span>
          <p className="text-xs text-gray-700 leading-relaxed bg-gray-50/50 p-2.5 rounded-lg border border-gray-100">
            {item.description}
          </p>
        </div>
      )}

      {/* Footer Actions */}
      <div className="pt-2 flex items-center justify-between border-t border-gray-100">
        <div>
          {onViewFeedback && (
            <button
              type="button"
              onClick={() => {
                onHide();
                onViewFeedback(item);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold text-xs border border-amber-200/60 transition-colors cursor-pointer"
            >
              <span className="text-amber-500">★</span>
              <span>Resident Reviews</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onHide}
            className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>

          {onEdit && (
            <button
              type="button"
              onClick={() => {
                onHide();
                onEdit(item);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#175C46] hover:bg-[#134e3b] text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
              <span>Edit Item</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
