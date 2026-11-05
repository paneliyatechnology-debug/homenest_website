import { apiClient } from '@/lib/api-client';
import {
  AgreementRecord,
  AgreementStats,
  AgreementFilterParams,
  AgreementMeta,
  CreateAgreementInput,
  UpdateAgreementInput,
  AgreementsApiResponse,
  AgreementDetailApiResponse,
  AgreementStatsApiResponse,
} from '@/types/agreement';

export const INITIAL_AGREEMENT_STATS: AgreementStats = {
  total_agreements: 0,
  total: 0,
  draft: 0,
  pending_sign: 0,
  pending: 0,
  signed: 0,
  expired: 0,
};

class AgreementService {
  /**
   * GET /agreements?page=&limit=&status=&agreement_type=&search=&branch_id=&pg_id=
   */
  async getAgreements(params: AgreementFilterParams = {}): Promise<{
    data: AgreementRecord[];
    meta: AgreementMeta;
  }> {
    const page = params.page || 1;
    const limit = params.limit || 10;

    const query = new URLSearchParams();
    query.set('page', String(page));
    query.set('limit', String(limit));
    // Always send these even if empty — matches backend expectation from curl
    query.set('status', params.status ?? '');
    query.set('agreement_type', params.agreement_type ?? '');
    query.set('search', params.search ?? '');
    if (params.resident_id) query.set('resident_id', String(params.resident_id));
    if (params.pg_id) query.set('pg_id', String(params.pg_id));
    if (params.branch_id) query.set('branch_id', String(params.branch_id));

    const res = await apiClient<AgreementsApiResponse>(`/agreements?${query.toString()}`);

    const items = Array.isArray(res?.data) ? res.data : [];
    const totalCount = res?.meta?.total ?? items.length;
    const totalPages = res?.meta?.total_pages ?? Math.ceil(totalCount / limit);

    return {
      data: items.map((item, idx) => ({
        ...item,
        sr_no: (page - 1) * limit + idx + 1,
      })),
      meta: res?.meta ?? { page, limit, total_pages: totalPages, total: totalCount },
    };
  }

  /**
   * GET /agreements/stats?branch_id=
   */
  async getAgreementStats(params: { branch_id?: number | null; pg_id?: number | null } = {}): Promise<AgreementStats> {
    const query = new URLSearchParams();
    if (params.branch_id) query.set('branch_id', String(params.branch_id));
    if (params.pg_id) query.set('pg_id', String(params.pg_id));
    const qs = query.toString();

    const res = await apiClient<AgreementStatsApiResponse>(`/agreements/stats${qs ? `?${qs}` : ''}`);
    return res?.data ?? INITIAL_AGREEMENT_STATS;
  }

  /**
   * GET /agreements/:id
   */
  async getAgreementById(id: number): Promise<AgreementRecord | null> {
    const res = await apiClient<AgreementDetailApiResponse>(`/agreements/${id}`);
    return res?.data ?? null;
  }

  /**
   * POST /agreements
   */
  async createAgreement(input: CreateAgreementInput): Promise<{ id?: number; agreement_no?: string; message?: string }> {
    const res = await apiClient<{ success?: boolean; message?: string; id?: number; data?: AgreementRecord }>('/agreements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res || res.success === false) {
      throw new Error(res?.message ?? 'Failed to create agreement');
    }
    return {
      id: res.id ?? res.data?.id,
      agreement_no: res.data?.agreement_no ?? input.agreement_no,
      message: res.message,
    };
  }

  /**
   * PUT /agreements/:id
   */
  async updateAgreement(id: number, input: UpdateAgreementInput): Promise<{ message?: string; data?: AgreementRecord }> {
    const res = await apiClient<{ success?: boolean; message?: string; data?: AgreementRecord }>(`/agreements/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res || res.success === false) {
      throw new Error(res?.message ?? 'Failed to update agreement');
    }
    return {
      message: res.message,
      data: res.data,
    };
  }

  /**
   * DELETE /agreements/:id
   */
  async deleteAgreement(id: number): Promise<{ message?: string }> {
    const res = await apiClient<{ success?: boolean; message?: string }>(`/agreements/${id}`, {
      method: 'DELETE',
    });
    if (res && res.success === false) {
      throw new Error(res?.message ?? 'Failed to delete agreement');
    }
    return {
      message: res?.message ?? 'Agreement deleted successfully',
    };
  }
}

export const agreementService = new AgreementService();
