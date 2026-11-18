'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Dialog } from 'primereact/dialog';
import { FoodItemFeedbackData, FoodMenuItem } from '@/types/food-menu';
import { foodMenuService } from '@/services/food-menu.service';
import { formatDateToDDMMYYYY } from '@/components/ui';

interface FoodMenuItemFeedbackModalProps {
  visible: boolean;
  onHide: () => void;
  menuItem: FoodMenuItem | null;
}

export const FoodMenuItemFeedbackModal: React.FC<FoodMenuItemFeedbackModalProps> = ({
  visible,
  onHide,
  menuItem,
}) => {
  const [data, setData] = useState<FoodItemFeedbackData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!visible || !menuItem) return;

    let isMounted = true;

    foodMenuService
      .getItemFeedback(menuItem.id)
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load item feedback:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [visible, menuItem]);

  // Render star icons helper
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5 text-amber-400">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-3.5 h-3.5 ${
              star <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'
            }`}
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  const avgRating = data?.stats?.average_rating ?? 0;
  const totalReviews = data?.stats?.total_feedbacks ?? 0;

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Food Feedback & Ratings</h3>
            <p className="text-xs text-gray-500">{menuItem?.name || 'Menu Item'}</p>
          </div>
        </div>
      }
      style={{ width: '92vw', maxWidth: '600px' }}
      modal
      className="food-feedback-modal"
      dismissableMask
    >
      <div className="space-y-4 pt-1">
        {/* Banner with Item Details & Rating summary */}
        <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-gray-800">{menuItem?.name}</span>
              <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {menuItem?.meal_type}
              </span>
            </div>
            <p className="text-[11px] text-gray-500">
              {menuItem?.start_time} - {menuItem?.end_time} &bull; {menuItem?.day_of_week}
            </p>
          </div>

          <div className="flex items-center gap-2.5 bg-white px-3.5 py-2 rounded-xl border border-gray-200/70 shadow-2xs self-start sm:self-auto">
            <span className="text-xl font-extrabold text-gray-900">{avgRating.toFixed(1)}</span>
            <div>
              {renderStars(avgRating)}
              <span className="text-[10px] text-gray-400 font-medium">
                {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
              </span>
            </div>
          </div>
        </div>

        {/* Feedbacks list */}
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-2.5">
            <div className="w-6 h-6 border-2 border-[#175C46] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-gray-400">Loading resident reviews...</span>
          </div>
        ) : !data?.feedbacks || data.feedbacks.length === 0 ? (
          <div className="p-10 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
            <svg
              className="w-10 h-10 mx-auto text-gray-300 mb-2 stroke-current"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p className="text-xs font-semibold text-gray-700">No resident reviews yet</p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Residents can rate this meal and leave feedback from their resident portal.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {data.feedbacks.map((fb) => (
              <div
                key={fb.id}
                className="p-3.5 rounded-xl border border-gray-100 bg-white hover:border-gray-200 transition-colors shadow-2xs space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-emerald-100 text-[#175C46] text-xs font-bold flex items-center justify-center">
                      {fb.resident_name ? fb.resident_name.charAt(0).toUpperCase() : 'R'}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-800">{fb.resident_name}</h4>
                      {fb.resident_phone && (
                        <p className="text-[10px] text-gray-400">{fb.resident_phone}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end">
                    {renderStars(fb.rating)}
                    {fb.feedback_date && (
                      <span className="text-[10px] text-gray-400 mt-0.5">{formatDateToDDMMYYYY(fb.feedback_date)}</span>
                    )}
                  </div>
                </div>

                {fb.comments && (
                  <p className="text-xs text-gray-600 bg-gray-50/70 p-2 rounded-lg leading-relaxed">
                    &ldquo;{fb.comments}&rdquo;
                  </p>
                )}

                {fb.image_url && fb.image_url !== 'null' && fb.image_url !== 'undefined' && fb.image_url.trim() !== '' && (
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 mt-2">
                    <Image
                      src={fb.image_url}
                      alt="Feedback photo"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onHide}
            className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </Dialog>
  );
};
