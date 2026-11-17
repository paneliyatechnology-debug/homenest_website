export type LaundryStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export type LaundryTab = 'all' | 'service' | 'laundry' | 'billing';

export interface LaundryCatalogItem {
  name: string;
  rate: number;
}

export interface LaundryOrderItem {
  name: string;
  rate: number;
  quantity: number;
  total?: number;
}

export interface LaundryCatalog {
  pg_id?: number;
  branch_id?: number | null;
  scope?: string;
  pickup_time_slot?: string;
  service_types?: string[];
  items: LaundryCatalogItem[];
  important_notes?: string[];
}

export interface LaundryStats {
  pg_id?: number;
  branch_id?: number | null;
  total_requests: number;
  total: number;
  in_progress: number;
  pending: number;
  completed: number;
  cancelled: number;
}

export interface LaundryResidentInfo {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  profile_photo?: string | null;
  photo_url?: string | null;
  status?: string;
  stay_id?: number;
  branch_id?: number;
  branch_name?: string;
  room?: {
    id: number;
    room_no: string;
    room_type?: string;
    bed_number?: string;
  } | null;
}

export interface LaundryStaffInfo {
  id: number;
  name: string;
  phone?: string;
  role?: string | null;
}

export interface LaundryRequest {
  id: number;
  request_number: string;
  pg_id: number;
  branch_id: number;
  branch_name: string;
  request_type: string;
  service_subtype?: string;
  request_detail?: string;
  items?: LaundryOrderItem[];
  total_items_count: number;
  total_amount: number;
  pickup_date: string;
  pickup_time?: string;
  pickup_schedule: string;
  special_instructions?: string | null;
  status: LaundryStatus | string;
  is_billed?: boolean;
  payment_id?: number | null;
  resident: LaundryResidentInfo;
  room?: {
    id: number;
    room_no: string;
    room_type?: string;
  } | null;
  assigned_staff?: LaundryStaffInfo | null;
  assigned_name: string;
  admin_notes?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LaundryPaginationMeta {
  page: number;
  limit: number;
  total_pages: number;
  total: number;
  total_records?: number;
  has_next?: boolean;
  has_prev?: boolean;
  overview?: LaundryUsersOverview;
}

export interface LaundryQueryParams {
  page?: number;
  limit?: number;
  branch_id?: number | string;
  tab?: string;
  status?: string;
  type?: string;
  request_type?: string;
  search?: string;
}

export interface CreateLaundryPayload {
  resident_id: number;
  request_type?: string;
  service_subtype?: string;
  pickup_date: string;
  pickup_time?: string;
  items?: LaundryOrderItem[];
  special_instructions?: string;
  assigned_to?: number;
  status?: LaundryStatus | string;
}

export interface UpdateLaundryStatusPayload {
  status: LaundryStatus | string;
  admin_notes?: string;
}

export interface UpdateLaundryCatalogPayload {
  branch_id?: number | null;
  apply_to_all_branches?: boolean;
  pickup_time_slot?: string;
  service_types?: string[];
  items: LaundryCatalogItem[];
  important_notes?: string[];
}

export interface LaundryUsersOverview {
  total_residents: number;
  residents_with_laundry: number;
  residents_with_unbilled: number;
  total_unbilled_amount: number;
  total_due_amount: number;
}

export interface LaundryUserResident {
  resident: LaundryResidentInfo;
  laundry_summary: {
    total_orders: number;
    total_items_cleaned: number;
    total_charges: number;
    unbilled_orders_count: number;
    unbilled_amount: number;
    billed_amount: number;
    active_orders_count: number;
    completed_orders_count: number;
  };
  payment_summary: {
    total_paid: number;
    total_due: number;
    payment_status: 'paid' | 'pending' | 'no_orders' | string;
  };
  last_order: {
    id: number;
    request_number: string;
    request_detail: string;
    pickup_schedule: string;
    total_amount: number;
    status: LaundryStatus | string;
    is_billed: boolean;
    created_at: string;
  } | null;
}

export interface LaundryPaymentEntry {
  resident_id: number;
  amount?: number;
  laundry_request_ids?: number[];
}

export interface CreateLaundryPaymentPayload {
  title?: string;
  due_date?: string;
  notes?: string;
  resident_id?: number;
  amount?: number;
  laundry_request_ids?: number[];
  entries?: LaundryPaymentEntry[];
}

export interface ResidentLaundryBilling {
  resident: LaundryResidentInfo;
  summary: {
    total_orders: number;
    total_amount_incurred: number;
    unbilled_orders_count: number;
    unbilled_amount: number;
    billed_orders_count: number;
    billed_amount: number;
    total_paid: number;
    total_due: number;
  };
  laundry_requests: LaundryRequest[];
  payment_entries: Array<{
    id: number;
    receipt_no: string;
    transaction_id: string;
    title: string;
    amount: number;
    paid_amount: number;
    due_amount: number;
    payment_method: string;
    status: string;
    due_date?: string;
    paid_at?: string;
    notes?: string;
    created_at: string;
  }>;
}

export const INITIAL_LAUNDRY_STATS: LaundryStats = {
  total_requests: 0,
  total: 0,
  in_progress: 0,
  pending: 0,
  completed: 0,
  cancelled: 0,
};

export const DEFAULT_LAUNDRY_META: LaundryPaginationMeta = {
  page: 1,
  limit: 10,
  total_pages: 1,
  total: 0,
  total_records: 0,
  has_next: false,
  has_prev: false,
};
