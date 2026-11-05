import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes accessible without authentication
const PUBLIC_PATHS = ['/', '/forgot-password', '/reset-password'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Bypass static resources, next internals, and api calls
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check for the access token cookie
  const token = request.cookies.get('homenest_access_token')?.value;

  const isPublicPath = PUBLIC_PATHS.some(
    (path) => pathname === path || (path !== '/' && pathname.startsWith(path))
  );

  // If accessing a protected route without an authenticated session
  if (!token && !isPublicPath) {
    const loginUrl = new URL('/', request.url);
    loginUrl.searchParams.set('toast', 'auth_required');
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files:
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

