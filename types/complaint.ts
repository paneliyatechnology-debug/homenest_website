export type ComplaintStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'OPEN';

export interface ComplaintCategory {
  id: number;
  name: string;
  key: string;
  icon: string;
  description?: string;
}

export interface ComplaintLocation {
  room_id?: number | null;
  room_no?: string | null;
  floor_number?: number | string | null;
  building_name?: string | null;
  branch_id?: number | null;
  branch_name?: string | null;
}

export interface ComplaintResident {
  id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  profile_photo_url?: string | null;
}

export interface ComplaintAssignedTo {
  id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  role?: string | null;
  profile_photo_url?: string | null;
}

export interface ComplaintAttachment {
  id?: number | string;
  name?: string;
  file_name?: string;
  url?: string;
  file_url?: string;
  size?: string | number;
  file_size?: string | number;
  mime_type?: string;
}

export interface ComplaintTimelineItem {
  id: number;
  event_type: string;
  description: string;
  old_value?: string | null;
  new_value?: string | null;
  performed_by?: {
    id: number;
    name: string;
    role?: string;
  } | null;
  created_at: string;
}

export interface Complaint {
  id: number;
  complaint_number: string;
  title: string;
  description: string;
  status: ComplaintStatus | string;
  is_overdue?: boolean;
  due_date?: string | null;
  category?: ComplaintCategory | null;
  location?: ComplaintLocation | null;
  resident?: ComplaintResident | null;
  assigned_to?: ComplaintAssignedTo | null;
  attachments?: ComplaintAttachment[];
  timeline?: ComplaintTimelineItem[];
  resolution_notes?: string | null;
  resolved_at?: string | null;
  feedback?: unknown;
  created_at: string;
  updated_at?: string;
}

export interface ComplaintStats {
  branch_id?: number | null;
  branch_name?: string | null;
  total: number;
  total_complaints?: number;
  pending?: number;
  pending_complaints?: number;
  open?: number;
  open_complaints?: number;
  in_progress: number;
  in_progress_complaints?: number;
  resolved: number;
  resolved_complaints?: number;
  overdue: number;
  overdue_complaints?: number;
}

export interface ComplaintFilterParams {
  status?: string;
  category_id?: number | string;
  search?: string;
  assigned_to_user_id?: number | string;
  branch_id?: number | string;
  resident_id?: number | string;
  user_id?: number | string;
  page?: number;
  limit?: number;
}

export interface AssignComplaintPayload {
  assigned_to_user_id: number;
  due_date?: string;
}

export interface UpdateComplaintStatusPayload {
  status: ComplaintStatus | string;
  resolution_notes?: string;
}

export interface ComplaintMeta {
  page: number;
  limit: number;
  total_pages: number;
  total: number;
}

export const INITIAL_COMPLAINT_STATS: ComplaintStats = {
  total: 0,
  total_complaints: 0,
  pending: 0,
  pending_complaints: 0,
  open: 0,
  open_complaints: 0,
  in_progress: 0,
  in_progress_complaints: 0,
  resolved: 0,
  resolved_complaints: 0,
  overdue: 0,
  overdue_complaints: 0,
};
