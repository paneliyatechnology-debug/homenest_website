'use client';

import React from 'react';

export interface TablePaginationProps {
  currentPage: number;
  totalCount: number;
  pageSize?: number;
  itemCount?: number;
  itemLabel?: string;
  loading?: boolean;
  onPageChange: (page: number) => void;
  className?: string;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage,
  totalCount,
  pageSize = 10,
  itemCount,
  itemLabel,
  loading = false,
  onPageChange,
  className = '',
}) => {
  const currentCount = itemCount !== undefined ? itemCount : Math.min(pageSize, totalCount);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const startRecord = totalCount > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endRecord = totalCount > 0 ? Math.min(startRecord + currentCount - 1, totalCount) : 0;

  // Generate dynamic page numbers matching Figma design
  const getPageNumbers = (): (number | string)[] => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 3) {
      return [1, 2, 3, '...', totalPages];
    }
    if (currentPage >= totalPages - 2) {
      return [1, '...', totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', currentPage, '...', totalPages];
  };

  const pageNumbers = getPageNumbers();

  return (
    <div
      className={`flex items-center justify-between gap-3 text-xs sm:text-sm text-gray-500 pt-2 px-1 select-none w-full flex-wrap sm:flex-nowrap ${className}`}
    >
      {/* Left record counter: "Showing 1-10 of 12" */}
      <div className="font-medium text-gray-500 text-xs sm:text-sm whitespace-nowrap">
        Showing{' '}
        <span className="font-semibold text-gray-800">
          {totalCount > 0 ? `${startRecord}-${endRecord}` : '0'}
        </span>{' '}
        of <span className="font-semibold text-gray-800">{totalCount}</span>
        {itemLabel ? ` ${itemLabel}` : ''}
      </div>

      {/* Right pagination navigation buttons */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* Previous Button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1 || loading}
          aria-label="Previous Page"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
        >
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Page buttons */}
        {pageNumbers.map((pg, idx) => {
          if (typeof pg === 'string') {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="w-6 sm:w-8 h-8 flex items-center justify-center text-gray-400 text-xs font-semibold select-none"
              >
                ...
              </span>
            );
          }
          const isActive = pg === currentPage;
          return (
            <button
              key={pg}
              type="button"
              onClick={() => onPageChange(pg)}
              disabled={loading}
              className={`w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#175C46] text-white shadow-2xs font-bold'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 font-medium'
              }`}
            >
              {pg}
            </button>
          );
        })}

        {/* Next Button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages || loading}
          aria-label="Next Page"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
        >
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};
