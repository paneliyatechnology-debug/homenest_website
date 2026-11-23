'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
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

export const DashboardTopbar: React.FC<TopbarProps> = React.memo(({
  onToggleSidebar,
  adminName = 'Admin',
  adminRole = 'Admin',
  photoUrl = null,
  onLogout,
}) => {
  const router = useRouter();
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
      command: () => {
        router.push('/profile');
      },
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

      {/* Right: Profile Header matching reference image */}
      <div className="flex items-center gap-2.5 sm:gap-4 md:gap-5 shrink-0 ml-3">
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
            className={`w-8 h-8 rounded-full overflow-hidden shrink-0 transition-all ${hasValidPhoto
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
});
DashboardTopbar.displayName = 'DashboardTopbar';
