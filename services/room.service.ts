import { apiClient } from '@/lib/api-client';
import {
  Room,
  RoomStats,
  RoomBuilding,
  BuildingItem,
  FloorItem,
  RoomMeta,
  RoomFilterParams,
} from '@/types/room';

export const INITIAL_ROOM_STATS: RoomStats = {
  total_rooms: 0,
  occupied: 0,
  vacant: 0,
  maintenance: 0,
  out_of_service: 0,
};

class RoomService {
  /**
   * GET /rooms/stats?branch_id=
   */
  async getRoomStats(branchId?: number | string | null): Promise<RoomStats> {
    try {
      const query = branchId && branchId !== 'all' ? `?branch_id=${branchId}` : '';
      const res = await apiClient<{
        success?: boolean;
        message?: string;
        data?: RoomStats;
      }>(`/rooms/stats${query}`);
      return res?.data ?? INITIAL_ROOM_STATS;
    } catch {
      return INITIAL_ROOM_STATS;
    }
  }

  /**
   * GET /rooms/buildings?branch_id=
   */
  async getRoomBuildings(branchId?: number | string | null): Promise<RoomBuilding[]> {
    try {
      const query = branchId && branchId !== 'all' ? `?branch_id=${branchId}` : '';
      const res = await apiClient<{
        success?: boolean;
        message?: string;
        data?: RoomBuilding[];
      }>(`/rooms/buildings${query}`, { cacheTtlMs: 30_000 });
      return Array.isArray(res?.data) ? res.data : [];
    } catch {
      return [];
    }
  }

  /**
   * GET /buildings?page=1&limit=50&search=&branch_id=
   */
  async getBuildings(branchId: number | string): Promise<BuildingItem[]> {
    try {
      if (!branchId || branchId === 'all') return [];
      const res = await apiClient<{
        success?: boolean;
        message?: string;
        data?: BuildingItem[];
      }>(`/buildings?page=1&limit=50&search=&branch_id=${branchId}`, { cacheTtlMs: 30_000 });
      return Array.isArray(res?.data) ? res.data : [];
    } catch {
      return [];
    }
  }

  /**
   * GET /buildings//floors
   */
  async getFloors(buildingId: number | string): Promise<FloorItem[]> {
    try {
      if (!buildingId || buildingId === 'all') return [];
      const res = await apiClient<{
        success?: boolean;
        message?: string;
        data?: { floors?: FloorItem[] };
      }>(`/buildings/${buildingId}`, { cacheTtlMs: 30_000 });
      return Array.isArray(res?.data?.floors) ? res.data.floors : [];
    } catch {
      return [];
    }
  }

  /**
   * GET /rooms?page=1&limit=10&building_id=&floor_id=&status=&room_type=&search=&branch_id=
   */
  async getRooms(params: RoomFilterParams = {}): Promise<{
    data: Room[];
    meta: RoomMeta;
  }> {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const query = new URLSearchParams();

    query.set('page', String(page));
    query.set('limit', String(limit));

    if (params.branch_id && params.branch_id !== 'all') {
      query.set('branch_id', String(params.branch_id));
    }
    if (params.building_id && params.building_id !== 'all') {
      query.set('building_id', String(params.building_id));
    }
    if (params.floor_id && params.floor_id !== 'all') {
      query.set('floor_id', String(params.floor_id));
    }
    if (params.status && params.status !== 'all') {
      query.set('status', params.status);
    }
    if (params.room_type && params.room_type !== 'all') {
      query.set('room_type', params.room_type);
    }
    if (params.search && params.search.trim()) {
      query.set('search', params.search.trim());
    }

    const qs = query.toString();
    const res = await apiClient<{
      success?: boolean;
      message?: string;
      data?: Room[];
      meta?: RoomMeta;
    }>(`/rooms${qs ? `?${qs}` : ''}`);

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
  }

  /**
   * GET /rooms/:id
   */
  async getRoomById(id: number | string): Promise<Room | null> {
    const res = await apiClient<{
      success?: boolean;
      message?: string;
      data?: Room;
    }>(`/rooms/${id}`);
    return res?.data ?? null;
  }

  /**
   * POST /rooms (multipart/form-data)
   */
  async createRoom(formData: FormData): Promise<Room> {
    const res = await apiClient<{
      success?: boolean;
      message?: string;
      data?: Room;
    }>('/rooms', {
      method: 'POST',
      body: formData,
    });
    return res.data as Room;
  }

  /**
   * PUT /rooms/:id (multipart/form-data)
   */
  async updateRoom(id: number | string, formData: FormData): Promise<Room> {
    const res = await apiClient<{
      success?: boolean;
      message?: string;
      data?: Room;
    }>(`/rooms/${id}`, {
      method: 'PUT',
      body: formData,
    });
    return res.data as Room;
  }

  /**
   * DELETE /rooms/:id
   */
  async deleteRoom(id: number | string): Promise<void> {
    await apiClient(`/rooms/${id}`, {
      method: 'DELETE',
    });
  }
}

export const roomService = new RoomService();

