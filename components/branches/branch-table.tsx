'use client';

import React from 'react';
import Image from 'next/image';
import { Branch, BranchMeta } from '@/types/branch';
import { ProgressSpinner } from 'primereact/progressspinner';

interface BranchTableProps {
  branches: Branch[];
  meta: BranchMeta;
  loading: boolean;
  onPageChange: (page: number) => void;
  onView: (branch: Branch) => void;
  onEdit: (branch: Branch) => void;
  onDelete: (branch: Branch) => void;
}

export const BranchTable: React.FC<BranchTableProps> = ({
  branches,
  meta,
  loading,
  onPageChange,
  onView,
  onEdit,
  onDelete,
}) => {
  const totalCount = meta.total_records ?? branches.length;
  const limit = meta.limit || 10;
  const totalPages = Math.max(1, meta.total_pages || Math.ceil(totalCount / limit));
  const currentPage = meta.page || 1;

  const startRecord = branches.length > 0 ? (currentPage - 1) * limit + 1 : 0;
  const endRecord = Math.min((currentPage - 1) * limit + branches.length, totalCount);

  // Status Badge Helper
  const renderStatusBadge = (status?: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'active') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#E8F1FD] text-[#2563EB]">
          Active
        </span>
      );
    }
    if (s === 'maintenance') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#FEF7E0] text-[#D97706]">
          Under maintenance
        </span>
      );
    }
    if (s === 'upcoming') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#FDF2F2] text-[#DC2626]">
          Upcoming
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 capitalize">
        {status || 'Unknown'}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
      <div className="overflow-x-auto min-h-[360px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <ProgressSpinner style={{ width: '40px', height: '40px' }} strokeWidth="4" />
            <span className="text-xs text-gray-500 font-medium">Loading branches...</span>
          </div>
        ) : branches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3 text-gray-400">
              <svg className="w-6 h-6 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">No Branches Found</h3>
            <p className="text-xs text-gray-500 max-w-sm">
              No branch records match your search criteria.
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 font-medium text-xs">
                <th className="py-4 px-4 sm:px-6 font-semibold w-16">Sr no.</th>
                <th className="py-4 px-4 font-semibold">Branch name</th>
                <th className="py-4 px-4 font-semibold">Location</th>
                <th className="py-4 px-4 font-semibold">Total rooms</th>
                <th className="py-4 px-4 font-semibold">Occupied</th>
                <th className="py-4 px-4 font-semibold">Available</th>
                <th className="py-4 px-4 font-semibold">Status</th>
                <th className="py-4 px-4 sm:px-6 font-semibold text-right w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/80">
              {branches.map((branch, index) => {
                const srNo = (currentPage - 1) * limit + index + 1;
                const photoSrc = branch.branch_photo_url || branch.branch_photo;

                return (
                  <tr
                    key={branch.id}
                    className="hover:bg-gray-50/70 transition-colors group text-gray-700"
                  >
                    <td className="py-4 px-4 sm:px-6 font-medium text-gray-900">
                      {srNo}
                    </td>

                    {/* Branch name + thumbnail photo */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 border border-gray-200/80 relative shrink-0 flex items-center justify-center">
                          {photoSrc ? (
                            <Image
                              src={photoSrc}
                              alt={branch.name}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                              unoptimized
                            />
                          ) : (
                            <svg className="w-5 h-5 text-gray-400 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="1.8">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          )}
                        </div>
                        <span className="font-semibold text-gray-900 text-xs sm:text-sm">
                          {branch.name}
                        </span>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="py-4 px-4 text-gray-700 font-medium whitespace-nowrap">
                      {branch.location || '—'}
                    </td>

                    {/* Total rooms */}
                    <td className="py-4 px-4 text-gray-700 font-medium whitespace-nowrap">
                      {branch.total_rooms ?? '—'}
                    </td>

                    {/* Occupied */}
                    <td className="py-4 px-4 text-gray-700 font-medium whitespace-nowrap">
                      {branch.occupied_rooms ?? 0}
                    </td>

                    {/* Available */}
                    <td className="py-4 px-4 text-gray-700 font-medium whitespace-nowrap">
                      {branch.available_rooms ?? branch.total_rooms ?? 0}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      {renderStatusBadge(branch.status)}
                    </td>

                    {/* Actions: Eye, Pencil, Trash */}
                    <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        {/* View Button */}
                        <button
                          type="button"
                          onClick={() => onView(branch)}
                          title="View Details"
                          className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-colors cursor-pointer"
                        >
                          <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="1.8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => onEdit(branch)}
                          title="Edit Branch"
                          className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:text-[#175C46] hover:border-gray-300 transition-colors cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => onDelete(branch)}
                          title="Delete Branch"
                          className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="1.8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer matching Figma */}
      <div className="border-t border-gray-100 px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-gray-500">
        <div>
          Showing {branches.length > 0 ? `${startRecord}-${endRecord}` : '0'} of {totalCount} Branches
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
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

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => {
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
        )}
      </div>
    </div>
  );
};

