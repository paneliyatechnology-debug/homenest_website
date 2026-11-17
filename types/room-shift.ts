export type RoomShiftStatus = 'approved' | 'pending' | 'rejected' | 'all';

export interface RoomShiftResident {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  profile_photo?: string | null;
  photo_url?: string | null;
}

export interface RoomShiftRoomInfo {
  id: number;
  room_no: string;
  room_type?: string;
  building_name?: string;
  floor_number?: number;
}

export interface RoomShiftRequest {
  id: number;
  pg_id?: number;
  branch_id?: number;
  branch_name?: string;
  stay_id?: number;
  resident: RoomShiftResident;
  current_room?: RoomShiftRoomInfo | null;
  requested_room?: RoomShiftRoomInfo | null;
  preferred_room_type?: string;
  reason: string;
  additional_notes?: string | null;
  notes?: string | null;
  expected_move_date?: string | null;
  status: 'approved' | 'pending' | 'rejected' | string;
  reviewed_by?: number | null;
  reviewer_name?: string | null;
  admin_notes?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface RoomShiftStats {
  pg_id?: number;
  branch_id?: number | null;
  total_requests: number;
  total: number;
  approved: number;
  pending: number;
  rejected: number;
}

export interface RoomShiftMeta {
  page: number;
  limit: number;
  total_pages: number;
  total_items: number;
}

export interface RoomShiftQueryParams {
  branch_id?: number | string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateRoomShiftPayload {
  resident_id: number;
  reason: string;
  preferred_room_type?: string;
  requested_room_id?: number | null;
  expected_move_date?: string;
  additional_notes?: string;
  status?: 'approved' | 'pending' | 'rejected';
}

export interface UpdateRoomShiftStatusPayload {
  status: 'approved' | 'pending' | 'rejected';
  assigned_room_id?: number | null;
  admin_notes?: string;
}
