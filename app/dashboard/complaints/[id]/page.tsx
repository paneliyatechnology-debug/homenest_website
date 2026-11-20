'use client';

import React, { Suspense, use, useEffect, useState, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Dialog } from 'primereact/dialog';
import { ProgressSpinner } from 'primereact/progressspinner';
import {
  Complaint,
  ComplaintStatus,
  ComplaintTimelineItem,
} from '@/types/complaint';
import { StaffMember } from '@/types/staff';
import { complaintService } from '@/services/complaint.service';
import { staffService } from '@/services/staff.service';
import {
  StatusBadge,
  BackButton,
  Button,
  AppDatePicker,
  AttachmentPreviewModal,
} from '@/components/ui';
import { ComplaintCategoryIcon } from '@/components/complaints/complaint-category-icon';
import { StaffAssignmentDropdown } from '@/components/complaints/staff-assignment-dropdown';
import {
  resolveFileUrl,
  formatFileSize,
  isImageFile,
  isPdfFile,
  getFileExtension,
} from '@/lib/file-utils';
import { toast } from '@/lib/toast';
import { useSocketEvent, SOCKET_EVENTS } from '@/hooks';

const STATUS_OPTIONS: {
  value: ComplaintStatus;
  label: string;
  description: string;
  activeBorder: string;
  activeBg: string;
  icon: string;
}[] = [
  {
    value: 'PENDING',
    label: 'Pending',
    description: 'Awaiting initial review or staff assignment',
    activeBorder: 'border-amber-500',
    activeBg: 'bg-amber-50/50',
    icon: 'pi pi-clock text-amber-600',
  },
  {
    value: 'IN_PROGRESS',
    label: 'In Progress',
    description: 'Staff assigned and issue is actively being addressed',
    activeBorder: 'border-blue-500',
    activeBg: 'bg-blue-50/50',
    icon: 'pi pi-spinner text-blue-600',
  },
  {
    value: 'RESOLVED',
    label: 'Resolved',
    description: 'Issue has been inspected, fixed, and completed',
    activeBorder: 'border-[#175C46]',
    activeBg: 'bg-[#E8F8F0]/50',
    icon: 'pi pi-check-circle text-emerald-600',
  },
];

interface ComplaintDetailPageProps {
  params: Promise<{ id: string }>;
}

