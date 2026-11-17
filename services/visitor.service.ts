import { apiClient } from '@/lib/api-client';
import { ApiResponse } from '@/types/auth';
import {
  Visitor,
  VisitorStats,
  VisitorStatsApiResponse,
  VisitorsApiResponse,
  VisitorDetailApiResponse,
  VisitorQueryParams,
  VisitorPaginationMeta,
  VisitorLog,
  VisitorGateLog,
} from '@/types/visitor';

export const DEFAULT_VISITOR_STATS: VisitorStats = {
  total_visitors: 0,
  today: 0,
  active_on_site: 0,
  pending_approval: 0,
};

export const DEFAULT_VISITOR_META: VisitorPaginationMeta = {
  page: 1,
  limit: 10,
  total_pages: 1,
  total: 0,
};

export const visitorService = {
  /**
   * Fetches visitor dashboard statistics
   * GET /visitors/stats?branch_id=1
   */
  async getVisitorStats(params: { branch_id?: number | string | null } = {}): Promise<VisitorStats> {
    const query = new URLSearchParams();
    if (params.branch_id !== undefined && params.branch_id !== null && params.branch_id !== '' && params.branch_id !== 'all') {
      query.set('branch_id', String(params.branch_id));
    }

    try {
      const endpoint = query.toString() ? `/visitors/stats?${query.toString()}` : '/visitors/stats';
      const response = await apiClient<VisitorStatsApiResponse>(endpoint);
      if (response && response.success && response.data) {
        return response.data;
      }
      return DEFAULT_VISITOR_STATS;
    } catch {
      return DEFAULT_VISITOR_STATS;
    }
  },

  /**
   * Fetches paginated visitors with filters
   * GET /visitors?status=all&purpose=all&start_date=&end_date=&search=&page=1&limit=10&branch_id=1&resident_id=
   */
  async getVisitors(params: VisitorQueryParams = {}): Promise<{ data: Visitor[]; meta: VisitorPaginationMeta }> {
    const query = new URLSearchParams();
    query.set('page', String(params.page || 1));
    query.set('limit', String(params.limit || 10));

    if (params.status && params.status !== 'all') {
      query.set('status', params.status);
    }
    if (params.purpose && params.purpose !== 'all') {
      query.set('purpose', params.purpose);
    }
    if (params.start_date) {
      query.set('start_date', params.start_date);
    }
    if (params.end_date) {
      query.set('end_date', params.end_date);
    }
    if (params.search && params.search.trim()) {
      query.set('search', params.search.trim());
    }
    if (params.branch_id !== undefined && params.branch_id !== null && params.branch_id !== '' && params.branch_id !== 'all') {
      query.set('branch_id', String(params.branch_id));
    }
    if (params.resident_id !== undefined && params.resident_id !== null && params.resident_id !== '' && params.resident_id !== 'all') {
      query.set('resident_id', String(params.resident_id));
    }

    try {
      const response = await apiClient<VisitorsApiResponse>(`/visitors?${query.toString()}`);
      if (response && response.success && Array.isArray(response.data)) {
        return {
          data: response.data,
          meta: response.meta || {
            page: params.page || 1,
            limit: params.limit || 10,
            total_pages: Math.ceil(response.data.length / (params.limit || 10)) || 1,
            total: response.data.length,
          },
        };
      }
      return { data: [], meta: DEFAULT_VISITOR_META };
    } catch {
      return { data: [], meta: DEFAULT_VISITOR_META };
    }
  },

  /**
   * Fetches visitor details by ID
   * GET /visitors/:id
   */
  async getVisitorById(id: number | string): Promise<Visitor | null> {
    try {
      const response = await apiClient<VisitorDetailApiResponse>(`/visitors/${id}`);
      if (response && response.success && response.data) {
        return response.data;
      }
      return null;
    } catch {
      return null;
    }
  },

  /**
   * Creates a new visitor (multipart/form-data)
   * POST /visitors
   */
  async createVisitor(formData: FormData): Promise<ApiResponse<Visitor>> {
    const response = await apiClient<ApiResponse<Visitor>>('/visitors', {
      method: 'POST',
      body: formData,
    });
    return response;
  },

  /**
   * Updates an existing visitor (multipart/form-data)
   * PUT /visitors/:id
   */
  async updateVisitor(id: number | string, formData: FormData): Promise<ApiResponse<Visitor>> {
    const response = await apiClient<ApiResponse<Visitor>>(`/visitors/${id}`, {
      method: 'PUT',
      body: formData,
    });
    return response;
  },

  /**
   * Updates visitor status (e.g. in_office, left, approved, pending)
   * PATCH /visitors/:id/status
   */
  async updateVisitorStatus(
    id: number | string,
    payload: { status: string; admin_notes?: string }
  ): Promise<ApiResponse<Visitor>> {
    const response = await apiClient<ApiResponse<Visitor>>(`/visitors/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return response;
  },

  /**
   * Deletes a visitor
   * DELETE /visitors/:id
   */
  async deleteVisitor(id: number | string): Promise<{ success?: boolean; message?: string }> {
    const response = await apiClient<{ success?: boolean; message?: string }>(`/visitors/${id}`, {
      method: 'DELETE',
    });
    return response;
  },

  /**
   * Fetches logs for a single visitor
   * GET /visitors/:id/logs
   */
  async getVisitorLogs(id: number | string): Promise<VisitorLog[]> {
    try {
      const response = await apiClient<ApiResponse<VisitorLog[]>>(`/visitors/${id}/logs`);
      if (response && response.success && Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch {
      return [];
    }
  },

  /**
   * Fetches gate activity logs across all visitors
   * GET /visitors/gate/logs
   */
  async getGateLogs(params: {
    branch_id?: number | string;
    visitor_id?: number | string;
    resident_id?: number | string;
    type?: string;
    date?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ data: VisitorGateLog[]; meta?: VisitorPaginationMeta }> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '' && val !== 'all') {
        query.set(key, String(val));
      }
    });

    try {
      const endpoint = query.toString() ? `/visitors/gate/logs?${query.toString()}` : '/visitors/gate/logs';
      const response = await apiClient<ApiResponse<VisitorGateLog[]> & { meta?: VisitorPaginationMeta }>(endpoint);
      if (response && response.success && Array.isArray(response.data)) {
        return {
          data: response.data,
          meta: response.meta,
        };
      }
      return { data: [] };
    } catch {
      return { data: [] };
    }
  },
};
