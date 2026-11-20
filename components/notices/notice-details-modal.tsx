'use client';

import React, { useEffect, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Notice } from '@/types/notice';
import { noticeService } from '@/services/notice.service';
import { StatusBadge, ModalHeader } from '@/components/ui';

interface NoticeDetailsModalProps {
  visible: boolean;
  onHide: () => void;
  noticeId?: number | string | null;
  notice?: Notice | null;
  onNoticeSent?: () => void;
  onEditNotice?: (notice: Notice) => void;
}

export const NoticeDetailsModal: React.FC<NoticeDetailsModalProps> = ({
  visible,
  onHide,
  noticeId,
  notice,
  onNoticeSent,
  onEditNotice,
}) => {
  const targetId = noticeId ?? notice?.id ?? null;

  const [fetchedNotice, setFetchedNotice] = useState<Notice | null>(notice || null);
  const [loading, setLoading] = useState<boolean>(() => !notice && Boolean(targetId));
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!visible || !targetId) return;

    let isMounted = true;
    noticeService
      .getNoticeById(targetId)
      .then((data) => {
        if (!isMounted) return;
        setFetchedNotice(data || notice || null);
      })
      .catch(() => {
        if (!isMounted) return;
        setFetchedNotice(notice || null);
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [visible, targetId, notice]);

  const current = fetchedNotice || notice || null;

  const handleSendNow = async () => {
    if (!current?.id || isSending) return;
    try {
      setIsSending(true);
      await noticeService.sendNotice(current.id);
      if (onNoticeSent) onNoticeSent();
      onHide();
    } catch {
      // apiClient handles backend errors
    } finally {
      setIsSending(false);
    }
  };

  const getAttachmentUrl = (url?: string | null) => {
    if (!url) return '';
    return url;
  };

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      modal
      draggable={false}
      resizable={false}
      className="w-full max-w-xl mx-4 rounded-2xl overflow-hidden shadow-2xl border-0 font-sans"
      header={
        <ModalHeader
          title={
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900 tracking-tight leading-snug">
                Notice Details
              </h2>
              {current?.status && <StatusBadge status={current.status} />}
            </div>
          }
          subtitle="Notice summary, broadcast target & schedule details"
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
                d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
              />
            </svg>
          }
        />
      }
    >
      <div className="space-y-4 pt-1 text-xs sm:text-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <div className="w-8 h-8 border-3 border-[#175C46] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-gray-500">Loading notice details...</p>
          </div>
        ) : !current ? (
          <div className="py-10 text-center text-gray-500 text-sm">
            No notice details found.
          </div>
        ) : (
          <>
            {/* Title & Priority Card */}
            <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-100 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-bold text-gray-900 leading-snug">
                  {current.title}
                </h3>
                {current.priority && (
                  <StatusBadge status={current.priority} label={current.priority} />
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 pt-1">
                <span className="flex items-center gap-1 font-medium text-gray-700">
                  <span className="text-gray-400">Category:</span> {current.category || 'General'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-medium text-gray-700">
                  <span className="text-gray-400">Audience:</span> {current.audience || 'All Residents'}
                </span>
                {current.branch_name && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-medium text-gray-700">
                      <span className="text-gray-400">Branch:</span> {current.branch_name}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Schedule / Sent Metadata */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-white border border-gray-100 shadow-2xs">
              <div>
                <span className="text-[11px] font-semibold text-gray-400 block uppercase tracking-wider mb-1">
                  Schedule Date
                </span>
                <span className="text-gray-800 font-medium">
                  {current.schedule_date || current.date_time || current.scheduled_at || '—'}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-gray-400 block uppercase tracking-wider mb-1">
                  Sent At
                </span>
                <span className="text-gray-800 font-medium">
                  {current.sent_at || (current.status === 'sent' ? current.date_time || 'Sent' : 'Not sent yet')}
                </span>
              </div>
            </div>

            {/* Notice Content */}
            <div className="p-4 rounded-xl bg-white border border-gray-100 shadow-2xs space-y-2">
              <span className="text-[11px] font-semibold text-gray-400 block uppercase tracking-wider">
                Message Content
              </span>
              <p className="text-gray-700 whitespace-pre-line leading-relaxed text-xs sm:text-sm">
                {current.content || current.summary || 'No content provided.'}
              </p>
            </div>

            {/* Attachment if present */}
            {(current.has_attachment || current.attachment || current.file_url) && (
              <div className="p-3.5 rounded-xl bg-gray-50/80 border border-gray-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 text-[#175C46] flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                      {current.attachment?.file_name || current.file_name || 'Attached File'}
                    </p>
                    {current.attachment?.file_size && (
                      <p className="text-[11px] text-gray-500">
                        {current.attachment.file_size}
                      </p>
                    )}
                  </div>
                </div>

                <a
                  href={getAttachmentUrl(current.attachment?.file_url || current.file_url)}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="px-3 py-1.5 text-xs font-semibold text-[#175C46] hover:bg-emerald-50 rounded-lg transition-colors flex items-center gap-1 shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </a>
              </div>
            )}

            {/* Modal Footer */}
            <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onHide}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>

              {onEditNotice && (
                <button
                  type="button"
                  onClick={() => {
                    onHide();
                    onEditNotice(current);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer"
                >
                  Edit Notice
                </button>
              )}

              <button
                type="button"
                disabled={isSending}
                onClick={handleSendNow}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#175C46] hover:bg-[#124b38] rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSending ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
                {current.status === 'sent' ? 'Resend Notice' : 'Send Now'}
              </button>
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
};
