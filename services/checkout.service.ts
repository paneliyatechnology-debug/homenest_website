import { apiClient } from '@/lib/api-client';
import {
  CheckoutListItem,
  CheckoutPaginationMeta,
  CheckoutQueryParams,
  CheckoutDetails,
  UpdateCheckoutStatusPayload,
  CheckoutExportResult,
} from '@/types/checkout';

class CheckoutService {
  /**
   * GET /stays/checkouts
   * Retrieves checkout requests with status filters, search, and pagination
   */
  async getCheckouts(params: CheckoutQueryParams = {}): Promise<{
    data: CheckoutListItem[];
    meta: CheckoutPaginationMeta;
  }> {
    try {
      const query = new URLSearchParams();
      if (params.page) query.set('page', String(params.page));
      if (params.limit) query.set('limit', String(params.limit));
      if (params.branch_id && params.branch_id !== 'all') {
        query.set('branch_id', String(params.branch_id));
      }
      if (params.status && params.status !== 'all') {
        query.set('status', params.status);
      }
      if (params.search && params.search.trim()) {
        query.set('search', params.search.trim());
      }
      if (params.start_date) {
        query.set('start_date', params.start_date);
      }
      if (params.end_date) {
        query.set('end_date', params.end_date);
      }
      if (params.date_by) {
        query.set('date_by', params.date_by);
      } else {
        query.set('date_by', 'departure_date');
      }

      const qs = query.toString();
      const response = await apiClient<{
        success: boolean;
        data: CheckoutListItem[];
        meta: CheckoutPaginationMeta;
      }>(`/stays/checkouts${qs ? `?${qs}` : ''}`);

      return {
        data: response?.data || [],
        meta: response?.meta || { total_records: response?.data?.length || 0 },
      };
    } catch {
      return {
        data: [],
        meta: { total_records: 0 },
      };
    }
  }

  /**
   * GET /stays/checkouts/:id
   * Retrieves single checkout request details with financials, timeline & checklist
   */
  async getCheckoutById(id: number | string): Promise<CheckoutDetails | null> {
    try {
      const response = await apiClient<{
        success: boolean;
        data: CheckoutDetails;
      }>(`/stays/checkouts/${id}`);

      return response?.data || null;
    } catch {
      return null;
    }
  }

  /**
   * PATCH /stays/checkouts/:id/status
   * Updates checkout status, room inspection, key return, NOC, refund amount, and notes
   */
  async updateCheckoutStatus(
    id: number | string,
    payload: UpdateCheckoutStatusPayload
  ): Promise<void> {
    await apiClient(`/stays/checkouts/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
      showSuccessToast: true,
    });
  }

  /**
   * DELETE /stays/checkouts/:id
   * Soft deletes or cancels checkout departure request
   */
  async deleteCheckout(id: number | string): Promise<void> {
    await apiClient(`/stays/checkouts/${id}`, {
      method: 'DELETE',
      showSuccessToast: true,
    });
  }

  /**
   * GET /stays/checkouts/export
   * Exports checkout and refund approvals report as Excel or PDF
   */
  async exportCheckouts(
    params: CheckoutQueryParams & { format?: 'excel' | 'pdf' } = {}
  ): Promise<CheckoutExportResult> {
    const query = new URLSearchParams();
    query.set('format', params.format || 'excel');

    if (params.branch_id && params.branch_id !== 'all') {
      query.set('branch_id', String(params.branch_id));
    }
    if (params.status && params.status !== 'all') {
      query.set('status', params.status);
    }
    if (params.search && params.search.trim()) {
      query.set('search', params.search.trim());
    }
    if (params.start_date) {
      query.set('start_date', params.start_date);
    }
    if (params.end_date) {
      query.set('end_date', params.end_date);
    }
    if (params.date_by) {
      query.set('date_by', params.date_by);
    } else {
      query.set('date_by', 'departure_date');
    }

    const response = await apiClient<{
      success: boolean;
      data: CheckoutExportResult;
    }>(`/stays/checkouts/export?${query.toString()}`);

    return response.data;
  }
}

export const checkoutService = new CheckoutService();
