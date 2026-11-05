import { ApiResponse } from './auth';
import { Branch, BranchMeta } from './branch';

export type { Branch, BranchMeta };

export interface Resident {
  id: number;
  name: string;
  email: string;
  phone: string;
  gender: string;
  status: 'active' | 'pending' | 'inactive' | string;
  profile_photo_url?: string | null;
  room_no?: string | null;
  room_type?: string | null;
  building_name?: string | null;
  floor_name?: string | null;
  room_id?: number | null;
  floor_id?: number | null;
  floor_number?: number | null;
  bed_number?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  role: string;
  building_id?: number | null;
  subscription_plan?: unknown | null;
}

export interface ResidentMeta {
  page: number;
  limit: number;
  total_pages: number;
  total: number;
}

export type ResidentsApiResponse = ApiResponse<Resident[]> & {
  meta?: ResidentMeta;
};

export interface ResidentQueryParams {
  page?: number;
  limit?: number;
  role?: string;
  status?: string;
  search?: string;
  branch_id?: number | string | null;
}

// Branch and BranchMeta re-exported from @/types/branch

export type BranchesApiResponse = ApiResponse<Branch[]> & {
  meta?: BranchMeta;
};

export interface Building {
  id: number;
  name?: string;
  building_name?: string;
  branch_id?: number;
  total_floors?: number;
  status?: string;
}

export interface Floor {
  id: number;
  name?: string;
  floor_name?: string;
  floor_number?: number;
  building_id?: number;
  status?: string;
}

export interface RoomOption {
  id: number;
  room_no?: string;
  room_number?: string;
  name?: string;
  room_type?: string;
  type?: string;
  monthly_rent?: number;
  rent?: number;
  security_deposit?: number;
  building_id?: number;
  floor_id?: number;
  branch_id?: number;
  status?: string;
}

export interface ResidentStats {
  total: number;
  total_residents: number;
  active: number;
  pending: number;
  inactive: number;
  active_residents: number;
  pending_residents: number;
  inactive_residents: number;
  filtered_total: number;
}

export type ResidentStatsApiResponse = ApiResponse<ResidentStats>;

export interface ResidentPersonalInfo {
  name: string;
  date_of_birth?: string;
  age?: number;
  dob_display?: string;
  gender?: string;
  nationality?: string;
  marital_status?: string;
  occupation?: string;
}

export interface ResidentContactInfo {
  phone?: string;
  email?: string;
  address?: string;
  address_line_1?: string;
  city?: string;
  state?: string;
  pincode?: string;
  location_display?: string;
  emergency_contact_name?: string;
  emergency_contact_relationship?: string;
  emergency_contact_phone?: string;
  emergency_contact_display?: string;
}

export interface ResidentRoomInfo {
  room_id?: number;
  room_no?: string;
  room_type?: string;
  room_capacity?: number;
  room_size?: string;
  room_status?: string;
  room_image_url?: string | null;
  building_id?: number;
  building_name?: string;
  floor_id?: number;
  floor_number?: number;
  floor_name?: string;
  bed_number?: string;
  monthly_rent?: number;
  security_deposit?: number;
  check_in_date?: string;
  check_out_date?: string | null;
  current_status?: string;
  stay_notes?: string;
  pg_id?: number;
  pg_name?: string;
  branch_id?: number;
  branch_name?: string;
}

export interface ResidentDocuments {
  aadhar_card?: string | null;
  aadhar_card_url?: string | null;
  address_proof?: string | null;
  address_proof_url?: string | null;
  education_certificate?: string | null;
  education_certificate_url?: string | null;
  signature?: string | null;
  signature_url?: string | null;
  terms_accepted?: boolean;
  terms_accepted_at?: string | null;
}

export interface ResidentPaymentInfo {
  payment_id?: number;
  title?: string;
  due_amount?: number;
  paid_amount?: number;
  status?: string;
  due_date?: string;
  billing_period?: {
    start?: string | null;
    end?: string | null;
  };
  breakdown?: {
    rent?: number;
    deposit?: number;
    security_deposit?: number;
    maintenance?: number;
    electricity?: number;
    other?: number;
    total?: number;
  };
}

export interface ResidentDetail {
  id: number;
  name: string;
  email: string;
  phone: string;
  gender: string;
  profile_photo?: string | null;
  profile_photo_url?: string | null;
  status: string;
  role: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  personal_info?: ResidentPersonalInfo;
  contact_info?: ResidentContactInfo;
  room_info?: ResidentRoomInfo;
  documents?: ResidentDocuments;
  agreements?: unknown[];
  due_amount?: number;
  payment_info?: ResidentPaymentInfo;
  subscription_plan?: unknown | null;
}

export type ResidentDetailApiResponse = ApiResponse<ResidentDetail>;


