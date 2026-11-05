'use client';

import React, { useRef, useState } from 'react';
import { Menu } from 'primereact/menu';
import { MenuItem } from 'primereact/menuitem';
import { Avatar } from 'primereact/avatar';

interface TopbarProps {
  onToggleSidebar: () => void;
  adminName?: string;
  adminRole?: string;
  photoUrl?: string | null;
  onLogout?: () => void | Promise<void>;
}

export const DashboardTopbar: React.FC<TopbarProps> = ({
  onToggleSidebar,
  adminName = 'Admin',
  adminRole = 'Admin',
  photoUrl = null,
  onLogout,
}) => {
  const menuRef = useRef<Menu>(null);
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
    <header className="w-full h-16 sm:h-[68px] bg-[#E8F3ED] px-4 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 select-none transition-all">
      {/* PrimeReact Menu popup for Admin options */}
      <Menu model={menuItems} popup ref={menuRef} id="popup_menu_topbar" />

      {/* Left: Mobile Hamburger Toggle (hidden on desktop) */}
      <div className="flex items-center">
        {/* Mobile Hamburger Drawer Button */}
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Open sidebar navigation"
          className="lg:hidden p-2 -ml-1 text-[#175C46] hover:text-[#124b38] hover:bg-black/5 rounded-lg transition-colors cursor-pointer shrink-0"
        >
          <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Right: Notifications & Profile Header matching reference image */}
      <div className="flex items-center gap-2.5 sm:gap-4 md:gap-5 shrink-0 ml-3">
        {/* Notification Bell with Red Badge Dot */}
        <button
          type="button"
          aria-label="View notifications"
          className="relative p-2 text-[#175C46] hover:bg-black/5 rounded-full transition-colors cursor-pointer shrink-0"
        >
          <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {/* Active Red notification indicator dot matching image */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#ef4444] ring-2 ring-[#E8F3ED]" />
        </button>

        {/* Admin Profile Dropdown Button */}
        <button
          type="button"
          onClick={(e) => menuRef.current?.toggle(e)}
          className="flex items-center gap-2 sm:gap-2.5 text-gray-800 hover:text-gray-900 transition-colors cursor-pointer py-1 px-1 sm:px-1.5 rounded-lg hover:bg-black/5 group shrink-0"
        >
          {/* Circular Avatar: Photo if present, otherwise Alphabets (initials) */}
          <Avatar
            image={hasValidPhoto ? photoUrl! : undefined}
            label={!hasValidPhoto ? initials : undefined}
            imageFallback="default"
            shape="circle"
            onImageError={() => setImageError(true)}
            className={`w-8 h-8 rounded-full overflow-hidden shrink-0 transition-all ${
              hasValidPhoto
                ? 'border border-[#175C46] shadow-2xs'
                : 'bg-[#175C46] text-white font-semibold text-xs border border-[#175C46] flex items-center justify-center shadow-xs'
            }`}
          />

          <span className="text-xs sm:text-sm font-semibold text-gray-800 truncate max-w-[80px] xs:max-w-[110px] sm:max-w-[150px] md:max-w-[180px]">
            {adminName}
          </span>

          <svg
            className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-800 stroke-current shrink-0 transition-transform duration-150"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2.5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </header>
  );
};
