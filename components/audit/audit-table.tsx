'use client';

import React from 'react';
import { AuditLog, AuditMeta } from '@/types/audit';
import { ProgressSpinner } from 'primereact/progressspinner';

interface AuditTableProps {
  records: AuditLog[];
  meta: AuditMeta;
  loading: boolean;
  onPageChange: (page: number) => void;
  onViewRecord: (record: AuditLog) => void;
}

export const AuditTable: React.FC<AuditTableProps> = ({
  records,
  meta,
  loading,
  onPageChange,
  onViewRecord,
}) => {
  const totalCount = meta.total_records ?? meta.total ?? 0;
  const limit = meta.limit || 10;
  const totalPages = Math.max(1, meta.total_pages || Math.ceil(totalCount / limit));
  const currentPage = meta.page || 1;

  const startRecord = records.length > 0 ? (currentPage - 1) * limit + 1 : 0;
  const endRecord = Math.min((currentPage - 1) * limit + records.length, totalCount);

  // Pagination buttons (e.g. 1 2 3 4 5)
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxButtons = 5;
    let start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, start + maxButtons - 1);

    if (end - start + 1 < maxButtons) {
      start = Math.max(1, end - maxButtons + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
      {/* Table Wrapper */}
      <div className="overflow-x-auto min-h-[360px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <ProgressSpinner style={{ width: '40px', height: '40px' }} strokeWidth="4" />
            <span className="text-xs text-gray-500 font-medium">Loading activity logs...</span>
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3 text-gray-400">
              <svg className="w-6 h-6 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">No Activity Logs Found</h3>
            <p className="text-xs text-gray-500 max-w-sm">
              No audit records match the current filter or date range criteria.
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 font-medium text-xs">
                <th className="py-4 px-4 sm:px-6 font-semibold w-16">Sr no.</th>
                <th className="py-4 px-4 font-semibold">User</th>
                <th className="py-4 px-4 font-semibold">Action</th>
                <th className="py-4 px-4 font-semibold">Module</th>
                <th className="py-4 px-4 font-semibold">Details</th>
                <th className="py-4 px-4 font-semibold">Timestamp</th>
                <th className="py-4 px-4 font-semibold">IP address</th>
                <th className="py-4 px-4 sm:px-6 font-semibold text-center w-20">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/80">
              {records.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-gray-50/70 transition-colors group text-gray-700"
                >
                  <td className="py-4 px-4 sm:px-6 font-medium text-gray-900">
                    {item.sr_no}
                  </td>
                  <td className="py-4 px-4 font-semibold text-gray-900 whitespace-nowrap">
                    {item.user_name || item.user}
                  </td>
                  <td className="py-4 px-4 text-gray-700 font-medium whitespace-nowrap">
                    {item.action}
                  </td>
                  <td className="py-4 px-4 text-gray-700 font-medium whitespace-nowrap">
                    {item.module}
                  </td>
                  <td className="py-4 px-4 text-gray-600 max-w-xs truncate cursor-pointer" title={item.details || item.description}>
                    {item.details || item.description || '—'}
                  </td>
                  <td className="py-4 px-4 text-gray-600 whitespace-nowrap">
                    {item.timestamp || item.created_at_formatted || item.created_at || '—'}
                  </td>
                  <td className="py-4 px-4 font-mono text-gray-600 text-xs whitespace-nowrap">
                    {item.ip_address || '—'}
                  </td>
                  <td className="py-4 px-4 sm:px-6 text-center">
                    <button
                      type="button"
                      onClick={() => onViewRecord(item)}
                      title="View Details"
                      className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-colors cursor-pointer"
                    >
                      <svg
                        className="w-4 h-4 stroke-current"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.8"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer matching Figma */}
      <div className="border-t border-gray-100 px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-gray-500">
        <div>
          Showing {records.length > 0 ? `${startRecord}-${endRecord}` : '0'} of {totalCount}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Previous Button */}
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1 || loading}
            aria-label="Previous Page"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Page Number Buttons */}
          {getPageNumbers().map((num) => {
            const isActive = num === currentPage;
            return (
              <button
                key={num}
                type="button"
                onClick={() => onPageChange(num)}
                disabled={loading}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center ${
                  isActive
                    ? 'bg-[#175C46] text-white shadow-xs'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {num}
              </button>
            );
          })}

          {/* Next Button */}
          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages || loading}
            aria-label="Next Page"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

