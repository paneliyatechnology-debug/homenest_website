export interface BankDetails {
  pg_upi_id: string | null;
  pg_bank_name: string | null;
  pg_account_number: string | null;
  pg_ifsc_code: string | null;
  pg_account_holder_name: string | null;
}

export interface PGDetails {
  id: number;
  name: string;
  type: string;
  phone: string;
  email: string;
  address: string;
  city: string | null;
  state: string | null;
  pincode: string | null;
  total_rooms: number;
  total_beds: number;
  amenities: string[];
  rules: string;
  status: string;
  logo: string | null;
  logo_url: string | null;
  pg_upi_id: string | null;
  pg_bank_name: string | null;
  pg_account_number: string | null;
  pg_ifsc_code: string | null;
  pg_account_holder_name: string | null;
  bank_details: BankDetails;
  active_residents_count: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  gender: string;
  address: string;
  city: string | null;
  state: string | null;
  pincode: string | null;
  date_of_birth: string | null;
  age: number | null;
  dob_display: string | null;
  nationality: string;
  marital_status: string;
  occupation: string | null;
  profile_photo: string | null;
  profile_photo_url: string | null;
  status: string;
  role: string;
  created_at: string;
  updated_at: string;
  pg?: PGDetails | null;
}

export interface AuthData {
  user: User;
  access_token: string;
  refresh_token: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

export type AuthResponse = ApiResponse<AuthData>;

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordData {
  email: string;
  message: string;
  expires_in: string;
  reset_token: string;
  reset_url: string;
}

export type ForgotPasswordResponse = ApiResponse<ForgotPasswordData>;

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export type ResetPasswordResponse = ApiResponse<null>;

