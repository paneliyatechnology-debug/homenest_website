// Status values as returned by the backend API
export type AgreementStatus = 'signed' | 'pending' | 'pending_sign' | 'draft' | 'expired';

// Exact shape of one agreement record from GET /agreements
export interface AgreementRecord {
  id: number;
  agreement_no: string;
  resident_id: number;
  resident_name: string;
  resident_email?: string;
  resident_phone?: string;
  pg_id?: number;
  branch_id?: number | null;
  pg_name?: string;
  owner_id?: number;
  room_id?: number;
  room_number?: string;    // backend uses room_number, not room_no
  room_type?: string;
  agreement_type: string;
  start_date: string;      // returned as "DD-MM-YYYY HH:mm"
  end_date: string;
  status: AgreementStatus;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  // UI-only computed field for the table
  sr_no?: number;
}

// Exact shape of GET /agreements/stats data
export interface AgreementStats {
  total_agreements: number;
  total: number;
  draft: number;
  pending_sign: number;
  pending: number;
  signed: number;
  expired: number;
}

// Query params for GET /agreements
export interface AgreementFilterParams {
  branch_id?: number | null;
  resident_id?: number | null;
  pg_id?: number | null;
  agreement_type?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// POST /agreements request body
export interface CreateAgreementInput {
  resident_id: number | string;
  agreement_no: string;
  agreement_type: string;
  start_date: string;      // YYYY-MM-DD
  end_date: string;        // YYYY-MM-DD
  branch_id: number | string;
  room_id: number | string;
  room_type: string;
  status: AgreementStatus;
  pg_id?: number | string;
}

// PUT /agreements/:id request body
export interface UpdateAgreementInput {
  status?: AgreementStatus;
  agreement_type?: string;
  end_date?: string;       // YYYY-MM-DD
  start_date?: string;     // YYYY-MM-DD
}

export interface AgreementMeta {
  page: number;
  limit: number;
  total_pages: number;
  total: number;
}

// API response shapes
export interface AgreementsApiResponse {
  success?: boolean;
  message?: string;
  data?: AgreementRecord[];
  meta?: AgreementMeta;
}

export interface AgreementDetailApiResponse {
  success?: boolean;
  message?: string;
  data?: AgreementRecord;
  id?: number;
}

export interface CreateAgreementResponse {
  success?: boolean;
  message?: string;
  id?: number;
  data?: AgreementRecord;
}

export interface AgreementStatsApiResponse {
  success?: boolean;
  message?: string;
  data?: AgreementStats;
}
