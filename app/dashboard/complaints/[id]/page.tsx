'use client';

import React, { Suspense, use, useEffect, useState, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Menu } from 'primereact/menu';
import { MenuItem } from 'primereact/menuitem';
import { ProgressSpinner } from 'primereact/progressspinner';
import {
  Complaint,
  ComplaintStatus,
  ComplaintTimelineItem,
} from '@/types/complaint';
import { StaffMember } from '@/types/staff';
import { complaintService } from '@/services/complaint.service';
import { staffService } from '@/services/staff.service';
import { StatusBadge, BackButton, Button, AppDatePicker, Dropdown } from '@/components/ui';
import { ComplaintCategoryIcon } from '@/components/complaints/complaint-category-icon';
import { StaffAssignmentDropdown } from '@/components/complaints/staff-assignment-dropdown';
import { toast } from '@/lib/toast';

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

  // Main state
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Status Action Menu
  const statusMenuRef = useRef<Menu>(null);

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
    if (!complaintId) return;
    if (!bottomNotes.trim()) {
      // If no notes, trigger status dialog
      setTargetStatus((complaint?.status as ComplaintStatus) === 'OPEN' ? 'IN_PROGRESS' : 'RESOLVED');
      setIsStatusDialogOpen(true);
      return;
    }

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

  // PrimeReact Status Menu Items
  const statusMenuItems: MenuItem[] = [
    {
      label: 'Mark as Open',
      icon: 'pi pi-folder text-blue-600',
      command: () => {
        setTargetStatus('OPEN');
        setIsStatusDialogOpen(true);
      },
    },
    {
      label: 'Mark as In Progress',
      icon: 'pi pi-spinner text-amber-600',
      command: () => {
        setTargetStatus('IN_PROGRESS');
        setIsStatusDialogOpen(true);
      },
    },
    {
      label: 'Mark as Resolved',
      icon: 'pi pi-check-circle text-emerald-600',
      command: () => {
        setTargetStatus('RESOLVED');
        setIsStatusDialogOpen(true);
      },
    },
  ];

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
        <BackButton href="/dashboard/complaints" title="Back to Complaints" />
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
          <BackButton href="/dashboard/complaints" />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Complaint Details
          </h1>
          <span className="bg-[#E8F1FD] text-[#2563EB] px-2.5 py-0.5 rounded-md text-xs font-semibold">
            {complaint.complaint_number || `CMP-${complaint.id}`}
          </span>
          <StatusBadge status={complaint.status} />
        </div>

        {/* Top Right "Update status" Dropdown Action Button */}
        <div>
          <Menu model={statusMenuItems} popup ref={statusMenuRef} id="status_action_menu" />
          <button
            type="button"
            onClick={(e) => statusMenuRef.current?.toggle(e)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#175C46] hover:bg-[#124b38] active:bg-[#0e3b2c] text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <span>Update status</span>
            <i className="pi pi-chevron-down text-xs ml-0.5 opacity-80" />
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
            <div className="pt-2 border-t border-gray-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900 tracking-tight">
                  Attachment ({attachments.length})
                </span>
              </div>

              {/* Existing Attachments Grid */}
              {attachments.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {attachments.map((att, idx) => {
                    const fileName = att.name || att.file_name || `attachment_${idx + 1}.jpg`;
                    const fileUrl = att.url || att.file_url || '#';
                    const fileSize = att.size || att.file_size || '1.2 MB';

                    return (
                      <div
                        key={idx}
                        className="bg-gray-50/80 rounded-xl border border-gray-100 p-2.5 flex items-center justify-between gap-3 hover:bg-gray-100/60 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-[#E8F8F0] text-[#175C46] flex items-center justify-center shrink-0">
                            <i className="pi pi-file text-sm" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-900 truncate" title={fileName}>
                              {fileName}
                            </p>
                            <p className="text-[11px] text-gray-400">{fileSize}</p>
                          </div>
                        </div>

                        {fileUrl !== '#' && (
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-gray-500 hover:text-[#175C46] transition-colors rounded-lg hover:bg-white shrink-0"
                            title="Download/View file"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

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
          disabled={isSubmittingNotes}
          className="px-5 sm:px-6 h-11 bg-[#175C46] hover:bg-[#124b38] active:bg-[#0e3b2c] text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer shrink-0 disabled:opacity-60 flex items-center gap-2"
        >
          {isSubmittingNotes ? (
            <>
              <i className="pi pi-spin pi-spinner text-xs" />
              <span>Saving...</span>
            </>
          ) : (
            <span>{bottomNotes.trim() ? 'Add Update' : 'Update status'}</span>
          )}
        </button>
      </div>

      {/* PrimeReact Dialog for Updating Status */}
      <Dialog
        visible={isStatusDialogOpen}
        onHide={() => setIsStatusDialogOpen(false)}
        header={`Update Complaint Status: ${targetStatus.replace('_', ' ')}`}
        className="w-full max-w-md"
        headerClassName="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3"
      >
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700">
              New Status
            </label>
            <Dropdown
              value={targetStatus}
              options={[
                { label: 'OPEN', value: 'OPEN' },
                { label: 'IN PROGRESS', value: 'IN_PROGRESS' },
                { label: 'RESOLVED', value: 'RESOLVED' },
              ]}
              onChange={(e) => setTargetStatus(e.target.value as ComplaintStatus)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700">
              Resolution / Action Notes
            </label>
            <textarea
              rows={4}
              placeholder="Enter resolution notes, technician findings, or inspection details..."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              className="w-full p-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#175C46] focus:bg-white text-gray-800 resize-none font-normal"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsStatusDialogOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpdateStatus}
              disabled={isUpdatingStatus}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#175C46] hover:bg-[#124b38] rounded-xl transition-colors cursor-pointer disabled:opacity-60 flex items-center gap-2"
            >
              {isUpdatingStatus && <i className="pi pi-spin pi-spinner text-xs" />}
              <span>Save Status</span>
            </button>
          </div>
        </div>
      </Dialog>
    </main>
  );
}
