import { apiClient } from '@/lib/api-client';
import {
  LaundryRequest,
  LaundryStatus,
  LaundryStats,
  LaundryCatalog,
  LaundryPaginationMeta,
  LaundryQueryParams,
  CreateLaundryPayload,
  UpdateLaundryStatusPayload,
  UpdateLaundryCatalogPayload,
  LaundryUserResident,
  CreateLaundryPaymentPayload,
  ResidentLaundryBilling,
  INITIAL_LAUNDRY_STATS,
  DEFAULT_LAUNDRY_META,
} from '@/types/laundry';

class LaundryService {
  /**
   * GET /laundry/stats?branch_id=&type=
   * Retrieves dashboard statistics for laundry requests
   */
  async getStats(params: { branch_id?: number | string; type?: string } = {}): Promise<LaundryStats> {
    try {
      const query = new URLSearchParams();
      if (params.branch_id && params.branch_id !== 'all') {
        query.set('branch_id', String(params.branch_id));
      }
      if (params.type && params.type !== 'all') {
        query.set('type', params.type);
      }
      const qs = query.toString();
      const endpoint = `/laundry/stats${qs ? `?${qs}` : ''}`;
      const response = await apiClient<{ success?: boolean; data?: LaundryStats }>(endpoint);
      return response?.data ?? INITIAL_LAUNDRY_STATS;
    } catch {
      return INITIAL_LAUNDRY_STATS;
    }
  }

  /**
   * GET /laundry?branch_id=&tab=&status=&type=&search=&page=&limit=
   * Retrieves paginated list of laundry and service requests
   */
  async getRequests(params: LaundryQueryParams = {}): Promise<{
    data: LaundryRequest[];
    meta: LaundryPaginationMeta;
  }> {
    try {
      const query = new URLSearchParams();
      query.set('page', String(params.page || 1));
      query.set('limit', String(params.limit || 10));

      if (params.branch_id && params.branch_id !== 'all') {
        query.set('branch_id', String(params.branch_id));
      }
      if (params.tab && params.tab !== 'all') {
        query.set('tab', params.tab);
      }
      if (params.status && params.status !== 'all') {
        query.set('status', params.status);
      }
      if (params.type && params.type !== 'all') {
        query.set('type', params.type);
      }
      if (params.request_type && params.request_type !== 'all') {
        query.set('request_type', params.request_type);
      }
      if (params.search && params.search.trim()) {
        query.set('search', params.search.trim());
      }

      const response = await apiClient<{
        success?: boolean;
        data?: LaundryRequest[];
        meta?: LaundryPaginationMeta;
        pagination?: LaundryPaginationMeta;
      }>(`/laundry?${query.toString()}`);

      const dataList = Array.isArray(response?.data) ? response.data : [];
      const metaInfo = response?.meta || response?.pagination || {
        ...DEFAULT_LAUNDRY_META,
        total: dataList.length,
        total_pages: Math.ceil(dataList.length / (params.limit || 10)) || 1,
      };

      return {
        data: dataList,
        meta: metaInfo,
      };
    } catch {
      return { data: [], meta: DEFAULT_LAUNDRY_META };
    }
  }

  /**
   * GET /laundry/:id
   * Retrieves single laundry request details
   */
  async getRequestById(id: number | string): Promise<LaundryRequest | null> {
    try {
      const response = await apiClient<{ success?: boolean; data?: LaundryRequest }>(`/laundry/${id}`);
      return response?.data ?? null;
    } catch {
      return null;
    }
  }

  /**
   * POST /laundry
   * Creates a new laundry or service request
   */
  async createRequest(payload: CreateLaundryPayload): Promise<{ success: boolean; id?: number }> {
    const response = await apiClient<{ success: boolean; data?: { id: number }; id?: number }>(
      '/laundry',
      {
        method: 'POST',
        body: JSON.stringify(payload),
        showSuccessToast: true,
      }
    );
    return {
      success: Boolean(response?.success),
      id: response?.data?.id ?? response?.id,
    };
  }

