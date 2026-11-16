import { apiClient } from '@/lib/api-client';
import {
  StaffMember,
  StaffStats,
  StaffMeta,
  StaffFilterParams,
  StaffStatus,
} from '@/types/staff';

export const INITIAL_STAFF_STATS: StaffStats = {
  total_staff: 0,
  total: 0,
  active: 0,
  on_leave: 0,
  inactive: 0,
  roles: {},
};

class StaffService {
  /**
   * GET /users/staff/stats?branch_id=
   */
  async getStaffStats(branchId?: number | string | null): Promise<StaffStats> {
    try {
      const query = branchId && branchId !== 'all' ? `?branch_id=${branchId}` : '';
      const res = await apiClient<{
        success?: boolean;
        message?: string;
        data?: StaffStats;
      }>(`/users/staff/stats${query}`);
      return res?.data ?? INITIAL_STAFF_STATS;
    } catch {
      return INITIAL_STAFF_STATS;
    }
  }

  /**
   * GET /users/staff?branch_id=&staff_role=&status=&search=&page=&limit=
   */
  async getStaffList(params: StaffFilterParams = {}): Promise<{
    data: StaffMember[];
    meta: StaffMeta;
  }> {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const query = new URLSearchParams();

    query.set('page', String(page));
    query.set('limit', String(limit));

    if (params.branch_id && params.branch_id !== 'all') {
      query.set('branch_id', String(params.branch_id));
    }
    if (params.staff_role && params.staff_role !== 'all') {
      query.set('staff_role', params.staff_role);
    }
    if (params.status && params.status !== 'all') {
      query.set('status', params.status);
    }
    if (params.search && params.search.trim()) {
      query.set('search', params.search.trim());
    }

    const qs = query.toString();
    const res = await apiClient<{
      success?: boolean;
      message?: string;
      data?: StaffMember[];
      meta?: StaffMeta;
    }>(`/users/staff${qs ? `?${qs}` : ''}`);

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
   * GET /users/staff/:id
   */
  async getStaffById(id: number | string): Promise<StaffMember | null> {
    const res = await apiClient<{
      success?: boolean;
      message?: string;
      data?: StaffMember;
    }>(`/users/staff/${id}`);
    return res?.data ?? null;
  }

  /**
   * POST /users/staff (multipart/form-data)
   */
  async createStaff(formData: FormData): Promise<{
    success: boolean;
    message: string;
    data?: StaffMember;
  }> {
    const res = await apiClient<{
      success?: boolean;
      message?: string;
      data?: StaffMember;
    }>('/users/staff', {
      method: 'POST',
      body: formData,
    });

    if (res && res.success === false) {
      throw new Error(res.message || 'Staff creation failed');
    }

    return {
      success: res?.success ?? true,
      message: res?.message ?? 'Staff created successfully',
      data: res?.data,
    };
  }

  /**
   * PUT /users/staff/:id (multipart/form-data)
   */
  async updateStaff(
    id: number | string,
    formData: FormData
  ): Promise<{
    success: boolean;
    message: string;
    data?: StaffMember;
  }> {
    const res = await apiClient<{
      success?: boolean;
      message?: string;
      data?: StaffMember;
    }>(`/users/staff/${id}`, {
      method: 'PUT',
      body: formData,
    });

    if (res && res.success === false) {
      throw new Error(res.message || 'Staff update failed');
    }

    return {
      success: res?.success ?? true,
      message: res?.message ?? 'Staff updated successfully',
      data: res?.data,
    };
  }

  /**
   * PATCH /users/staff/:id/status
   */
  async updateStaffStatus(
    id: number | string,
    status: StaffStatus
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    const res = await apiClient<{
      success?: boolean;
      message?: string;
    }>(`/users/staff/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });

    return {
      success: res?.success ?? true,
      message: res?.message ?? 'Staff status updated successfully',
    };
  }

  /**
   * DELETE /users/staff/:id
   */
  async deleteStaff(id: number | string): Promise<{
    success: boolean;
    message: string;
  }> {
    const res = await apiClient<{
      success?: boolean;
      message?: string;
    }>(`/users/staff/${id}`, {
      method: 'DELETE',
    });

    return {
      success: res?.success ?? true,
      message: res?.message ?? 'Staff deleted successfully',
    };
  }
}

export const staffService = new StaffService();

