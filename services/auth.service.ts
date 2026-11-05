import { apiClient } from '@/lib/api-client';
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
      });
    } catch (err) {
      console.warn('Backend logout API request failed or unreachable:', err);
    } finally {
      clearAuthCookies();
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
   * GET /auth/me
   */
  async getMe(): Promise<User> {
    const response = await apiClient<{
      success: boolean;
      message: string;
      data: User;
    }>('/auth/me');

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
};