function formatDetailDateTime(dateStr?: string | null): string {
  if (!dateStr || !dateStr.trim()) return '—';

  // Format: "02-11-2026 16:26" or "02/11/2026 16:26"
  const match = dateStr.match(/^(\d{2})[-/](\d{2})[-/](\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (match) {
    const day = match[1];
    const month = match[2];
    const year = match[3];
    const hours = match[4] ? match[4] : '';
    const minutes = match[5] ? match[5] : '';
    const timeStr = hours ? ` ${hours}:${minutes}` : '';
    return `${day}/${month}/${year}${timeStr}`;
  }

  // Format: "2026-11-02T16:26:00.000Z"
  const isoMatch = dateStr.match(/^(\d{4})[-/](\d{2})[-/](\d{2})(?:[T\s](\d{1,2}):(\d{2}))?/);
  if (isoMatch) {
    const year = isoMatch[1];
    const month = isoMatch[2];
    const day = isoMatch[3];
    const hours = isoMatch[4] ? isoMatch[4] : '';
    const minutes = isoMatch[5] ? isoMatch[5] : '';
    const timeStr = hours ? ` ${hours}:${minutes}` : '';
    return `${day}/${month}/${year}${timeStr}`;
  }

  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  return dateStr;
}

function formatTimelineDescription(desc?: string): string {
  if (!desc) return '';
  return desc.replace(/(\d{4})[-/](\d{2})[-/](\d{2})/g, '$3/$2/$1');
}

export default function ComplaintDetailPage({ params }: ComplaintDetailPageProps) {
  return (
    <Suspense
      fallback={
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 max-w-[1600px] w-full mx-auto space-y-6 bg-[#F7F7F5]">
          <div className="p-24 flex flex-col items-center justify-center gap-3">
            <ProgressSpinner style={{ width: '40px', height: '40px' }} strokeWidth="3" />
            <span className="text-xs text-gray-500 font-medium">Loading complaint details...</span>
          </div>
        </main>
      }
    >
      <ComplaintDetailContent params={params} />
    </Suspense>
  );
}

function ComplaintDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const complaintId = resolvedParams?.id;
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromParam = searchParams.get('from');
  const returnToParam = searchParams.get('returnTo');
  const residentIdParam = searchParams.get('residentId');

  // Main state
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Compute back navigation destination dynamically
  const backHref = useMemo(() => {
    if (returnToParam) return returnToParam;
    const targetResidentId = residentIdParam || (fromParam === 'resident' ? complaint?.resident?.id : null);
    if ((fromParam === 'resident' || targetResidentId) && targetResidentId) {
      return `/dashboard/residents/${targetResidentId}?tab=Complaints`;
    }
    return '/dashboard/complaints';
  }, [returnToParam, fromParam, residentIdParam, complaint?.resident?.id]);

  const handleBackNavigation = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (fromParam === 'resident' || returnToParam) {
      router.push(backHref);
    } else if (typeof window !== 'undefined' && document.referrer && document.referrer.includes('/dashboard/residents/')) {
      router.back();
    } else {
      router.push(backHref);
    }
  };

  // Assignment state
  const [assignedStaffId, setAssignedStaffId] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Status Dialog State
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<ComplaintStatus>('IN_PROGRESS');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Bottom Quick Notes
  const [bottomNotes, setBottomNotes] = useState('');
  const [isSubmittingNotes, setIsSubmittingNotes] = useState(false);

  // File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  // Attachment View Mode & Preview Modal State
  const [attachmentViewMode, setAttachmentViewMode] = useState<'grid' | 'list'>('grid');
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  const handleOpenPreview = (index: number) => {
    setPreviewIndex(index);
    setPreviewModalVisible(true);
  };

  // Open Status Dialog
  const handleOpenStatusDialog = () => {
    if (complaint?.status) {
      setTargetStatus(complaint.status as ComplaintStatus);
    }
    setResolutionNotes('');
    setIsStatusDialogOpen(true);
  };

  // Fetch Complaint details and Staff members
  const fetchComplaintData = async () => {
    if (!complaintId) return;
    try {
      const data = await complaintService.getComplaintById(complaintId);
      if (data) {
        setComplaint(data);
        if (data.assigned_to?.id) {
          setAssignedStaffId(String(data.assigned_to.id));
        }
        if (data.due_date) {
          // Extract YYYY-MM-DD or keep date
          const dateOnly = data.due_date.split(' ')[0];
          setDueDate(dateOnly);
        }
      }
    } catch (err) {
      console.warn('Failed to load complaint detail:', err);
    }
  };

  // Real-time WebSocket updates for this specific complaint
  useSocketEvent<{ id: number | string }>(SOCKET_EVENTS.COMPLAINT_STATUS_UPDATED, (data) => {
    if (String(data?.id) === String(complaintId)) {
      fetchComplaintData();
    }
  });

  useSocketEvent<{ id: number | string }>(SOCKET_EVENTS.COMPLAINT_ACTIVITY, (data) => {
    if (String(data?.id) === String(complaintId)) {
      fetchComplaintData();
    }
  });

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      complaintService.getComplaintById(complaintId),
      staffService.getStaffList({ limit: 100 }),
    ])
      .then(([complaintData, staffRes]) => {
        if (!isMounted) return;
        if (complaintData) {
          setComplaint(complaintData);
          if (complaintData.assigned_to?.id) {
            setAssignedStaffId(String(complaintData.assigned_to.id));
          }
          if (complaintData.due_date) {
            const dateOnly = complaintData.due_date.split(' ')[0];
            setDueDate(dateOnly);
          }
        }
        setStaffList(staffRes.data || []);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('Failed to load complaint data:', err);
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [complaintId]);

  // Handle Assignment Submission
  const handleSaveAssignment = async () => {
    if (!complaintId || !assignedStaffId) {
      toast.error('Please select a staff member to assign.');
      return;
    }

    try {
      setIsAssigning(true);
      await complaintService.assignComplaint(complaintId, {
        assigned_to_user_id: Number(assignedStaffId),
        due_date: dueDate ? `${dueDate}T18:00:00.000Z` : undefined,
      });
      await fetchComplaintData();
    } catch (err) {
      console.warn('Failed to assign complaint:', err);
    } finally {
      setIsAssigning(false);
    }
  };

  // Handle Status Update
  const handleUpdateStatus = async () => {
    if (!complaintId) return;

    try {
      setIsUpdatingStatus(true);
      await complaintService.updateStatus(complaintId, {
        status: targetStatus,
        resolution_notes: resolutionNotes.trim() || undefined,
      });
      setIsStatusDialogOpen(false);
      setResolutionNotes('');
      await fetchComplaintData();
    } catch (err) {
      console.warn('Failed to update status:', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handle Bottom Notes submission
  const handlePostNotes = async () => {
    if (!complaintId || !bottomNotes.trim()) return;

    try {
      setIsSubmittingNotes(true);
      const fd = new FormData();
      fd.append('notes', bottomNotes.trim());
      await complaintService.addUpdate(complaintId, fd);
      setBottomNotes('');
      await fetchComplaintData();
    } catch (err) {
      console.warn('Failed to post update notes:', err);
    } finally {
      setIsSubmittingNotes(false);
    }
  };

  // Handle File Upload from screenshot dropzone
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !complaintId) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5MB limit.');
      return;
    }

    try {
      setIsUploadingFile(true);
      const fd = new FormData();
      fd.append('notes', `Attached screenshot: ${file.name}`);
      fd.append('attachments', file);
      await complaintService.addUpdate(complaintId, fd);
      await fetchComplaintData();
    } catch (err) {
      console.warn('Failed to upload screenshot:', err);
    } finally {
      setIsUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (loading) {
    return (
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 max-w-[1600px] w-full mx-auto space-y-6 bg-[#F7F7F5]">
        <div className="p-24 flex flex-col items-center justify-center gap-3">
          <ProgressSpinner style={{ width: '40px', height: '40px' }} strokeWidth="3" />
          <span className="text-xs text-gray-500 font-medium">Loading complaint details...</span>
        </div>
      </main>
    );
  }

  if (!complaint) {
    return (
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 max-w-[1600px] w-full mx-auto space-y-6 bg-[#F7F7F5]">
        <BackButton
          href={backHref}
          title={backHref.includes('/residents/') ? 'Back to Resident Details' : 'Back to Complaints'}
          onClick={handleBackNavigation}
        />
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-sm font-medium text-gray-600">Complaint not found.</p>
        </div>
      </main>
    );
  }

  const categoryName = complaint.category?.name || 'General';
  const categoryKey = complaint.category?.key || 'other';
  const residentName = complaint.resident?.name || 'Resident';
  const residentContact = complaint.resident?.phone || complaint.resident?.email || '';

  // Location string
  const locParts = [
    complaint.location?.branch_name,
    complaint.location?.building_name,
    complaint.location?.floor_number ? `Floor ${complaint.location.floor_number}` : null,
    complaint.location?.room_no ? `Room ${complaint.location.room_no}` : null,
  ].filter(Boolean);
  const locationText = locParts.length > 0 ? locParts.join(' | ') : 'Main Building | Floor 2';

  // Attachments
  const attachments = complaint.attachments || [];

  // Timeline events sorted chronologically
  const timelineEvents: ComplaintTimelineItem[] = complaint.timeline || [];

  return (
    <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 max-w-[1600px] w-full mx-auto space-y-5 bg-[#F7F7F5] min-h-screen pb-24">
      {/* Top Header matching Figma pixel-for-pixel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <BackButton
            href={backHref}
            title={backHref.includes('/residents/') ? 'Back to Resident Details' : 'Back to Complaints'}
            onClick={handleBackNavigation}
          />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Complaint Details
          </h1>
          <span className="bg-[#E8F1FD] text-[#2563EB] px-2.5 py-0.5 rounded-md text-xs font-semibold">
            {complaint.complaint_number || `CMP-${complaint.id}`}
          </span>
          <StatusBadge status={complaint.status} />
        </div>

        {/* Top Right "Update status" Action Button */}
        <div>
          <button
            type="button"
            onClick={handleOpenStatusDialog}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#175C46] hover:bg-[#124b38] active:bg-[#0e3b2c] text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <span>Update status</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Responsive Layout matching Figma */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: (approx 7 of 12 cols = ~58%) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Card 1: Banner Header Card with Category Icon */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center gap-4">
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#E8F8F0] text-[#175C46] flex items-center justify-center shrink-0">
              <ComplaintCategoryIcon categoryKey={categoryKey} size="lg" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight truncate">
                {complaint.title}
              </h2>
              <div className="flex items-center gap-2.5 mt-1 flex-wrap">
                <span className="text-xs text-gray-500 font-medium">
                  {categoryName}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Complaint Information Card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4.5">
            <h3 className="text-sm font-bold text-gray-900 tracking-tight border-b border-gray-100 pb-3">
              Complaint Information
            </h3>

            {/* Description Row */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 text-xs">
              <span className="w-28 text-gray-500 font-medium shrink-0">Description</span>
              <p className="text-gray-800 leading-relaxed font-normal flex-1">
                {complaint.description || 'No description provided.'}
              </p>
            </div>

            {/* Resident Row */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs">
              <span className="w-28 text-gray-500 font-medium shrink-0">Resident</span>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#175C46] text-white flex items-center justify-center text-xs font-semibold shrink-0">
                  {residentName.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-900">{residentName}</span>
                  {residentContact && (
                    <span className="text-[11px] text-gray-500">{residentContact}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Category Row */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs">
              <span className="w-28 text-gray-500 font-medium shrink-0">Category</span>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-gray-900 font-medium">{categoryName}</span>
              </div>
            </div>

            {/* Location Row */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs">
              <span className="w-28 text-gray-500 font-medium shrink-0">Location</span>
              <span className="text-gray-900 font-medium">{locationText}</span>
            </div>

            {/* Attachments Section matching Figma */}
            <div className="pt-2 border-t border-gray-100 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-900 tracking-tight">
                    Attachments
                  </span>
                  <span className="text-[11px] font-bold text-[#175C46] bg-[#E8F8F0] px-2 py-0.5 rounded-full">
                    {attachments.length}
                  </span>
                </div>

                {attachments.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenPreview(0)}
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#175C46] hover:text-[#124b38] hover:bg-[#E8F8F0] px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      title="Preview all in full screen lightbox"
                    >
                      <i className="pi pi-eye text-[11px]" />
                      <span>Preview all</span>
                    </button>
                    <div className="w-[1px] h-3.5 bg-gray-200 mx-0.5" />
                    {/* Grid view icon */}
                    <button
                      type="button"
                      onClick={() => setAttachmentViewMode('grid')}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        attachmentViewMode === 'grid'
                          ? 'bg-gray-200/90 text-gray-900 shadow-2xs'
                          : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                      }`}
                      title="Grid View"
                      aria-label="Grid View"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    </button>
                    {/* List view icon */}
                    <button
                      type="button"
                      onClick={() => setAttachmentViewMode('list')}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        attachmentViewMode === 'list'
                          ? 'bg-gray-200/90 text-gray-900 shadow-2xs'
                          : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                      }`}
                      title="List View"
                      aria-label="List View"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              {/* Attachments Display */}
              {attachments.length > 0 && attachmentViewMode === 'grid' ? (
                /* GRID VIEW: Clean image/media tiles without captions */
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {attachments.map((att, idx) => {
                    const fileName = att.name || att.file_name || `attachment_${idx + 1}.png`;
                    const rawUrl = att.url || att.file_url || '';
                    const fullUrl = resolveFileUrl(rawUrl);
                    const isImage = isImageFile(fileName, fullUrl);
                    const isPdf = isPdfFile(fileName, fullUrl);
                    const ext = getFileExtension(fileName, fullUrl);

                    return (
                      <div
                        key={idx}
                        onClick={() => handleOpenPreview(idx)}
                        className="group relative aspect-[4/3] bg-gray-100 rounded-xl border border-gray-200/90 hover:border-[#175C46]/50 shadow-2xs hover:shadow-md transition-all overflow-hidden flex items-center justify-center cursor-pointer"
                        title={fileName}
                      >
                        {isImage && fullUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={fullUrl}
                            alt={fileName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : isPdf ? (
                          <div className="w-full h-full bg-rose-50 flex flex-col items-center justify-center gap-1 text-rose-600">
                            <i className="pi pi-file-pdf text-2xl" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">PDF</span>
                          </div>
                        ) : (
                          <div className="w-full h-full bg-[#E8F8F0] flex flex-col items-center justify-center gap-1 text-[#175C46]">
                            <i className="pi pi-file text-2xl" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">{ext}</span>
                          </div>
                        )}

                        {/* Top File Extension Badge */}
                        <div className="absolute top-2 left-2 pointer-events-none">
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-black/60 text-white backdrop-blur-xs shadow-xs">
                            {ext}
                          </span>
                        </div>

                        {/* Hover Action Overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenPreview(idx);
                            }}
                            className="w-8 h-8 rounded-full bg-white text-gray-800 hover:text-[#175C46] flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all cursor-pointer"
                            title="Preview"
                            aria-label="Preview"
                          >
                            <i className="pi pi-eye text-xs" />
                          </button>
                          {fullUrl && (
                            <a
                              href={fullUrl}
                              download={fileName}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="w-8 h-8 rounded-full bg-white text-gray-800 hover:text-[#175C46] flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all cursor-pointer"
                              title="Download"
                              aria-label="Download"
                            >
                              <i className="pi pi-download text-xs" />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : attachments.length > 0 ? (
                /* LIST VIEW: Clean horizontal rows with thumbnail & actions */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {attachments.map((att, idx) => {
                    const fileName = att.name || att.file_name || `attachment_${idx + 1}.png`;
                    const rawUrl = att.url || att.file_url || '';
                    const fullUrl = resolveFileUrl(rawUrl);
                    const fileSize = formatFileSize(att.size || att.file_size);
                    const isImage = isImageFile(fileName, fullUrl);
                    const isPdf = isPdfFile(fileName, fullUrl);
                    const ext = getFileExtension(fileName, fullUrl);

                    return (
                      <div
                        key={idx}
                        className="bg-white rounded-xl border border-gray-200/80 p-2.5 flex items-center justify-between gap-3 hover:border-[#175C46]/50 hover:shadow-2xs transition-all group"
                      >
                        {/* File preview trigger area */}
                        <div
                          onClick={() => handleOpenPreview(idx)}
                          className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
                          title="Click to preview attachment"
                        >
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 border border-gray-200/90 shrink-0 flex items-center justify-center relative shadow-2xs group-hover:border-[#175C46]/40 transition-colors">
                            {isImage && fullUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={fullUrl}
                                alt={fileName}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                loading="lazy"
                              />
                            ) : isPdf ? (
                              <div className="w-full h-full bg-rose-50 text-rose-600 flex items-center justify-center">
                                <i className="pi pi-file-pdf text-base" />
                              </div>
                            ) : (
                              <div className="w-full h-full bg-[#E8F8F0] text-[#175C46] flex items-center justify-center">
                                <i className="pi pi-file text-base" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p
                              className="text-xs font-semibold text-gray-900 group-hover:text-[#175C46] transition-colors truncate"
                              title={fileName}
                            >
                              {fileName}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-gray-100 text-gray-600">
                                {ext}
                              </span>
                              <span className="text-[11px] text-gray-400">{fileSize || 'Attached file'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions: Preview & Download */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenPreview(idx)}
                            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-[#175C46] hover:bg-[#E8F8F0] rounded-lg transition-colors cursor-pointer"
                            title="Preview attachment"
                            aria-label="Preview attachment"
                          >
                            <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </button>

                          {fullUrl && (
                            <a
                              href={fullUrl}
                              download={fileName}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-[#175C46] hover:bg-[#E8F8F0] rounded-lg transition-colors shrink-0"
                              title="Download attachment"
                              aria-label="Download attachment"
                            >
                              <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {/* Tap to Upload Screenshot Dropzone */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={handleFileUpload}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 hover:border-[#175C46] rounded-xl p-5 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-1.5 bg-gray-50/40 hover:bg-[#E8F8F0]/20"
              >
                {isUploadingFile ? (
                  <div className="flex items-center gap-2 text-xs text-[#175C46] font-medium py-1">
                    <i className="pi pi-spin pi-spinner text-sm" />
                    <span>Uploading attachment...</span>
                  </div>
                ) : (
                  <>
                    <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-xs font-semibold text-gray-700">
                      Tap to upload screenshot
                    </span>
                    <span className="text-[11px] text-gray-400">
                      JPG, PNG • Max 5MB
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: (approx 5 of 12 cols = ~42%) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Card 1: Created on & Last Update Dual Boxes */}
          <div className="grid grid-cols-2 gap-3">
            {/* Created on */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#E8F8F0] text-[#175C46] flex items-center justify-center shrink-0 mt-0.5">
                <i className="pi pi-calendar text-sm" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-medium text-gray-500 block truncate">
                  Created on
                </span>
                <span className="text-xs font-bold text-gray-900 block mt-0.5">
                  {formatDetailDateTime(complaint.created_at)}
                </span>
              </div>
            </div>

            {/* Last update */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#E8F8F0] text-[#175C46] flex items-center justify-center shrink-0 mt-0.5">
                <i className="pi pi-clock text-sm" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-medium text-gray-500 block truncate">
                  Last update
                </span>
                <span className="text-xs font-bold text-gray-900 block mt-0.5">
                  {formatDetailDateTime(complaint.updated_at || complaint.created_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Assignment Card with Staff Dropdown */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-gray-900 tracking-tight">
                Assignment
              </h3>
              {complaint.assigned_to && (
                <span className="text-[11px] font-medium text-emerald-700 bg-[#E8F8F0] px-2 py-0.5 rounded-md">
                  Assigned
                </span>
              )}
            </div>

            {/* Improved Staff Selector matching Image 2 */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">
                Assigned to
              </label>
              <StaffAssignmentDropdown
                staffList={staffList}
                selectedStaffId={assignedStaffId}
                onSelect={(staffId) => setAssignedStaffId(staffId)}
                disabled={isAssigning}
              />
            </div>

            {/* Due Date Picker in DD/MM/YYYY format */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">
                Due Date
              </label>
              <AppDatePicker
                value={dueDate}
                onChange={(val) => setDueDate(val)}
                dateFormat="dd/mm/yy"
                placeholder="dd/mm/yyyy"
                disabled={isAssigning}
              />
            </div>

            {/* Assign Button */}
            <Button
              onClick={handleSaveAssignment}
              loading={isAssigning}
              disabled={!assignedStaffId || isAssigning}
              fullWidth
              className="mt-2 text-xs font-semibold"
            >
              Save Assignment
            </Button>
          </div>

          {/* Card 3: Timeline Card matching Figma */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
            <h3 className="text-sm font-bold text-gray-900 tracking-tight border-b border-gray-100 pb-3">
              Timeline
            </h3>

            {/* Timeline Steps with sleek custom scrollbar */}
            <div className="space-y-4 relative pl-2 pr-2.5 max-h-[380px] overflow-y-auto custom-scrollbar">
              {timelineEvents.map((t, idx) => {
                const isLast = idx === timelineEvents.length - 1;

                return (
                  <div key={t.id || idx} className="relative flex items-start gap-3.5">
                    {/* Vertical Connector Line */}
                    {!isLast && (
                      <span className="absolute left-[11px] top-6 bottom-[-16px] w-[2px] bg-emerald-600/30" />
                    )}

                    {/* Step Icon */}
                    <div className="w-6 h-6 rounded-full bg-[#175C46] text-white flex items-center justify-center shrink-0 z-10 shadow-xs">
                      <i className="pi pi-check text-[10px]" />
                    </div>

                    {/* Step Content */}
                    <div className="min-w-0 flex-1 pt-0.5">
                      <p className="text-xs font-bold text-gray-900">
                        {formatTimelineDescription(t.description) || t.event_type.replace('_', ' ')}
                      </p>
                      {t.performed_by?.name && (
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          By {t.performed_by.name} ({t.performed_by.role || 'Admin'})
                        </p>
                      )}
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {formatDetailDateTime(t.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}

              {/* If complaint is not resolved, show Awaiting Resolution step */}
              {complaint.status !== 'RESOLVED' && (
                <div className="relative flex items-start gap-3.5">
                  <div className="w-6 h-6 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center shrink-0 z-10">
                    <span className="w-2 h-2 rounded-full bg-gray-300" />
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-xs font-semibold text-gray-500">
                      Awaiting resolution
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Pending staff action
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Sticky Action Bar matching Figma */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-[265px] xl:left-[275px] bg-white border-t border-gray-200 px-4 sm:px-8 py-3.5 z-40 shadow-lg flex items-center gap-3">
        <input
          type="text"
          placeholder="Add Update or resolution notes..."
          value={bottomNotes}
          onChange={(e) => setBottomNotes(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handlePostNotes();
            }
          }}
          className="flex-1 h-11 px-4 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#175C46] focus:bg-white text-gray-800 transition-colors"
        />

        <button
          type="button"
          onClick={handlePostNotes}
          disabled={isSubmittingNotes || !bottomNotes.trim()}
          className="px-5 sm:px-6 h-11 bg-[#175C46] hover:bg-[#124b38] active:bg-[#0e3b2c] text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSubmittingNotes ? (
            <>
              <i className="pi pi-spin pi-spinner text-xs" />
              <span>Saving...</span>
            </>
          ) : (
            <span>Add Update</span>
          )}
        </button>
      </div>

      {/* PrimeReact Dialog for Updating Status */}
      <Dialog
        visible={isStatusDialogOpen}
        onHide={() => setIsStatusDialogOpen(false)}
        modal
        draggable={false}
        resizable={false}
        className="w-full max-w-[480px] mx-4 rounded-2xl overflow-hidden shadow-2xl border-0 font-sans"
        header={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E8F8F0] text-[#175C46] flex items-center justify-center shrink-0 shadow-2xs">
              <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-gray-900 tracking-tight leading-snug">
                Update Complaint Status
              </h2>
              <p className="text-xs text-gray-500 font-normal mt-0.5 truncate">
                {complaint.complaint_number || `CMP-${complaint.id}`}
                {residentName ? ` • ${residentName}` : ''}
              </p>
            </div>
          </div>
        }
        contentClassName="p-5 sm:p-6 bg-white space-y-4"
      >
        <div className="space-y-4 pt-1">
          {/* Current Status banner */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs">
            <span className="text-gray-500 font-medium">Current Status:</span>
            <StatusBadge status={complaint.status} />
          </div>

          {/* New Status Choice Cards */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Select New Status <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {STATUS_OPTIONS.map((opt) => {
                const isSelected = targetStatus === opt.value;
                return (
                  <label
                    key={opt.value}
                    onClick={() => setTargetStatus(opt.value)}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none ${
                      isSelected
                        ? `${opt.activeBorder} ${opt.activeBg} ring-1 ring-current shadow-2xs`
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="complaint_status"
                      value={opt.value}
                      checked={isSelected}
                      onChange={() => setTargetStatus(opt.value)}
                      className="mt-0.5 text-[#175C46] focus:ring-[#175C46]"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <i className={`${opt.icon} text-xs`} />
                        <span className="text-xs font-bold text-gray-900">{opt.label}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-normal">
                        {opt.description}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Resolution / Action Notes */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Resolution / Action Notes{' '}
              {targetStatus === 'RESOLVED' ? (
                <span className="text-gray-400 font-normal lowercase">(recommended)</span>
              ) : (
                <span className="text-gray-400 font-normal lowercase">(optional)</span>
              )}
            </label>
            <textarea
              rows={3}
              placeholder={
                targetStatus === 'RESOLVED'
                  ? 'Enter resolution notes, actions taken, or inspection details...'
                  : 'Enter update notes, technician findings, or progress details...'
              }
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              className="w-full p-3 rounded-xl border border-gray-200 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#175C46]/20 focus:border-[#175C46] transition-all resize-none font-normal"
            />
          </div>

          {/* Dialog Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsStatusDialogOpen(false)}
              className="h-10 px-4 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpdateStatus}
              disabled={isUpdatingStatus}
              className="h-10 px-5 text-xs font-semibold text-white bg-[#175C46] hover:bg-[#124b38] rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isUpdatingStatus && <i className="pi pi-spin pi-spinner text-xs" />}
              <span>Update Status</span>
            </button>
          </div>
        </div>
      </Dialog>

      {/* Attachment Preview Lightbox Modal */}
      <AttachmentPreviewModal
        visible={previewModalVisible}
        onHide={() => setPreviewModalVisible(false)}
        attachments={attachments}
        initialIndex={previewIndex}
      />
    </main>
  );
}
