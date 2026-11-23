import { apiClient } from '@/lib/api-client';
import {
  Complaint,
  ComplaintCategory,
  ComplaintStats,
  ComplaintFilterParams,
  ComplaintMeta,
  AssignComplaintPayload,
  UpdateComplaintStatusPayload,
  INITIAL_COMPLAINT_STATS,
} from '@/types/complaint';

class ComplaintService {
  /**
   * GET /complaints/categories
   */
  async getCategories(): Promise<ComplaintCategory[]> {
    try {
      const res = await apiClient<{
        success?: boolean;
        message?: string;
        data?: ComplaintCategory[];
      }>('/complaints/categories', { cacheTtlMs: 300_000 });
      return Array.isArray(res?.data) ? res.data : [];
    } catch (err) {
      console.warn('Failed to fetch complaint categories:', err);
      return [];
    }
  }

  /**
   * GET /complaints/stats?branch_id=
   */
  async getStats(branchId?: number | string | null): Promise<ComplaintStats> {
    try {
      const query = branchId && branchId !== 'all' ? `?branch_id=${branchId}` : '';
      const res = await apiClient<{
        success?: boolean;
        message?: string;
        data?: ComplaintStats;
      }>(`/complaints/stats${query}`);
      return res?.data ?? INITIAL_COMPLAINT_STATS;
    } catch (err) {
      console.warn('Failed to fetch complaint stats:', err);
      return INITIAL_COMPLAINT_STATS;
    }
  }

  /**
   * GET /complaints?status=all&category_id=&search=&assigned_to_user_id=&page=1&limit=10
   */
  async getComplaints(params: ComplaintFilterParams = {}): Promise<{
    data: Complaint[];
    meta: ComplaintMeta;
  }> {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const query = new URLSearchParams();

    query.set('page', String(page));
    query.set('limit', String(limit));

    if (params.status && params.status !== 'all') {
      query.set('status', params.status);
    }
    if (params.category_id && params.category_id !== 'all') {
      query.set('category_id', String(params.category_id));
    }
    if (params.search && params.search.trim()) {
      query.set('search', params.search.trim());
    }
    if (params.assigned_to_user_id && params.assigned_to_user_id !== 'all') {
      query.set('assigned_to_user_id', String(params.assigned_to_user_id));
    }
    if (params.branch_id && params.branch_id !== 'all') {
      query.set('branch_id', String(params.branch_id));
    }
    if (params.resident_id && params.resident_id !== 'all') {
      query.set('resident_id', String(params.resident_id));
    }
    if (params.user_id && params.user_id !== 'all') {
      query.set('user_id', String(params.user_id));
    }

    const qs = query.toString();
    const res = await apiClient<{
      success?: boolean;
      message?: string;
      data?: Complaint[];
      meta?: ComplaintMeta;
    }>(`/complaints${qs ? `?${qs}` : ''}`);

    const items = Array.isArray(res?.data) ? res.data : [];
    const totalCount = res?.meta?.total ?? items.length;
    const totalPages = res?.meta?.total_pages ?? Math.max(1, Math.ceil(totalCount / limit));

    return {
      data: items,
      meta: res?.meta ?? {
        page,
        limit,
        total_pages: totalPages,
        total: totalCount,
      },
    };
  }

  /**
   * GET /complaints/:id
   */
  async getComplaintById(id: number | string): Promise<Complaint | null> {
    const res = await apiClient<{
      success?: boolean;
      message?: string;
      data?: Complaint;
    }>(`/complaints/${id}`);
    return res?.data ?? null;
  }

  /**
   * PATCH /complaints/:id/assignment
   */
  async assignComplaint(
    id: number | string,
    payload: AssignComplaintPayload
  ): Promise<Complaint> {
    const res = await apiClient<{
      success?: boolean;
      message?: string;
      data: Complaint;
    }>(`/complaints/${id}/assignment`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return res.data;
  }

  /**
   * PATCH /complaints/:id/status
   */
  async updateStatus(
    id: number | string,
    payload: UpdateComplaintStatusPayload
  ): Promise<Complaint> {
    const res = await apiClient<{
      success?: boolean;
      message?: string;
      data: Complaint;
    }>(`/complaints/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return res.data;
  }

  /**
   * POST /complaints/:id/updates (multipart form data)
   */
  async addUpdate(id: number | string, formData: FormData): Promise<unknown> {
    const res = await apiClient<{
      success?: boolean;
      message?: string;
      data: unknown;
    }>(`/complaints/${id}/updates`, {
      method: 'POST',
      body: formData,
    });
    return res.data;
  }
}

export const complaintService = new ComplaintService();
