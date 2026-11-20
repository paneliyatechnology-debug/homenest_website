export type PaymentType =
  | 'rent'
  | 'maintenance'
  | 'security_deposit'
  | 'electricity'
  | 'other'
  | 'laundry';

export type PaymentStatus =
  | 'paid'
  | 'pending'
  | 'overdue'
  | 'refunded'
  | 'failed';

export type PaymentMethod =
  | 'upi'
  | 'card'
  | 'net_banking'
  | 'wallet'
  | 'bank_transfer'
  | 'cash';

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  rent: 'Rent',
  maintenance: 'Maintenance',
  security_deposit: 'Security Deposit',
  electricity: 'Electricity',
  other: 'Other',
  laundry: 'Laundry',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  paid: 'Paid',
  pending: 'Pending',
  overdue: 'Overdue',
  refunded: 'Refunded',
  failed: 'Failed',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  upi: 'UPI',
  card: 'Card',
  net_banking: 'Net Banking',
  wallet: 'Wallet',
  bank_transfer: 'Bank Transfer',
  cash: 'Cash',
};

export function formatPaymentType(type?: string | null): string {
  if (!type) return '—';
  const norm = type.toLowerCase().trim() as PaymentType;
  if (PAYMENT_TYPE_LABELS[norm]) {
    return PAYMENT_TYPE_LABELS[norm];
  }
  return type
    .replace(/_/g, ' ')
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function formatPaymentStatus(status?: string | null): string {
  if (!status) return '—';
  const norm = status.toLowerCase().trim() as PaymentStatus;
  if (PAYMENT_STATUS_LABELS[norm]) {
    return PAYMENT_STATUS_LABELS[norm];
  }
  if (String(status).toLowerCase() === 'completed') return 'Paid';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function formatPaymentMethod(method?: string | null): string {
  if (!method) return '—';
  const norm = method.toLowerCase().trim() as PaymentMethod;
  if (PAYMENT_METHOD_LABELS[norm]) {
    return PAYMENT_METHOD_LABELS[norm];
  }
  return method
    .replace(/_/g, ' ')
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function formatCurrency(amount?: number | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹ 0';
  return '₹ ' + Number(amount).toLocaleString('en-IN');
}

export interface PaymentResident {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  profile_photo_url?: string | null;
}

export interface PaymentBillingPeriod {
  start?: string | null;
  end?: string | null;
}

export interface PaymentBreakdown {
  rent?: number;
  deposit?: number;
  security_deposit?: number;
  maintenance?: number;
  electricity?: number;
  laundry?: number;
  other?: number;
}

export interface PaymentRecord {
  id: number;
  transaction_id: string | null;
  receipt_no: string | null;
  title: string;
  payment_type: PaymentType | string;
  status: PaymentStatus | string;
  amount: number;
  paid_amount: number;
  due_date: string;
  paid_at?: string | null;
  payment_method?: PaymentMethod | string | null;
  payment_method_details?: unknown;
  image?: string | null;
  image_url?: string | null;
  upi_id?: string | null;
  upi_ref_no?: string | null;
  refund?: unknown | null;
  resident?: PaymentResident;
  stay_id?: number | null;
  bed_number?: string | null;
  room_id?: number | null;
  branch_id?: number | null;
  branch_name?: string | null;
  pg_name?: string | null;
  pg_id?: number | null;
  room_no?: string | null;
  room_type?: string | null;
  building_name?: string | null;
  floor_name?: string | null;
  floor_number?: number | null;
  billing_period?: PaymentBillingPeriod | null;
  breakdown?: PaymentBreakdown | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentStats {
  total_revenue: number;
  total_transactions: number;
  collected: number;
  collected_percentage: number;
  pending_dues: number;
  pending_percentage: number;
  overdue: number;
  overdue_percentage: number;
  total_pending: number;
  total_refunded: number;
}

export interface PaymentMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  total_records?: number;
}

export interface PaymentFilterParams {
  page?: number;
  limit?: number;
  status?: PaymentStatus | 'all' | string;
  tab?: string;
  resident_id?: number | string;
  room_type?: string;
  payment_type?: PaymentType | 'all' | string;
  payment_method?: PaymentMethod | 'all' | string;
  start_date?: string;
  end_date?: string;
  date_by?: 'due_date' | 'created_at' | 'paid_at';
  search?: string;
  branch_id?: number | string;
}

export interface PaymentExportParams extends Omit<PaymentFilterParams, 'page' | 'limit'> {
  format?: 'xlsx' | 'csv' | 'pdf';
}

export interface PaymentExportResult {
  file_url: string;
  file_path?: string;
  filename: string;
  format: string;
  total_records?: number;
  total_amount?: number;
  total_paid?: number;
  total_due?: number;
}

export interface PaymentCreatePayload {
  resident_id: number;
  pg_id?: number;
  branch_id?: number;
  stay_id?: number;
  room_id?: number;
  title: string;
  payment_type: PaymentType | string;
  billing_period_start?: string;
  billing_period_end?: string;
  due_date: string;
  rent_amount?: number;
  deposit_amount?: number;
  maintenance_amount?: number;
  electricity_amount?: number;
  other_amount?: number;
  amount: number;
  notes?: string;
}

export interface PaymentUpdatePayload {
  title?: string;
  payment_type?: PaymentType | string;
  billing_period_start?: string;
  billing_period_end?: string;
  due_date?: string;
  rent_amount?: number;
  deposit_amount?: number;
  maintenance_amount?: number;
  electricity_amount?: number;
  other_amount?: number;
  amount?: number;
  notes?: string;
  status?: PaymentStatus | string;
  paid_amount?: number;
  paid_at?: string | null;
  payment_method?: PaymentMethod | string | null;
  breakdown?: PaymentBreakdown;
}

export interface PaymentCollectPayload {
  payment_method: PaymentMethod | string;
  payment_method_details?: string;
  upi_ref_no?: string;
  note?: string;
  notes?: string;
  image?: File | null | string;
}

export interface UpdatePaymentStatusPayload {
  status: PaymentStatus | string;
  paid_amount?: number;
}
