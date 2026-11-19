import { apiClient } from '@/lib/api-client';
import {
  PaymentRecord,
  PaymentStats,
  PaymentMeta,
  PaymentFilterParams,
  PaymentExportParams,
  PaymentExportResult,
  PaymentCreatePayload,
  PaymentUpdatePayload,
  PaymentCollectPayload,
} from '@/types/payment';

export const INITIAL_PAYMENT_STATS: PaymentStats = {
  total_revenue: 0,
  total_transactions: 0,
  collected: 0,
  collected_percentage: 0,
  pending_dues: 0,
  pending_percentage: 0,
  overdue: 0,
  overdue_percentage: 0,
  total_pending: 0,
  total_refunded: 0,
};

class PaymentService {
  /**
   * GET /payments/stats?start_date=&end_date=&branch_id=
   */
  async getPaymentStats(params: {
    start_date?: string;
    end_date?: string;
    branch_id?: number | string | null;
  } = {}): Promise<PaymentStats> {
    try {
      const query = new URLSearchParams();
      if (params.start_date) query.set('start_date', params.start_date);
      if (params.end_date) query.set('end_date', params.end_date);
      if (params.branch_id && params.branch_id !== 'all') {
        query.set('branch_id', String(params.branch_id));
      }

      const queryString = query.toString() ? `?${query.toString()}` : '';
      const res = await apiClient<{
        success?: boolean;
        message?: string;
        data?: PaymentStats;
      }>(`/payments/stats${queryString}`);

      return res?.data ?? INITIAL_PAYMENT_STATS;
    } catch {
      return INITIAL_PAYMENT_STATS;
    }
  }

  /**
   * GET /payments?status=all&resident_id=&room_type=&payment_type=&payment_method=&start_date=&end_date=&date_by=due_date&search=&page=1&limit=10&branch_id=&tab=
   */
  async getPayments(params: PaymentFilterParams = {}): Promise<{
    data: PaymentRecord[];
    meta: PaymentMeta;
  }> {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const query = new URLSearchParams();

    query.set('page', String(page));
    query.set('limit', String(limit));

    if (params.status && params.status !== 'all') {
      query.set('status', params.status);
    }
    if (params.tab) {
      query.set('tab', params.tab);
    }
    if (params.branch_id && params.branch_id !== 'all') {
      query.set('branch_id', String(params.branch_id));
    }
    if (params.room_type && params.room_type !== 'all') {
      query.set('room_type', params.room_type);
    }
    if (params.payment_type && params.payment_type !== 'all') {
      query.set('payment_type', params.payment_type);
    }
    if (params.payment_method && params.payment_method !== 'all') {
      query.set('payment_method', params.payment_method);
    }
    if (params.resident_id) {
      query.set('resident_id', String(params.resident_id));
    }
    if (params.start_date) {
      query.set('start_date', params.start_date);
    }
    if (params.end_date) {
      query.set('end_date', params.end_date);
    }
    if (params.date_by) {
      query.set('date_by', params.date_by);
    }
    if (params.search) {
      query.set('search', params.search);
    }

    const res = await apiClient<{
      success?: boolean;
      message?: string;
      data?: PaymentRecord[];
      meta?: PaymentMeta;
    }>(`/payments?${query.toString()}`);

    const items = Array.isArray(res?.data) ? res.data : [];
    const meta: PaymentMeta = {
      page: res?.meta?.page ?? page,
      limit: res?.meta?.limit ?? limit,
      total: res?.meta?.total ?? res?.meta?.total_records ?? items.length,
      total_pages:
        res?.meta?.total_pages ??
        (Math.ceil((res?.meta?.total ?? items.length) / limit) || 1),
      total_records: res?.meta?.total_records ?? res?.meta?.total ?? items.length,
    };

    return {
      data: items,
      meta,
    };
  }

  /**
   * GET /payments/:id
   */
  async getPaymentById(id: number | string): Promise<PaymentRecord | null> {
    try {
      const res = await apiClient<{
        success?: boolean;
        message?: string;
        data?: PaymentRecord;
      }>(`/payments/${id}`);
      return res?.data ?? null;
    } catch {
      return null;
    }
  }

  /**
   * POST /payments
   */
  async createPayment(data: PaymentCreatePayload): Promise<PaymentRecord> {
    const res = await apiClient<{
      success?: boolean;
      message?: string;
      data: PaymentRecord;
    }>('/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  }

  /**
   * PUT /payments/:id
   */
  async updatePayment(id: number | string, data: PaymentUpdatePayload): Promise<PaymentRecord> {
    const res = await apiClient<{
      success?: boolean;
      message?: string;
      data: PaymentRecord;
    }>(`/payments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.data;
  }

  /**
   * DELETE /payments/:id
   */
  async deletePayment(id: number | string): Promise<void> {
    await apiClient(`/payments/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * POST /payments/:id/pay
   * Collect payment / record collection
   */
  async collectPayment(id: number | string, data: PaymentCollectPayload): Promise<PaymentRecord> {
    const res = await apiClient<{
      success?: boolean;
      message?: string;
      data: PaymentRecord;
    }>(`/payments/${id}/pay`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  }

  /**
   * GET /payments/export?format=xlsx&...
   */
  async exportPayments(params: PaymentExportParams = {}): Promise<PaymentExportResult> {
    const query = new URLSearchParams();
    query.set('format', params.format || 'xlsx');

    if (params.status && params.status !== 'all') {
      query.set('status', params.status);
    }
    if (params.branch_id && params.branch_id !== 'all') {
      query.set('branch_id', String(params.branch_id));
    }
    if (params.room_type && params.room_type !== 'all') {
      query.set('room_type', params.room_type);
    }
    if (params.payment_type && params.payment_type !== 'all') {
      query.set('payment_type', params.payment_type);
    }
    if (params.payment_method && params.payment_method !== 'all') {
      query.set('payment_method', params.payment_method);
    }
    if (params.start_date) {
      query.set('start_date', params.start_date);
    }
    if (params.end_date) {
      query.set('end_date', params.end_date);
    }
    if (params.search) {
      query.set('search', params.search);
    }

    const res = await apiClient<{
      success?: boolean;
      message?: string;
      data: PaymentExportResult;
    }>(`/payments/export?${query.toString()}`, {
      showSuccessToast: true,
    });

    return res.data;
  }

  /**
   * GET /payments/:id/receipt
   * Generate and retrieve official payment receipt PDF
   */
  async getPaymentReceipt(id: number | string): Promise<{
    file_url: string;
    filename: string;
    receipt_no: string;
    payment_id: number;
    resident_name: string;
    amount: number;
    status: string;
  }> {
    const res = await apiClient<{
      success?: boolean;
      message?: string;
      data: {
        file_url: string;
        filename: string;
        receipt_no: string;
        payment_id: number;
        resident_name: string;
        amount: number;
        status: string;
      };
    }>(`/payments/${id}/receipt`, {
      showSuccessToast: true,
    });
    return res.data;
  }
}

export const paymentService = new PaymentService();
