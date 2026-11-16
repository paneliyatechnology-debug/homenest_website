export type StaffStatus = 'active' | 'on_leave' | 'inactive';

export type StaffRole =
  | 'BRANCH_MANAGER'
  | 'KITCHEN_STAFF'
  | 'HOUSEKEEPING'
  | 'SECURITY_GUARD'
  | 'ACCOUNTANT'
  | 'WARDEN'
  | 'MAINTENANCE'
  | string;

export interface StaffBranch {
  id: number;
  name: string;
}

export interface StaffMember {
  id: number;
  name: string;
  role: string;
  staff_role: string;
  email: string;
  phone: string;
  status: StaffStatus | string;
  profile_photo?: string | null;
  profile_photo_url?: string | null;
  photo?: string | null;
  photo_url?: string | null;
  branches?: StaffBranch[];
  branch_names?: string;
  branch_name?: string;
  created_at?: string;
  updated_at?: string;
  call_action?: string;
  message_action?: string;
}

export interface StaffStats {
  pg_id?: number;
  branch_id?: number | null;
  total_staff: number;
  total: number;
  active: number;
  on_leave: number;
  inactive: number;
  roles?: Record<string, number>;
}

export interface StaffMeta {
  page: number;
  limit: number;
  total_pages: number;
  total: number;
  branch?: {
    id: number;
    name: string;
    location?: string;
  } | null;
}

export interface StaffFilterParams {
  branch_id?: number | string | null;
  staff_role?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateStaffInput {
  name: string;
  staff_role: string;
  branch_ids: number[];
  email: string;
  phone: string;
  status: StaffStatus;
  profile_photo?: File | null;
}

export interface UpdateStaffInput {
  name: string;
  staff_role: string;
  branch_ids: number[];
  phone: string;
  status: StaffStatus;
  profile_photo?: File | null;
  remove_photo?: boolean;
}

