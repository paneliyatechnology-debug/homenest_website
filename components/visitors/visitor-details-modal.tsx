'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Dialog } from 'primereact/dialog';
import { Visitor, VisitorLog } from '@/types/visitor';
import { ResidentRoomInfo } from '@/types/resident';
import { visitorService } from '@/services/visitor.service';
import { residentService } from '@/services/resident.service';
import { StatusBadge, ModalHeader } from '@/components/ui';
import { formatDateToDDMMYYYY } from '@/components/ui/app-date-picker';

function formatDisplayDate(val?: string | null): string {
  if (!val) return '—';
  const formatted = formatDateToDDMMYYYY(val);
  return formatted && formatted !== '—' ? formatted.split(' ')[0] : '—';
}

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
  const [isQrZoomed, setIsQrZoomed] = useState<boolean>(false);
  const [residentRoomInfo, setResidentRoomInfo] = useState<ResidentRoomInfo | null>(null);

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

  // If resident room doesn't have building/floor populated directly, fetch full resident stay details
  useEffect(() => {
    const residentId = current?.resident?.id;
    if (visible && residentId && (!current?.room?.building_name || !current?.room?.floor_name)) {
      let isMounted = true;
      residentService
        .getResidentById(residentId)
        .then((detail) => {
          if (isMounted && detail?.room_info) {
            setResidentRoomInfo(detail.room_info);
          }
        })
        .catch(() => {});

      return () => {
        isMounted = false;
      };
    }
  }, [visible, current?.resident?.id, current?.room?.building_name, current?.room?.floor_name]);

  // Derived location values
  const displayBranchName =
    current?.branch?.name ||
    residentRoomInfo?.branch_name ||
    current?.pg?.name ||
    '—';

  const displayBuildingName =
    current?.room?.building_name ||
    residentRoomInfo?.building_name ||
    '—';

  const displayFloorName =
    current?.room?.floor_name ||
    residentRoomInfo?.floor_name ||
    (current?.room?.floor_number !== undefined && current?.room?.floor_number !== null
      ? `Floor ${current.room.floor_number}`
      : residentRoomInfo?.floor_number !== undefined && residentRoomInfo?.floor_number !== null
      ? `Floor ${residentRoomInfo.floor_number}`
      : '—');

  const displayRoomNo =
    current?.room?.room_no ||
    residentRoomInfo?.room_no ||
    '—';

  const displayRoomType =
    current?.room?.room_type ||
    residentRoomInfo?.room_type ||
    '';

  const displayResidentPhone =
    current?.resident?.phone ||
    '';

  return (
    <>
      <Dialog
        visible={visible}
        onHide={onHide}
        modal
        draggable={false}
        resizable={false}
        className="w-full max-w-2xl mx-4 rounded-2xl overflow-hidden shadow-2xl border-0 font-sans"
      header={
        <ModalHeader
          title={
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
          }
          subtitle="Pass overview & movement activity records"
          icon={
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
          }
        />
      }
    >
      <div className="space-y-3 pt-0.5 text-xs sm:text-sm">
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
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/80 border border-gray-100">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-full overflow-hidden bg-[#175C46]/10 text-[#175C46] flex items-center justify-center font-bold text-base shrink-0 border-2 border-white shadow-2xs relative">
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
                  <h4 className="text-sm font-bold text-gray-900 truncate">
                    {current.visitor_name}
                  </h4>
                  <p className="text-xs text-gray-500 font-medium">{current.visitor_phone}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] font-medium text-gray-600 bg-white px-2 py-0.5 rounded border border-gray-200/80">
                      {current.purpose}
                    </span>
                    {displayBranchName && displayBranchName !== '—' && (
                      <span className="text-[11px] text-gray-400 truncate">
                        • {displayBranchName}
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

            {/* Visit Details & Security Pass QR Row */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-stretch">
              {/* Left Column (sm:col-span-6): Timing Schedule, Host Resident & Admin Notes */}
              <div className="sm:col-span-6 p-4 rounded-xl border border-gray-100 bg-[#FAFBFB] flex flex-col justify-between space-y-3">
                {/* 1. Visit Schedule & Timing */}
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                    Visit Schedule & Timing
                  </span>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                    <div>
                      <span className="text-[10px] text-gray-400 block font-medium">Visit Date</span>
                      <span className="text-xs sm:text-sm font-semibold text-gray-800 mt-0.5 block truncate">
                        {formatDisplayDate(current.visit_date)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block font-medium">Valid Until</span>
                      <span className="text-xs sm:text-sm font-semibold text-gray-800 mt-0.5 block truncate">
                        {formatDisplayDate(current.valid_until || current.visit_date)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block font-medium">Entry Time</span>
                      <span className="text-xs sm:text-sm font-semibold text-gray-800 mt-0.5 block truncate">
                        {current.entry_time || current.last_entry_time || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block font-medium">Exit Time</span>
                      <span className="text-xs sm:text-sm font-semibold text-gray-800 mt-0.5 block truncate">
                        {current.exit_time || current.last_exit_time || '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Host Resident & Room */}
                <div className="pt-2.5 border-t border-gray-200/60">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Host Resident & Room
                  </span>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-bold text-gray-900 text-xs sm:text-sm truncate">
                        {current.resident?.name || current.host_resident || 'Resident not assigned'}
                      </div>
                      {displayResidentPhone && (
                        <div className="text-[11px] text-gray-600 shrink-0">
                          Phone: <strong className="font-semibold text-gray-800">{displayResidentPhone}</strong>
                        </div>
                      )}
                    </div>

                    {/* Location Details Matrix: Branch, Building, Floor, Room */}
                    <div className="grid grid-cols-2 gap-x-2.5 gap-y-1.5 p-2 rounded-lg bg-white/90 border border-gray-100 shadow-2xs text-xs">
                      <div>
                        <span className="text-[10px] text-gray-400 block font-medium">Branch</span>
                        <span className="text-xs font-semibold text-gray-800 truncate block">
                          {displayBranchName}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block font-medium">Building</span>
                        <span className="text-xs font-semibold text-gray-800 truncate block">
                          {displayBuildingName}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block font-medium">Floor</span>
                        <span className="text-xs font-semibold text-gray-800 truncate block">
                          {displayFloorName}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block font-medium">Room</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-bold text-[#175C46] bg-[#E8F8F0] px-1.5 py-0.5 rounded border border-[#C6ECD9] text-xs">
                            {displayRoomNo}
                          </span>
                          {displayRoomType && (
                            <span className="text-[10px] text-gray-500 font-medium capitalize truncate">
                              ({displayRoomType})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {current.pg?.name && (
                      <div className="text-[11px] text-gray-400 pt-0.5 truncate">
                        {current.pg.name}{current.pg.city ? `, ${current.pg.city}` : ''}
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Admin Notes */}
                <div className="pt-2.5 border-t border-gray-200/60">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
                    Admin Notes
                  </span>
                  <p className="text-xs text-gray-800 leading-relaxed font-medium whitespace-pre-line break-words">
                    {current.admin_notes?.trim() ||
                      (current as any).notes?.trim() ||
                      (current as any).remarks?.trim() || (
                        <span className="text-gray-400 font-normal">—</span>
                      )}
                  </p>
                </div>
              </div>

              {/* Right Column (sm:col-span-6): Security Pass QR */}
              <div className="sm:col-span-6 p-4 rounded-xl border border-gray-100 bg-[#FAFBFB] flex flex-col items-center justify-between text-center gap-2">
                <div className="w-full flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Security Pass QR
                  </span>
                  {current.qr_code && (
                    <button
                      type="button"
                      onClick={() => setIsQrZoomed(true)}
                      title="Enlarge QR Code"
                      className="text-[11px] font-semibold text-[#175C46] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                      </svg>
                      Zoom
                    </button>
                  )}
                </div>

                {current.qr_code ? (
                  <button
                    type="button"
                    onClick={() => setIsQrZoomed(true)}
                    title="Click to view full-size QR code"
                    className="relative w-48 h-48 sm:w-52 sm:h-52 bg-white p-3 rounded-2xl border border-gray-200/90 shadow-2xs hover:shadow-md hover:border-[#175C46]/60 transition-all cursor-pointer flex items-center justify-center shrink-0 my-auto"
                  >
                    <Image
                      src={current.qr_code}
                      alt="Gate QR Code"
                      fill
                      className="object-contain p-1 [image-rendering:pixelated]"
                      unoptimized
                    />
                  </button>
                ) : (
                  <div className="w-48 h-48 sm:w-52 sm:h-52 bg-white rounded-2xl border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 p-4 space-y-2 shrink-0 my-auto">
                    <svg className="w-8 h-8 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                    <span className="text-[11px] text-gray-400 font-medium">QR not available</span>
                  </div>
                )}

                <div className="space-y-0.5">
                  <span className="font-mono text-xs sm:text-sm font-bold text-gray-800 tracking-wide block">
                    {current.pass_code}
                  </span>
                  <p className="text-[10px] text-gray-400 font-medium">
                    Scan for gate entry / exit check-in
                  </p>
                </div>
              </div>
            </div>

            {/* Movement Activity Logs */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Movement Activity Logs
                </span>
                <span className="text-[11px] text-gray-400 font-medium">
                  Total Entries: {current.total_entries || current.entry_exit_logs?.length || 0}
                </span>
              </div>

              {(!current.entry_exit_logs || current.entry_exit_logs.length === 0) ? (
                <div className="py-3 text-center text-gray-400 bg-gray-50/50 rounded-xl border border-dashed border-gray-200 text-xs">
                  No movement logs recorded yet.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1 custom-scrollbar">
                  {current.entry_exit_logs.map((log: VisitorLog, idx: number) => {
                    const isEntry = log.type === 'entry' || log.direction === 'IN';
                    return (
                      <div
                        key={log.id || idx}
                        className="flex items-center justify-between p-2 rounded-lg border border-gray-100 bg-white hover:bg-gray-50/60 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-[10px] font-bold ${
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
        <div className="flex items-center justify-end pt-2.5 border-t border-gray-100">
          <button
            type="button"
            onClick={onHide}
            className="px-5 py-2 text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200/80 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </Dialog>

    {/* High-Resolution QR Code Zoom Lightbox Modal */}
    {current?.qr_code && (
      <Dialog
        visible={isQrZoomed}
        onHide={() => setIsQrZoomed(false)}
        modal
        draggable={false}
        resizable={false}
        className="w-full max-w-md mx-4 rounded-2xl overflow-hidden shadow-2xl border-0 font-sans"
        header={
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Passcode:
            </span>
            <span className="font-mono text-xs font-bold text-[#175C46] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {current.pass_code}
            </span>
          </div>
        }
      >
        <div className="flex flex-col items-center justify-center p-3 sm:p-5 space-y-4">
          <div className="relative w-72 h-72 sm:w-80 sm:h-80 bg-white p-4 rounded-2xl border-2 border-gray-200 shadow-md">
            <Image
              src={current.qr_code}
              alt="Enlarged Gate QR Code"
              fill
              className="object-contain p-2 [image-rendering:pixelated]"
              unoptimized
            />
          </div>
          <div className="text-center space-y-0.5">
            <p className="text-sm font-bold text-gray-900">{current.visitor_name}</p>
            <p className="text-xs text-gray-500">Hold camera or gate scanner up to scan</p>
          </div>
          <button
            type="button"
            onClick={() => setIsQrZoomed(false)}
            className="w-full py-2.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </Dialog>
    )}
  </>
  );
};
