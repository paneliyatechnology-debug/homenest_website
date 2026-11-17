export type CheckoutTab = 'all' | 'pending' | 'approved' | 'rejected';

export type CheckoutStatus =
  | 'pending'
  | 'under_review'
  | 'in_progress'
  | 'approved'
  | 'rejected'
  | 'completed';

export interface CheckoutResidentInfo {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  profile_photo?: string | null;
  photo_url?: string | null;
}

export interface CheckoutRoomInfo {
  id: number;
  room_no: string;
  room_type?: string;
  bed_number?: string;
  bed_no?: string;
  building_name?: string;
  floor_name?: string;
}

export interface CheckoutBranchInfo {
  id: number;
  name: string;
}

export interface CheckoutListItem {
  sr_no?: number;
  id: number;
  resident: CheckoutResidentInfo;
  building_name?: string;
  floor_name?: string;
  room: CheckoutRoomInfo;
  branch: CheckoutBranchInfo;
  check_out_date: string;
  dues: number;
  deposit: number;
  refund: number;
  status: string;
  step?: string;
  created_at: string;
}

export interface CheckoutSummaryMeta {
  all: number;
  pending: number;
  in_progress: number;
  approved: number;
  rejected: number;
}

export interface CheckoutPaginationMeta {
  page?: number;
  limit?: number;
  total_records: number;
  total_pages?: number;
  has_next?: boolean;
  has_prev?: boolean;
  summary?: CheckoutSummaryMeta;
}

export interface DueBreakdownItem {
  id: number;
  title: string;
  payment_type: string;
  amount: number;
  due_date: string;
}

export interface CheckoutFinancials {
  dues_amount: number;
  deposit_amount: number;
  estimated_refund: number;
  refund_amount: number;
  display_refund: number;
  dues_breakdown: DueBreakdownItem[];
}

export interface ClearanceChecklist {
  room_inspection: boolean;
  return_room_key: boolean;
  no_pending_dues: boolean;
}

export interface CheckoutTimelineStep {
  step: number;
  title: string;
  status: 'completed' | 'current' | 'pending' | string;
  timestamp: string;
}

export interface CheckoutReviewInfo {
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  admin_notes?: string | null;
  completed_at?: string | null;
}

export interface CheckoutDetails {
  id: number;
  resident: CheckoutResidentInfo;
  stay: {
    id: number;
    branch_id: number;
    branch_name: string;
    room_id: number;
    room_no: string;
    room_type: string;
    bed_no?: string;
    check_in_date: string;
  };
  departure_date: string;
  departure_date_raw?: string;
  reason?: string;
  additional_notes?: string;
  financials: CheckoutFinancials;
  status: string;
  clearance_checklist: ClearanceChecklist;
  timeline: CheckoutTimelineStep[];
  estimated_refund_card?: {
    amount: number;
    note?: string;
  };
  review_info: CheckoutReviewInfo;
  created_at: string;
  updated_at: string;
}

export interface UpdateCheckoutStatusPayload {
  status: 'pending' | 'under_review' | 'in_progress' | 'approved' | 'rejected' | 'completed';
  clearance_room_inspected?: boolean;
  clearance_key_returned?: boolean;
  clearance_dues_cleared?: boolean;
  noc_issued?: boolean;
  refund_amount?: number;
  refund_processed?: boolean;
  admin_notes?: string;
}

export interface CheckoutQueryParams {
  branch_id?: number | string;
  status?: string;
  search?: string;
  start_date?: string;
  end_date?: string;
  date_by?: string;
  page?: number;
  limit?: number;
}

export interface CheckoutExportResult {
  format: string;
  file_url: string;
  filename: string;
  file_path?: string;
  total_records?: number;
  total_dues?: number;
  total_deposits?: number;
  total_refunds?: number;
}
