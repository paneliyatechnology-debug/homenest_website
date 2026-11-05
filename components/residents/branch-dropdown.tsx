'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Branch } from '@/types/resident';
import { residentService } from '@/services/resident.service';
import { ProgressSpinner } from 'primereact/progressspinner';

interface BranchDropdownProps {
  selectedBranchId: number | null;
  onSelectBranch: (branchId: number | null, branchName: string) => void;
}

export const BranchDropdown: React.FC<BranchDropdownProps> = ({
  selectedBranchId,
  onSelectBranch,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Debounce search input changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch branches whenever debounced query changes
  useEffect(() => {
    let isMounted = true;
    residentService
      .getBranches({ search: debouncedQuery, page: 1, limit: 10 })
      .then((res) => {
        if (!isMounted) return;
        setBranches(res.data);
        setPage(1);
        setHasNext(res.meta ? res.meta.has_next : false);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('Error fetching branches:', err);
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery]);

  // Purely computed selected branch name (no setState in effect)
  const selectedName = useMemo(() => {
    if (selectedBranchId === null) return 'All Branches';
    const found = branches.find((b) => b.id === selectedBranchId);
    return found ? found.name : 'All Branches';
  }, [selectedBranchId, branches]);

  // Infinite scroll: fetch next page when user scrolls to bottom of dropdown
  const loadMoreBranches = async () => {
    if (loadingMore || !hasNext) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const res = await residentService.getBranches({
        search: debouncedQuery,
        page: nextPage,
        limit: 10,
      });
      setBranches((prev) => [...prev, ...res.data]);
      setPage(nextPage);
      setHasNext(res.meta ? res.meta.has_next : false);
    } catch (err) {
      console.warn('Error loading more branches:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleListScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollTop + clientHeight >= scrollHeight - 20) {
      loadMoreBranches();
    }
  };

  const handleSelect = (id: number | null, name: string) => {
    onSelectBranch(id, name);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Trigger Button matching Figma input style */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-11 px-4 py-2.5 bg-white rounded-xl border border-gray-200/90 hover:border-gray-300 flex items-center justify-between text-xs sm:text-sm font-normal text-gray-800 transition-colors shadow-2xs cursor-pointer"
      >
        <span className="truncate">{selectedName}</span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 shrink-0 ml-2 ${
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

      {/* Dropdown Popup with Search & Infinite Scroll */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-full min-w-[260px] bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Search Box Header */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <svg
                className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setLoading(true);
                }}
                placeholder="Search branches..."
                className="w-full h-8 pl-8 pr-7 text-xs bg-gray-50 rounded-lg border border-gray-200/80 outline-none text-gray-800 placeholder:text-gray-400 focus:bg-white focus:border-[#175C46] transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Scrollable Branch Item List with Infinite Scroll */}
          <div
            ref={listRef}
            onScroll={handleListScroll}
            className="max-h-[220px] overflow-y-auto p-1 text-xs divide-y divide-gray-50"
          >
            {/* "All Branches" Option */}
            <div
              onClick={() => handleSelect(null, 'All Branches')}
              className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                selectedBranchId === null
                  ? 'bg-[#E8F3ED] text-[#175C46] font-semibold'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>All Branches</span>
              {selectedBranchId === null && (
                <svg className="w-3.5 h-3.5 text-[#175C46] stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>

            {/* Loading initial search */}
            {loading ? (
              <div className="py-6 flex flex-col items-center justify-center gap-2 text-gray-400">
                <ProgressSpinner style={{ width: '22px', height: '22px' }} strokeWidth="3" />
                <span className="text-[11px]">Searching branches...</span>
              </div>
            ) : branches.length === 0 ? (
              <div className="py-5 text-center text-gray-400 text-xs">
                No branches found
              </div>
            ) : (
              branches.map((branch) => {
                const isSelected = selectedBranchId === branch.id;
                return (
                  <div
                    key={branch.id}
                    onClick={() => handleSelect(branch.id, branch.name)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#E8F3ED] text-[#175C46] font-semibold'
                        : 'text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="truncate font-medium">{branch.name}</span>
                      {branch.location && (
                        <span className="text-[10.5px] text-gray-400 truncate mt-0.5">
                          {branch.location}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <svg className="w-3.5 h-3.5 text-[#175C46] stroke-current shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                );
              })
            )}

            {/* Bottom Spinner when Infinite Scrolling */}
            {loadingMore && (
              <div className="py-2.5 flex items-center justify-center gap-2 text-gray-500 bg-gray-50/50 rounded-md my-1">
                <ProgressSpinner style={{ width: '16px', height: '16px' }} strokeWidth="3" />
                <span className="text-[11px] font-medium text-gray-500">Loading more branches...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
