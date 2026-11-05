export interface Branch {
  id: number;
  pg_id?: number | null;
  pg_name?: string | null;
  name: string;
  location?: string | null;
  branch_photo?: string | null;
  branch_photo_url?: string | null;
  total_rooms?: number;
  occupied_rooms?: number;
  available_rooms?: number;
  status?: 'active' | 'upcoming' | 'maintenance' | string;
  created_at?: string;
  updated_at?: string;
}

export interface BranchStats {
  total_branches: number;
  active: number;
  maintenance: number;
  upcoming: number;
}

export interface BranchMeta {
  page: number;
  limit: number;
  total_records: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface BranchFilterParams {
  pg_id?: number | string;
  status?: string;
  search?: string;
  location?: string;
  page?: number;
  limit?: number;
}

export interface BranchFormData {
  name: string;
  location: string;
  total_rooms: string | number;
  status: 'active' | 'maintenance' | 'upcoming';
  pg_id?: string | number;
  branch_photo?: File | null;
}

