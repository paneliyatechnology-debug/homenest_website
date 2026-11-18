import { ApiResponse } from './auth';

export type MealType = 'breakfast' | 'lunch' | 'dinner';

export interface FoodMenuItem {
  id: number;
  branch_id: number;
  branch_name?: string;
  menu_date: string; // Format: "01-11-2026 00:00" or "YYYY-MM-DD"
  day_of_week: string; // e.g. "sunday", "monday", etc.
  meal_type: MealType;
  name: string;
  description: string | null;
  image: string | null;
  image_url: string | null;
  start_time: string; // e.g. "07:30 AM"
  end_time: string; // e.g. "09:30 AM"
  included_items: string | null; // e.g. "Masala Chai, Curd, Pickle"
  is_active: boolean;
  is_feedback_open?: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface DailyMeals {
  breakfast: FoodMenuItem[];
  lunch: FoodMenuItem[];
  dinner: FoodMenuItem[];
}

export interface DailyFoodMenu {
  date: string; // Format: "YYYY-MM-DD"
  day_of_week: string; // e.g. "sunday"
  total_items: number;
  meals: DailyMeals;
}

export interface FoodMenuMeta {
  page: number;
  limit: number;
  total_pages: number;
  total: number;
  branch_id?: number;
  branch_name?: string;
  start_date?: string;
  end_date?: string;
}

export type FoodMenuApiResponse = ApiResponse<DailyFoodMenu[]> & {
  meta?: FoodMenuMeta;
};

export type SingleFoodMenuItemApiResponse = ApiResponse<FoodMenuItem>;

export interface FoodMenuQueryParams {
  branch_id?: number | string;
  start_date?: string; // YYYY-MM-DD
  end_date?: string; // YYYY-MM-DD
  meal_type?: string; // 'all' | 'breakfast' | 'lunch' | 'dinner'
  page?: number;
  limit?: number;
  date?: string;
  day_of_week?: string;
  search?: string;
}

export interface FoodFeedbackItem {
  id: number;
  menu_id?: number;
  menu_name?: string;
  resident_id: number;
  resident_name: string;
  resident_phone?: string;
  room_no?: string;
  meal_type?: MealType | string;
  rating: number; // 1 to 5
  comments: string;
  image?: string | null;
  image_url?: string | null;
  feedback_date?: string;
  created_at?: string;
  updated_at?: string;
  branch_id?: number;
  branch_name?: string;
}

export interface FoodItemFeedbackData {
  menu_item: {
    id: number;
    name: string;
    meal_type: MealType;
    menu_date: string;
    start_time: string;
    end_time: string;
    branch_id: number;
    is_feedback_open?: boolean;
  };
  stats: {
    total_feedbacks: number;
    average_rating: number;
  };
  feedbacks: FoodFeedbackItem[];
}

export type FoodItemFeedbackApiResponse = ApiResponse<FoodItemFeedbackData>;

export interface FoodBranchFeedbackMeta {
  page: number;
  limit: number;
  total_pages: number;
  total: number;
  branch_name?: string;
}

export type FoodBranchFeedbackApiResponse = ApiResponse<FoodFeedbackItem[]> & {
  meta?: FoodBranchFeedbackMeta;
};

export interface StarRatingBreakdown {
  count: number;
  percentage: number;
}

export interface MealRatingBreakdown {
  total: number;
  average_rating: number;
}

export interface FoodFeedbackSummary {
  branch_id: number;
  branch_name: string;
  total_reviews: number;
  average_rating: number;
  meals: {
    breakfast: MealRatingBreakdown;
    lunch: MealRatingBreakdown;
    dinner: MealRatingBreakdown;
  };
  stars: {
    '1': StarRatingBreakdown;
    '2': StarRatingBreakdown;
    '3': StarRatingBreakdown;
    '4': StarRatingBreakdown;
    '5': StarRatingBreakdown;
  };
}

export type FoodFeedbackSummaryApiResponse = ApiResponse<FoodFeedbackSummary>;

export const DEFAULT_FOOD_FEEDBACK_SUMMARY: FoodFeedbackSummary = {
  branch_id: 1,
  branch_name: 'All Branches',
  total_reviews: 0,
  average_rating: 0,
  meals: {
    breakfast: { total: 0, average_rating: 0 },
    lunch: { total: 0, average_rating: 0 },
    dinner: { total: 0, average_rating: 0 },
  },
  stars: {
    '1': { count: 0, percentage: 0 },
    '2': { count: 0, percentage: 0 },
    '3': { count: 0, percentage: 0 },
    '4': { count: 0, percentage: 0 },
    '5': { count: 0, percentage: 0 },
  },
};
