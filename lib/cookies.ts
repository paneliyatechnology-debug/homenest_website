import { AuthData, User } from '@/types/auth';

const ACCESS_TOKEN_KEY = 'mypgpms_access_token';
const REFRESH_TOKEN_KEY = 'mypgpms_refresh_token';
const USER_KEY = 'mypgpms_user';

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
  const pastDate = 'Thu, 01 Jan 1970 00:00:00 UTC';
  const encodedName = encodeURIComponent(name);

  // Clear for root path
  document.cookie = `${encodedName}=; expires=${pastDate}; path=/; SameSite=Lax`;
  document.cookie = `${encodedName}=; expires=${pastDate}; path=/; SameSite=Lax; Secure`;
  document.cookie = `${encodedName}=; max-age=0; path=/; SameSite=Lax`;

  // Clear without explicit path
  document.cookie = `${encodedName}=; expires=${pastDate}; path=; SameSite=Lax`;
  document.cookie = `${encodedName}=; max-age=0; path=; SameSite=Lax`;

  // Clear with host domain if window is available
  if (typeof window !== 'undefined' && window.location.hostname) {
    document.cookie = `${encodedName}=; expires=${pastDate}; path=/; domain=${window.location.hostname}; SameSite=Lax`;
    document.cookie = `${encodedName}=; max-age=0; path=/; domain=${window.location.hostname}; SameSite=Lax`;
  }
}

// Specialized helpers for Authentication
export function setAuthCookies(data: AuthData, rememberMe = true): void {
  const days = rememberMe ? 7 : 1;
  setCookie(ACCESS_TOKEN_KEY, data.access_token, days);
  setCookie(REFRESH_TOKEN_KEY, data.refresh_token, days);
  setCookie(USER_KEY, JSON.stringify(data.user), days);
}

export function getAccessToken(): string | null {
  return getCookie(ACCESS_TOKEN_KEY) || getCookie('homenest_access_token');
}

export function getRefreshToken(): string | null {
  return getCookie(REFRESH_TOKEN_KEY) || getCookie('homenest_refresh_token');
}

export function getUser(): User | null {
  const userStr = getCookie(USER_KEY) || getCookie('homenest_user');
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
  const keysToDelete = [
    ACCESS_TOKEN_KEY,
    REFRESH_TOKEN_KEY,
    USER_KEY,
    'mypgpms_access_token',
    'mypgpms_refresh_token',
    'mypgpms_user',
    'homenest_access_token',
    'homenest_refresh_token',
    'homenest_user',
    'token',
    'access_token',
    'refresh_token',
    'user',
  ];

  keysToDelete.forEach((key) => deleteCookie(key));

  // Also iterate document.cookie to clear any remaining auth-related cookies
  if (typeof document !== 'undefined') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie;
      if (
        name.includes('token') ||
        name.includes('mypgpms') ||
        name.includes('homenest') ||
        name.includes('auth') ||
        name.includes('user')
      ) {
        deleteCookie(name);
      }
    }
  }

  // Also remove token from localStorage / sessionStorage if any legacy scripts stored it
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      localStorage.removeItem('mypgpms_user');
      localStorage.removeItem('homenest_user');
    } catch {
      // Ignore storage access errors
    }
  }
}

