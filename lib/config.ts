/**
 * Application Configuration and Environment Variables
 * Centralizes environment access to ensure strict typing and single source of truth.
 */

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:5000/api/v1';
const appName = process.env.NEXT_PUBLIC_APP_NAME;
const appUrl = process.env.NEXT_PUBLIC_APP_URL;

export const config = {
  api: {
    baseUrl: apiBaseUrl,
  },
  app: {
    name: appName,
    url: appUrl,
  },
  isProduction: process.env.NODE_ENV === 'production',
} as const;

