export interface VisitorStats {
  total_visitors: number;
  today: number;
  active_on_site: number;
  pending_approval: number;
}

export interface VisitorStatsApiResponse {
  success: boolean;
  message: string;
  data: VisitorStats;
}

export interface VisitorLog {
  id: number;
  visitor_id?: number;
  type: 'entry' | 'exit' | string;
  direction: 'IN' | 'OUT' | string;
  log_date: string;
  log_time: string;
  gate_name?: string;
  logged_by_name?: string;
  notes?: string | null;
  created_at: string;
}

export interface VisitorResidentInfo {
  id: number;
  name: string;
  email?: string;
  phone?: string;
}

export interface VisitorRoomInfo {
  id: number;
  room_no: string;
  room_type: string;
  building_name?: string;
  floor_name?: string;
  floor_number?: number;
}

export interface VisitorPgInfo {
  id: number;
  name: string;
  address?: string;
  city?: string;
}

export interface VisitorBranchInfo {
  id: number;
  name: string;
}

export interface Visitor {
  id: number;
  pass_code: string;
  visitor_name: string;
  visitor_phone: string;
  visitor_photo?: string | null;
  visitor_photo_url?: string | null;
  purpose: string;
  visit_date: string;
  valid_until?: string | null;
  entry_time?: string | null;
  exit_time?: string | null;
  last_entry_time?: string | null;
  last_exit_time?: string | null;
  status: string;
  is_on_site: boolean;
  total_entries?: number;
  qr_code?: string | null;
  admin_notes?: string | null;
  entry_exit_logs?: VisitorLog[];
  host_resident?: string;
  resident?: VisitorResidentInfo;
  room?: VisitorRoomInfo;
  pg?: VisitorPgInfo;
  branch?: VisitorBranchInfo;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
}

export interface VisitorPaginationMeta {
  page: number;
  limit: number;
  total_pages: number;
  total: number;
}

export interface VisitorsApiResponse {
  success: boolean;
  message: string;
  data: Visitor[];
  meta: VisitorPaginationMeta;
}

export interface VisitorDetailApiResponse {
  success: boolean;
  message: string;
  data: Visitor;
}

export interface VisitorQueryParams {
  status?: string;
  purpose?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
  page?: number;
  limit?: number;
  branch_id?: number | string;
  resident_id?: number | string;
}

export interface VisitorGateLog {
  id: number;
  visitor_id: number;
  pass_code?: string;
  visitor_name: string;
  visitor_phone?: string;
  host_resident?: string;
  room_no?: string;
  type: string;
  direction: string;
  log_date: string;
  log_time: string;
  gate_name?: string;
  logged_by_name?: string;
  notes?: string | null;
  created_at: string;
}

export interface VisitorFormData {
  visitor_name: string;
  visitor_phone: string;
  purpose: string;
  visit_date: string;
  valid_until?: string;
  entry_time?: string;
  resident_id: number | string;
  pg_id?: number | string;
  branch_id?: number | string;
  admin_notes?: string;
  status: string;
  photo?: File | null;
}

