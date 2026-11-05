import { apiClient } from '@/lib/api-client';
import { Branch, BranchStats, BranchMeta, BranchFilterParams } from '@/types/branch';

export const INITIAL_BRANCH_STATS: BranchStats = {
  total_branches: 0,
  active: 0,
  maintenance: 0,
  upcoming: 0,
};

class BranchService {
  /**
   * GET /branches/stats
   */
  async getBranchStats(): Promise<BranchStats> {
    try {
      const res = await apiClient<{
        success?: boolean;
        message?: string;
        data?: BranchStats;
      }>('/branches/stats');
      return res?.data ?? INITIAL_BRANCH_STATS;
    } catch {
      return INITIAL_BRANCH_STATS;
    }
  }

  /**
   * GET /branches?pg_id=&status=&search=&location=&page=&limit=
   */
  async getBranches(params: BranchFilterParams = {}): Promise<{
    data: Branch[];
    meta: BranchMeta;
  }> {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const query = new URLSearchParams();

    query.set('page', String(page));
    query.set('limit', String(limit));

    if (params.pg_id) query.set('pg_id', String(params.pg_id));
    if (params.status && params.status !== 'all') query.set('status', params.status);
    if (params.search) query.set('search', params.search);
    if (params.location) query.set('location', params.location);

    const qs = query.toString();
    const res = await apiClient<{
      success?: boolean;
      message?: string;
      data?: Branch[];
      meta?: BranchMeta;
    }>(`/branches${qs ? `?${qs}` : ''}`);

    const items = Array.isArray(res?.data) ? res.data : [];
    const totalCount = res?.meta?.total_records ?? items.length;
    const totalPages = res?.meta?.total_pages ?? Math.max(1, Math.ceil(totalCount / limit));

    return {
      data: items,
      meta: res?.meta ?? {
        page,
        limit,
        total_records: totalCount,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1,
      },
    };
  }

  /**
   * GET /branches/:id
   */
  async getBranchById(id: number | string): Promise<Branch | null> {
    const res = await apiClient<{
      success?: boolean;
      message?: string;
      data?: Branch;
    }>(`/branches/${id}`);
    return res?.data ?? null;
  }

  /**
   * POST /branches (multipart/form-data)
   */
  async createBranch(formData: FormData): Promise<{
    success: boolean;
    message: string;
    data?: Branch;
  }> {
    const res = await apiClient<{
      success?: boolean;
      message?: string;
      data?: Branch;
    }>('/branches', {
      method: 'POST',
      body: formData,
    });

    if (res && res.success === false) {
      throw new Error(res.message || 'Branch creation failed');
    }

    return {
      success: res?.success ?? true,
      message: res?.message ?? 'Branch created successfully',
      data: res?.data,
    };
  }

  /**
   * PUT /branches/:id (multipart/form-data)
   */
  async updateBranch(
    id: number | string,
    formData: FormData
  ): Promise<{
    success: boolean;
    message: string;
    data?: Branch;
  }> {
    const res = await apiClient<{
      success?: boolean;
      message?: string;
      data?: Branch;
    }>(`/branches/${id}`, {
      method: 'PUT',
      body: formData,
    });

    if (res && res.success === false) {
      throw new Error(res.message || 'Branch update failed');
    }

    return {
      success: res?.success ?? true,
      message: res?.message ?? 'Branch updated successfully',
      data: res?.data,
    };
  }

  /**
   * DELETE /branches/:id
   */
  async deleteBranch(id: number | string): Promise<{
    success: boolean;
    message: string;
  }> {
    const res = await apiClient<{
      success?: boolean;
      message?: string;
    }>(`/branches/${id}`, {
      method: 'DELETE',
    });

    return {
      success: res?.success ?? true,
      message: res?.message ?? 'Branch deleted successfully',
    };
  }
}

export const branchService = new BranchService();

