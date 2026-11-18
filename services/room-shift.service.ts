import { apiClient } from '@/lib/api-client';
import {
  RoomShiftRequest,
  RoomShiftStats,
  RoomShiftMeta,
  RoomShiftQueryParams,
  CreateRoomShiftPayload,
  UpdateRoomShiftStatusPayload,
} from '@/types/room-shift';

export const INITIAL_ROOM_SHIFT_STATS: RoomShiftStats = {
  total_requests: 0,
  total: 0,
  approved: 0,
  pending: 0,
  rejected: 0,
};

class RoomShiftService {
  /**
   * GET /rooms/shifts/stats?branch_id=
   * KPI statistics for Room Shifts dashboard cards (Total, Approved, Pending, Rejected)
   */
  async getShiftStats(branchId?: number | string | null): Promise<RoomShiftStats> {
    try {
      const query = branchId && branchId !== 'all' ? `?branch_id=${branchId}` : '';
      const res = await apiClient<{
        success?: boolean;
        message?: string;
        data?: RoomShiftStats;
      }>(`/rooms/shifts/stats${query}`);
      return res?.data ?? INITIAL_ROOM_SHIFT_STATS;
    } catch {
      return INITIAL_ROOM_SHIFT_STATS;
    }
  }

  /**
   * GET /rooms/shifts?branch_id=1&status=all&search=&page=1&limit=10
   * Retrieves paginated room shift requests
   */
  async getShifts(params: RoomShiftQueryParams = {}): Promise<{
    data: RoomShiftRequest[];
    meta: RoomShiftMeta;
  }> {
    try {
      const page = params.page || 1;
      const limit = params.limit || 10;
      const query = new URLSearchParams();

      query.set('page', String(page));
      query.set('limit', String(limit));

      if (params.branch_id && params.branch_id !== 'all') {
        query.set('branch_id', String(params.branch_id));
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
        data?: RoomShiftRequest[];
        meta?: RoomShiftMeta;
      }>(`/rooms/shifts${qs ? `?${qs}` : ''}`);

      const items = Array.isArray(res?.data) ? res.data : [];
      const totalCount = res?.meta?.total_items ?? items.length;
      const totalPages = res?.meta?.total_pages ?? Math.max(1, Math.ceil(totalCount / limit));

      return {
        data: items,
        meta: res?.meta ?? {
          page,
          limit,
          total_pages: totalPages,
          total_items: totalCount,
        },
      };
    } catch {
      return {
        data: [],
        meta: {
          page: 1,
          limit: 10,
          total_pages: 1,
          total_items: 0,
        },
      };
    }
  }

  /**
   * GET /rooms/shifts/:id
   * Retrieves details of a specific room shift request
   */
  async getShiftById(id: number | string): Promise<RoomShiftRequest | null> {
    try {
      const res = await apiClient<{
        success?: boolean;
        message?: string;
        data?: RoomShiftRequest;
      }>(`/rooms/shifts/${id}`);
      return res?.data ?? null;
    } catch {
      return null;
    }
  }

  /**
   * POST /rooms/shifts
   * Submits a room shift request
   */
  async createShift(payload: CreateRoomShiftPayload): Promise<RoomShiftRequest> {
    const res = await apiClient<{
      success: boolean;
      message: string;
      id?: number;
      data?: RoomShiftRequest;
    }>('/rooms/shifts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return (res.data || res) as unknown as RoomShiftRequest;
  }

  /**
   * PUT /rooms/shifts/:id
   * Updates an existing room shift request (same fields as create)
   */
  async updateShift(
    id: number | string,
    payload: Partial<CreateRoomShiftPayload>
  ): Promise<RoomShiftRequest> {
    const res = await apiClient<{
      success: boolean;
      message: string;
      id?: number;
      data?: RoomShiftRequest;
    }>(`/rooms/shifts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return (res.data || res) as unknown as RoomShiftRequest;
  }

  /**
   * PATCH /rooms/shifts/:id/status
   * Approves or rejects a room shift request, optionally assigning a room
   */
  async updateShiftStatus(
    id: number | string,
    payload: UpdateRoomShiftStatusPayload
  ): Promise<void> {
    await apiClient(`/rooms/shifts/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  /**
   * DELETE /rooms/shifts/:id
   * Deletes or cancels a room shift request
   */
  async deleteShift(id: number | string): Promise<void> {
    await apiClient(`/rooms/shifts/${id}`, {
      method: 'DELETE',
    });
  }
}

export const roomShiftService = new RoomShiftService();
