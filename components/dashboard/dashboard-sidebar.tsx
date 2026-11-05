'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar } from 'primereact/avatar';
import { Menu } from 'primereact/menu';
import { MenuItem } from 'primereact/menuitem';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
  adminName?: string;
  adminRole?: string;
  photoUrl?: string | null;
  onLogout?: () => void | Promise<void>;
}

interface SubNavItem {
  label: string;
  href: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  children?: SubNavItem[];
}

export const DashboardSidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  adminName = 'Admin',
  adminRole = 'Admin',
  photoUrl = null,
  onLogout,
}) => {
  const pathname = usePathname();
  const sidebarMenuRef = useRef<Menu>(null);
  const [imageError, setImageError] = useState(false);

  // Compute initials (e.g. "John Doe" -> "JD", "Admin" -> "A")
  const getInitials = (name?: string): string => {
    if (!name || !name.trim()) return 'A';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  };

  const initials = getInitials(adminName);

  // Check if valid photo URL exists and hasn't errored
  const hasValidPhoto = Boolean(
    photoUrl &&
    photoUrl.trim() !== '' &&
    photoUrl !== 'null' &&
    photoUrl !== 'undefined' &&
    !imageError
  );

  // Navigation Items matching the provided Figma designs pixel-for-pixel
  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: (
        <svg className="w-[18px] h-[18px] shrink-0 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      label: 'Residents',
      href: '/dashboard/residents',
      icon: (
        <svg className="w-[18px] h-[18px] shrink-0 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      children: [
        { label: 'Residents List', href: '/dashboard/residents' },
        { label: 'Agreement Records', href: '/dashboard/residents/agreements' },
      ],
    },
    {
      label: 'Rooms',
      href: '/dashboard/rooms',
      icon: (
        <svg className="w-[18px] h-[18px] shrink-0 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v11m0-4h18m0-7v11M3 11a3 3 0 013-3h3a3 3 0 013 3v3H3v-3z" />
        </svg>
      ),
      children: [
        { label: 'Room Inventory', href: '/dashboard/rooms' },
        { label: 'Room Details & Allocation', href: '/dashboard/rooms/allocation' },
      ],
    },
    {
      label: 'Payments',
      href: '/dashboard/payments',
      icon: (
        <svg className="w-[18px] h-[18px] shrink-0 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 14h6m-6-4h6m-9 9l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14z" />
        </svg>
      ),
      children: [
        { label: 'Payment Overview', href: '/dashboard/payments' },
        { label: 'Payment History & Receipts', href: '/dashboard/payments/history' },
      ],
    },
    {
      label: 'Complaints',
      href: '/dashboard/complaints',
      icon: (
        <svg className="w-[18px] h-[18px] shrink-0 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6-4h6m-9 14h6.5M16 20.5l4-4a2.121 2.121 0 00-3-3l-4 4v3h3zM5 20V4a2 2 0 012-2h10a2 2 0 012 2v7" />
        </svg>
      ),
    },
    {
      label: 'Visitors',
      href: '/dashboard/visitors',
      icon: (
        <svg className="w-[18px] h-[18px] shrink-0 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
          <circle cx="12" cy="4" r="2" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 8l2.5 3 2.5-2v7l-2 5m4-5l2 5M12 9l2.5 2L17 8" />
        </svg>
      ),
    },
    {
      label: 'Notices',
      href: '/dashboard/notices',
      icon: (
        <svg className="w-[18px] h-[18px] shrink-0 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
    },
    {
      label: 'Settings',
      href: '/dashboard/settings',
      icon: (
        <svg className="w-[18px] h-[18px] shrink-0 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      children: [
        { label: 'Staff Management', href: '/dashboard/settings/staff' },
        { label: 'Branch Management', href: '/dashboard/settings/branches' },
        { label: 'Administrative Activity Log', href: '/dashboard/settings/activity-log' },
        { label: 'Service & Laundry Requests', href: '/dashboard/settings/services' },
        { label: 'Checkout & Refund Approvals', href: '/dashboard/settings/refunds' },
        { label: 'Room Shift Request', href: '/dashboard/settings/room-shifts' },
        { label: 'Subscription Plans', href: '/dashboard/settings/subscriptions' },
      ],
    },
  ];

  // Determine which menu is automatically open based on the current pathname
  const getActiveParentMenu = (path: string): string | null => {
    if (path.startsWith('/dashboard/residents')) return 'Residents';
    if (path.startsWith('/dashboard/rooms')) return 'Rooms';
    if (path.startsWith('/dashboard/payments')) return 'Payments';
    if (path.startsWith('/dashboard/settings')) return 'Settings';
    return null;
  };

  // State to track manual user toggle on the current route
  const [manualMenuState, setManualMenuState] = useState<{ path: string; menu: string | null } | null>(null);

  // Active expanded section: user toggle takes precedence for the current path, else derived from route
  const activeExpandedMenu =
    manualMenuState && manualMenuState.path === pathname
      ? manualMenuState.menu
      : getActiveParentMenu(pathname);

  // Toggle parent menu item (mutex single-expand behavior matching reference images)
  const handleToggleMenu = (label: string) => {
    const isCurrentlyOpen = activeExpandedMenu === label;
    setManualMenuState({
      path: pathname,
      menu: isCurrentlyOpen ? null : label,
    });
  };

  const menuItems: MenuItem[] = [
    {
      template: () => (
        <div className="px-3.5 py-2.5 border-b border-gray-100 flex flex-col">
          <span className="text-xs font-semibold text-gray-900 truncate">
            {adminName}
          </span>
          <span className="text-[11px] text-[#175C46] font-medium truncate mt-0.5">
            {adminRole}
          </span>
        </div>
      ),
    },
    {
      label: 'Admin Profile',
      icon: 'pi pi-user',
    },
    {
      label: 'Settings',
      icon: 'pi pi-cog',
    },
    {
      separator: true,
    },
    {
      label: 'Sign Out',
      icon: 'pi pi-sign-out',
      command: () => {
        onLogout?.();
      },
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* PrimeReact Menu popup for Sidebar Profile options */}
      <Menu model={menuItems} popup ref={sidebarMenuRef} id="popup_menu_sidebar" />

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-[265px] xl:w-[275px] bg-[#176B52] text-white flex flex-col justify-between transition-transform duration-200 ease-in-out shrink-0 select-none overflow-hidden no-scrollbar ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header with HomeNest Brand Logo */}
        <div className="pt-6 px-5 pb-5">
          <div className="relative w-36 h-8">
            <Image
              src="/images/logo-white.png"
              alt="HomeNest Logo"
              fill
              className="object-contain object-left"
              priority
            />
          </div>
          <span className="text-[11px] font-medium tracking-wide text-white/80 block mt-1 pl-0.5">
            Admin Portal
          </span>
        </div>

        {/* Navigation List with Collapsible Submenus */}
        <nav
          className="flex-1 overflow-y-auto overflow-x-hidden space-y-0.5 py-1 no-scrollbar [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {navItems.map((item) => {
            const hasChildren = !!item.children && item.children.length > 0;
            const isMenuOpen = activeExpandedMenu === item.label;

            // Direct parent route match
            const isDirectActive = !hasChildren && pathname === item.href;

            // Check if any child of this parent is currently the active route
            const hasActiveChild =
              hasChildren &&
              item.children?.some(
                (child) =>
                  pathname === child.href ||
                  (child.href === '/dashboard/settings/staff' && pathname === '/dashboard/settings')
              );

            return (
              <div key={item.label} className="w-full">
                {hasChildren ? (
                  /* Collapsible Parent Button */
                  <button
                    type="button"
                    onClick={() => handleToggleMenu(item.label)}
                    className={`w-full flex items-center justify-between px-5 py-2.5 text-xs xl:text-[13px] font-medium transition-colors cursor-pointer text-left ${
                      hasActiveChild && !isMenuOpen
                        ? 'bg-[#3A816C]/60 text-white'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <span className="text-white">{item.icon}</span>
                      <span>{item.label}</span>
                    </div>

                    {/* Chevron: points up when expanded, down when collapsed */}
                    <svg
                      className={`w-3.5 h-3.5 text-white stroke-current transition-transform duration-200 ${
                        isMenuOpen ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2.5"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                ) : (
                  /* Standard Direct Link (e.g. Dashboard, Complaints, Visitors, Notices) */
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={`relative w-full flex items-center justify-between px-5 py-2.5 text-xs xl:text-[13px] font-medium transition-colors ${
                      isDirectActive
                        ? 'bg-[#3A816C] text-white font-medium'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <span className="text-white">{item.icon}</span>
                      <span>{item.label}</span>
                    </div>

                    {/* Distinctive 3px white accent bar on the right edge */}
                    {isDirectActive && (
                      <span className="absolute right-0 top-0 bottom-0 w-[3px] bg-white" />
                    )}
                  </Link>
                )}

                {/* Submenu Item List (Full-width with White Right-Edge Indicator matching reference images) */}
                {hasChildren && isMenuOpen && (
                  <div className="flex flex-col py-0.5">
                    {item.children?.map((sub) => {
                      const isSubActive =
                        pathname === sub.href ||
                        (sub.href === '/dashboard/settings/staff' && pathname === '/dashboard/settings');

                      return (
                        <Link
                          key={sub.label}
                          href={sub.href}
                          onClick={onClose}
                          className={`relative flex items-center w-full py-2.5 pl-11 pr-4 text-xs xl:text-[12.5px] transition-colors ${
                            isSubActive
                              ? 'bg-[#3A816C] text-white font-medium'
                              : 'text-white/80 hover:bg-white/10 hover:text-white font-normal'
                          }`}
                        >
                          <span className="whitespace-nowrap">{sub.label}</span>

                          {/* Distinctive 3px white accent bar on the right edge matching Figma */}
                          {isSubActive && (
                            <span className="absolute right-0 top-0 bottom-0 w-[3px] bg-white" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Bottom Profile Footer matching Figma pixel-for-pixel (No border divider) */}
        <div className="px-5 py-4">
          <div
            onClick={(e) => sidebarMenuRef.current?.toggle(e)}
            className="flex items-center justify-between cursor-pointer p-1 -m-1 rounded-lg hover:bg-white/5 transition-colors group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar
                image={hasValidPhoto ? photoUrl! : undefined}
                label={!hasValidPhoto ? initials : undefined}
                imageFallback="default"
                shape="circle"
                onImageError={() => setImageError(true)}
                className={`w-8 h-8 rounded-full overflow-hidden shrink-0 transition-all ${
                  hasValidPhoto
                    ? 'border border-white/40 shadow-xs'
                    : 'bg-[#247A61] border border-white/30 text-white font-semibold text-xs flex items-center justify-center shadow-xs'
                }`}
              />

              <div className="flex flex-col text-left leading-tight min-w-0 flex-1">
                <span className="text-xs font-semibold text-white truncate">
                  {adminName}
                </span>
                <span className="text-[10px] text-[#A3C9BE] truncate mt-0.5">
                  {adminRole}
                </span>
              </div>
            </div>

            <div className="text-white/80 group-hover:text-white transition-colors p-1 shrink-0">
              <svg className="w-3.5 h-3.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
