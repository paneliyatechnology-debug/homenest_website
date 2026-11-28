import {
  getAccessToken,
  clearAuthCookies,
} from '@/lib/cookies';
import { config } from '@/lib/config';
import { toast } from '@/lib/toast';

const API_BASE_URL = config.api.baseUrl;

let isHandling401 = false;

function redirectToLogin(): void {
  if (typeof window !== 'undefined') {
    if (window.location.pathname !== '/') {
      window.location.replace(new URL('/?toast=session_expired', window.location.origin).href);
    } else {
      toast.warn('Your session has expired. Please sign in again.', 'Session Expired');
    }
    setTimeout(() => {
      isHandling401 = false;
    }, 2500);
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
  cacheTtlMs?: number;
  skipCache?: boolean;
}

// In-flight GET request deduplication: cacheKey -> Promise<unknown>
const inFlightRequests = new Map<string, Promise<unknown>>();

// In-memory cache for GET requests: cacheKey -> { data: unknown; expiresAt: number }
const apiCache = new Map<string, { data: unknown; expiresAt: number }>();

/**
 * Invalidate cached GET responses matching an endpoint prefix or pattern.
 */
export function invalidateApiCache(prefix?: string | RegExp): void {
  if (!prefix) {
    apiCache.clear();
    return;
  }
  for (const key of apiCache.keys()) {
    if (typeof prefix === 'string' ? key.includes(prefix) : prefix.test(key)) {
      apiCache.delete(key);
    }
  }
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
    cacheTtlMs,
    skipCache = false,
    ...fetchOptions
  } = options;

  const method = (fetchOptions.method || 'GET').toUpperCase();
  const isGet = method === 'GET';
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  const cacheKey = `${method}:${url}`;

  // 1. Check in-memory cache for GET requests
  if (isGet && !skipCache && cacheTtlMs && cacheTtlMs > 0) {
    const cached = apiCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data as T;
    }
  }

  // 2. Check in-flight duplicate GET requests
  if (isGet && !skipCache) {
    const existingPromise = inFlightRequests.get(cacheKey);
    if (existingPromise) {
      return existingPromise as Promise<T>;
    }
  }

  const executeRequest = async (): Promise<T> => {
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

      // Handle 401 Unauthorized: Auto logout, clear all token/auth cookies, and redirect to login
      if (response.status === 401 && !skipAuth) {
        clearAuthCookies();
        invalidateApiCache();

        if (!isHandling401) {
          isHandling401 = true;
          redirectToLogin();
        }

        const backendMsg = extractErrorMessage(data, response.status);
        const errorMessage = backendMsg || 'Session expired. Please log in again.';
        throw new ApiError(errorMessage, 401, data);
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
      const isMutation = method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE';
      const isSilentEndpoint =
        endpoint.includes('/auth/refresh') ||
        endpoint.includes('/auth/me') ||
        endpoint.includes('/auth/logout') ||
        endpoint.includes('/auth/login');

      const shouldShowSuccess =
        showSuccessToast !== undefined ? showSuccessToast : isMutation && !isSilentEndpoint;

      if (shouldShowSuccess) {
        const backendSuccessMessage =
          extractSuccessMessage(data) || getDefaultSuccessMessage(method, endpoint);
        if (backendSuccessMessage) {
          toast.success(backendSuccessMessage);
        }
      }

      // Save to cache on successful GET
      if (isGet && cacheTtlMs && cacheTtlMs > 0) {
        apiCache.set(cacheKey, { data, expiresAt: Date.now() + cacheTtlMs });
      } else if (!isGet) {
        // Invalidate relevant cache on mutations
        const resourceMatch = endpoint.match(/^\/([a-zA-Z0-9_-]+)/);
        if (resourceMatch) {
          invalidateApiCache(`/${resourceMatch[1]}`);
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
  };

  if (isGet && !skipCache) {
    const promise = executeRequest().finally(() => {
      inFlightRequests.delete(cacheKey);
    });
    inFlightRequests.set(cacheKey, promise);
    return promise;
  }

  return executeRequest();
}
