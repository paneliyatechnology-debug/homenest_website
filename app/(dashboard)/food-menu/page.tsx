'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import {
  DailyFoodMenu,
  FoodMenuItem,
  MealType,
  FoodFeedbackSummary,
  DEFAULT_FOOD_FEEDBACK_SUMMARY,
  FoodFeedbackItem,
} from '@/types/food-menu';
import { foodMenuService } from '@/services/food-menu.service';
import { branchService } from '@/services/branch.service';
import { Branch } from '@/types/branch';
import {
  Dropdown,
  SearchInput,
  ClearFilterButton,
  StatusBadge,
  DeleteConfirmationModal,
  BrandLoader,
  DataTable,
  TablePagination,
  ColumnDef,
  IconButton,
  TableActions,
  AppDatePicker,
  formatDateToDDMMYYYY,
} from '@/components/ui';
import {
  FoodMenuFormModal,
  FoodMenuItemFeedbackModal,
  FoodFeedbackSummaryCards,
  FoodMenuDayCard,
  FoodMenuDetailsModal,
} from '@/components/food-menu';

type FoodMenuTab = 'schedule' | 'list' | 'feedback';

// Helper: Merge daily food menus across multiple branches by date
function mergeDailyFoodMenus(
  results: Array<{ branch?: Branch; days: DailyFoodMenu[] }>
): DailyFoodMenu[] {
  const dateMap = new Map<string, DailyFoodMenu>();

  for (const { branch, days } of results) {
    for (const day of days) {
      const attachBranch = (items: FoodMenuItem[] = []) =>
        items.map((it) => ({
          ...it,
          branch_id: it.branch_id || (branch ? Number(branch.id) : it.branch_id),
          branch_name: it.branch_name || branch?.name,
        }));

      const bItems = attachBranch(day.meals?.breakfast);
      const lItems = attachBranch(day.meals?.lunch);
      const dItems = attachBranch(day.meals?.dinner);

      const existing = dateMap.get(day.date);
      if (!existing) {
        dateMap.set(day.date, {
          date: day.date,
          day_of_week: day.day_of_week,
          total_items: bItems.length + lItems.length + dItems.length,
          meals: {
            breakfast: bItems,
            lunch: lItems,
            dinner: dItems,
          },
        });
      } else {
        const mergeUnique = (a: FoodMenuItem[], b: FoodMenuItem[]) => {
          const map = new Map<number, FoodMenuItem>();
          a.forEach((it) => map.set(it.id, it));
          b.forEach((it) => map.set(it.id, it));
          return Array.from(map.values());
        };

        const mergedB = mergeUnique(existing.meals.breakfast, bItems);
        const mergedL = mergeUnique(existing.meals.lunch, lItems);
        const mergedD = mergeUnique(existing.meals.dinner, dItems);

        existing.meals.breakfast = mergedB;
        existing.meals.lunch = mergedL;
        existing.meals.dinner = mergedD;
        existing.total_items = mergedB.length + mergedL.length + mergedD.length;
      }
    }
  }

  return Array.from(dateMap.values()).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

// Helper: Merge feedback summaries across branches
function mergeFeedbackSummaries(summaries: FoodFeedbackSummary[]): FoodFeedbackSummary {
  if (summaries.length === 0) return DEFAULT_FOOD_FEEDBACK_SUMMARY;
  if (summaries.length === 1) return summaries[0];

  let totalReviews = 0;
  let weightedRatingSum = 0;

  const starCounts: Record<'1' | '2' | '3' | '4' | '5', number> = {
    '1': 0,
    '2': 0,
    '3': 0,
    '4': 0,
    '5': 0,
  };

  const mealTotals: Record<MealType, { count: number; weightedRating: number }> = {
    breakfast: { count: 0, weightedRating: 0 },
    lunch: { count: 0, weightedRating: 0 },
    dinner: { count: 0, weightedRating: 0 },
  };

  for (const s of summaries) {
    const reviews = s.total_reviews || 0;
    totalReviews += reviews;
    weightedRatingSum += (s.average_rating || 0) * reviews;

    if (s.stars) {
      (['1', '2', '3', '4', '5'] as const).forEach((k) => {
        starCounts[k] += s.stars[k]?.count || 0;
      });
    }

    if (s.meals) {
      (['breakfast', 'lunch', 'dinner'] as const).forEach((m) => {
        const mealData = s.meals[m];
        if (mealData) {
          mealTotals[m].count += mealData.total || 0;
          mealTotals[m].weightedRating += (mealData.average_rating || 0) * (mealData.total || 0);
        }
      });
    }
  }

  const avgRating =
    totalReviews > 0 ? Number((weightedRatingSum / totalReviews).toFixed(1)) : 0;

  const calcPercentage = (count: number) =>
    totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;

  return {
    branch_id: 0,
    branch_name: 'All Branches',
    total_reviews: totalReviews,
    average_rating: avgRating,
    meals: {
      breakfast: {
        total: mealTotals.breakfast.count,
        average_rating:
          mealTotals.breakfast.count > 0
            ? Number((mealTotals.breakfast.weightedRating / mealTotals.breakfast.count).toFixed(1))
            : 0,
      },
      lunch: {
        total: mealTotals.lunch.count,
        average_rating:
          mealTotals.lunch.count > 0
            ? Number((mealTotals.lunch.weightedRating / mealTotals.lunch.count).toFixed(1))
            : 0,
      },
      dinner: {
        total: mealTotals.dinner.count,
        average_rating:
          mealTotals.dinner.count > 0
            ? Number((mealTotals.dinner.weightedRating / mealTotals.dinner.count).toFixed(1))
            : 0,
      },
    },
    stars: {
      '1': { count: starCounts['1'], percentage: calcPercentage(starCounts['1']) },
      '2': { count: starCounts['2'], percentage: calcPercentage(starCounts['2']) },
      '3': { count: starCounts['3'], percentage: calcPercentage(starCounts['3']) },
      '4': { count: starCounts['4'], percentage: calcPercentage(starCounts['4']) },
      '5': { count: starCounts['5'], percentage: calcPercentage(starCounts['5']) },
    },
  };
}

// Helper: Format date string to DD/MM/YYYY
function formatDateDisplay(dateStr: string): string {
  return formatDateToDDMMYYYY(dateStr);
}

export default function FoodMenuPage() {
  // Tabs
  const [activeTab, setActiveTab] = useState<FoodMenuTab>('schedule');

  // Branches
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');

  // Filters
  const [selectedMealType, setSelectedMealType] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>(''); // Filter by a single specific date (YYYY-MM-DD)
  const [search, setSearch] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');

  // Date / Week navigation (Starts on Sunday by default)
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const d = new Date();
    const day = d.getDay(); // 0 is Sunday
    const diff = d.getDate() - day;
    const sunday = new Date(d.setDate(diff));
    sunday.setHours(0, 0, 0, 0);
    return sunday;
  });

  // Data states
  const [dailyMenus, setDailyMenus] = useState<DailyFoodMenu[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Feedback states
  const [feedbackSummary, setFeedbackSummary] = useState<FoodFeedbackSummary>(
    DEFAULT_FOOD_FEEDBACK_SUMMARY
  );
  const [feedbackList, setFeedbackList] = useState<FoodFeedbackItem[]>([]);
  const [loadingFeedback, setLoadingFeedback] = useState<boolean>(false);

  // Pagination states
  const [listCurrentPage, setListCurrentPage] = useState<number>(1);
  const [listPageSize] = useState<number>(10);
  const [feedbackCurrentPage, setFeedbackCurrentPage] = useState<number>(1);
  const feedbackPageSize = 8;

  // Modals
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [detailsTargetItem, setDetailsTargetItem] = useState<FoodMenuItem | null>(null);

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodMenuItem | null>(null);
  const [formDefaultDate, setFormDefaultDate] = useState<string | undefined>(undefined);
  const [formDefaultMealType, setFormDefaultMealType] = useState<MealType | undefined>(undefined);

  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackTargetItem, setFeedbackTargetItem] = useState<FoodMenuItem | null>(null);

  const [deletingItem, setDeletingItem] = useState<FoodMenuItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Calculate week range (YYYY-MM-DD)
  const formatDateToApi = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const weekRange = useMemo(() => {
    const start = new Date(currentWeekStart);
    const end = new Date(currentWeekStart);
    end.setDate(start.getDate() + 6);
    return {
      startDateStr: formatDateToApi(start),
      endDateStr: formatDateToApi(end),
      displayLabel: `${formatDateToDDMMYYYY(start)} – ${formatDateToDDMMYYYY(end)}`,
    };
  }, [currentWeekStart]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch data on parameters or refresh change
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      // Resolve active branches list if needed
      let currentBranches = branches;
      if (currentBranches.length === 0) {
        try {
          const bRes = await branchService.getBranches({ limit: 100 });
          if (bRes?.data && bRes.data.length > 0) {
            currentBranches = bRes.data;
            if (isMounted) setBranches(bRes.data);
          }
        } catch (err) {
          console.warn('Failed to load branches in loadData:', err);
        }
      }

      if (!isMounted) return;

      const queryStartDate = selectedDate || weekRange.startDateStr;
      const queryEndDate = selectedDate || weekRange.endDateStr;
      const queryDate = selectedDate || undefined;

      if (activeTab === 'feedback') {
        try {
          if (selectedBranchId === 'all') {
            if (currentBranches.length > 0) {
              const results = await Promise.all(
                currentBranches.map(async (b) => {
                  try {
                    const [sumRes, listRes] = await Promise.all([
                      foodMenuService.getFeedbackSummary({
                        branch_id: b.id,
                        start_date: queryStartDate,
                        end_date: queryEndDate,
                      }),
                      foodMenuService.getBranchFeedback({
                        branch_id: b.id,
                        start_date: queryStartDate,
                        end_date: queryEndDate,
                        meal_type: selectedMealType !== 'all' ? selectedMealType : undefined,
                        limit: 50,
                      }),
                    ]);
                    return {
                      summary: sumRes,
                      feedbacks: (listRes.data || []).map((f) => ({
                        ...f,
                        branch_id: Number(b.id),
                        branch_name: b.name,
                      })),
                    };
                  } catch {
                    return { summary: null, feedbacks: [] };
                  }
                })
              );

              if (!isMounted) return;
              const mergedSummary = mergeFeedbackSummaries(
                results.map((r) => r.summary).filter((s): s is FoodFeedbackSummary => Boolean(s))
              );
              const allFeedbacks = results
                .flatMap((r) => r.feedbacks)
                .sort(
                  (a, b) =>
                    new Date(b.created_at || '').getTime() -
                    new Date(a.created_at || '').getTime()
                );

              setFeedbackSummary(mergedSummary);
              setFeedbackList(allFeedbacks);
            } else {
              const [sumRes, listRes] = await Promise.all([
                foodMenuService.getFeedbackSummary({
                  start_date: queryStartDate,
                  end_date: queryEndDate,
                }),
                foodMenuService.getBranchFeedback({
                  start_date: queryStartDate,
                  end_date: queryEndDate,
                  meal_type: selectedMealType !== 'all' ? selectedMealType : undefined,
                  limit: 50,
                }),
              ]);
              if (!isMounted) return;
              setFeedbackSummary(sumRes || DEFAULT_FOOD_FEEDBACK_SUMMARY);
              setFeedbackList(listRes.data || []);
            }
          } else {
            const currentBranch = currentBranches.find(
              (b) => String(b.id) === String(selectedBranchId)
            );
            const [sumRes, listRes] = await Promise.all([
              foodMenuService.getFeedbackSummary({
                branch_id: selectedBranchId,
                start_date: queryStartDate,
                end_date: queryEndDate,
              }),
              foodMenuService.getBranchFeedback({
                branch_id: selectedBranchId,
                start_date: queryStartDate,
                end_date: queryEndDate,
                meal_type: selectedMealType !== 'all' ? selectedMealType : undefined,
                limit: 50,
              }),
            ]);
            if (!isMounted) return;
            setFeedbackSummary(sumRes || DEFAULT_FOOD_FEEDBACK_SUMMARY);
            setFeedbackList(
              (listRes.data || []).map((f) => ({
                ...f,
                branch_id: Number(selectedBranchId),
                branch_name: currentBranch?.name,
              }))
            );
          }
        } catch (err) {
          console.error('Failed to load feedback:', err);
        } finally {
          if (isMounted) setLoadingFeedback(false);
        }
      } else {
        // Tab is 'schedule' or 'list'
        try {
          if (selectedBranchId === 'all') {
            if (currentBranches.length > 0) {
              const results = await Promise.all(
                currentBranches.map(async (b) => {
                  try {
                    const res = await foodMenuService.getFoodMenus({
                      branch_id: b.id,
                      start_date: queryStartDate,
                      end_date: queryEndDate,
                      date: queryDate,
                      meal_type: selectedMealType !== 'all' ? selectedMealType : undefined,
                      limit: 50,
                    });
                    return { branch: b, days: res.data || [] };
                  } catch (err) {
                    console.warn(`Failed to fetch menu for branch ${b.name}:`, err);
                    return { branch: b, days: [] };
                  }
                })
              );

              if (!isMounted) return;
              const merged = mergeDailyFoodMenus(results);
              setDailyMenus(merged);
            } else {
              const res = await foodMenuService.getFoodMenus({
                start_date: queryStartDate,
                end_date: queryEndDate,
                date: queryDate,
                meal_type: selectedMealType !== 'all' ? selectedMealType : undefined,
                limit: 50,
              });
              if (!isMounted) return;
              setDailyMenus(res.data || []);
            }
          } else {
            const currentBranch = currentBranches.find(
              (b) => String(b.id) === String(selectedBranchId)
            );
            const res = await foodMenuService.getFoodMenus({
              branch_id: selectedBranchId,
              start_date: queryStartDate,
              end_date: queryEndDate,
              date: queryDate,
              meal_type: selectedMealType !== 'all' ? selectedMealType : undefined,
              limit: 50,
            });
            if (!isMounted) return;
            const merged = mergeDailyFoodMenus([{ branch: currentBranch, days: res.data || [] }]);
            setDailyMenus(merged);
          }
        } catch (err) {
          console.error('Failed to load food menu:', err);
          if (isMounted) setDailyMenus([]);
        } finally {
          if (isMounted) setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [activeTab, selectedBranchId, weekRange.startDateStr, weekRange.endDateStr, selectedMealType, refreshTrigger, selectedDate]);

  // Week navigation handlers
  const handlePrevWeek = () => {
    const next = new Date(currentWeekStart);
    next.setDate(next.getDate() - 7);
    setCurrentWeekStart(next);
  };

  const handleNextWeek = () => {
    const next = new Date(currentWeekStart);
    next.setDate(next.getDate() + 7);
    setCurrentWeekStart(next);
  };

  const handleThisWeek = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day;
    const sunday = new Date(d.setDate(diff));
    sunday.setHours(0, 0, 0, 0);
    setCurrentWeekStart(sunday);
  };

  // Active filters check
  const hasActiveFilters = useMemo(() => {
    return (
      selectedBranchId !== 'all' ||
      selectedMealType !== 'all' ||
      Boolean(search.trim()) ||
      Boolean(selectedDate)
    );
  }, [selectedBranchId, selectedMealType, search, selectedDate]);

  const handleClearFilters = () => {
    setLoading(true);
    setLoadingFeedback(true);
    setSelectedBranchId('all');
    setSelectedMealType('all');
    setSelectedDate('');
    setSearch('');
    setDebouncedSearch('');
    setListCurrentPage(1);
    setFeedbackCurrentPage(1);
    handleThisWeek();
  };

  // Flattened menu items for table view
  const flattenedItems = useMemo(() => {
    const items: Array<FoodMenuItem & { date: string; day_of_week: string }> = [];
    dailyMenus.forEach((dm) => {
      (['breakfast', 'lunch', 'dinner'] as const).forEach((type) => {
        const mealList = dm.meals?.[type] || [];
        mealList.forEach((m) => {
          items.push({
            ...m,
            date: dm.date,
            day_of_week: dm.day_of_week,
          });
        });
      });
    });

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      return items.filter(
        (it) =>
          it.name.toLowerCase().includes(q) ||
          it.description?.toLowerCase().includes(q) ||
          it.included_items?.toLowerCase().includes(q)
      );
    }
    return items;
  }, [dailyMenus, debouncedSearch]);

  // Paginated menu items for table view
  const paginatedListItems = useMemo(() => {
    const start = (listCurrentPage - 1) * listPageSize;
    return flattenedItems.slice(start, start + listPageSize);
  }, [flattenedItems, listCurrentPage, listPageSize]);

  // Paginated reviews for feedback tab
  const paginatedFeedbackList = useMemo(() => {
    const start = (feedbackCurrentPage - 1) * feedbackPageSize;
    return feedbackList.slice(start, start + feedbackPageSize);
  }, [feedbackList, feedbackCurrentPage, feedbackPageSize]);

  // Filtered daily menus for schedule view (when searching)
  const filteredDailyMenus = useMemo(() => {
    if (!debouncedSearch.trim()) return dailyMenus;
    const q = debouncedSearch.toLowerCase();

    return dailyMenus.map((dm) => {
      const filterMeal = (list: FoodMenuItem[]) =>
        list.filter(
          (m) =>
            m.name.toLowerCase().includes(q) ||
            m.description?.toLowerCase().includes(q) ||
            m.included_items?.toLowerCase().includes(q)
        );

      const b = filterMeal(dm.meals?.breakfast || []);
      const l = filterMeal(dm.meals?.lunch || []);
      const d = filterMeal(dm.meals?.dinner || []);

      return {
        ...dm,
        total_items: b.length + l.length + d.length,
        meals: {
          breakfast: b,
          lunch: l,
          dinner: d,
        },
      };
    });
  }, [dailyMenus, debouncedSearch]);

  // Open Form modal
  const handleOpenAddModal = (date?: string, mealType?: MealType) => {
    setEditingItem(null);
    setFormDefaultDate(date);
    setFormDefaultMealType(mealType);
    setFormModalOpen(true);
  };

  // Open Details modal
  const handleOpenDetailsModal = (item: FoodMenuItem) => {
    setDetailsTargetItem(item);
    setDetailsModalOpen(true);
  };

  const handleOpenEditModal = (item: FoodMenuItem) => {
    setEditingItem(item);
    setFormModalOpen(true);
  };

  // Open Feedback modal
  const handleOpenFeedbackModal = (item: FoodMenuItem) => {
    setFeedbackTargetItem(item);
    setFeedbackModalOpen(true);
  };

  // Delete Item handler
  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    setIsDeleting(true);
    try {
      await foodMenuService.deleteFoodMenuItem(deletingItem.id);
      setDeletingItem(null);
      setLoading(true);
      setLoadingFeedback(true);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error('Failed to delete menu item:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Columns for List Table view
  const listColumns = useMemo<ColumnDef<FoodMenuItem & { date: string; day_of_week: string }>[]>(
    () => [
      {
        header: 'Sr no.',
        className: 'w-16 text-center',
        cell: (_, idx) => (
          <span className="text-xs text-gray-500 font-medium">
            {(listCurrentPage - 1) * listPageSize + idx + 1}
          </span>
        ),
      },
    {
      header: 'Meal & Date',
      cell: (item) => (
        <div className="flex items-center gap-2.5">
          {item.image_url && item.image_url !== 'null' && item.image_url !== 'undefined' && item.image_url.trim() !== '' ? (
            <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-black/10">
              <Image src={item.image_url} alt={item.name} fill className="object-cover" unoptimized />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 text-sm">
              {item.meal_type === 'breakfast' ? '☀️' : item.meal_type === 'lunch' ? '🍲' : '🌙'}
            </div>
          )}
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-gray-900 capitalize">{item.day_of_week}</span>
              <span className="text-[10px] font-semibold text-gray-400">({formatDateToDDMMYYYY(item.date)})</span>
            </div>
            <span
              className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                item.meal_type === 'breakfast'
                  ? 'bg-amber-100 text-amber-800'
                  : item.meal_type === 'lunch'
                  ? 'bg-orange-100 text-orange-800'
                  : 'bg-indigo-100 text-indigo-800'
              }`}
            >
              {item.meal_type}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Item Name & Description',
      cell: (item) => (
        <div className="max-w-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-xs font-bold text-gray-900">{item.name}</p>
            {item.branch_name && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200 shrink-0">
                {item.branch_name}
              </span>
            )}
          </div>
          {item.description && (
            <p className="text-[11px] text-gray-500 truncate mt-0.5">{item.description}</p>
          )}
        </div>
      ),
    },
    {
      header: 'Serving Timings',
      cell: (item) => (
        <span className="text-xs text-gray-600 font-medium">
          {item.start_time} - {item.end_time}
        </span>
      ),
    },
    {
      header: 'Accompaniments',
      cell: (item) => (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {item.included_items ? (
            item.included_items.split(',').map((inc, i) => (
              <span
                key={i}
                className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-medium"
              >
                {inc.trim()}
              </span>
            ))
          ) : (
            <span className="text-xs text-gray-400">—</span>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      cell: (item) => <StatusBadge status={item.is_active ? 'active' : 'inactive'} />,
    },
    {
      header: 'Actions',
      align: 'right',
      className: 'whitespace-nowrap',
      cell: (item) => (
        <TableActions align="right">
          <button
            type="button"
            onClick={() => handleOpenFeedbackModal(item)}
            title="View Reviews"
            className="w-8 h-8 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 flex items-center justify-center text-xs transition-colors cursor-pointer"
          >
            ★
          </button>
          <IconButton variant="view" onClick={() => handleOpenDetailsModal(item)} title="View Details" />
          <IconButton variant="edit" onClick={() => handleOpenEditModal(item)} title="Edit Item" />
          <IconButton variant="delete" onClick={() => setDeletingItem(item)} title="Delete Item" />
        </TableActions>
      ),
    },
  ], [listCurrentPage, listPageSize]);

  return (
    <main className="flex-1 px-3.5 sm:px-6 lg:px-8 py-3.5 sm:py-5 max-w-[1600px] w-full mx-auto space-y-4 sm:space-y-6 bg-[#F7F7F5] min-h-[calc(100vh-80px)]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Food &amp; Dining Menu
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
            Weekly dining schedule, meal timings, included accompaniments, and resident feedback.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleOpenAddModal()}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 h-10 sm:h-11 bg-[#175C46] hover:bg-[#134e3b] active:bg-[#0e3b2c] active:scale-[0.99] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-2xs hover:shadow-xs transition-all cursor-pointer w-full sm:w-auto shrink-0"
        >
          <svg className="w-4 h-4 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span>Add Menu Item</span>
        </button>
      </div>

      {/* Tabs Row (Responsive with no text wrap) */}
      <div className="flex items-center gap-1 sm:gap-2 border-b border-gray-200 overflow-x-auto custom-scrollbar flex-nowrap scrollbar-none pb-px -mx-3.5 px-3.5 sm:mx-0 sm:px-0">
        {[
          { key: 'schedule', label: 'Weekly Schedule', icon: '📅' },
          { key: 'list', label: 'All Menu Items', icon: '📋' },
          { key: 'feedback', label: 'Resident Reviews & Ratings', icon: '⭐' },
        ].map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                if (tab.key === 'feedback') setLoadingFeedback(true);
                else setLoading(true);
                setActiveTab(tab.key as FoodMenuTab);
              }}
              className={`whitespace-nowrap shrink-0 pb-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
                active
                  ? 'border-[#175C46] text-[#175C46]'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter Bar & Week Navigator */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-gray-100 shadow-xs space-y-3 sm:space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          {/* Left Filters: Branch, Meal Type, Date, Search in structured 2-col mobile grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:flex md:flex-wrap md:items-center gap-2.5 sm:gap-3 w-full xl:w-auto">
            {/* Branch Selector */}
            <div className="col-span-1 w-full md:w-44 lg:w-48">
              <Dropdown
                value={selectedBranchId}
                onChange={(e) => {
                  setLoading(true);
                  setLoadingFeedback(true);
                  setSelectedBranchId(e.target.value);
                  setListCurrentPage(1);
                  setFeedbackCurrentPage(1);
                }}
                options={[
                  { label: 'All Branches', value: 'all' },
                  ...branches.map((b) => ({
                    label: b.name,
                    value: String(b.id),
                  })),
                ]}
                placeholder="Select branch"
              />
            </div>

            {/* Meal Type Filter */}
            <div className="col-span-1 w-full md:w-36 lg:w-44">
              <Dropdown
                value={selectedMealType}
                onChange={(e) => {
                  setLoading(true);
                  setLoadingFeedback(true);
                  setSelectedMealType(e.target.value);
                  setListCurrentPage(1);
                  setFeedbackCurrentPage(1);
                }}
                options={[
                  { label: 'All Meal Types', value: 'all' },
                  { label: 'Breakfast', value: 'breakfast' },
                  { label: 'Lunch', value: 'lunch' },
                  { label: 'Dinner', value: 'dinner' },
                ]}
                placeholder="Select meal type"
              />
            </div>

            {/* Date-wise Single Date Filter */}
            <div className="col-span-2 sm:col-span-1 relative w-full md:w-36 lg:w-44">
              <AppDatePicker
                value={selectedDate}
                onChange={(val) => {
                  setLoading(true);
                  setLoadingFeedback(true);
                  setSelectedDate(val);
                  setListCurrentPage(1);
                  setFeedbackCurrentPage(1);
                }}
                placeholder="dd-mm-yyyy"
                dateFormat="dd-mm-yy"
                className="w-full"
              />
              {selectedDate && (
                <button
                  type="button"
                  onClick={() => {
                    setLoading(true);
                    setLoadingFeedback(true);
                    setSelectedDate('');
                    setListCurrentPage(1);
                    setFeedbackCurrentPage(1);
                  }}
                  title="Clear date (show full week)"
                  className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 hover:text-gray-900 flex items-center justify-center text-[10px] transition-colors cursor-pointer z-10"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Search Input */}
            <div className="col-span-2 sm:col-span-2 md:col-span-1 w-full md:w-56 lg:w-64">
              <SearchInput
                value={search}
                onChange={(val) => {
                  setSearch(val);
                  setListCurrentPage(1);
                  setFeedbackCurrentPage(1);
                }}
                onClear={() => {
                  setSearch('');
                  setListCurrentPage(1);
                  setFeedbackCurrentPage(1);
                }}
                placeholder="Search food item..."
              />
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <div className="flex items-center col-span-2 md:col-span-1">
                <ClearFilterButton
                  onClick={handleClearFilters}
                  title="Clear all filters"
                />
              </div>
            )}
          </div>

          {/* Right: Week Navigator (compact & responsive) */}
          <div className="flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2 bg-gray-50 px-2.5 sm:px-3 py-1.5 rounded-xl border border-gray-200/70 w-full xl:w-auto shrink-0">
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setLoadingFeedback(true);
                setSelectedDate('');
                setListCurrentPage(1);
                setFeedbackCurrentPage(1);
                handlePrevWeek();
              }}
              title="Previous Week"
              className="w-8 h-8 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 flex items-center justify-center text-gray-700 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <span className="text-xs font-bold text-gray-800 px-1.5 sm:px-2 select-none text-center truncate">
              {weekRange.displayLabel}
            </span>

            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setLoadingFeedback(true);
                setSelectedDate('');
                setListCurrentPage(1);
                setFeedbackCurrentPage(1);
                handleNextWeek();
              }}
              title="Next Week"
              className="w-8 h-8 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 flex items-center justify-center text-gray-700 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setLoadingFeedback(true);
                setSelectedDate('');
                setListCurrentPage(1);
                setFeedbackCurrentPage(1);
                handleThisWeek();
              }}
              className="text-xs font-semibold text-[#175C46] hover:bg-[#EBF7F2] px-2 sm:px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ml-auto sm:ml-1 whitespace-nowrap"
            >
              This Week
            </button>
          </div>
        </div>
      </div>

      {/* Active Single Date Filter Indicator */}
      {selectedDate && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-emerald-50/70 border border-[#175C46]/20 rounded-xl text-xs">
          <div className="flex items-center gap-2 text-emerald-900 font-medium">
            <span className="w-2 h-2 rounded-full bg-[#175C46]" />
            <span>
              Showing menu for date: <strong className="font-bold">{formatDateDisplay(selectedDate)}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setLoadingFeedback(true);
              setSelectedDate('');
              setListCurrentPage(1);
              setFeedbackCurrentPage(1);
            }}
            className="text-[#175C46] hover:text-[#124b38] font-semibold underline underline-offset-2 cursor-pointer transition-colors"
          >
            Show Full Week
          </button>
        </div>
      )}

      {/* Main Tab Content */}
      {activeTab === 'schedule' && (
        <>
          {loading ? (
            <div className="p-24 flex flex-col items-center justify-center gap-3">
              <BrandLoader message="Loading dining schedule..." />
            </div>
          ) : filteredDailyMenus.length === 0 ? (
            <div className="p-16 text-center bg-white rounded-2xl border border-gray-100 shadow-xs space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 text-[#175C46] flex items-center justify-center text-2xl">
                🍲
              </div>
              <h3 className="text-base font-bold text-gray-800">
                {selectedDate ? `No Food Menu for ${formatDateDisplay(selectedDate)}` : 'No Food Menu Scheduled'}
              </h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                {selectedDate
                  ? `No meal records found for ${formatDateDisplay(selectedDate)}. Click below to schedule breakfast, lunch, or dinner.`
                  : 'No meal records found for this week. Click below to add breakfast, lunch, or dinner items.'}
              </p>
              <button
                type="button"
                onClick={() => handleOpenAddModal(selectedDate || weekRange.startDateStr)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#175C46] hover:bg-[#134e3b] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                + Schedule Meal
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
              {filteredDailyMenus.map((dm) => (
                <FoodMenuDayCard
                  key={dm.date}
                  dayMenu={dm}
                  onAddItem={handleOpenAddModal}
                  onViewDetails={handleOpenDetailsModal}
                  onEditItem={handleOpenEditModal}
                  onDeleteItem={(item) => setDeletingItem(item)}
                  onViewFeedback={handleOpenFeedbackModal}
                  showBranchBadge={selectedBranchId === 'all'}
                />
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'list' && (
        <DataTable
          data={paginatedListItems}
          columns={listColumns}
          loading={loading}
          emptyTitle="No Food Menu Items"
          emptyDescription="No food menu items found matching the selected filters."
          pagination={{
            currentPage: listCurrentPage,
            totalCount: flattenedItems.length,
            pageSize: listPageSize,
            itemCount: paginatedListItems.length,
            itemLabel: 'Menu Items',
            onPageChange: (page) => setListCurrentPage(page),
          }}
        />
      )}

      {activeTab === 'feedback' && (
        <div className="space-y-6">
          {/* Summary Ratings Cards */}
          <FoodFeedbackSummaryCards summary={feedbackSummary} loading={loadingFeedback} />

          {/* Feedback List Section */}
          <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Resident Dining Reviews</h3>
                <p className="text-xs text-gray-500">
                  Real-time reviews and suggestions submitted by hostel residents.
                </p>
              </div>

              <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {feedbackList.length} {feedbackList.length === 1 ? 'Review' : 'Reviews'}
              </span>
            </div>

            {loadingFeedback ? (
              <div className="p-16 flex flex-col items-center justify-center gap-3">
                <BrandLoader message="Loading resident reviews..." />
              </div>
            ) : feedbackList.length === 0 ? (
              <div className="p-12 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                <p className="text-xs font-semibold text-gray-700">No resident feedback available</p>
                <p className="text-[11px] text-gray-400 mt-1">
                  Reviews for meals served in this date range will appear here.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {paginatedFeedbackList.map((fb) => (
                    <div
                      key={fb.id}
                      className="p-4 rounded-xl border border-gray-100 bg-gray-50/30 hover:bg-white hover:border-gray-200 transition-all shadow-2xs space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#175C46] text-xs font-bold flex items-center justify-center shrink-0">
                            {fb.resident_name ? fb.resident_name.charAt(0).toUpperCase() : 'R'}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-gray-800">{fb.resident_name}</h4>
                            <p className="text-[10px] text-gray-400">
                              {fb.room_no ? `Room ${fb.room_no}` : fb.resident_phone || 'Resident'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 font-bold text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/50">
                          <span>{fb.rating}</span>
                          <span className="text-amber-500">★</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-gray-500 flex-wrap">
                        <span className="font-semibold text-gray-700">{fb.menu_name || 'Menu Item'}</span>
                        {fb.branch_name && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
                            {fb.branch_name}
                          </span>
                        )}
                        <span>&bull;</span>
                        <span className="capitalize text-emerald-700 font-medium">{fb.meal_type}</span>
                        {fb.feedback_date && (
                          <>
                            <span>&bull;</span>
                            <span>{formatDateToDDMMYYYY(fb.feedback_date)}</span>
                          </>
                        )}
                      </div>

                      {fb.comments && (
                        <p className="text-xs text-gray-600 bg-white p-2.5 rounded-lg border border-gray-100 leading-relaxed">
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

                {feedbackList.length > feedbackPageSize && (
                  <div className="pt-2">
                    <TablePagination
                      currentPage={feedbackCurrentPage}
                      totalCount={feedbackList.length}
                      pageSize={feedbackPageSize}
                      itemCount={paginatedFeedbackList.length}
                      itemLabel="Reviews"
                      onPageChange={(page) => setFeedbackCurrentPage(page)}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* View Menu Item Details Modal */}
      <FoodMenuDetailsModal
        visible={detailsModalOpen}
        onHide={() => {
          setDetailsModalOpen(false);
          setDetailsTargetItem(null);
        }}
        initialItem={detailsTargetItem}
        onEdit={(item) => handleOpenEditModal(item)}
        onViewFeedback={(item) => handleOpenFeedbackModal(item)}
      />

      {/* Add / Edit Menu Item Modal */}
      <FoodMenuFormModal
        visible={formModalOpen}
        onHide={() => setFormModalOpen(false)}
        onSuccess={() => {
          setFormModalOpen(false);
          setLoading(true);
          setLoadingFeedback(true);
          setRefreshTrigger((prev) => prev + 1);
        }}
        initialItem={editingItem}
        defaultDate={formDefaultDate}
        defaultMealType={formDefaultMealType}
        defaultBranchId={selectedBranchId}
        branches={branches}
      />

      {/* Item Feedback Modal */}
      <FoodMenuItemFeedbackModal
        visible={feedbackModalOpen}
        onHide={() => {
          setFeedbackModalOpen(false);
          setFeedbackTargetItem(null);
        }}
        menuItem={feedbackTargetItem}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        visible={Boolean(deletingItem)}
        onHide={() => setDeletingItem(null)}
        title="Delete Food Menu Item"
        itemType="menu item"
        itemName={deletingItem?.name}
        details={[
          { label: 'Item Name', value: deletingItem?.name || '—' },
          { label: 'Meal Type', value: deletingItem?.meal_type || '—' },
          { label: 'Timings', value: `${deletingItem?.start_time || ''} - ${deletingItem?.end_time || ''}` },
        ]}
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </main>
  );
}
