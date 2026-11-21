'use client';

import React, { useState, useRef, useEffect } from 'react';

export interface DateRangeFilterProps {
  startDate?: string;
  endDate?: string;
  onChange: (startDate: string, endDate: string) => void;
  placeholder?: string;
  className?: string;
}

function formatDateDisplay(dateStr?: string): string {
  if (!dateStr) return '';
  const clean = dateStr.trim().split(' ')[0];
  const parts = clean.split('-');
  let d: Date | null = null;
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else if (parts[2].length === 4) {
      d = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    }
  }
  if (!d || isNaN(d.getTime())) {
    d = new Date(dateStr);
  }
  if (isNaN(d.getTime())) return dateStr;

  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleString('en-US', { month: 'short' }).toLowerCase();
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  startDate = '',
  endDate = '',
  onChange,
  placeholder = 'Select date range',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStart, setTempStart] = useState('');
  const [tempEnd, setTempEnd] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => {
    if (!isOpen) {
      setTempStart(startDate);
      setTempEnd(endDate);
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const displayLabel =
    startDate && endDate
      ? `${formatDateDisplay(startDate)} - ${formatDateDisplay(endDate)}`
      : startDate
      ? `From ${formatDateDisplay(startDate)}`
      : endDate
      ? `Until ${formatDateDisplay(endDate)}`
      : placeholder;

  const applyPreset = (preset: 'thisMonth' | 'lastMonth' | 'last30' | 'all') => {
    const now = new Date();
    if (preset === 'all') {
      onChange('', '');
      setIsOpen(false);
      return;
    }

    const fmt = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    if (preset === 'thisMonth') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      onChange(fmt(start), fmt(end));
      setIsOpen(false);
      return;
    }
    if (preset === 'lastMonth') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      onChange(fmt(start), fmt(end));
      setIsOpen(false);
      return;
    }
    if (preset === 'last30') {
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      onChange(fmt(start), fmt(now));
      setIsOpen(false);
      return;
    }
  };

  const handleApply = () => {
    onChange(tempStart, tempEnd);
    setIsOpen(false);
  };

  const handleReset = () => {
    setTempStart('');
    setTempEnd('');
    onChange('', '');
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        className="w-full h-11 inline-flex items-center justify-between gap-3 px-3.5 sm:px-4 py-2 sm:py-2.5 bg-white border border-gray-200/90 rounded-xl text-xs sm:text-sm font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50/50 shadow-2xs transition-all cursor-pointer min-w-[190px]"
      >
        <div className="flex items-center gap-2 truncate">
          <svg
            className="w-4 h-4 text-gray-500 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span className="truncate">{displayLabel}</span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl border border-gray-100 shadow-xl z-50 p-4 space-y-4 animate-in fade-in-50 zoom-in-95">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
            <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              Filter by Date
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-semibold text-gray-500 hover:text-red-600 transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>

          {/* Quick presets */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => applyPreset('thisMonth')}
              className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-[#E8F8F0] hover:text-[#175C46] rounded-xl text-center transition-colors cursor-pointer border border-gray-100/80"
            >
              This Month
            </button>
            <button
              type="button"
              onClick={() => applyPreset('lastMonth')}
              className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-[#E8F8F0] hover:text-[#175C46] rounded-xl text-center transition-colors cursor-pointer border border-gray-100/80"
            >
              Last Month
            </button>
            <button
              type="button"
              onClick={() => applyPreset('last30')}
              className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-[#E8F8F0] hover:text-[#175C46] rounded-xl text-center transition-colors cursor-pointer border border-gray-100/80"
            >
              Last 30 Days
            </button>
            <button
              type="button"
              onClick={() => applyPreset('all')}
              className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl text-center transition-colors cursor-pointer border border-gray-100/80"
            >
              All Time
            </button>
          </div>

          {/* Custom Date Inputs */}
          <div className="space-y-3 pt-1 border-t border-gray-100">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                Start Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={tempStart}
                  onChange={(e) => setTempStart(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50/60 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-[#175C46] focus:ring-1 focus:ring-[#175C46] transition-all"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                End Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={tempEnd}
                  onChange={(e) => setTempEnd(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50/60 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-[#175C46] focus:ring-1 focus:ring-[#175C46] transition-all"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3.5 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#175C46] hover:bg-[#124b38] rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Apply Range
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
