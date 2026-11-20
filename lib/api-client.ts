import { AuthResponse } from '@/types/auth';
import {
  getAccessToken,
  getRefreshToken,
  setAuthCookies,
  clearAuthCookies,
} from '@/lib/cookies';
import { config } from '@/lib/config';
import { toast } from '@/lib/toast';

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

export interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
  _retry?: boolean;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

/**
 * Standardized backend error message extractor across all HTTP status codes.
 * Prioritizes the first specific validation/field error from an `errors` or `error` array/object,
 * before falling back to the generic top-level message (e.g. "Validation failed"),
 * and finally to HTTP status code descriptions.
 */
export function extractErrorMessage(data: unknown, status: number): string {
  if (typeof data === 'string' && data.trim()) {
    // If backend returned plain text string error (and not full HTML page)
    if (!data.trim().startsWith('<')) {
      return data.trim();
    }
  }

  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;

    // 1. Validation errors array or object: [{ field, message }] or ['error message'] or { field: '...' }
    // Prioritize specific validation errors over top-level generic messages (e.g., "Validation failed")
    const rawErrors = obj.errors ?? (Array.isArray(obj.error) ? obj.error : undefined);

    if (Array.isArray(rawErrors) && rawErrors.length > 0) {
      const msgs = rawErrors
        .map((e) => {
          if (typeof e === 'string' && e.trim()) return e.trim();
          if (e && typeof e === 'object') {
            const eo = e as Record<string, unknown>;
            if (typeof eo.message === 'string' && eo.message.trim()) return eo.message.trim();
            if (typeof eo.msg === 'string' && eo.msg.trim()) return eo.msg.trim();
            if (typeof eo.error === 'string' && eo.error.trim()) return eo.error.trim();
            if (typeof eo.detail === 'string' && eo.detail.trim()) return eo.detail.trim();
          }
          return null;
        })
        .filter((v): v is string => Boolean(v));

      if (msgs.length > 0) {
        // Display the first specific error
        return msgs[0];
      }
    } else if (rawErrors && typeof rawErrors === 'object') {
      const msgs = Object.values(rawErrors)
        .flatMap((v) => {
          if (typeof v === 'string' && v.trim()) return [v.trim()];
          if (Array.isArray(v)) {
            return v
              .map((item) => {
                if (typeof item === 'string' && item.trim()) return item.trim();
                if (item && typeof item === 'object') {
                  const itemObj = item as Record<string, unknown>;
                  if (typeof itemObj.message === 'string' && itemObj.message.trim()) return itemObj.message.trim();
                  if (typeof itemObj.msg === 'string' && itemObj.msg.trim()) return itemObj.msg.trim();
                }
                return null;
              })
              .filter((item): item is string => Boolean(item));
          }
          return [];
        });

      if (msgs.length > 0) {
        // Display the first specific error
        return msgs[0];
      }
    }

    // 2. Direct message field from API
    if (typeof obj.message === 'string' && obj.message.trim()) {
      return obj.message.trim();
    }

    // 3. Direct error field (string or object with message)
    if (typeof obj.error === 'string' && obj.error.trim()) {
      return obj.error.trim();
    }
    if (obj.error && typeof obj.error === 'object') {
      const errObj = obj.error as Record<string, unknown>;
      if (typeof errObj.message === 'string' && errObj.message.trim()) {
        return errObj.message.trim();
      }
      if (typeof errObj.msg === 'string' && errObj.msg.trim()) {
        return errObj.msg.trim();
      }
    }

    // 4. Detail field
    if (typeof obj.detail === 'string' && obj.detail.trim()) {
      return obj.detail.trim();
    }
  }

  // 5. Centralized HTTP status code fallback messages
  switch (status) {
    case 400:
      return 'Bad request. Please verify your input.';
    case 401:
      return 'Unauthorized. Please log in to continue.';
    case 403:
      return 'Access denied. You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 409:
      return 'A conflict occurred with existing records.';
    case 422:
      return 'Validation failed. Please correct the highlighted fields.';
    case 500:
      return 'Internal server error. Please try again later.';
    case 502:
    case 503:
    case 504:
      return 'Service temporarily unavailable. Please try again in a few moments.';
    default:
      if (status > 0) {
        return `Request failed with status ${status}.`;
      }
      return 'Unable to reach backend server. Please verify your network connection.';
  }
}

