export type NoticeStatus = 'draft' | 'scheduled' | 'sent' | 'all';
export type NoticePriority = 'low' | 'medium' | 'high';
export type NoticeAudienceType = 'all' | 'branch' | 'room' | 'resident' | 'specific';

export interface NoticeAttachment {
  file_name?: string | null;
  raw_file_name?: string | null;
  file_url?: string | null;
  file_size?: string | null;
  file_mime?: string | null;
}

export interface Notice {
  id: number;
  sr_no?: number;
  title: string;
  category: string;
  priority: NoticePriority | string;
  audience: string;
  audience_type: NoticeAudienceType | string;
  branch_id?: number | null;
  branch_name?: string | null;
  room_id?: number | null;
  room_no?: string | null;
  resident_id?: number | null;
  resident_name?: string | null;
  summary?: string | null;
  content: string;
  schedule_date?: string | null;
  date_time?: string | null;
  scheduled_at?: string | null;
  sent_at?: string | null;
  status: NoticeStatus | string;
  has_attachment?: boolean;
  attachment?: NoticeAttachment | null;
  file_url?: string | null;
  file_name?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface NoticeStats {
  total_notices: number;
  drafts: number;
  scheduled: number;
  sent: number;
}

export interface NoticeQueryParams {
  page?: number;
  limit?: number;
  tab?: 'all' | 'draft' | 'scheduled' | 'sent' | string;
  category?: string;
  priority?: string;
  search?: string;
  branch_id?: number | string;
}

export interface NoticePaginationMeta {
  page: number;
  limit: number;
  total_records: number;
  total_pages: number;
  has_next?: boolean;
  has_prev?: boolean;
}

export interface NoticesApiResponse {
  success: boolean;
  message: string;
  data: Notice[];
  meta: NoticePaginationMeta;
}

export interface NoticeDetailApiResponse {
  success: boolean;
  message: string;
  data: Notice;
}

export interface NoticeStatsApiResponse {
  success: boolean;
  message: string;
  data: NoticeStats;
}

export const INITIAL_NOTICE_STATS: NoticeStats = {
  total_notices: 0,
  drafts: 0,
  scheduled: 0,
  sent: 0,
};

export const DEFAULT_NOTICE_META: NoticePaginationMeta = {
  page: 1,
  limit: 10,
  total_records: 0,
  total_pages: 1,
  has_next: false,
  has_prev: false,
};
