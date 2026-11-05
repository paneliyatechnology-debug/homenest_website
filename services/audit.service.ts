import { apiClient } from '@/lib/api-client';
import {
  AuditLog,
  AuditStats,
  AuditMeta,
  AuditFilterParams,
  AuditExportParams,
  AuditExportResponse,
} from '@/types/audit';

export const INITIAL_AUDIT_STATS: AuditStats = {
  total_activities: 0,
  today: 0,
  last_7_days: 0,
  last_30_days: 0,
  total: 0,
  total_audits: 0,
  modules: {},
  actions: {},
  branches: [],
  recent: [],
};

class AuditService {
  /**
   * GET /audits?branch_id=&module=&action=&user=&date_range=&start_date=&end_date=&search=&page=&limit=
   */
  async getAudits(params: AuditFilterParams = {}): Promise<{
    data: AuditLog[];
    meta: AuditMeta;
  }> {
    const page = params.page || 1;
    const limit = params.limit || 10;

    const query = new URLSearchParams();
    query.set('page', String(page));
    query.set('limit', String(limit));

    if (params.branch_id !== undefined && params.branch_id !== null && params.branch_id !== '') {
      query.set('branch_id', String(params.branch_id));
    }
    if (params.module) query.set('module', params.module);
    if (params.action) query.set('action', params.action);
    if (params.user) query.set('user', params.user);
    if (params.date_range) query.set('date_range', params.date_range);
    if (params.start_date) query.set('start_date', params.start_date);
    if (params.end_date) query.set('end_date', params.end_date);
    if (params.search) query.set('search', params.search);

    const res = await apiClient<{
      success?: boolean;
      message?: string;
      data?: AuditLog[];
      meta?: AuditMeta;
    }>(`/audits?${query.toString()}`);

    const items = Array.isArray(res?.data) ? res.data : [];
    const totalCount = res?.meta?.total_records ?? res?.meta?.total ?? items.length;
    const totalPages = res?.meta?.total_pages ?? Math.max(1, Math.ceil(totalCount / limit));

    return {
      data: items.map((item, idx) => ({
        ...item,
        sr_no: item.sr_no ?? ((page - 1) * limit + idx + 1),
      })),
      meta: res?.meta ?? {
        page,
        limit,
        total_records: totalCount,
        total_pages: totalPages,
        total: totalCount,
        from: (page - 1) * limit + (items.length > 0 ? 1 : 0),
        to: (page - 1) * limit + items.length,
        showing: `Showing ${items.length > 0 ? (page - 1) * limit + 1 : 0}-${(page - 1) * limit + items.length} of ${totalCount}`,
      },
    };
  }

  /**
   * GET /audits/stats?branch_id=&date_range=&start_date=&end_date=
   */
  async getAuditStats(params: {
    branch_id?: number | string | null;
    date_range?: string;
    start_date?: string;
    end_date?: string;
  } = {}): Promise<AuditStats> {
    const query = new URLSearchParams();
    if (params.branch_id !== undefined && params.branch_id !== null && params.branch_id !== '') {
      query.set('branch_id', String(params.branch_id));
    }
    if (params.date_range) query.set('date_range', params.date_range);
    if (params.start_date) query.set('start_date', params.start_date);
    if (params.end_date) query.set('end_date', params.end_date);

    const qs = query.toString();
    const res = await apiClient<{
      success?: boolean;
      message?: string;
      data?: AuditStats;
    }>(`/audits/stats${qs ? `?${qs}` : ''}`);

    return res?.data ?? INITIAL_AUDIT_STATS;
  }

  /**
   * GET /audits/:id
   */
  async getAuditById(id: number | string): Promise<AuditLog | null> {
    const res = await apiClient<{
      success?: boolean;
      message?: string;
      data?: AuditLog;
    }>(`/audits/${id}`);
    return res?.data ?? null;
  }

  /**
   * GET /audits/export?branch_id=&module=&action=&user=&date_range=&format=pdf|xlsx
   */
  async exportAudits(params: AuditExportParams): Promise<AuditExportResponse> {
    const query = new URLSearchParams();
    query.set('format', params.format);

    if (params.branch_id !== undefined && params.branch_id !== null && params.branch_id !== '') {
      query.set('branch_id', String(params.branch_id));
    }
    if (params.module) query.set('module', params.module);
    if (params.action) query.set('action', params.action);
    if (params.user) query.set('user', params.user);
    if (params.date_range) query.set('date_range', params.date_range);

    const res = await apiClient<{
      success?: boolean;
      message?: string;
      data?: AuditExportResponse;
    }>(`/audits/export?${query.toString()}`);

    if (!res || !res.data) {
      throw new Error(res?.message ?? 'Failed to export audit report');
    }

    return res.data;
  }
}

export const auditService = new AuditService();

