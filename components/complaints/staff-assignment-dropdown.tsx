'use client';

import React, { useState, useRef, useEffect } from 'react';
import { StaffMember } from '@/types/staff';
import { SearchInput } from '@/components/ui';

interface StaffAssignmentDropdownProps {
  staffList: StaffMember[];
  selectedStaffId: string | number;
  onSelect: (staffId: string) => void;
  disabled?: boolean;
  className?: string;
}

export const StaffAssignmentDropdown: React.FC<StaffAssignmentDropdownProps> = ({
  staffList,
  selectedStaffId,
  onSelect,
  disabled = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const selectedStaff = staffList.find(
    (s) => String(s.id) === String(selectedStaffId)
  );

  const filteredStaff = staffList.filter((s) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const nameMatch = s.name.toLowerCase().includes(term);
    const roleMatch = (s.staff_role || s.role || '').toLowerCase().includes(term);
    return nameMatch || roleMatch;
  });

  const getInitials = (name?: string): string => {
    if (!name || !name.trim()) return 'S';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  };

  const formatRole = (role?: string): string => {
    if (!role) return 'Staff Member';
    return role.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      {/* Dropdown Trigger Box matching Image 2 pixel-for-pixel */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full min-h-[52px] px-3.5 py-2 bg-white border border-gray-200 hover:border-gray-300 rounded-xl flex items-center justify-between gap-3 text-left transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-2xs focus:outline-none focus:border-[#175C46] focus:ring-1 focus:ring-[#175C46]"
      >
        {selectedStaff ? (
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#175C46] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
              {getInitials(selectedStaff.name)}
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-bold text-gray-900 block truncate">
                {selectedStaff.name}
              </span>
              <span className="text-[11px] text-gray-500 font-medium block truncate">
                {formatRole(selectedStaff.staff_role || selectedStaff.role)}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 text-gray-400">
            <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-xs shrink-0">
              <i className="pi pi-user" />
            </div>
            <span className="text-xs sm:text-sm font-medium">
              Select Staff Member
            </span>
          </div>
        )}

        <svg
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Floating Dropdown Panel */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Search filter for staff */}
          <div className="p-2 border-b border-gray-100 bg-gray-50/50">
            <SearchInput
              value={searchTerm}
              onChange={(val) => setSearchTerm(val)}
              onClear={() => setSearchTerm('')}
              placeholder="Search staff by name or role..."
              size="sm"
            />
          </div>

          {/* Staff Options List */}
          <div className="max-h-[220px] overflow-y-auto custom-scrollbar p-1 divide-y divide-gray-50">
            {filteredStaff.length === 0 ? (
              <div className="py-6 text-center text-gray-400 text-xs">
                No staff members found
              </div>
            ) : (
              filteredStaff.map((staff) => {
                const isSelected = String(staff.id) === String(selectedStaffId);
                return (
                  <div
                    key={staff.id}
                    onClick={() => {
                      onSelect(String(staff.id));
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#E8F8F0] text-[#175C46]'
                        : 'hover:bg-gray-50 text-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                          isSelected
                            ? 'bg-[#175C46] text-white'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {getInitials(staff.name)}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold block truncate">
                          {staff.name}
                        </span>
                        <span className="text-[11px] text-gray-500 font-medium block truncate">
                          {formatRole(staff.staff_role || staff.role)}
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <i className="pi pi-check text-[#175C46] text-xs shrink-0 ml-2" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
