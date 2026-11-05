import { AuthResponse } from '@/types/auth';
import {
  getAccessToken,
  getRefreshToken,
  setAuthCookies,
  clearAuthCookies,
} from '@/lib/cookies';
import { config } from '@/lib/config';

const API_BASE_URL = config.api.baseUrl;

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

function redirectToLogin(): void {
  if (typeof window !== 'undefined' && window.location.pathname !== '/') {
    window.location.replace(new URL('/?toast=session_expired', window.location.origin).href);
  }
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
  _retry?: boolean;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { skipAuth = false, _retry = false, ...fetchOptions } = options;
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const headers = new Headers(fetchOptions.headers || {});
  if (!headers.has('Content-Type') && !(fetchOptions.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  // Attach access token if auth is not skipped
  if (!skipAuth) {
    const token = getAccessToken();
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    // Handle 401 Unauthorized - Attempt Token Refresh
    if (response.status === 401 && !skipAuth && !_retry) {
      const refreshToken = getRefreshToken();

      // No refresh token available -> session expired
      if (!refreshToken) {
        clearAuthCookies();
        redirectToLogin();
        throw new ApiError('Session expired. Please log in again.', 401);
      }

      // If already refreshing, wait for new token
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((newToken) => {
          headers.set('Authorization', `Bearer ${newToken}`);
          return apiClient<T>(endpoint, {
            ...options,
            _retry: true,
            headers,
          });
        });
      }

      isRefreshing = true;

      try {
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (!refreshResponse.ok) {
          throw new Error('Refresh token invalid or expired');
        }

        const refreshResult = (await refreshResponse.json()) as AuthResponse;

        if (!refreshResult.success || !refreshResult.data?.access_token) {
          throw new Error(refreshResult.message || 'Token refresh failed');
        }

        // Store refreshed tokens
        setAuthCookies(refreshResult.data);

        const newAccessToken = refreshResult.data.access_token;
        processQueue(null, newAccessToken);

        // Retry original request with new access token
        headers.set('Authorization', `Bearer ${newAccessToken}`);
        return apiClient<T>(endpoint, {
          ...options,
          _retry: true,
          headers,
        });
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        clearAuthCookies();
        redirectToLogin();
        throw new ApiError('Session expired. Please log in again.', 401, refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data?.message || `Request failed with status ${response.status}`,
        response.status,
        data
      );
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'Network error occurred',
      0
    );
  }
}
