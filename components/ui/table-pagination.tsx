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
      return [1, 2, 3, 4, '...', totalPages];
    }
    if (currentPage >= totalPages - 2) {
      return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  const pageNumbers = getPageNumbers();

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-gray-400 pt-1 px-1 select-none ${className}`}
    >
      {/* Left record counter matching Figma: "Showing 1-5 of 5" */}
      <div>
        Showing {totalCount > 0 ? `${startRecord}-${endRecord}` : '0'} of {totalCount}
      </div>

      {/* Right pagination navigation buttons */}
      <div className="flex items-center gap-1.5">
        {/* Previous Button (‹) */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1 || loading}
          aria-label="Previous Page"
          className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors text-sm font-semibold"
        >
          ‹
        </button>

        {/* Page buttons */}
        {pageNumbers.map((pg, idx) => {
          if (typeof pg === 'string') {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="w-7 h-7 flex items-center justify-center text-gray-400 text-xs"
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
              className={`w-7 h-7 rounded-md text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer ${
                isActive
                  ? 'bg-[#175C46] text-white shadow-2xs'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/60'
              }`}
            >
              {pg}
            </button>
          );
        })}

        {/* Next Button (›) */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages || loading}
          aria-label="Next Page"
          className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors text-sm font-semibold"
        >
          ›
        </button>
      </div>
    </div>
  );
};
