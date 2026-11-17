'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Dialog } from 'primereact/dialog';
import { Visitor, VisitorLog } from '@/types/visitor';
import { visitorService } from '@/services/visitor.service';
import { StatusBadge } from '@/components/ui';
import { formatDateToDDMMYYYY } from '@/components/ui/app-date-picker';

interface VisitorDetailsModalProps {
  visible: boolean;
  onHide: () => void;
  visitorId?: number | string | null;
  visitor?: Visitor | null;
  onStatusChange?: (updated: Visitor) => void;
}

export const VisitorDetailsModal: React.FC<VisitorDetailsModalProps> = ({
  visible,
  onHide,
  visitorId,
  visitor,
}) => {
  const targetId = visitorId ?? visitor?.id ?? null;

  const [fetchedVisitor, setFetchedVisitor] = useState<Visitor | null>(visitor || null);
  const [loading, setLoading] = useState<boolean>(() => !visitor && Boolean(targetId));

  // Fetch full visitor record including logs
  useEffect(() => {
    if (!visible || !targetId) return;

    let isMounted = true;
    visitorService
      .getVisitorById(targetId)
      .then((data) => {
        if (!isMounted) return;
        setFetchedVisitor(data || visitor || null);
      })
      .catch(() => {
        if (!isMounted) return;
        setFetchedVisitor(visitor || null);
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [visible, targetId, visitor]);

  const current = fetchedVisitor || visitor || null;

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      modal
      draggable={false}
      resizable={false}
      className="w-full max-w-xl mx-4 rounded-2xl overflow-hidden shadow-2xl border-0 font-sans"
      header={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E8F8F0] text-[#175C46] flex items-center justify-center shrink-0 shadow-2xs">
            <svg
              className="w-5 h-5 stroke-current"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900 tracking-tight leading-snug">
                Visitor Details
              </h2>
              {current?.pass_code && (
                <span className="font-mono text-[11px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-semibold">
                  {current.pass_code}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 font-normal mt-0.5">
              Pass overview & movement activity records
            </p>
          </div>
        </div>
      }
    >
      <div className="space-y-4 pt-1 text-xs sm:text-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <div className="w-8 h-8 border-3 border-[#175C46] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-gray-500">Loading visitor details...</p>
          </div>
        ) : !current ? (
          <div className="py-10 text-center text-gray-500 text-sm">
            No visitor details found.
          </div>
        ) : (
          <>
            {/* Top Profile Summary Card */}
            <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-gray-50/80 border border-gray-100">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-[#175C46]/10 text-[#175C46] flex items-center justify-center font-bold text-base shrink-0 border-2 border-white shadow-2xs relative">
                  {current.visitor_photo_url || current.visitor_photo ? (
                    <Image
                      src={current.visitor_photo_url || current.visitor_photo || ''}
                      alt={current.visitor_name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    current.visitor_name ? current.visitor_name.charAt(0).toUpperCase() : 'V'
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm sm:text-base font-bold text-gray-900 truncate">
                    {current.visitor_name}
                  </h4>
                  <p className="text-xs text-gray-500 font-medium">{current.visitor_phone}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] font-medium text-gray-600 bg-white px-2 py-0.5 rounded border border-gray-200/80">
                      {current.purpose}
                    </span>
                    {current.branch?.name && (
                      <span className="text-[11px] text-gray-400 truncate">
                        • {current.branch.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="shrink-0 flex flex-col items-end gap-1.5 pl-2">
                <StatusBadge status={current.status} />
                {current.is_on_site && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    On-Site
                  </span>
                )}
              </div>
            </div>

            {/* Visit Timing & Schedule Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-[#FAFBFB] border border-gray-100">
              <div>
                <span className="text-[11px] text-gray-400 block font-medium">Visit Date</span>
                <span className="text-xs sm:text-sm text-gray-800 font-semibold mt-0.5 block truncate">
                  {formatDateToDDMMYYYY(current.visit_date)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-gray-400 block font-medium">Valid Until</span>
                <span className="text-xs sm:text-sm text-gray-800 font-semibold mt-0.5 block truncate">
                  {formatDateToDDMMYYYY(current.valid_until || current.visit_date)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-gray-400 block font-medium">Entry Time</span>
                <span className="text-xs sm:text-sm text-gray-800 font-semibold mt-0.5 block truncate">
                  {current.entry_time || current.last_entry_time || '—'}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-gray-400 block font-medium">Exit Time</span>
                <span className="text-xs sm:text-sm text-gray-800 font-semibold mt-0.5 block truncate">
                  {current.exit_time || current.last_exit_time || '—'}
                </span>
              </div>
            </div>

            {/* Host Resident & QR Code Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Host Resident */}
              <div className="sm:col-span-2 p-3.5 rounded-xl border border-gray-100 bg-[#FAFBFB] space-y-1.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Host Resident & Room
                </span>
                <div className="space-y-1">
                  <div className="font-bold text-gray-900 text-xs sm:text-sm truncate">
                    {current.resident?.name || current.host_resident || 'Resident not assigned'}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
                    <span>
                      Room:{' '}
                      <strong className="font-bold text-[#175C46]">
                        {current.room?.room_no || '—'}
                      </strong>
                    </span>
                    {current.room?.room_type && (
                      <span>
                        Type:{' '}
                        <strong className="font-semibold text-gray-800 capitalize">
                          {current.room.room_type}
                        </strong>
                      </span>
                    )}
                    {current.resident?.phone && (
                      <span>
                        Phone:{' '}
                        <strong className="font-semibold text-gray-800">
                          {current.resident.phone}
                        </strong>
                      </span>
                    )}
                  </div>
                  {current.pg?.name && (
                    <div className="text-[11px] text-gray-400 pt-0.5 truncate">
                      {current.pg.name}{current.pg.city ? `, ${current.pg.city}` : ''}
                    </div>
                  )}
                </div>
              </div>

              {/* Security QR Code */}
              <div className="p-3.5 rounded-xl border border-gray-100 bg-[#FAFBFB] flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">
                  Security Pass QR
                </span>
                {current.qr_code ? (
                  <div className="w-18 h-18 bg-white p-1 rounded-lg border border-gray-200 shadow-2xs relative">
                    <Image
                      src={current.qr_code}
                      alt="Gate QR Code"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="w-18 h-18 bg-white rounded-lg border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400">
                    <svg className="w-6 h-6 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                  </div>
                )}
                <span className="font-mono text-[10px] text-gray-600 font-semibold mt-1">
                  {current.pass_code}
                </span>
              </div>
            </div>

            {/* Movement Activity Logs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Movement Activity Logs
                </span>
                <span className="text-[11px] text-gray-400 font-medium">
                  Total Entries: {current.total_entries || current.entry_exit_logs?.length || 0}
                </span>
              </div>

              {(!current.entry_exit_logs || current.entry_exit_logs.length === 0) ? (
                <div className="py-5 text-center text-gray-400 bg-gray-50/50 rounded-xl border border-dashed border-gray-200 text-xs">
                  No movement logs recorded yet.
                </div>
              ) : (
                <div className="space-y-2 max-h-[170px] overflow-y-auto pr-1 custom-scrollbar">
                  {current.entry_exit_logs.map((log: VisitorLog, idx: number) => {
                    const isEntry = log.type === 'entry' || log.direction === 'IN';
                    return (
                      <div
                        key={log.id || idx}
                        className="flex items-center justify-between p-2.5 rounded-lg border border-gray-100 bg-white hover:bg-gray-50/60 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-[10px] font-bold ${
                              isEntry
                                ? 'bg-[#E8F8F0] text-[#175C46]'
                                : 'bg-rose-50 text-rose-600'
                            }`}
                          >
                            {isEntry ? 'IN' : 'OUT'}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800 text-xs">
                              {isEntry ? 'Entry Check-in' : 'Exit Check-out'}
                              {log.gate_name ? ` (${log.gate_name})` : ''}
                            </div>
                            <div className="text-[10px] text-gray-400">
                              Logged by: {log.logged_by_name || 'Security Gate'}
                              {log.notes ? ` • ${log.notes}` : ''}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-semibold text-gray-700 block">
                            {log.log_time}
                          </span>
                          <span className="text-[10px] text-gray-400 block">
                            {formatDateToDDMMYYYY(log.log_date || log.created_at)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-end pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onHide}
            className="px-5 py-2.5 text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200/80 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </Dialog>
  );
};