/**
 * Standardized backend success message extractor
 */
export function extractSuccessMessage(data: unknown): string | null {
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (typeof obj.message === 'string' && obj.message.trim()) {
      return obj.message.trim();
    }
    if (typeof obj.msg === 'string' && obj.msg.trim()) {
      return obj.msg.trim();
    }
    if (obj.data && typeof obj.data === 'object') {
      const dataObj = obj.data as Record<string, unknown>;
      if (typeof dataObj.message === 'string' && dataObj.message.trim()) {
        return dataObj.message.trim();
      }
      if (typeof dataObj.msg === 'string' && dataObj.msg.trim()) {
        return dataObj.msg.trim();
      }
    }
  }
  return null;
}

/**
 * Appropriate fallback success message when the API response does not provide one
 */
export function getDefaultSuccessMessage(method: string, endpoint: string): string {
  const upperMethod = method.toUpperCase();
  if (endpoint.includes('/export') || endpoint.includes('/receipt')) {
    return 'File downloaded successfully.';
  }
  switch (upperMethod) {
    case 'DELETE':
      return 'Record deleted successfully.';
    case 'POST':
      return 'Record created successfully.';
    case 'PUT':
    case 'PATCH':
      return 'Changes saved successfully.';
    default:
      return 'Operation completed successfully.';
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    skipAuth = false,
    _retry = false,
    showSuccessToast,
    showErrorToast = true,
    ...fetchOptions
  } = options;
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
        const msg = 'Session expired. Please log in again.';
        if (showErrorToast) {
          toast.error(msg);
        }
        throw new ApiError(msg, 401);
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
        const msg = 'Session expired. Please log in again.';
        if (showErrorToast) {
          toast.error(msg);
        }
        throw new ApiError(msg, 401, refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    // Parse response body (JSON or text)
    let data: unknown = null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch {
        data = null;
      }
    } else {
      try {
        data = await response.text();
      } catch {
        data = null;
      }
    }

    if (!response.ok) {
      const errorMessage = extractErrorMessage(data, response.status);
      if (showErrorToast) {
        toast.error(errorMessage);
      }
      throw new ApiError(errorMessage, response.status, data);
    }

    // Check for explicit success: false payload even on 200 OK
    if (data && typeof data === 'object' && (data as Record<string, unknown>).success === false) {
      const errorMessage = extractErrorMessage(data, response.status);
      if (showErrorToast) {
        toast.error(errorMessage);
      }
      throw new ApiError(errorMessage, response.status, data);
    }

    // Success Toast Notification handling:
    // Display backend response message for mutations (POST, PUT, PATCH, DELETE) or when explicitly requested
    const method = (fetchOptions.method || 'GET').toUpperCase();
    const isMutation = method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE';
    const isSilentEndpoint =
      endpoint.includes('/auth/refresh') ||
      endpoint.includes('/auth/me') ||
      endpoint.includes('/auth/logout');

    const shouldShowSuccess =
      showSuccessToast !== undefined ? showSuccessToast : isMutation && !isSilentEndpoint;

    if (shouldShowSuccess) {
      const backendSuccessMessage =
        extractSuccessMessage(data) || getDefaultSuccessMessage(method, endpoint);
      if (backendSuccessMessage) {
        toast.success(backendSuccessMessage);
      }
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    const networkMsg = extractErrorMessage(null, 0);
    if (showErrorToast) {
      toast.error(networkMsg);
    }
    throw new ApiError(networkMsg, 0, error);
  }
}
