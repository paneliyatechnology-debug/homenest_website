'use client';

import React, { useEffect, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Notice } from '@/types/notice';
import { noticeService } from '@/services/notice.service';
import {
  StatusBadge,
  ModalHeader,
  AttachmentPreviewModal,
  formatDateToDDMMYYYY,
  formatDateTimeToDDMMYYYY,
} from '@/components/ui';
import {
  resolveFileUrl,
  formatFileSize,
  isImageFile,
  isPdfFile,
  getFileExtension,
} from '@/lib/file-utils';

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
  const [previewOpen, setPreviewOpen] = useState(false);

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

  // Resolve attachment details
  const rawAttachmentUrl = current?.attachment?.file_url || current?.file_url || '';
  const attachmentUrl = resolveFileUrl(rawAttachmentUrl);
  const fileName = current?.attachment?.file_name || current?.file_name || 'Attached File';
  const fileSize = formatFileSize(current?.attachment?.file_size);
  const isImage = isImageFile(fileName, attachmentUrl);
  const isPdf = isPdfFile(fileName, attachmentUrl);
  const ext = getFileExtension(fileName, attachmentUrl);
  const hasAttachment = Boolean(
    current?.has_attachment || current?.attachment || current?.file_url
  );

  const previewAttachments =
    hasAttachment && attachmentUrl
      ? [
          {
            id: current?.id || 1,
            name: fileName,
            file_name: fileName,
            url: attachmentUrl,
            file_url: attachmentUrl,
            size: fileSize,
            file_size: fileSize,
          },
        ]
      : [];

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

  return (
    <>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-white border border-gray-100 shadow-2xs">
              <div>
                <span className="text-[11px] font-semibold text-gray-400 block uppercase tracking-wider mb-1">
                  Schedule Date
                </span>
                <span className="text-gray-800 font-medium">
                  {formatDateTimeToDDMMYYYY(
                    current.schedule_date || current.scheduled_at || current.date_time || current.created_at
                  )}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-gray-400 block uppercase tracking-wider mb-1">
                  Sent At
                </span>
                <span className="text-gray-800 font-medium">
                  {current.sent_at
                    ? formatDateTimeToDDMMYYYY(current.sent_at)
                    : current.status === 'sent'
                    ? formatDateTimeToDDMMYYYY(current.date_time || current.schedule_date) || 'Sent'
                    : 'Not sent yet'}
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

            {/* Attachment Preview Section */}
            {hasAttachment && (
              <div className="p-3.5 rounded-xl border border-gray-100 bg-white space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-[#175C46]/10 text-[#175C46] flex items-center justify-center shrink-0">
                      <svg className="w-3.5 h-3.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                    </div>
                    <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                      Attachment Preview
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {attachmentUrl && (
                      <button
                        type="button"
                        onClick={() => setPreviewOpen(true)}
                        className="text-[11px] font-semibold text-[#175C46] hover:text-[#124B38] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>Enlarge</span>
                        <svg className="w-3 h-3 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </button>
                    )}
                    {attachmentUrl && <span className="text-gray-300">•</span>}
                    {attachmentUrl && (
                      <a
                        href={attachmentUrl}
                        download={fileName}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-semibold text-[#175C46] hover:text-[#124B38] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <svg className="w-3 h-3 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span>Download</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* If Image: Visual preview card with hover effect matching Payments and Complaints */}
                {isImage && attachmentUrl ? (
                  <div
                    onClick={() => setPreviewOpen(true)}
                    className="group relative rounded-xl border border-gray-200 overflow-hidden bg-gray-50 cursor-pointer flex flex-col items-center justify-center hover:border-[#175C46]/40 transition-all shadow-2xs"
                  >
                    <img
                      src={attachmentUrl}
                      alt={fileName}
                      className="w-full max-h-56 sm:max-h-60 object-contain transition-transform duration-300 group-hover:scale-[1.01]"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white">
                      <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm">
                        <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                        <span>Click to preview image</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* If PDF or Other Document: Standardized Document Card matching Complaints / Residents */
                  <div
                    onClick={() => attachmentUrl && setPreviewOpen(true)}
                    className="p-3 rounded-xl border border-gray-200/90 bg-gray-50/60 hover:bg-white hover:border-[#175C46]/40 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={`w-11 h-11 rounded-lg shrink-0 flex items-center justify-center ${
                          isPdf ? 'bg-rose-50 text-rose-600' : 'bg-[#E8F8F0] text-[#175C46]'
                        }`}
                      >
                        {isPdf ? (
                          <i className="pi pi-file-pdf text-xl" />
                        ) : (
                          <i className="pi pi-file text-xl" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-gray-900 group-hover:text-[#175C46] transition-colors truncate">
                          {fileName}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-gray-100 text-gray-600">
                            {ext}
                          </span>
                          {fileSize && <span className="text-xs text-gray-400">{fileSize}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewOpen(true);
                        }}
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-[#175C46] hover:bg-[#E8F8F0] rounded-lg transition-colors cursor-pointer"
                        title="Preview attachment"
                      >
                        <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                      {attachmentUrl && (
                        <a
                          href={attachmentUrl}
                          download={fileName}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-[#175C46] hover:bg-[#E8F8F0] rounded-lg transition-colors shrink-0"
                          title="Download attachment"
                        >
                          <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* File info footer row */}
                <div className="flex items-center justify-between text-xs pt-0.5 px-0.5 text-gray-500">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-gray-100 text-gray-600">
                      {ext}
                    </span>
                    <span className="truncate max-w-[280px] font-medium text-gray-700">
                      {fileName}
                    </span>
                    {fileSize && <span className="text-gray-400 text-[11px]">• {fileSize}</span>}
                  </div>
                  {attachmentUrl && (
                    <button
                      type="button"
                      onClick={() => setPreviewOpen(true)}
                      className="text-[11px] font-semibold text-[#175C46] hover:underline cursor-pointer"
                    >
                      Open Preview
                    </button>
                  )}
                </div>
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

    {/* Universal Attachment Preview Lightbox Modal */}
    {hasAttachment && previewAttachments.length > 0 && (
      <AttachmentPreviewModal
        visible={previewOpen}
        onHide={() => setPreviewOpen(false)}
        attachments={previewAttachments}
      />
    )}
  </>
  );
};
