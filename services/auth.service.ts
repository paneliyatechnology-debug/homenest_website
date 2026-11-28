import { apiClient, invalidateApiCache } from '@/lib/api-client';
import {
  ApiResponse,
  AuthResponse,
  LoginCredentials,
  RefreshTokenRequest,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  User,
  PGDetails,
  UpdatePgProfilePayload,
} from '@/types/auth';
import {
  setAuthCookies,
  clearAuthCookies,
  getUser,
  setUserCookie,
  getAccessToken,
} from '@/lib/cookies';

export const authService = {
  /**
   * Log in user and persist tokens into secure cookies
   */
  async login(
    credentials: LoginCredentials,
    rememberMe = true
  ): Promise<AuthResponse> {
    const response = await apiClient<AuthResponse>('/auth/login', {
      method: 'POST',
      skipAuth: true,
      showSuccessToast: false,
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data) {
      const userRole = (
        response.data.user?.role ||
        (response.data as unknown as { role?: string }).role ||
        ''
      ).toLowerCase();

      // Only store session tokens if role is admin
      if (userRole === 'admin') {
        setAuthCookies(response.data, rememberMe);
      } else {
        clearAuthCookies();
      }
    }

    return response;
  },

  /**
   * Refresh access token using stored refresh token
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const body: RefreshTokenRequest = { refresh_token: refreshToken };
    const response = await apiClient<AuthResponse>('/auth/refresh', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify(body),
    });

    if (response.success && response.data) {
      setAuthCookies(response.data);
    }

    return response;
  },

  /**
   * Request password reset link for the given email
   */
  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    const body: ForgotPasswordRequest = { email };
    return apiClient<ForgotPasswordResponse>('/auth/forgot-password', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify(body),
    });
  },

  /**
   * Reset user password using token
   */
  async resetPassword(
    payload: ResetPasswordRequest
  ): Promise<ResetPasswordResponse> {
    return apiClient<ResetPasswordResponse>('/auth/reset-password', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify(payload),
    });
  },

  /**
   * Log out user: notifies backend API endpoint (POST /auth/logout),
   * clears local auth cookies, and redirects to login page.
   *
   * Endpoint: POST /auth/logout
   * Header: Accept: application/json
   * Header: Authorization: Bearer <access_token> (auto-attached by apiClient)
   */
  async logout(redirectUrl = '/'): Promise<void> {
    try {
      await apiClient<ApiResponse<null>>('/auth/logout', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        showSuccessToast: false,
        showErrorToast: false,
      });
    } catch (err) {
      console.warn('Backend logout API request failed or unreachable:', err);
    } finally {
      clearAuthCookies();
      invalidateApiCache('/auth');
      if (typeof window !== 'undefined') {
        window.location.replace(new URL(redirectUrl, window.location.origin).href);
      }
    }
  },

  /**
   * Retrieve current stored user
   */
  getCurrentUser(): User | null {
    return getUser();
  },

  /**
   * Fetch live authenticated user profile from backend API:
   * GET /auth/me (cached for 30s; pass forceRefresh=true to bypass)
   */
  async getMe(forceRefresh = false): Promise<User> {
    const response = await apiClient<{
      success: boolean;
      message: string;
      data: User;
    }>('/auth/me', {
      cacheTtlMs: 30_000,
      skipCache: forceRefresh,
    });

    if (response.success && response.data) {
      setUserCookie(response.data);
      return response.data;
    }
    throw new Error(response.message || 'Failed to fetch user profile');
  },

  /**
   * Check if user is currently authenticated
   */
  isAuthenticated(): boolean {
    return !!getAccessToken();
  },

  /**
   * PUT /auth/update-pg
   * Update Owner and PG Facility Profile (multipart/form-data or JSON)
   */
  async updatePgProfile(payload: FormData | UpdatePgProfilePayload): Promise<PGDetails> {
    const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData;
    const response = await apiClient<{
      success: boolean;
      message: string;
      data: PGDetails;
    }>('/auth/update-pg', {
      method: 'PUT',
      body: isFormData ? payload : JSON.stringify(payload),
    });
    invalidateApiCache('/auth');
    return response.data;
  },
};
