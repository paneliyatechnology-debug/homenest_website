import { AuthData, User } from '@/types/auth';

const ACCESS_TOKEN_KEY = 'homenest_access_token';
const REFRESH_TOKEN_KEY = 'homenest_refresh_token';
const USER_KEY = 'homenest_user';

export function setCookie(name: string, value: string, days = 7): void {
  if (typeof document === 'undefined') return;

  let expires = '';
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = `; expires=${date.toUTCString()}`;
  }

  const isSecure =
    typeof window !== 'undefined' && window.location.protocol === 'https:';
  const secureFlag = isSecure ? '; Secure' : '';

  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(
    value
  )}${expires}; path=/; SameSite=Lax${secureFlag}`;
}

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;

  const nameEQ = `${encodeURIComponent(name)}=`;
  const cookies = document.cookie.split(';');

  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i];
    while (cookie.charAt(0) === ' ') {
      cookie = cookie.substring(1, cookie.length);
    }
    if (cookie.indexOf(nameEQ) === 0) {
      return decodeURIComponent(cookie.substring(nameEQ.length, cookie.length));
    }
  }

  return null;
}

export function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${encodeURIComponent(
    name
  )}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
}

// Specialized helpers for Authentication
export function setAuthCookies(data: AuthData, rememberMe = true): void {
  const days = rememberMe ? 7 : 1;
  setCookie(ACCESS_TOKEN_KEY, data.access_token, days);
  setCookie(REFRESH_TOKEN_KEY, data.refresh_token, days);
  setCookie(USER_KEY, JSON.stringify(data.user), days);
}

export function getAccessToken(): string | null {
  return getCookie(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return getCookie(REFRESH_TOKEN_KEY);
}

export function getUser(): User | null {
  const userStr = getCookie(USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr) as User;
  } catch {
    return null;
  }
}

export function setUserCookie(user: User, days = 7): void {
  setCookie(USER_KEY, JSON.stringify(user), days);
}

export function clearAuthCookies(): void {
  deleteCookie(ACCESS_TOKEN_KEY);
  deleteCookie(REFRESH_TOKEN_KEY);
  deleteCookie(USER_KEY);
}