  /**
   * PUT /laundry/:id
   * Updates an existing laundry or service request
   */
  async updateRequest(
    id: number | string,
    payload: Partial<CreateLaundryPayload> & { status?: LaundryStatus }
  ): Promise<{ success: boolean; data?: LaundryRequest }> {
    const response = await apiClient<{ success: boolean; data?: LaundryRequest }>(
      `/laundry/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
        showSuccessToast: true,
      }
    );
    return {
      success: Boolean(response?.success),
      data: response?.data,
    };
  }

  /**
   * PATCH /laundry/:id/status
   * Updates status of laundry request (pending -> in_progress -> completed -> cancelled)
   */
  async updateStatus(
    id: number | string,
    payload: UpdateLaundryStatusPayload
  ): Promise<void> {
    await apiClient(`/laundry/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
      showSuccessToast: true,
    });
  }

  /**
   * PATCH /laundry/:id/assign
   * Assigns staff member to a laundry request
   */
  async assignStaff(id: number | string, staffId: number): Promise<void> {
    await apiClient(`/laundry/${id}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ assigned_to: staffId }),
      showSuccessToast: true,
    });
  }

  /**
   * DELETE /laundry/:id
   * Cancels or removes a laundry request
   */
  async deleteRequest(id: number | string): Promise<void> {
    await apiClient(`/laundry/${id}`, {
      method: 'DELETE',
      showSuccessToast: true,
    });
  }

  /**
   * GET /laundry/catalog?branch_id=
   * Retrieves laundry catalog, items, pricing, and pickup slots
   */
  async getCatalog(branchId?: number | string | null): Promise<LaundryCatalog | null> {
    try {
      const query = branchId && branchId !== 'all' ? `?branch_id=${branchId}` : '';
      const response = await apiClient<{ success?: boolean; data?: LaundryCatalog }>(
        `/laundry/catalog${query}`
      );
      return response?.data ?? null;
    } catch {
      return null;
    }
  }

  /**
   * PUT /laundry/catalog
   * Updates laundry catalog items and rates (Branch-wise or All Branches)
   */
  async updateCatalog(payload: UpdateLaundryCatalogPayload): Promise<void> {
    await apiClient('/laundry/catalog', {
      method: 'PUT',
      body: JSON.stringify(payload),
      showSuccessToast: true,
    });
  }

  /**
   * GET /laundry/users?branch_id=&search=&laundry_status=&sort_by=&order=&page=&limit=
   * Retrieves residents laundry and payment summary
   */
  async getUsers(params: {
    branch_id?: number | string;
    search?: string;
    laundry_status?: string;
    sort_by?: string;
    order?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    data: LaundryUserResident[];
    meta: LaundryPaginationMeta;
  }> {
    try {
      const query = new URLSearchParams();
      query.set('page', String(params.page || 1));
      query.set('limit', String(params.limit || 10));

      if (params.branch_id && params.branch_id !== 'all') {
        query.set('branch_id', String(params.branch_id));
      }
      if (params.search && params.search.trim()) {
        query.set('search', params.search.trim());
      }
      if (params.laundry_status && params.laundry_status !== 'all') {
        query.set('laundry_status', params.laundry_status);
      }
      if (params.sort_by) {
        query.set('sort_by', params.sort_by);
      }
      if (params.order) {
        query.set('order', params.order);
      }

      const response = await apiClient<{
        success?: boolean;
        data?: LaundryUserResident[];
        meta?: LaundryPaginationMeta;
        pagination?: LaundryPaginationMeta;
      }>(`/laundry/users?${query.toString()}`);

      const dataList = Array.isArray(response?.data) ? response.data : [];
      const metaInfo = response?.meta || response?.pagination || {
        ...DEFAULT_LAUNDRY_META,
        total: dataList.length,
        total_pages: Math.ceil(dataList.length / (params.limit || 10)) || 1,
      };

      return {
        data: dataList,
        meta: metaInfo,
      };
    } catch {
      return { data: [], meta: DEFAULT_LAUNDRY_META };
    }
  }

  /**
   * GET /laundry/residents/:id/billing
   * Retrieves resident-wise laundry orders and payment history overview
   */
  async getResidentBilling(residentId: number | string): Promise<ResidentLaundryBilling | null> {
    try {
      const response = await apiClient<{ success?: boolean; data?: ResidentLaundryBilling }>(
        `/laundry/residents/${residentId}/billing`
      );
      return response?.data ?? null;
    } catch {
      return null;
    }
  }

  /**
   * POST /laundry/payments
   * Generates laundry payment billing entry for resident(s)
   */
  async createLaundryPayment(payload: CreateLaundryPaymentPayload): Promise<void> {
    await apiClient('/laundry/payments', {
      method: 'POST',
      body: JSON.stringify(payload),
      showSuccessToast: true,
    });
  }
}

export const laundryService = new LaundryService();
export { INITIAL_LAUNDRY_STATS, DEFAULT_LAUNDRY_META };
