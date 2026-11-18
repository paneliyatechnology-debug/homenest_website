/**
 * Application Configuration and Environment Variables
 * Centralizes environment access to ensure strict typing and single source of truth.
 */

const rawBackendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || '').trim();

// Resolve API base URL for network calls (e.g. http://localhost:5000/api/v1)
const apiBaseUrl = rawBackendUrl
  ? rawBackendUrl.replace(/\/+$/, '').endsWith('/api/v1')
    ? rawBackendUrl.replace(/\/+$/, '')
    : `${rawBackendUrl.replace(/\/+$/, '')}/api/v1`
  : '';

// Root backend host (e.g. http://localhost:5000) for static assets, uploads, and receipts
const backendUrl = rawBackendUrl
  ? rawBackendUrl.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '')
  : '';

const appName = process.env.NEXT_PUBLIC_APP_NAME;

export const config = {
  backendUrl,
  api: {
    baseUrl: apiBaseUrl,
  },
  app: {
    name: appName,
  },
  isProduction: process.env.NODE_ENV === 'production',
} as const;
