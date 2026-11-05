export interface AuditUserDetail {
  id?: number;
  name?: string;
  role?: string;
  profile_photo_url?: string | null;
}

export interface AuditLog {
  id: number;
  sr_no?: number;
  user: string;
  user_name?: string;
  action: string;
  action_code?: string;
  module: string;
  module_code?: string;
  details: string;
  description?: string;
  timestamp: string;
  created_at_formatted?: string;
  created_at?: string;
  ip_address?: string;
  user_details?: AuditUserDetail | null;
  entity_type?: string;
  entity_id?: string;
  branch_id?: number | null;
  branch_name?: string;
  pg_id?: number | null;
  pg_name?: string;
  user_agent?: string;
  old_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}

export interface AuditStats {
  total_activities: number;
  today: number;
  last_7_days: number;
  last_30_days: number;
  total?: number;
  total_audits?: number;
  today_activities?: number;
  today_audits?: number;
  last_7_days_activities?: number;
  last_7_days_audits?: number;
  last_30_days_activities?: number;
  last_30_days_audits?: number;
  modules?: Record<string, number>;
  actions?: Record<string, number>;
  branches?: Array<{ id: number; name: string }>;
  recent?: AuditLog[];
}

export interface AuditMeta {
  page: number;
  limit: number;
  total_records: number;
  total_pages: number;
  total?: number;
  from?: number;
  to?: number;
  showing?: string;
}

export interface AuditFilterParams {
  branch_id?: number | string | null;
  module?: string;
  action?: string;
  user?: string;
  date_range?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AuditExportParams extends AuditFilterParams {
  format: 'pdf' | 'xlsx';
}

export interface AuditExportResponse {
  format: 'pdf' | 'xlsx';
  download_url: string;
  file_url: string;
  filename: string;
  total_records: number;
}

