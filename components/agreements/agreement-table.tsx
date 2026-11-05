'use client';

import React from 'react';
import { AgreementRecord, AgreementMeta } from '@/types/agreement';
import { ProgressSpinner } from 'primereact/progressspinner';

interface AgreementTableProps {
  records: AgreementRecord[];
  meta: AgreementMeta;
  loading: boolean;
  onPageChange: (page: number) => void;
  onViewRecord: (record: AgreementRecord) => void;
  onEditRecord?: (record: AgreementRecord) => void;
  onDeleteRecord?: (record: AgreementRecord) => void;
}

const AGREEMENT_TYPE_LABELS: Record<string, string> = {
  rental: 'Rental Agreement',
  '11_months': '11 Months Standard',
  lease: 'Lease Agreement',
  resident: 'Resident Agreement',
};

const formatAgreementType = (val: string) =>
  AGREEMENT_TYPE_LABELS[val] ?? val;

export const AgreementTable: React.FC<AgreementTableProps> = ({
  records,
  meta,
  loading,
  onPageChange,
  onViewRecord,
  onEditRecord,
  onDeleteRecord,
}) => {
  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    switch (s) {
      case 'signed':
        return (
          <span className="bg-[#E8F8F0] text-[#175C46] px-3.5 py-1 rounded-full text-xs font-semibold tracking-tight inline-flex items-center capitalize">
            Signed
          </span>
        );
      case 'pending':
        return (
          <span className="bg-[#FEF7E6] text-[#B06000] px-3.5 py-1 rounded-full text-xs font-semibold tracking-tight inline-flex items-center capitalize">
            Pending
          </span>
        );
      case 'draft':
        return (
          <span className="bg-[#EFF6FF] text-[#2563EB] px-3.5 py-1 rounded-full text-xs font-semibold tracking-tight inline-flex items-center capitalize">
            Draft
          </span>
        );
      case 'expired':
        return (
          <span className="bg-[#FDF2F2] text-[#DC2626] px-3.5 py-1 rounded-full text-xs font-semibold tracking-tight inline-flex items-center capitalize">
            Expired
          </span>
        );
      default:
        return (
          <span className="bg-gray-100 text-gray-700 px-3.5 py-1 rounded-full text-xs font-semibold tracking-tight inline-flex items-center capitalize">
            {status}
          </span>
        );
    }
  };

  const totalPages = Math.max(1, meta.total_pages || Math.ceil(meta.total / (meta.limit || 6)));
  const currentPage = meta.page || 1;

  const startRecord = (currentPage - 1) * meta.limit + 1;
  const endRecord = Math.min(startRecord + records.length - 1, meta.total);

  // Pagination page buttons: e.g. 1 2 3 4 5
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
      {/* Responsive Table Wrapper */}
      <div className="overflow-x-auto min-h-[360px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <ProgressSpinner style={{ width: '40px', height: '40px' }} strokeWidth="4" />
            <span className="text-xs text-gray-500 font-medium">Loading agreement records...</span>
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3 text-gray-400">
              <svg className="w-6 h-6 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">No Agreements Found</h3>
            <p className="text-xs text-gray-500 max-w-sm">
              No agreement records match the selected filters or search query.
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 font-medium text-xs">
                <th className="py-4 px-4 sm:px-6 font-semibold w-16">Sr no.</th>
                <th className="py-4 px-4 font-semibold">Agreement no.</th>
                <th className="py-4 px-4 font-semibold">Resident Name</th>
                <th className="py-4 px-4 font-semibold">Room No.</th>
                <th className="py-4 px-4 font-semibold">Agreement type</th>
                <th className="py-4 px-4 font-semibold">Start Date</th>
                <th className="py-4 px-4 font-semibold">End date</th>
                <th className="py-4 px-4 font-semibold text-center">Status</th>
                <th className="py-4 px-4 sm:px-6 font-semibold text-right pr-8 whitespace-nowrap">Actions</th>
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
                  <td className="py-4 px-4 font-semibold text-gray-900">
                    {item.agreement_no}
                  </td>
                  <td className="py-4 px-4 font-medium text-gray-900">
                    {item.resident_name}
                  </td>
                  <td className="py-4 px-4 text-gray-700 font-medium">
                    {item.room_number ?? '—'}
                  </td>
                  <td className="py-4 px-4 text-gray-700 font-medium">
                    {formatAgreementType(item.agreement_type)}
                  </td>
                  <td className="py-4 px-4 text-gray-600">
                    {item.start_date}
                  </td>
                  <td className="py-4 px-4 text-gray-600">
                    {item.end_date}
                  </td>
                  <td className="py-4 px-4 text-center">
                    {getStatusBadge(item.status)}
                  </td>
                  <td className="py-4 px-5 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-2">
                      {/* View Action */}
                      <button
                        type="button"
                        onClick={() => onViewRecord(item)}
                        title="View Agreement"
                        className="w-9 h-9 rounded-xl border border-gray-200/90 bg-white flex items-center justify-center text-gray-500 hover:text-gray-900 hover:border-gray-300 transition-colors shadow-2xs cursor-pointer"
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

                      {/* Edit Action */}
                      {onEditRecord && (
                        <button
                          type="button"
                          onClick={() => onEditRecord(item)}
                          title="Edit Agreement"
                          className="w-9 h-9 rounded-xl border border-gray-200/90 bg-white flex items-center justify-center text-gray-500 hover:text-[#175C46] hover:border-gray-300 transition-colors shadow-2xs cursor-pointer"
                        >
                          <svg
                            className="w-3.5 h-3.5 stroke-current"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                          </svg>
                        </button>
                      )}

                      {/* Delete Action */}
                      {onDeleteRecord && (
                        <button
                          type="button"
                          onClick={() => onDeleteRecord(item)}
                          title="Delete Agreement"
                          className="w-9 h-9 rounded-xl border border-gray-200/90 bg-white flex items-center justify-center text-gray-500 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50/50 transition-colors shadow-2xs cursor-pointer"
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
                              d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination & Count matching Figma pixel-for-pixel */}
      <div className="border-t border-gray-100 px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-gray-500">
        <div>
          Showing {records.length > 0 ? `${startRecord}-${endRecord}` : '0'} of {meta.total}
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

