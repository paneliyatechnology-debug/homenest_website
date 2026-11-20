'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Notice } from '@/types/notice';
import { noticeService } from '@/services/notice.service';
import { branchService } from '@/services/branch.service';
import { residentService } from '@/services/resident.service';
import { Branch } from '@/types/branch';
import { Resident } from '@/types/resident';
import { useResetOnNavigation } from '@/hooks';
import {
  Dropdown,
  AppDatePicker,
  AppTimePicker,
  StatusBadge,
} from '@/components/ui';

export interface NoticeFormProps {
  mode: 'create' | 'edit';
  noticeId?: number | string;
  initialData?: Notice | null;
}

export const NoticeForm: React.FC<NoticeFormProps> = ({ mode, noticeId, initialData }) => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const targetNoticeId = noticeId ?? initialData?.id ?? null;
  const isEdit = mode === 'edit';

  // Loading & Submitting states (if initialData is provided, loading starts false)
  const [loading, setLoading] = useState<boolean>(() => isEdit && !initialData && Boolean(targetNoticeId));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingAction, setSubmittingAction] = useState<'draft' | 'schedule' | 'send' | null>(null);

  const resolveCategory = (cat?: string | null): string => {
    if (!cat) return '';
    const clean = cat.toLowerCase();
    if (clean === 'maintenance') return 'Maintenance';
    if (clean === 'important') return 'Important';
    if (clean === 'general') return 'General';
    if (clean === 'event') return 'Event';
    if (clean === 'safety') return 'Safety';
    return cat;
  };

  // Form Fields - starts from initialData when editing, or clean and empty when creating
  const [title, setTitle] = useState(initialData?.title || '');
  const [category, setCategory] = useState(resolveCategory(initialData?.category));
  const [priority, setPriority] = useState(
    initialData?.priority ? String(initialData.priority).toLowerCase() : ''
  );
  const [audienceType, setAudienceType] = useState<string>(() => {
    if (!initialData) return 'all';
    const aud = (initialData.audience_type || '').toLowerCase();
    if (aud === 'branch') return 'branch';
    if (aud === 'room' || aud === 'resident' || aud === 'specific') return 'resident';
    return 'all';
  });
  const [selectedBranchId, setSelectedBranchId] = useState<string>(
    initialData?.branch_id ? String(initialData.branch_id) : ''
  );
  const [selectedResidentId, setSelectedResidentId] = useState<string>(
    initialData?.resident_id ? String(initialData.resident_id) : ''
  );
  const [content, setContent] = useState(initialData?.content || initialData?.summary || '');

  // Scheduling Fields
  const [sendNow, setSendNow] = useState(initialData?.status === 'sent');
  const [scheduleDate, setScheduleDate] = useState(() => {
    if (initialData?.schedule_date) return initialData.schedule_date;
    if (initialData?.scheduled_at) return initialData.scheduled_at.split(' ')[0] || '';
    return '';
  });
  const [scheduleTime, setScheduleTime] = useState(() => {
    if (initialData?.scheduled_at) {
      const parts = initialData.scheduled_at.split(' ');
      return parts.slice(1).join(' ');
    }
    return '';
  });

  // File Upload Fields
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [existingFileName, setExistingFileName] = useState<string | null>(
    initialData?.attachment?.file_name || initialData?.file_name || null
  );
  const [existingFileUrl, setExistingFileUrl] = useState<string | null>(
    initialData?.attachment?.file_url || initialData?.file_url || null
  );

  // Lookups
  const [branches, setBranches] = useState<Branch[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset all fields to clean initial state (used in create mode)
  const resetForm = useCallback(() => {
    setTitle('');
    setCategory('');
    setPriority('');
    setAudienceType('all');
    setSelectedBranchId('');
    setSelectedResidentId('');
    setContent('');
    setSendNow(false);
    setScheduleDate('');
    setScheduleTime('');
    setSelectedFile(null);
    setExistingFileName(null);
    setExistingFileUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setErrors({});
  }, []);

  // Universal navigation reset: clean all fields when moving between pages in create mode
  useResetOnNavigation(
    () => {
      if (!isEdit) {
        resetForm();
      }
    },
    { cleanQueryToast: true }
  );

  // Clean all fields on unmount in create mode
  useEffect(() => {
    return () => {
      if (!isEdit) {
        resetForm();
      }
    };
  }, [isEdit, resetForm]);

  // Fetch branches and residents on mount without auto-selecting default values
  useEffect(() => {
    let isMounted = true;

    branchService
      .getBranches({ limit: 100 })
      .then((res) => {
        if (!isMounted) return;
        setBranches(res.data || []);
      })
      .catch((err) => console.warn('Failed to load branches:', err));

    residentService
      .getResidents({ limit: 100 })
      .then((res) => {
        if (!isMounted) return;
        setResidents(res.data || []);
      })
      .catch((err) => console.warn('Failed to load residents:', err));

    return () => {
      isMounted = false;
    };
  }, []);

  // Fallback fetch existing notice if edit mode without initialData
  useEffect(() => {
    if (!isEdit || !targetNoticeId || initialData) return;

    let isMounted = true;
    noticeService
      .getNoticeById(targetNoticeId)
      .then((data: Notice | null) => {
        if (!isMounted || !data) return;
        setTitle(data.title || '');
        setCategory(resolveCategory(data.category));
        setPriority(data.priority ? String(data.priority).toLowerCase() : '');
        setContent(data.content || data.summary || '');

        const aud = (data.audience_type || '').toLowerCase();
        if (aud === 'branch') {
          setAudienceType('branch');
          if (data.branch_id) setSelectedBranchId(String(data.branch_id));
        } else if (aud === 'room' || aud === 'resident' || aud === 'specific') {
          setAudienceType('resident');
          if (data.resident_id) setSelectedResidentId(String(data.resident_id));
        } else {
          setAudienceType('all');
        }

        if (data.status === 'sent') {
          setSendNow(true);
        } else {
          setSendNow(false);
          if (data.schedule_date) {
            setScheduleDate(data.schedule_date);
          }
          if (data.scheduled_at) {
            const parts = data.scheduled_at.split(' ');
            if (parts[0]) setScheduleDate(parts[0]);
            if (parts[1]) setScheduleTime(parts[1]);
          }
        }

        if (data.attachment?.file_name || data.file_name) {
          setExistingFileName(data.attachment?.file_name || data.file_name || null);
          setExistingFileUrl(data.attachment?.file_url || data.file_url || null);
        }
      })
      .catch((err) => console.warn('Failed to load notice for editing:', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isEdit, targetNoticeId, initialData]);

  // Options
  const categoryOptions = [
    { label: 'Maintenance', value: 'Maintenance' },
    { label: 'Important', value: 'Important' },
    { label: 'General', value: 'General' },
    { label: 'Event', value: 'Event' },
    { label: 'Safety', value: 'Safety' },
    { label: 'Other', value: 'Other' },
  ];

  const priorityOptions = [
    { label: 'High', value: 'high' },
    { label: 'Medium', value: 'medium' },
    { label: 'Low', value: 'low' },
  ];

  const branchOptions = branches.map((b) => ({
    label: b.name,
    value: String(b.id),
  }));

  const residentOptions = residents.map((r) => ({
    label: `${r.name} ${r.room_no ? `(Room ${r.room_no})` : ''}`,
    value: String(r.id),
  }));

  // File Handling
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setExistingFileName(null);
      setExistingFileUrl(null);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setExistingFileName(null);
    setExistingFileUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Text formatting helpers for rich textarea
  const applyFormat = (tag: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);

    let replacement = '';
    if (tag === 'b') replacement = `**${selected || 'bold text'}**`;
    else if (tag === 'i') replacement = `*${selected || 'italic text'}*`;
    else if (tag === 'u') replacement = `<u>${selected || 'underlined text'}</u>`;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);
  };

  // Validation
  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};
    if (!title.trim()) {
      errs.title = 'Notice title is required';
    }
    if (!category.trim()) {
      errs.category = 'Category is required';
    }
    if (!priority.trim()) {
      errs.priority = 'Priority is required';
    }
    if (!audienceType) {
      errs.audience = 'Please select an audience';
    }
    if (!content.trim()) {
      errs.content = 'Notice content is required';
    }
    if (audienceType === 'branch' && !selectedBranchId) {
      errs.branch = 'Please select a branch';
    }
    if ((audienceType === 'resident' || audienceType === 'specific') && !selectedResidentId) {
      errs.resident = 'Please select a room or resident';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit Handler
  const handleSubmit = async (intendedStatus: 'draft' | 'scheduled' | 'sent') => {
    if (!validateForm() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setSubmittingAction(intendedStatus === 'draft' ? 'draft' : intendedStatus === 'sent' ? 'send' : 'schedule');

      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('category', category);
      formData.append('priority', priority);
      formData.append('content', content.trim());
      formData.append('status', intendedStatus);

      // Audience
      const finalAudience =
        audienceType === 'resident' || audienceType === 'specific' ? 'resident' : audienceType || 'all';
      formData.append('audience_type', finalAudience);

      if (finalAudience === 'branch' && selectedBranchId) {
        formData.append('branch_id', selectedBranchId);
        if (isEdit) {
          formData.append('resident_id', '');
          formData.append('room_id', '');
        }
      } else if (finalAudience === 'resident' && selectedResidentId) {
        formData.append('resident_id', selectedResidentId);
        const resObj = residents.find((r) => String(r.id) === selectedResidentId);
        if (resObj?.room_id) {
          formData.append('room_id', String(resObj.room_id));
        } else if (isEdit) {
          formData.append('room_id', '');
        }
        if (isEdit) {
          formData.append('branch_id', '');
        }
      } else if (finalAudience === 'all') {
        if (isEdit) {
          formData.append('branch_id', '');
          formData.append('resident_id', '');
          formData.append('room_id', '');
        }
      }

      // Scheduling dates
      if (intendedStatus === 'scheduled' || (!sendNow && scheduleDate)) {
        formData.append('schedule_date', scheduleDate);
        if (scheduleTime) {
          formData.append('schedule_time', scheduleTime);
        }
      }

      // File handling (new upload or explicit removal)
      if (selectedFile) {
        formData.append('file', selectedFile);
      } else if (isEdit && !existingFileName) {
        formData.append('attachment', '');
      }

      if (isEdit) {
        const targetId = targetNoticeId;
        if (!targetId) {
          console.error('Cannot edit notice without valid ID');
          return;
        }
        await noticeService.updateNotice(targetId, formData, {
          showSuccessToast: intendedStatus !== 'sent',
        });
        if (intendedStatus === 'sent') {
          try {
            await noticeService.sendNotice(targetId);
          } catch {
            // Handled
          }
        }
      } else {
        const res = await noticeService.createNotice(formData, {
          showSuccessToast: intendedStatus !== 'sent',
        });
        if (intendedStatus === 'sent' && res?.data?.id) {
          try {
            await noticeService.sendNotice(res.data.id);
          } catch {
            // Handled
          }
        }
      }

      router.push('/dashboard/notices');
    } catch {
      // apiClient handles backend errors automatically
    } finally {
      setIsSubmitting(false);
      setSubmittingAction(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <div className="w-9 h-9 border-3 border-[#175C46] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs sm:text-sm text-gray-500 font-medium">Loading notice details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12 animate-fade-in">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/notices"
          className="w-9 h-9 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-700 transition-colors shadow-2xs"
          title="Back to Notices"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            {isEdit ? 'Edit Notice' : 'Create / Schedule Notice'}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-normal mt-0.5">
            {isEdit
              ? 'Update notice information and schedule it to be sent to resident.'
              : 'Create a new notice and schedule it to be sent to resident.'}
          </p>
        </div>
      </div>

      {/* Main Grid: Form Left, Sidebar Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Fields */}
        <div className="lg:col-span-8 space-y-5">
          {/* Notice Title */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-1.5">
              Notice Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
              }}
              placeholder="Enter notice title"
              className={`w-full h-11 px-3.5 rounded-xl border text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 bg-white transition-all focus:outline-none focus:ring-2 focus:ring-[#175C46]/20 focus:border-[#175C46] ${
                errors.title ? 'border-red-400 bg-red-50/20' : 'border-gray-200'
              }`}
            />
            {errors.title && (
              <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.title}</p>
            )}
          </div>

          {/* Row: Category & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-1.5">
                Category <span className="text-red-500">*</span>
              </label>
              <Dropdown
                options={categoryOptions}
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  if (errors.category) setErrors((prev) => ({ ...prev, category: '' }));
                }}
                placeholder="Enter category"
                className="w-full"
              />
              {errors.category && (
                <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.category}</p>
              )}
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-1.5">
                Priority <span className="text-red-500">*</span>
              </label>
              <Dropdown
                options={priorityOptions}
                value={priority}
                onChange={(e) => {
                  setPriority(e.target.value);
                  if (errors.priority) setErrors((prev) => ({ ...prev, priority: '' }));
                }}
                placeholder="Enter priority"
                className="w-full"
              />
              {errors.priority && (
                <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.priority}</p>
              )}
            </div>
          </div>

          {/* Audience Section matching Figma pixel-for-pixel */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-3">
              Audience <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3.5">
              {/* Row 1: All Residents */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center min-h-[44px]">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setAudienceType('all');
                    if (errors.audience) setErrors((prev) => ({ ...prev, audience: '' }));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setAudienceType('all');
                      if (errors.audience) setErrors((prev) => ({ ...prev, audience: '' }));
                    }
                  }}
                  className="flex items-center gap-3 cursor-pointer select-none group py-1"
                >
                  {audienceType === 'all' ? (
                    <div className="w-5 h-5 rounded-full bg-[#175C46] flex items-center justify-center shrink-0 text-white shadow-2xs">
                      <svg className="w-3 h-3 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 bg-white shrink-0 group-hover:border-gray-400 transition-colors" />
                  )}
                  <span className="text-xs sm:text-sm font-normal text-gray-700">
                    All Residents
                  </span>
                </div>
              </div>

              {/* Row 2: Specific Branch */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center min-h-[44px]">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setAudienceType('branch');
                    if (errors.audience) setErrors((prev) => ({ ...prev, audience: '' }));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setAudienceType('branch');
                      if (errors.audience) setErrors((prev) => ({ ...prev, audience: '' }));
                    }
                  }}
                  className="flex items-center gap-3 cursor-pointer select-none group py-1"
                >
                  {audienceType === 'branch' ? (
                    <div className="w-5 h-5 rounded-full bg-[#175C46] flex items-center justify-center shrink-0 text-white shadow-2xs">
                      <svg className="w-3 h-3 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 bg-white shrink-0 group-hover:border-gray-400 transition-colors" />
                  )}
                  <span className="text-xs sm:text-sm font-normal text-gray-700">
                    Specific Branch
                  </span>
                </div>

                <div>
                  <Dropdown
                    options={branchOptions}
                    value={selectedBranchId}
                    onChange={(e) => {
                      setSelectedBranchId(e.target.value);
                      setAudienceType('branch');
                      if (errors.branch) setErrors((prev) => ({ ...prev, branch: '' }));
                      if (errors.audience) setErrors((prev) => ({ ...prev, audience: '' }));
                    }}
                    onFocus={() => {
                      setAudienceType('branch');
                      if (errors.audience) setErrors((prev) => ({ ...prev, audience: '' }));
                    }}
                    placeholder="Select Branch"
                    className="w-full"
                  />
                  {audienceType === 'branch' && errors.branch && (
                    <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.branch}</p>
                  )}
                </div>
              </div>

              {/* Row 3: Specific Room/Residents */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center min-h-[44px]">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setAudienceType('resident');
                    if (errors.audience) setErrors((prev) => ({ ...prev, audience: '' }));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setAudienceType('resident');
                      if (errors.audience) setErrors((prev) => ({ ...prev, audience: '' }));
                    }
                  }}
                  className="flex items-center gap-3 cursor-pointer select-none group py-1"
                >
                  {audienceType === 'resident' ? (
                    <div className="w-5 h-5 rounded-full bg-[#175C46] flex items-center justify-center shrink-0 text-white shadow-2xs">
                      <svg className="w-3 h-3 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 bg-white shrink-0 group-hover:border-gray-400 transition-colors" />
                  )}
                  <span className="text-xs sm:text-sm font-normal text-gray-700">
                    Specific Room/Residents
                  </span>
                </div>

                <div>
                  <Dropdown
                    options={residentOptions}
                    value={selectedResidentId}
                    onChange={(e) => {
                      setSelectedResidentId(e.target.value);
                      setAudienceType('resident');
                      if (errors.resident) setErrors((prev) => ({ ...prev, resident: '' }));
                      if (errors.audience) setErrors((prev) => ({ ...prev, audience: '' }));
                    }}
                    onFocus={() => {
                      setAudienceType('resident');
                      if (errors.audience) setErrors((prev) => ({ ...prev, audience: '' }));
                    }}
                    placeholder="Select Room/Resident"
                    className="w-full"
                  />
                  {audienceType === 'resident' && errors.resident && (
                    <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.resident}</p>
                  )}
                </div>
              </div>
            </div>
            {errors.audience && (
              <p className="text-[11px] text-red-500 mt-1.5 font-medium">{errors.audience}</p>
            )}
          </div>

          {/* Content with Rich Text Toolbar */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-1.5">
              Content <span className="text-red-500">*</span>
            </label>
            <div
              className={`rounded-xl border transition-all overflow-hidden ${
                errors.content ? 'border-red-400 bg-red-50/20' : 'border-gray-200'
              }`}
            >
              {/* Toolbar */}
              <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-100 bg-gray-50/60 text-gray-600">
                <button
                  type="button"
                  onClick={() => applyFormat('b')}
                  title="Bold"
                  className="w-7 h-7 rounded hover:bg-gray-200/70 flex items-center justify-center font-bold text-xs cursor-pointer transition-colors"
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() => applyFormat('i')}
                  title="Italic"
                  className="w-7 h-7 rounded hover:bg-gray-200/70 flex items-center justify-center italic text-xs font-serif cursor-pointer transition-colors"
                >
                  I
                </button>
                <button
                  type="button"
                  onClick={() => applyFormat('u')}
                  title="Underline"
                  className="w-7 h-7 rounded hover:bg-gray-200/70 flex items-center justify-center underline text-xs cursor-pointer transition-colors"
                >
                  U
                </button>
                <div className="h-4 w-px bg-gray-200 mx-1" />
                <button
                  type="button"
                  title="Align Left"
                  className="w-7 h-7 rounded hover:bg-gray-200/70 flex items-center justify-center text-gray-500 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h10M4 18h14" />
                  </svg>
                </button>
                <button
                  type="button"
                  title="Align Center"
                  className="w-7 h-7 rounded hover:bg-gray-200/70 flex items-center justify-center text-gray-500 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M7 12h10M5 18h14" />
                  </svg>
                </button>
                <button
                  type="button"
                  title="Align Right"
                  className="w-7 h-7 rounded hover:bg-gray-200/70 flex items-center justify-center text-gray-500 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M10 12h10M6 18h14" />
                  </svg>
                </button>
              </div>

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  if (errors.content) setErrors((prev) => ({ ...prev, content: '' }));
                }}
                rows={6}
                placeholder="Write your notice message here..."
                className="w-full p-3.5 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 bg-white resize-y focus:outline-none"
              />

              {/* Bottom Character Count */}
              <div className="flex justify-end px-3 py-1.5 text-[11px] text-gray-400 bg-gray-50/40 border-t border-gray-100">
                {content.length} / 500
              </div>
            </div>
            {errors.content && (
              <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.content}</p>
            )}
          </div>
        </div>

        {/* Right Column: Schedule, Attachments, Preview & Actions */}
        <div className="lg:col-span-4 space-y-5">
          {/* Card 1: Scheduled (Optional) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 text-gray-900 font-bold text-sm">
              <div className="w-8 h-8 rounded-lg bg-[#E8F8F0] text-[#175C46] flex items-center justify-center">
                <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span>Scheduled (Optional)</span>
            </div>

            <div className="pt-2 border-t border-gray-100 space-y-3.5">
              <div
                role="button"
                tabIndex={0}
                onClick={() => setSendNow((prev) => !prev)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSendNow((prev) => !prev);
                  }
                }}
                className="flex items-center gap-3 cursor-pointer select-none group"
              >
                {sendNow ? (
                  <div className="w-5 h-5 rounded-full bg-[#175C46] flex items-center justify-center shrink-0 text-white shadow-2xs">
                    <svg className="w-3 h-3 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300 bg-white shrink-0 group-hover:border-gray-400 transition-colors" />
                )}
                <span className="text-xs sm:text-sm font-semibold text-gray-900">
                  Send now
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className={sendNow ? 'opacity-40 pointer-events-none' : ''}>
                  <AppDatePicker
                    value={scheduleDate}
                    onChange={(val) => setScheduleDate(val)}
                    placeholder="Select Date"
                    disabled={sendNow}
                    className="w-full"
                  />
                </div>
                <div className={sendNow ? 'opacity-40 pointer-events-none' : ''}>
                  <AppTimePicker
                    value={scheduleTime}
                    onChange={(val) => setScheduleTime(val)}
                    placeholder="Select Time"
                    disabled={sendNow}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Attach file (Optional) */}
          <div className="space-y-3">
            <h3 className="text-xs sm:text-sm font-bold text-gray-900">
              Attach file <span className="font-normal text-gray-400">(Optional)</span>
            </h3>

            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              className="hidden"
            />

            {selectedFile || existingFileName ? (
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#175C46] flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    {existingFileUrl && !selectedFile ? (
                      <a
                        href={existingFileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-gray-900 hover:text-[#175C46] truncate hover:underline block"
                      >
                        {existingFileName}
                      </a>
                    ) : (
                      <p className="text-xs font-semibold text-gray-900 truncate">
                        {selectedFile ? selectedFile.name : existingFileName}
                      </p>
                    )}
                    {selectedFile && (
                      <p className="text-[10px] text-gray-400">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRemoveFile}
                  title="Remove file"
                  className="w-7 h-7 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 hover:border-[#175C46] rounded-xl p-5 text-center cursor-pointer transition-colors bg-gray-50/50 hover:bg-emerald-50/20 group"
              >
                <div className="w-10 h-10 rounded-full bg-white shadow-2xs mx-auto flex items-center justify-center text-gray-400 group-hover:text-[#175C46] transition-colors mb-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-xs font-semibold text-gray-700 group-hover:text-[#175C46]">
                  Click to upload or drag and drop
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  PDF, DOC, JPG • Max 5MB
                </p>
              </div>
            )}
          </div>

          {/* Card 3: Preview */}
          <div className="space-y-3">
            <h3 className="text-xs sm:text-sm font-bold text-gray-900">Preview</h3>

            {title.trim() || content.trim() ? (
              <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-[#175C46] uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded">
                    {category || 'Notice'}
                  </span>
                  <StatusBadge status={priority} label={priority} />
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-gray-900 line-clamp-2">
                  {title || 'Notice Title'}
                </h4>
                <p className="text-xs text-gray-600 line-clamp-3 whitespace-pre-line leading-relaxed">
                  {content || 'Your notice message will appear here...'}
                </p>
                <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between text-[11px] text-gray-400">
                  <span>
                    {sendNow ? 'Send immediately' : scheduleDate ? `${scheduleDate} ${scheduleTime}` : 'Scheduled'}
                  </span>
                  {(selectedFile || existingFileName) && (
                    <span className="text-emerald-700 font-medium flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      Attached
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-8 text-center flex flex-col items-center justify-center">
                <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-400 flex items-center justify-center mb-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-xs text-gray-500 font-normal">
                  Your notice preview will appear here.
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit('draft')}
              className="flex-1 h-11 px-4 text-xs sm:text-sm font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl shadow-2xs transition-colors cursor-pointer disabled:opacity-50 text-center flex items-center justify-center"
            >
              {submittingAction === 'draft' ? (
                <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                'Save Draft'
              )}
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit(sendNow ? 'sent' : 'scheduled')}
              className="flex-1 h-11 px-4 text-xs sm:text-sm font-semibold text-white bg-[#175C46] hover:bg-[#124b38] rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 text-center flex items-center justify-center gap-1.5"
            >
              {submittingAction === 'schedule' || submittingAction === 'send' ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  <span>{sendNow ? 'Send Notice' : isEdit ? 'Update Notice' : 'Schedule Notice'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
