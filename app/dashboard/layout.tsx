'use client';

import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth.service';
import { User } from '@/types/auth';
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';
import { DashboardTopbar } from '@/components/dashboard/dashboard-topbar';

const emptySubscribe = () => () => {};

function useIsMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const mounted = useIsMounted();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // 1. Verify user authentication
    if (!authService.isAuthenticated()) {
      router.replace('/?toast=auth_required');
      return;
    }

    // 2. Verify admin role
    const isAllowedRole = (r?: string | null): boolean => {
      if (!r) return true;
      const lower = r.toLowerCase();
      return lower === 'admin' || lower === 'super_admin' || lower === 'superadmin' || lower.includes('admin');
    };

    const currentUser = authService.getCurrentUser();
    if (currentUser && !isAllowedRole(currentUser.role)) {
      authService.logout('/?toast=unauthorized');
      return;
    }

    let isMounted = true;

    // 3. Refresh live user profile from GET /auth/me
    authService
      .getMe()
      .then((me) => {
        if (isMounted) {
          if (!isAllowedRole(me.role)) {
            authService.logout('/?toast=unauthorized');
            return;
          }
          setUser(me);
        }
      })
      .catch((err) => {
        console.warn('Could not refresh live user profile from /auth/me:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleLogout = async () => {
    await authService.logout('/');
  };

  /**
   * Format role dynamically from API without static hardcoding:
   * e.g. "admin" -> "Admin", "super_admin" -> "Super Admin"
   */
  const formatRole = (role?: string | null): string => {
    if (!role || !role.trim()) return 'Admin';
    return role
      .trim()
      .split(/[_\s]+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  };

  // Only resolve cookie-stored user after client-side hydration
  const activeUser = mounted ? (user || authService.getCurrentUser()) : null;
  const adminDisplayName = activeUser?.name?.trim() || 'Admin';
  const adminDisplayRole = activeUser?.role ? formatRole(activeUser.role) : 'Admin';

  /**
   * Resolve media URLs from backend API (supporting relative paths, full URLs, or null)
   */
  const resolveMediaUrl = (url?: string | null): string | null => {
    if (!url || typeof url !== 'string') return null;
    const trimmed = url.trim();
    if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return null;

    if (
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('data:')
    ) {
      return trimmed;
    }

    if (trimmed.startsWith('/images/')) {
      return trimmed;
    }

    const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1')
      .replace(/\/api\/v1\/?$/, '');
    const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return `${apiBase}${cleanPath}`;
  };

  // Real authenticated user photo from API response; null if not mounted
  const rawPhoto = activeUser?.profile_photo_url || activeUser?.profile_photo;
  const photoUrl = resolveMediaUrl(rawPhoto);

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex text-gray-900 font-sans antialiased overflow-x-hidden">
      {/* Left Sidebar Navigation matching Figma */}
      <React.Suspense fallback={<aside className="w-64 bg-[#175C46] min-h-screen shrink-0 hidden lg:block" />}>
        <DashboardSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          adminName={adminDisplayName}
          adminRole={adminDisplayRole}
          photoUrl={photoUrl}
          onLogout={handleLogout}
        />
      </React.Suspense>

      {/* Main Content Area with Header (#E8F3ED) and Body (#F7F7F5) */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen bg-[#F7F7F5]">
        {/* Top Header Bar with distinct #E8F3ED background matching reference image */}
        <DashboardTopbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          adminName={adminDisplayName}
          adminRole={adminDisplayRole}
          photoUrl={photoUrl}
          onLogout={handleLogout}
        />

        {/* Page Body Viewport */}
        <div className="flex-1 flex flex-col bg-[#F7F7F5]">
          <React.Suspense fallback={null}>
            {children}
          </React.Suspense>
        </div>
      </div>
    </div>
  );
}

