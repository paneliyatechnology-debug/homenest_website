import { apiClient } from '@/lib/api-client';
import {
  Notice,
  NoticeStats,
  NoticeQueryParams,
  NoticePaginationMeta,
  NoticesApiResponse,
  NoticeDetailApiResponse,
  NoticeStatsApiResponse,
  INITIAL_NOTICE_STATS,
  DEFAULT_NOTICE_META,
} from '@/types/notice';

class NoticeService {
  /**
   * GET /notices/stats
   * Retrieves statistical summary for notices
   */
  async getNoticeStats(): Promise<NoticeStats> {
    try {
      const response = await apiClient<NoticeStatsApiResponse>('/notices/stats');
      if (response && response.success && response.data) {
        return response.data;
      }
      return INITIAL_NOTICE_STATS;
    } catch {
      return INITIAL_NOTICE_STATS;
    }
  }

  /**
   * GET /notices?page=1&limit=10&tab=all&category=all&priority=all&search=
   * Retrieves paginated notices list with filters
   */
  async getNotices(params: NoticeQueryParams = {}): Promise<{
    data: Notice[];
    meta: NoticePaginationMeta;
  }> {
    const query = new URLSearchParams();
    query.set('page', String(params.page || 1));
    query.set('limit', String(params.limit || 10));

    if (params.tab && params.tab !== 'all') {
      query.set('tab', params.tab);
    } else {
      query.set('tab', 'all');
    }

    if (params.category && params.category !== 'all') {
      query.set('category', params.category);
    } else {
      query.set('category', 'all');
    }

    if (params.priority && params.priority !== 'all') {
      query.set('priority', params.priority);
    } else {
      query.set('priority', 'all');
    }

    if (params.search && params.search.trim()) {
      query.set('search', params.search.trim());
    } else {
      query.set('search', '');
    }

    if (params.branch_id && params.branch_id !== 'all') {
      query.set('branch_id', String(params.branch_id));
    }

    try {
      const response = await apiClient<NoticesApiResponse>(`/notices?${query.toString()}`);
      if (response && response.success && Array.isArray(response.data)) {
        return {
          data: response.data,
          meta: response.meta || {
            page: params.page || 1,
            limit: params.limit || 10,
            total_records: response.data.length,
            total_pages: Math.ceil(response.data.length / (params.limit || 10)) || 1,
            has_next: false,
            has_prev: false,
          },
        };
      }
      return { data: [], meta: DEFAULT_NOTICE_META };
    } catch {
      return { data: [], meta: DEFAULT_NOTICE_META };
    }
  }

  /**
   * GET /notices/:id
   * Retrieves single notice details
   */
  async getNoticeById(id: number | string): Promise<Notice | null> {
    try {
      const response = await apiClient<NoticeDetailApiResponse>(`/notices/${id}`);
      if (response && response.success && response.data) {
        return response.data;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * POST /notices (multipart/form-data)
   * Creates a new notice (draft or scheduled or sent)
   */
  async createNotice(formData: FormData): Promise<{ success: boolean; data?: Notice; message?: string }> {
    const response = await apiClient<{ success: boolean; data: Notice; message?: string }>('/notices', {
      method: 'POST',
      body: formData,
      showSuccessToast: true,
    });
    return response;
  }

  /**
   * PUT /notices/:id (multipart/form-data)
   * Updates an existing notice
   */
  async updateNotice(id: number | string, formData: FormData): Promise<{ success: boolean; data?: Notice; message?: string }> {
    const response = await apiClient<{ success: boolean; data: Notice; message?: string }>(`/notices/${id}`, {
      method: 'PUT',
      body: formData,
      showSuccessToast: true,
    });
    return response;
  }

  /**
   * DELETE /notices/:id
   * Deletes a notice
   */
  async deleteNotice(id: number | string): Promise<void> {
    await apiClient(`/notices/${id}`, {
      method: 'DELETE',
      showSuccessToast: true,
    });
  }

  /**
   * POST /notices/:id/send
   * Sends a notice immediately
   */
  async sendNotice(id: number | string): Promise<void> {
    await apiClient(`/notices/${id}/send`, {
      method: 'POST',
      showSuccessToast: true,
    });
  }
}

export const noticeService = new NoticeService();
export { INITIAL_NOTICE_STATS, DEFAULT_NOTICE_META };
