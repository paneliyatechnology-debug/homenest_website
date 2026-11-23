import { apiClient } from '@/lib/api-client';
import {
  Building,
  BuildingStats,
  BuildingMeta,
  BuildingFilterParams,
  BuildingFloorInput,
} from '@/types/building';

export const INITIAL_BUILDING_STATS: BuildingStats = {
  total_buildings: 0,
  total_floors: 0,
  total_rooms: 0,
};

class BuildingService {
  /**
   * GET /buildings/stats?branch_id=
   */
  async getBuildingStats(branchId?: number | string | null): Promise<BuildingStats> {
    try {
      const query = branchId && branchId !== 'all' ? `?branch_id=${branchId}` : '';
      const res = await apiClient<{
        success?: boolean;
        message?: string;
        data?: BuildingStats;
      }>(`/buildings/stats${query}`, { cacheTtlMs: 15_000 });
      return res?.data ?? INITIAL_BUILDING_STATS;
    } catch {
      return INITIAL_BUILDING_STATS;
    }
  }

  /**
   * GET /buildings?page=1&limit=10&search=&branch_id=
   */
  async getBuildings(params: BuildingFilterParams = {}): Promise<{
    data: Building[];
    meta: BuildingMeta;
  }> {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const query = new URLSearchParams();

    query.set('page', String(page));
    query.set('limit', String(limit));
    query.set('search', params.search ?? '');
    if (params.branch_id && params.branch_id !== 'all') {
      query.set('branch_id', String(params.branch_id));
    }

    const res = await apiClient<{
      success?: boolean;
      message?: string;
      data?: Building[];
      meta?: BuildingMeta;
    }>(`/buildings?${query.toString()}`, { cacheTtlMs: 30_000 });

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
   * GET /buildings/:id
   */
  async getBuildingById(id: number | string): Promise<Building | null> {
    const res = await apiClient<{
      success?: boolean;
      message?: string;
      data?: Building;
    }>(`/buildings/${id}`);
    return res?.data ?? null;
  }

  /**
   * POST /buildings
   */
  async createBuilding(data: {
    branch_id: string | number;
    name: string;
    floors: BuildingFloorInput[];
  }): Promise<Building> {
    const res = await apiClient<{
      success?: boolean;
      message?: string;
      data?: Building;
    }>('/buildings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res?.data as Building;
  }

  /**
   * PUT /buildings/:id
   */
  async updateBuilding(
    id: number | string,
    data: {
      branch_id: string | number;
      name: string;
      floors: BuildingFloorInput[];
    }
  ): Promise<Building> {
    const res = await apiClient<{
      success?: boolean;
      message?: string;
      data?: Building;
    }>(`/buildings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res?.data as Building;
  }

  /**
   * DELETE /buildings/:id
   */
  async deleteBuilding(id: number | string): Promise<void> {
    await apiClient(`/buildings/${id}`, {
      method: 'DELETE',
    });
  }
}

export const buildingService = new BuildingService();
