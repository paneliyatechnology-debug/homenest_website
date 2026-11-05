'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Resident } from '@/types/resident';
import { residentService } from '@/services/resident.service';
import { ProgressSpinner } from 'primereact/progressspinner';
import { SearchInput } from '@/components/ui';

interface ResidentDropdownProps {
  selectedResidentId: number | null;
  onSelect: (resident: Resident | null) => void;
  hasError?: boolean;
}

export const ResidentDropdown: React.FC<ResidentDropdownProps> = ({
  selectedResidentId,
  onSelect,
  hasError,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  // Focus search when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch residents when debounced query changes
  useEffect(() => {
    let isMounted = true;
    residentService
      .getResidents({ role: 'resident', search: debouncedQuery, page: 1, limit: 20 })
      .then((res) => {
        if (!isMounted) return;
        setResidents(res.data);
        setPage(1);
        setHasNext(res.meta.total_pages > 1);
        setLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setLoading(false);
      });
    return () => { isMounted = false; };
  }, [debouncedQuery]);

  // Infinite scroll — load next page
  const loadMore = async () => {
    if (loadingMore || !hasNext) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const res = await residentService.getResidents({
        role: 'resident',
        search: debouncedQuery,
        page: nextPage,
        limit: 20,
      });
      setResidents((prev) => [...prev, ...res.data]);
      setPage(nextPage);
      setHasNext(nextPage < res.meta.total_pages);
    } catch {
      // ignore
    } finally {
      setLoadingMore(false);
    }
  };

  const handleListScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollTop + clientHeight >= scrollHeight - 24) loadMore();
  };

  const handleSelect = (resident: Resident | null) => {
    onSelect(resident);
    setIsOpen(false);
    setSearchQuery('');
  };

  // Display label for the trigger button
  const selectedLabel = useMemo(() => {
    if (!selectedResidentId) return null;
    const found = residents.find((r) => r.id === selectedResidentId);
    return found ? found.name : `Resident #${selectedResidentId}`;
  }, [selectedResidentId, residents]);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className={`w-full h-11 px-4 py-2.5 bg-white rounded-xl border ${
          hasError
            ? 'border-rose-400'
            : 'border-gray-200/90 hover:border-gray-300'
        } flex items-center justify-between text-xs sm:text-sm text-gray-800 transition-colors shadow-2xs cursor-pointer outline-none focus:border-[#175C46] focus:ring-1 focus:ring-[#175C46]`}
      >
        <span className={`truncate ${!selectedLabel ? 'text-gray-400' : ''}`}>
          {selectedLabel ?? 'Select resident'}
        </span>
        <svg
          className={`w-4 h-4 text-gray-500 shrink-0 ml-2 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-full min-w-[280px] bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Search */}
          <div className="p-2 border-b border-gray-100">
            <SearchInput
              ref={searchInputRef}
              value={searchQuery}
              onChange={(val) => {
                setSearchQuery(val);
                setLoading(true);
              }}
              size="sm"
              placeholder="Search by name or email..."
            />
          </div>

          {/* List */}
          <div
            ref={listRef}
            onScroll={handleListScroll}
            className="max-h-[240px] overflow-y-auto p-1 text-xs divide-y divide-gray-50"
          >
            {loading ? (
              <div className="py-6 flex flex-col items-center justify-center gap-2 text-gray-400">
                <ProgressSpinner style={{ width: '22px', height: '22px' }} strokeWidth="3" />
                <span className="text-[11px]">Searching residents...</span>
              </div>
            ) : residents.length === 0 ? (
              <div className="py-5 text-center text-gray-400 text-xs">No residents found</div>
            ) : (
              residents.map((resident) => {
                const isSelected = selectedResidentId === resident.id;
                return (
                  <div
                    key={resident.id}
                    onClick={() => handleSelect(resident)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#E8F3ED] text-[#175C46] font-semibold'
                        : 'text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Avatar initials */}
                      <div className="w-7 h-7 rounded-full bg-[#175C46]/10 text-[#175C46] text-[10px] font-bold flex items-center justify-center shrink-0">
                        {resident.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium truncate text-xs">{resident.name}</span>
                        <span className="text-[10.5px] text-gray-400 truncate">
                          {resident.room_no ? `Room ${resident.room_no}` : resident.email}
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <svg className="w-3.5 h-3.5 text-[#175C46] stroke-current shrink-0 ml-2" fill="none" viewBox="0 0 24 24" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                );
              })
            )}

            {loadingMore && (
              <div className="py-2.5 flex items-center justify-center gap-2 text-gray-500 bg-gray-50/50 rounded-md my-1">
                <ProgressSpinner style={{ width: '16px', height: '16px' }} strokeWidth="3" />
                <span className="text-[11px] font-medium">Loading more...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

