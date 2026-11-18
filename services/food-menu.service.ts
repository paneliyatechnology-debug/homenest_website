import { apiClient } from '@/lib/api-client';
import { ApiResponse } from '@/types/auth';
import {
  DailyFoodMenu,
  FoodMenuMeta,
  FoodMenuApiResponse,
  FoodMenuItem,
  SingleFoodMenuItemApiResponse,
  FoodMenuQueryParams,
  FoodItemFeedbackData,
  FoodItemFeedbackApiResponse,
  FoodFeedbackItem,
  FoodBranchFeedbackApiResponse,
  FoodBranchFeedbackMeta,
  FoodFeedbackSummary,
  FoodFeedbackSummaryApiResponse,
  DEFAULT_FOOD_FEEDBACK_SUMMARY,
} from '@/types/food-menu';

export const foodMenuService = {
  /**
   * GET /food-menu?branch_id=1&start_date=2026-11-01&end_date=2026-11-07&meal_type=all&page=1&limit=20&date=&day_of_week=
   * Retrieves food menus grouped by date and meal types (breakfast, lunch, dinner)
   */
  async getFoodMenus(params: FoodMenuQueryParams = {}): Promise<{
    data: DailyFoodMenu[];
    meta?: FoodMenuMeta;
  }> {
    const query = new URLSearchParams();

    if (params.branch_id !== undefined && params.branch_id !== null && params.branch_id !== 'all') {
      query.set('branch_id', String(params.branch_id));
    }
    if (params.start_date) query.set('start_date', params.start_date);
    if (params.end_date) query.set('end_date', params.end_date);
    if (params.meal_type) query.set('meal_type', params.meal_type);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.date) query.set('date', params.date);
    if (params.day_of_week) query.set('day_of_week', params.day_of_week);

    try {
      const response = await apiClient<FoodMenuApiResponse>(`/food-menu?${query.toString()}`);
      if (response && response.data && Array.isArray(response.data)) {
        return {
          data: response.data,
          meta: response.meta,
        };
      }
      return { data: [], meta: response?.meta };
    } catch (err) {
      console.error('Failed to fetch food menus:', err);
      return { data: [] };
    }
  },

  /**
   * GET /food-menu/:id
   * Retrieves a single food menu item by ID
   */
  async getFoodMenuItemById(id: number | string): Promise<FoodMenuItem | null> {
    try {
      const response = await apiClient<SingleFoodMenuItemApiResponse | FoodMenuItem>(`/food-menu/${id}`);
      if (!response) return null;

      if ('data' in response && response.data && typeof response.data === 'object') {
        return response.data as FoodMenuItem;
      }
      if ('id' in response && (response as FoodMenuItem).id) {
        return response as FoodMenuItem;
      }
      return null;
    } catch (err) {
      console.error(`Failed to fetch food menu item #${id}:`, err);
      return null;
    }
  },

  /**
   * POST /food-menu (multipart/form-data)
   * Creates a new food menu item
   */
  async createFoodMenuItem(formData: FormData): Promise<ApiResponse<FoodMenuItem>> {
    return apiClient<ApiResponse<FoodMenuItem>>('/food-menu', {
      method: 'POST',
      body: formData,
    });
  },

  /**
   * PUT /food-menu/:id (multipart/form-data)
   * Updates an existing food menu item
   */
  async updateFoodMenuItem(
    id: number | string,
    formData: FormData
  ): Promise<ApiResponse<FoodMenuItem>> {
    try {
      return await apiClient<ApiResponse<FoodMenuItem>>(`/food-menu/${id}`, {
        method: 'PUT',
        body: formData,
      });
    } catch (err: unknown) {
      const apiErr = err as { status?: number };
      if (apiErr?.status === 405 || apiErr?.status === 404) {
        return await apiClient<ApiResponse<FoodMenuItem>>(`/food-menu/${id}`, {
          method: 'PATCH',
          body: formData,
        });
      }
      throw err;
    }
  },

  /**
   * DELETE /food-menu/:id
   * Deletes a food menu item
   */
  async deleteFoodMenuItem(id: number | string): Promise<{ success?: boolean; message?: string }> {
    const response = await apiClient<{ success?: boolean; message?: string }>(`/food-menu/${id}`, {
      method: 'DELETE',
    });
    if (response && response.success === false) {
      throw new Error(response.message || 'Failed to delete food menu item');
    }
    return response;
  },

  /**
   * GET /food-menu/:id/feedback
   * Retrieves feedbacks and average rating for a specific menu item
   */
  async getItemFeedback(id: number | string): Promise<FoodItemFeedbackData | null> {
    try {
      const response = await apiClient<FoodItemFeedbackApiResponse>(`/food-menu/${id}/feedback`);
      if (response && response.data) {
        return response.data;
      }
      return null;
    } catch (err) {
      console.error(`Failed to fetch feedback for menu item #${id}:`, err);
      return null;
    }
  },

  /**
   * GET /food-menu/feedback?branch_id=1&start_date=2026-11-01&end_date=2026-11-07&meal_type=all&page=1&limit=20
   * Retrieves branch-wide food feedbacks with pagination
   */
  async getBranchFeedback(params: FoodMenuQueryParams = {}): Promise<{
    data: FoodFeedbackItem[];
    meta?: FoodBranchFeedbackMeta;
  }> {
    const query = new URLSearchParams();

    if (params.branch_id !== undefined && params.branch_id !== null && params.branch_id !== 'all') {
      query.set('branch_id', String(params.branch_id));
    }
    if (params.start_date) query.set('start_date', params.start_date);
    if (params.end_date) query.set('end_date', params.end_date);
    if (params.meal_type) query.set('meal_type', params.meal_type);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));

    try {
      const response = await apiClient<FoodBranchFeedbackApiResponse>(
        `/food-menu/feedback?${query.toString()}`
      );
      if (response && response.data && Array.isArray(response.data)) {
        return {
          data: response.data,
          meta: response.meta,
        };
      }
      return { data: [], meta: response?.meta };
    } catch (err) {
      console.error('Failed to fetch food feedback list:', err);
      return { data: [] };
    }
  },

  /**
   * GET /food-menu/feedback/summary?branch_id=1&start_date=2026-11-01&end_date=2026-11-07
   * Retrieves rating stats summary and star distributions
   */
  async getFeedbackSummary(params: {
    branch_id?: number | string;
    start_date?: string;
    end_date?: string;
  } = {}): Promise<FoodFeedbackSummary> {
    const query = new URLSearchParams();

    if (params.branch_id !== undefined && params.branch_id !== null && params.branch_id !== 'all') {
      query.set('branch_id', String(params.branch_id));
    }
    if (params.start_date) query.set('start_date', params.start_date);
    if (params.end_date) query.set('end_date', params.end_date);

    try {
      const response = await apiClient<FoodFeedbackSummaryApiResponse>(
        `/food-menu/feedback/summary?${query.toString()}`
      );
      if (response && response.data) {
        return response.data;
      }
      return DEFAULT_FOOD_FEEDBACK_SUMMARY;
    } catch (err) {
      console.error('Failed to fetch food feedback summary:', err);
      return DEFAULT_FOOD_FEEDBACK_SUMMARY;
    }
  },
};
