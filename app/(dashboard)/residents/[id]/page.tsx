'use client';

import React, { Suspense, use, useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ProgressSpinner } from 'primereact/progressspinner';
import { ResidentDetail } from '@/types/resident';
import { residentService, DEFAULT_RESIDENT_DETAIL } from '@/services/resident.service';
import { PaymentRecord, formatCurrency } from '@/types/payment';
import { paymentService } from '@/services/payment.service';
import { Complaint, ComplaintAttachment } from '@/types/complaint';
import { complaintService } from '@/services/complaint.service';
import { PaymentFormModal, PaymentCollectModal, PaymentDetailsModal, PaymentStatusModal } from '@/components/payments';
import {
  DeleteConfirmationModal,
  StatusBadge,
  IconButton,
  AttachmentPreviewModal,
} from '@/components/ui';
import {
  resolveFileUrl,
  isImageFile,
  isPdfFile,
  getFileExtension,
} from '@/lib/file-utils';

interface ResidentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ResidentDetailPage({ params }: ResidentDetailPageProps) {
  return (
    <Suspense
      fallback={
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 max-w-[1600px] w-full mx-auto space-y-6 bg-[#F7F7F5]">
          <div className="p-24 flex flex-col items-center justify-center gap-3">
            <ProgressSpinner style={{ width: '40px', height: '40px' }} strokeWidth="3" />
            <span className="text-xs text-gray-500 font-medium">Loading resident profile...</span>
          </div>
        </main>
      }
    >
      <ResidentDetailContent params={params} />
    </Suspense>
  );
}

function ResidentDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const residentId = resolvedParams?.id;
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const validTab =
    tabParam && ['Overview', 'Documents', 'Payments', 'Complaints'].includes(tabParam)
      ? (tabParam as 'Overview' | 'Documents' | 'Payments' | 'Complaints')
      : null;

  const [resident, setResident] = useState<ResidentDetail>(DEFAULT_RESIDENT_DETAIL);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'Overview' | 'Documents' | 'Payments' | 'Complaints' | null>(null);

  const activeTab = selectedTab ?? validTab ?? 'Overview';
  const setActiveTab = (tab: 'Overview' | 'Documents' | 'Payments' | 'Complaints') => {
    setSelectedTab(tab);
  };

  const [prevResidentId, setPrevResidentId] = useState(residentId);
  if (residentId !== prevResidentId) {
    setPrevResidentId(residentId);
    setSelectedTab(null);
  }

  useEffect(() => {
    let isMounted = true;
    if (!residentId) return;

    residentService
      .getResidentById(residentId)
      .then((data) => {
        if (!isMounted) return;
        setResident(data || DEFAULT_RESIDENT_DETAIL);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('Failed to load resident details, falling back:', err);
        setResident(DEFAULT_RESIDENT_DETAIL);
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [residentId]);

  // Payment states for Payments Tab
  const [residentPayments, setResidentPayments] = useState<PaymentRecord[]>([]);
  const [loadingPayments, setLoadingPayments] = useState<boolean>(true);
  const [paymentsRefreshTrigger, setPaymentsRefreshTrigger] = useState<number>(0);

  // Complaint states for Complaints Tab
  const [residentComplaints, setResidentComplaints] = useState<Complaint[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState<boolean>(true);

  // Modals for Payments
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentRecord | null>(null);
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [collectingPayment, setCollectingPayment] = useState<PaymentRecord | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusPayment, setStatusPayment] = useState<PaymentRecord | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingPayment, setViewingPayment] = useState<PaymentRecord | null>(null);
  const [deletingPayment, setDeletingPayment] = useState<PaymentRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Fetch resident payments when Payments tab is active or refreshed
  useEffect(() => {
    if (!resident.id || activeTab !== 'Payments') return;
    let isMounted = true;

    paymentService
      .getPayments({
        resident_id: resident.id,
        limit: 50,
      })
      .then((res) => {
        if (!isMounted) return;
        setResidentPayments(res.data || []);
      })
      .catch((err) => {
        console.warn('Failed to load resident payments:', err);
        if (!isMounted) return;
        if (resident.payment_info) {
          setResidentPayments([
            {
              id: resident.payment_info.payment_id || 1,
              transaction_id: null,
              receipt_no: null,
              title: resident.payment_info.title || 'Monthly Rent & Utility Bill',
              payment_type: 'rent',
              status: resident.payment_info.status || 'pending',
              amount: (resident.payment_info.paid_amount || 0) + (resident.payment_info.due_amount || 150),
              paid_amount: resident.payment_info.paid_amount || 0,
              due_date: resident.payment_info.due_date || '',
              breakdown: {
                other: resident.payment_info.due_amount || 150,
              },
            } as PaymentRecord,
          ]);
        } else {
          setResidentPayments([]);
        }
      })
      .finally(() => {
        if (isMounted) setLoadingPayments(false);
      });

    return () => {
      isMounted = false;
    };
  }, [resident.id, activeTab, paymentsRefreshTrigger, resident.payment_info]);

  // Fetch resident complaints when Complaints tab is active
  useEffect(() => {
    if (!resident.id || activeTab !== 'Complaints') return;
    let isMounted = true;

    complaintService
      .getComplaints({
        resident_id: resident.id,
        limit: 100,
      })
      .then((res) => {
        if (!isMounted) return;
        const all = res.data || [];
        const filtered = all.filter((c) => {
          const cResId = c.resident?.id ?? (c as unknown as { resident_id?: number })?.resident_id;
          if (cResId !== undefined && cResId !== null) {
            return String(cResId) === String(resident.id);
          }
          if (resident.email && c.resident?.email) {
            return c.resident.email.toLowerCase() === resident.email.toLowerCase();
          }
          if (resident.phone && c.resident?.phone) {
            return c.resident.phone.replace(/\D/g, '') === resident.phone.replace(/\D/g, '');
          }
          return true;
        });
        setResidentComplaints(filtered);
      })
      .catch((err) => {
        console.warn('Failed to load resident complaints:', err);
        if (!isMounted) return;
        setResidentComplaints([]);
      })
      .finally(() => {
        if (isMounted) setLoadingComplaints(false);
      });

    return () => {
      isMounted = false;
    };
  }, [resident.id, activeTab, resident.email, resident.phone]);

  // Handle Delete Payment
  const handleConfirmDeletePayment = async () => {
    if (!deletingPayment) return;
    setIsDeleting(true);
    try {
      await paymentService.deletePayment(deletingPayment.id);
      setDeletingPayment(null);
      setLoadingPayments(true);
      setPaymentsRefreshTrigger((prev) => prev + 1);
    } catch (err: unknown) {
      console.error('Failed to delete payment:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Compute live total due amount from payments
  const totalDueAmount = useMemo(() => {
    if (residentPayments.length > 0) {
      return residentPayments.reduce((acc, p) => {
        const status = (p.status || '').toLowerCase();
        if (status === 'pending' || status === 'overdue') {
          const due = (p.amount || 0) - (p.paid_amount || 0);
          return acc + (due > 0 ? due : 0);
        }
        return acc;
      }, 0);
    }
    return resident.due_amount ?? resident.payment_info?.due_amount ?? 0;
  }, [residentPayments, resident.due_amount, resident.payment_info]);

  // Document Attachment Preview modal state (same as complaints)
  const [docPreviewVisible, setDocPreviewVisible] = useState(false);
  const [docPreviewIndex, setDocPreviewIndex] = useState(0);

  // Loading state for active file download
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);

  // Document list for resident documents tab
  const residentDocumentList = useMemo(() => {
    return [
      {
        key: 'aadhar_card',
        title: 'Aadhaar Card',
        fileName: resident.documents?.aadhar_card,
        url: resident.documents?.aadhar_card_url,
        status: 'Verified',
        defaultExt: 'PDF',
      },
      {
        key: 'address_proof',
        title: 'Address Proof',
        fileName: resident.documents?.address_proof,
        url: resident.documents?.address_proof_url,
        status: 'Verified',
        defaultExt: 'PNG',
      },
      {
        key: 'education_certificate',
        title: 'Education Certificate',
        fileName: resident.documents?.education_certificate,
        url: resident.documents?.education_certificate_url,
        status: 'Verified',
        defaultExt: 'JPG',
      },
      {
        key: 'agreement_file',
        title: 'Agreement File',
        fileName: resident.documents?.agreement_file,
        url: resident.documents?.agreement_file_url,
        status: 'Uploaded',
        defaultExt: 'PDF',
      },
      {
        key: 'signature',
        title: 'Resident Signature',
        fileName: resident.documents?.signature,
        url: resident.documents?.signature_url,
        status: 'Signed',
        defaultExt: 'PNG',
      },
    ];
  }, [resident.documents]);

  // Uploaded documents formatted as ComplaintAttachment for AttachmentPreviewModal
  const uploadedDocumentAttachments: ComplaintAttachment[] = useMemo(() => {
    return residentDocumentList
      .filter((doc) => Boolean(doc.url && doc.url.trim() !== ''))
      .map((doc, idx) => ({
        id: doc.key || idx,
        name: doc.fileName || `${doc.title}.${doc.defaultExt.toLowerCase()}`,
        file_name: doc.fileName || `${doc.title}.${doc.defaultExt.toLowerCase()}`,
        url: doc.url!,
        file_url: doc.url!,
      }));
  }, [residentDocumentList]);

  const handlePreviewDocument = (docKey: string) => {
    const uploadedDocs = residentDocumentList.filter((doc) => Boolean(doc.url && doc.url.trim() !== ''));
    const targetIdx = uploadedDocs.findIndex((d) => d.key === docKey);
    setDocPreviewIndex(targetIdx >= 0 ? targetIdx : 0);
    setDocPreviewVisible(true);
  };

  // Cross-origin safe automatic file download helper
  const handleDownloadDocument = async (fileUrl: string, fileName?: string, docKey?: string) => {
    if (!fileUrl) return;
    if (docKey) setDownloadingKey(docKey);

    const cleanFileName = fileName || fileUrl.split('/').pop()?.split('?')[0] || 'document';

    try {
      const response = await fetch(fileUrl, { mode: 'cors' });
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = cleanFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
    } catch {
      // Fallback: direct programmatic anchor click
      const link = document.createElement('a');
      link.href = fileUrl;
      link.setAttribute('download', cleanFileName);
      link.setAttribute('target', '_blank');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      if (docKey) setDownloadingKey(null);
    }
  };

  // Compute initials for avatar fallback (e.g. "John Doe" -> "JD")
  const getInitials = (name?: string): string => {
    if (!name || !name.trim()) return 'R';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  };

  // Format phone number
  const formatPhone = (phone?: string): string => {
    if (!phone) return '-';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }
    return phone;
  };

  // Format date helper e.g. "04-11-2026 00:00" or "2026-11-04" -> "04 Nov 2026"
  const formatDate = (dateStr?: string | null): string => {
    if (!dateStr) return '—';
    try {
      const clean = dateStr.trim().split(' ')[0];
      const sep = clean.includes('/') ? '/' : '-';
      const parts = clean.split(sep);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          // YYYY-MM-DD
          const year = parts[0];
          const mIdx = parseInt(parts[1], 10) - 1;
          const day = parts[2];
          if (mIdx >= 0 && mIdx < 12) {
            return `${day} ${monthNames[mIdx]} ${year}`;
          }
        } else if (parts[2].length === 4) {
          // DD-MM-YYYY
          const day = parts[0];
          const mIdx = parseInt(parts[1], 10) - 1;
          const year = parts[2];
          if (mIdx >= 0 && mIdx < 12) {
            return `${day} ${monthNames[mIdx]} ${year}`;
          }
        }
      }
      return clean;
    } catch {
      return dateStr;
    }
  };

  const isStatusActive = resident.status?.toLowerCase() === 'active';
  const isStatusPending = resident.status?.toLowerCase() === 'pending';

  const roomNo = resident.room_info?.room_no || 'A-201';
  const roomTypeFormatted = resident.room_info?.room_type
    ? resident.room_info.room_type.charAt(0).toUpperCase() + resident.room_info.room_type.slice(1) + ' Room'
    : 'Single Room';
  const sinceDateFormatted = resident.room_info?.check_in_date
    ? formatDate(resident.room_info.check_in_date)
    : '12 Jan 2025';

  return (
    <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 max-w-[1600px] w-full mx-auto space-y-6 bg-[#F7F7F5]">
      {/* Top Header Row: Breadcrumb Back Link */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
          <Link
            href="/residents"
            className="hover:text-gray-900 flex items-center gap-1 font-medium transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Residents List
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-800 font-semibold">{resident.name}</span>
        </div>
      </div>

      {loading ? (
        <div className="p-24 flex flex-col items-center justify-center gap-3">
          <ProgressSpinner style={{ width: '40px', height: '40px' }} strokeWidth="3" />
          <span className="text-xs text-gray-500 font-medium">Loading resident profile...</span>
        </div>
      ) : (
        <>
          {/* Top Profile Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pt-1">
            {/* Profile Photo */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-white shadow-sm shrink-0 bg-emerald-100 flex items-center justify-center text-[#175C46] font-bold text-2xl relative">
              {resident.profile_photo_url ? (
                <Image
                  src={resident.profile_photo_url}
                  alt={resident.name}
                  width={112}
                  height={112}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                <span>{getInitials(resident.name)}</span>
              )}
            </div>

            {/* Profile Main Info */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                  {resident.name}
                </h1>
                <span
                  className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold capitalize ${isStatusActive
                      ? 'bg-[#E6F4EA] text-[#137333]'
                      : isStatusPending
                        ? 'bg-[#FEF7E0] text-[#B06000]'
                        : 'bg-[#FCE8E6] text-[#C5221F]'
                    }`}
                >
                  {resident.status}
                </span>
              </div>

              {/* Subtitle Line: Room | Room Type | Since Date */}
              <div className="flex items-center gap-2.5 text-xs text-gray-500 font-normal">
                <span>{roomNo}</span>
                <span className="text-gray-300">|</span>
                <span>{roomTypeFormatted}</span>
                <span className="text-gray-300">|</span>
                <span>Since {sinceDateFormatted}</span>
              </div>

              {/* Contact Icons List */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 text-xs text-gray-600 pt-1">
                {/* Phone */}
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>{formatPhone(resident.contact_info?.phone || resident.phone)}</span>
                </div>

                {/* Email */}
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>{resident.contact_info?.email || resident.email}</span>
                </div>

                {/* Location */}
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{resident.contact_info?.location_display || (resident.contact_info?.city && resident.contact_info?.state ? `${resident.contact_info.city}, ${resident.contact_info.state}` : 'Location not set')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs Bar matching Figma */}
          <div className="border-b border-gray-200">
            <nav className="flex items-center gap-8 -mb-[1px]">
              {(['Overview', 'Documents', 'Payments', 'Complaints'] as const).map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => {
                      if (tab === 'Payments') setLoadingPayments(true);
                      if (tab === 'Complaints') setLoadingComplaints(true);
                      setActiveTab(tab);
                    }}
                    className={`pb-3.5 text-sm transition-colors cursor-pointer relative ${isActive
                        ? 'text-gray-900 font-bold border-b-2 border-[#175C46]'
                        : 'text-gray-500 font-medium hover:text-gray-800'
                      }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab 1: Overview matching Figma layout */}
          {activeTab === 'Overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Card 1: Personal Information */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-5">
                <h2 className="text-base font-bold text-gray-900">Personal Information</h2>

                <div className="space-y-4">
                  {/* Full Name */}
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#EBF7F2] text-[#175C46] flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 font-normal block">Full Name</span>
                      <span className="text-sm font-semibold text-gray-900 block mt-0.5">
                        {resident.personal_info?.name || resident.name}
                      </span>
                    </div>
                  </div>

                  {/* Date of Birth */}
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#EBF7F2] text-[#175C46] flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M3 21h18M3 10h18M5 10v10a1 1 0 001 1h12a1 1 0 001-1V10" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 font-normal block">Date of birth</span>
                      <span className="text-sm font-semibold text-gray-900 block mt-0.5">
                        {resident.personal_info?.dob_display || '20 August 1999 (27 Years)'}
                      </span>
                    </div>
                  </div>

                  {/* Gender */}
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#EBF7F2] text-[#175C46] flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <circle cx="10" cy="10" r="6" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.5 5.5L20 1m0 0h-4m4 0v4M10 16v6m-3-3h6" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 font-normal block">Gender</span>
                      <span className="text-sm font-semibold text-gray-900 block mt-0.5 capitalize">
                        {resident.personal_info?.gender || resident.gender || 'Male'}
                      </span>
                    </div>
                  </div>

                  {/* Nationality */}
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#EBF7F2] text-[#175C46] flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 font-normal block">Nationality</span>
                      <span className="text-sm font-semibold text-gray-900 block mt-0.5">
                        {resident.personal_info?.nationality || 'Indian'}
                      </span>
                    </div>
                  </div>

                  {/* Marital Status */}
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#EBF7F2] text-[#175C46] flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 font-normal block">Marital Status</span>
                      <span className="text-sm font-semibold text-gray-900 block mt-0.5 capitalize">
                        {resident.personal_info?.marital_status || 'Single'}
                      </span>
                    </div>
                  </div>

                  {/* Occupation */}
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#EBF7F2] text-[#175C46] flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 font-normal block">Occupation</span>
                      <span className="text-sm font-semibold text-gray-900 block mt-0.5">
                        {resident.personal_info?.occupation || 'Senior Developer'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Room Information */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-5">
                <h2 className="text-base font-bold text-gray-900">Room Information</h2>

                <div className="space-y-4">
                  {/* Room No. */}
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#EBF7F2] text-[#175C46] flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 font-normal block">Room No.</span>
                      <span className="text-sm font-semibold text-gray-900 block mt-0.5">
                        {resident.room_info?.room_no || 'A-201'}
                      </span>
                    </div>
                  </div>

                  {/* Room Type */}
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#EBF7F2] text-[#175C46] flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 font-normal block">Room Type</span>
                      <span className="text-sm font-semibold text-gray-900 block mt-0.5 capitalize">
                        {resident.room_info?.room_type || 'Single'}
                      </span>
                    </div>
                  </div>

                  {/* Building */}
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#EBF7F2] text-[#175C46] flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 font-normal block">Building</span>
                      <span className="text-sm font-semibold text-gray-900 block mt-0.5">
                        {resident.room_info?.building_name || 'Main Building'}
                      </span>
                    </div>
                  </div>

                  {/* Check-in Date */}
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#EBF7F2] text-[#175C46] flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 font-normal block">Check-in Date</span>
                      <span className="text-sm font-semibold text-gray-900 block mt-0.5">
                        {formatDate(resident.room_info?.check_in_date) || '04 Nov 2026'}
                      </span>
                    </div>
                  </div>

                  {/* Expected Check-out */}
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#EBF7F2] text-[#175C46] flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 font-normal block">Expected Check-out</span>
                      <span className="text-sm font-semibold text-gray-900 block mt-0.5">
                        {formatDate(resident.room_info?.check_out_date)}
                      </span>
                    </div>
                  </div>

                  {/* Current status */}
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#EBF7F2] text-[#175C46] flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 font-normal block">Current status</span>
                      <span className="text-sm font-semibold text-gray-900 block mt-0.5 capitalize">
                        {resident.room_info?.current_status || resident.status || 'Active'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Contact Information */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-5">
                <h2 className="text-base font-bold text-gray-900">Contact Information</h2>

                <div className="space-y-4">
                  {/* Phone */}
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#EBF7F2] text-[#175C46] flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 font-normal block">Phone</span>
                      <span className="text-sm font-semibold text-gray-900 block mt-0.5">
                        {formatPhone(resident.contact_info?.phone || resident.phone)}
                      </span>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#EBF7F2] text-[#175C46] flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 font-normal block">Email</span>
                      <span className="text-sm font-semibold text-gray-900 block mt-0.5">
                        {resident.contact_info?.email || resident.email}
                      </span>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#EBF7F2] text-[#175C46] flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 font-normal block">Emergency contact</span>
                      <span className="text-sm font-semibold text-gray-900 block mt-0.5">
                        {resident.contact_info?.emergency_contact_display || resident.contact_info?.emergency_contact_name || 'Not provided'}
                      </span>
                      {resident.contact_info?.emergency_contact_phone && (
                        <span className="text-xs font-medium text-gray-600 block mt-0.5">
                          {formatPhone(resident.contact_info.emergency_contact_phone)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Address */}
                  <div className="flex items-start gap-3.5 pt-1 border-t border-gray-100">
                    <div className="w-10 h-10 rounded-full bg-[#EBF7F2] text-[#175C46] flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 font-normal block">Permanent Address</span>
                      <span className="text-xs font-semibold text-gray-800 block mt-0.5">
                        {resident.contact_info?.address || resident.contact_info?.address_line_1 || 'Not provided'}
                      </span>
                      {(resident.contact_info?.city || resident.contact_info?.state) && (
                        <span className="text-xs text-gray-500 block">
                          {[resident.contact_info?.city, resident.contact_info?.state, resident.contact_info?.pincode].filter(Boolean).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Documents Tab */}
          {activeTab === 'Documents' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-900 tracking-tight">
                    Documents
                  </span>
                  <span className="text-[11px] font-bold text-[#175C46] bg-[#E8F8F0] px-2 py-0.5 rounded-full">
                    {uploadedDocumentAttachments.length}
                  </span>
                </div>

                {uploadedDocumentAttachments.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setDocPreviewIndex(0);
                      setDocPreviewVisible(true);
                    }}
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#175C46] hover:text-[#124b38] hover:bg-[#E8F8F0] px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    title="Preview all in full screen lightbox"
                  >
                    <i className="pi pi-eye text-[11px]" />
                    <span>Preview all</span>
                  </button>
                )}
              </div>

              {/* Grid of compact document media tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                {residentDocumentList.map((doc) => {
                  const rawUrl = doc.url || '';
                  const fullUrl = resolveFileUrl(rawUrl);
                  const isUploaded = Boolean(doc.url && doc.url.trim() !== '');
                  const ext = getFileExtension(doc.fileName || undefined, fullUrl || undefined) || doc.defaultExt;
                  const isPdf = isPdfFile(doc.fileName || undefined, fullUrl || undefined) || ext === 'PDF';
                  const isImage = isImageFile(doc.fileName || undefined, fullUrl || undefined);

                  if (!isUploaded) {
                    return (
                      <div
                        key={doc.key}
                        className="relative aspect-[4/3] bg-gray-50/70 rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center gap-1.5 text-gray-400 p-3 text-center select-none"
                        title={`${doc.title} (Not uploaded)`}
                      >
                        <i className="pi pi-cloud-upload text-xl text-gray-300" />
                        <span className="text-[11px] font-semibold text-gray-500 truncate max-w-full">
                          {doc.title}
                        </span>
                        <span className="text-[10px] text-gray-400">Not uploaded</span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={doc.key}
                      onClick={() => handlePreviewDocument(doc.key)}
                      className="group relative aspect-[4/3] bg-gray-100 rounded-xl border border-gray-200/90 hover:border-[#175C46]/50 shadow-2xs hover:shadow-md transition-all overflow-hidden flex items-center justify-center cursor-pointer"
                      title={`${doc.title} - ${doc.fileName || ''}`}
                    >
                      {isImage && fullUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={fullUrl}
                          alt={doc.title}
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

                      {/* Hover Action Overlay: Preview and Download icon buttons */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreviewDocument(doc.key);
                          }}
                          className="w-8 h-8 rounded-full bg-white text-gray-800 hover:text-[#175C46] flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all cursor-pointer"
                          title="Preview"
                          aria-label="Preview"
                        >
                          <i className="pi pi-eye text-xs" />
                        </button>
                        {doc.url && (
                          <button
                            type="button"
                            disabled={downloadingKey === doc.key}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadDocument(doc.url!, doc.fileName || undefined, doc.key);
                            }}
                            className="w-8 h-8 rounded-full bg-white text-gray-800 hover:text-[#175C46] flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                            title="Download"
                            aria-label="Download"
                          >
                            {downloadingKey === doc.key ? (
                              <ProgressSpinner style={{ width: '12px', height: '12px' }} strokeWidth="3" />
                            ) : (
                              <i className="pi pi-download text-xs" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 3: Payments Tab */}
          {activeTab === 'Payments' && (
            <div className="space-y-6">
              {/* Outstanding Invoices & Bills Table */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Billing History & Dues</h3>
                    <p className="text-xs text-gray-500 mt-0.5">All pending charges and recorded receipts</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-gray-100 bg-gray-50/80">
                      <span className="text-xs font-medium text-gray-500">Due Amount:</span>
                      <span
                        className={`text-sm font-bold tracking-tight ${
                          totalDueAmount > 0 ? 'text-red-600' : 'text-[#175C46]'
                        }`}
                      >
                        ₹{totalDueAmount.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingPayment(null);
                        setIsPaymentFormOpen(true);
                      }}
                      className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-[#175C46] hover:bg-[#124b38] active:bg-[#0e3b2c] text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs hover:shadow-sm transition-all cursor-pointer shrink-0"
                    >
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      <span>Record Payment</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-500 font-semibold bg-gray-50/50">
                        <th className="py-3.5 px-5">Invoice / Description</th>
                        <th className="py-3.5 px-4">Due Date</th>
                        <th className="py-3.5 px-4">Breakdown</th>
                        <th className="py-3.5 px-4">Due Amount</th>
                        <th className="py-3.5 px-4">Paid</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {loadingPayments ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-gray-400">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <ProgressSpinner style={{ width: '28px', height: '28px' }} strokeWidth="3" />
                              <span className="text-xs text-gray-500">Loading payment records...</span>
                            </div>
                          </td>
                        </tr>
                      ) : residentPayments.length > 0 ? (
                        residentPayments.map((item) => {
                          const due = (item.amount || 0) - (item.paid_amount || 0);
                          const isPaid = (item.status || '').toLowerCase() === 'paid';
                          const isPendingOrOverdue =
                            item.status?.toLowerCase() === 'pending' ||
                            item.status?.toLowerCase() === 'overdue' ||
                            due > 0;
                          const hasPaymentMethod =
                            Boolean(item.payment_method && item.payment_method.toLowerCase() !== 'unpaid') ||
                            Boolean(item.paid_at) ||
                            isPaid;
                          const showCollectButton = !isPaid && !hasPaymentMethod && isPendingOrOverdue;

                          // Parse breakdown elements
                          const b = item.breakdown;
                          const breakdownChips: string[] = [];
                          if (b?.rent) breakdownChips.push(`Rent: ₹${b.rent.toLocaleString('en-IN')}`);
                          if (b?.electricity) breakdownChips.push(`Elec: ₹${b.electricity.toLocaleString('en-IN')}`);
                          if (b?.maintenance) breakdownChips.push(`Maint: ₹${b.maintenance.toLocaleString('en-IN')}`);
                          if (b?.deposit || b?.security_deposit) {
                            breakdownChips.push(`Deposit: ₹${(b.deposit || b.security_deposit || 0).toLocaleString('en-IN')}`);
                          }
                          if (b?.other) breakdownChips.push(`Other: ₹${b.other.toLocaleString('en-IN')}`);
                          if (b?.laundry) breakdownChips.push(`Laundry: ₹${b.laundry.toLocaleString('en-IN')}`);

                          return (
                            <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                              <td className="py-4 px-5">
                                <span className="font-semibold text-gray-900 block">
                                  {item.title}
                                </span>
                                <span className="text-[11px] text-gray-400 font-normal block mt-0.5">
                                  ID: #{item.id}
                                  {item.receipt_no ? ` • ${item.receipt_no}` : ''}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-gray-600 whitespace-nowrap">
                                {formatDate(item.due_date)}
                              </td>
                              <td className="py-4 px-4 text-gray-600">
                                {breakdownChips.length > 0 ? (
                                  <div className="space-y-0.5 text-[11px]">
                                    {breakdownChips.map((chip, idx) => (
                                      <span key={idx} className="block text-gray-600 whitespace-nowrap">
                                        {chip}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </td>
                              <td className="py-4 px-4 font-bold text-red-600 whitespace-nowrap">
                                ₹{due > 0 ? due.toLocaleString('en-IN') : 0}
                              </td>
                              <td className="py-4 px-4 font-medium text-gray-700 whitespace-nowrap">
                                ₹{(item.paid_amount || 0).toLocaleString('en-IN')}
                              </td>
                              <td className="py-4 px-4 whitespace-nowrap">
                                <StatusBadge status={item.status} />
                              </td>
                              <td className="py-4 px-5 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1.5">
                                  {showCollectButton && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCollectingPayment(item);
                                        setIsCollectModalOpen(true);
                                      }}
                                      className="px-3 py-1.5 bg-[#175C46] text-white rounded-lg text-xs font-semibold hover:bg-[#124B38] transition-colors cursor-pointer shadow-2xs"
                                    >
                                      Collect
                                    </button>
                                  )}
                                  <IconButton
                                    variant="view"
                                    title="View Payment Details"
                                    onClick={() => {
                                      setViewingPayment(item);
                                      setIsViewModalOpen(true);
                                    }}
                                  />
                                  <IconButton
                                    variant="status"
                                    title={isPaid ? 'Cannot change status of paid transaction' : 'Update Status'}
                                    disabled={isPaid}
                                    onClick={() => {
                                      if (isPaid) return;
                                      setStatusPayment(item);
                                      setIsStatusModalOpen(true);
                                    }}
                                  />
                                  <IconButton
                                    variant="edit"
                                    title={isPaid ? 'Cannot edit paid bill' : 'Edit Payment'}
                                    disabled={isPaid}
                                    onClick={() => {
                                      if (isPaid) return;
                                      setEditingPayment(item);
                                      setIsPaymentFormOpen(true);
                                    }}
                                  />
                                  <IconButton
                                    variant="delete"
                                    title={isPaid ? 'Cannot delete paid bill' : 'Delete Payment'}
                                    disabled={isPaid}
                                    onClick={() => {
                                      if (isPaid) return;
                                      setDeletingPayment(item);
                                    }}
                                  />
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-gray-400">
                            <div className="flex flex-col items-center justify-center gap-1.5">
                              <span className="text-xs font-semibold text-gray-600">No Billing Records Found</span>
                              <span className="text-[11px] text-gray-400">
                                Click &quot;+ Record Payment&quot; above to create a bill or charge for this resident.
                              </span>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

                    {/* Tab 4: Complaints Tab */}
                    {activeTab === 'Complaints' && (
                      <div className="space-y-4">
                        {loadingComplaints ? (
                          <div className="bg-white rounded-2xl border border-gray-100 p-16 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col items-center justify-center gap-3">
                            <ProgressSpinner style={{ width: '36px', height: '36px' }} strokeWidth="3" />
                            <span className="text-xs text-gray-500 font-medium">Loading complaints...</span>
                          </div>
                        ) : residentComplaints.length === 0 ? (
                          <div className="bg-white rounded-2xl border border-gray-100 p-12 sm:p-16 shadow-[0_1px_3px_rgba(0,0,0,0.02)] text-center space-y-3">
                            <div className="w-14 h-14 rounded-full bg-[#EBF7F2] text-[#175C46] flex items-center justify-center mx-auto">
                              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <h3 className="text-base font-bold text-gray-900">No Complaints Reported</h3>
                            <p className="text-xs text-gray-500 max-w-sm mx-auto">
                              This resident currently has no active or past maintenance and facility complaints.
                            </p>
                          </div>
                        ) : (
                          /* Complaints Table Card */
                          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
                            <div className="p-5 border-b border-gray-100">
                              <h3 className="text-sm font-bold text-gray-900">Complaints & Requests</h3>
                              <p className="text-xs text-gray-500 mt-0.5">
                                All maintenance issues and service requests raised by {resident.name || 'this resident'}
                              </p>
                            </div>

                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="border-b border-gray-100 text-gray-500 font-semibold bg-gray-50/50">
                                    <th className="py-3.5 px-5">Complaint ID</th>
                                    <th className="py-3.5 px-4">Title / Issue</th>
                                    <th className="py-3.5 px-4">Category</th>
                                    <th className="py-3.5 px-4">Assigned To</th>
                                    <th className="py-3.5 px-4">Created On</th>
                                    <th className="py-3.5 px-4">Status</th>
                                    <th className="py-3.5 px-5 text-right">Action</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 font-normal">
                                  {residentComplaints.map((item) => {
                                    const complaintNo = item.complaint_number || `CMP-${item.id}`;
                                    const categoryName = item.category?.name || 'General';
                                    const assignedName = item.assigned_to?.name || 'Unassigned';

                                    return (
                                      <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="py-4 px-5">
                                          <Link
                                            href={`/complaints/${item.id}?from=resident&residentId=${resident.id}`}
                                            className="font-bold text-[#175C46] hover:underline whitespace-nowrap"
                                          >
                                            {complaintNo}
                                          </Link>
                                        </td>
                                        <td className="py-4 px-4">
                                          <span className="font-semibold text-gray-900 block max-w-[240px] truncate" title={item.title}>
                                            {item.title}
                                          </span>
                                          {item.description && (
                                            <span className="text-[11px] text-gray-400 block max-w-[240px] truncate mt-0.5" title={item.description}>
                                              {item.description}
                                            </span>
                                          )}
                                        </td>
                                        <td className="py-4 px-4 whitespace-nowrap">
                                          <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[11px] font-medium">
                                            {categoryName}
                                          </span>
                                        </td>
                                        <td className="py-4 px-4 whitespace-nowrap text-gray-700">
                                          {assignedName}
                                        </td>
                                        <td className="py-4 px-4 whitespace-nowrap text-gray-500">
                                          {formatDate(item.created_at)}
                                        </td>
                                        <td className="py-4 px-4 whitespace-nowrap">
                                          <StatusBadge status={item.status} />
                                        </td>
                                        <td className="py-4 px-5 text-right whitespace-nowrap">
                                          <div className="flex items-center justify-end pr-1">
                                            <Link href={`/complaints/${item.id}?from=resident&residentId=${resident.id}`}>
                                              <IconButton
                                                variant="view"
                                                title="View Complaint Details"
                                                aria-label="View Complaint Details"
                                              />
                                            </Link>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Record / Edit Payment Modal */}
                    <PaymentFormModal
                      visible={isPaymentFormOpen}
                      onHide={() => {
                        setIsPaymentFormOpen(false);
                        setEditingPayment(null);
                      }}
                      onSuccess={() => {
                        setLoadingPayments(true);
                        setPaymentsRefreshTrigger((prev) => prev + 1);
                      }}
                      initialPayment={editingPayment}
                      residentContext={{
                        resident_id: resident.id,
                        resident_name: resident.name,
                        branch_id: resident.room_info?.branch_id,
                        branch_name: resident.room_info?.branch_name,
                        building_name: resident.room_info?.building_name,
                        floor_name:
                          resident.room_info?.floor_name ||
                          (resident.room_info?.floor_number ? `Floor ${resident.room_info.floor_number}` : undefined),
                        pg_id: resident.room_info?.pg_id,
                        stay_id:
                          (resident as unknown as { stay_id?: number }).stay_id ??
                          resident.room_info?.stay_id ??
                          residentPayments.find((p) => p.stay_id)?.stay_id ??
                          undefined,
                        room_id:
                          resident.room_info?.room_id ??
                          residentPayments.find((p) => p.room_id)?.room_id ??
                          undefined,
                        room_no: resident.room_info?.room_no,
                        room_type: resident.room_info?.room_type,
                        monthly_rent: resident.room_info?.monthly_rent,
                        security_deposit: resident.room_info?.security_deposit,
                      }}
                    />

                    {/* Collect Payment Modal */}
                    <PaymentCollectModal
                      visible={isCollectModalOpen}
                      onHide={() => {
                        setIsCollectModalOpen(false);
                        setCollectingPayment(null);
                      }}
                      onSuccess={() => {
                        setLoadingPayments(true);
                        setPaymentsRefreshTrigger((prev) => prev + 1);
                      }}
                      payment={collectingPayment}
                    />

                    {/* Payment Details View Modal */}
                    <PaymentDetailsModal
                      visible={isViewModalOpen}
                      onHide={() => {
                        setIsViewModalOpen(false);
                        setViewingPayment(null);
                      }}
                      payment={viewingPayment}
                    />

                    {/* Payment Status Update Modal */}
                    <PaymentStatusModal
                      visible={isStatusModalOpen}
                      onHide={() => {
                        setIsStatusModalOpen(false);
                        setStatusPayment(null);
                      }}
                      payment={statusPayment}
                      onSuccess={() => {
                        setLoadingPayments(true);
                        setPaymentsRefreshTrigger((prev) => prev + 1);
                      }}
                    />

            {/* Delete Payment Confirmation Modal */}
            <DeleteConfirmationModal
              visible={Boolean(deletingPayment)}
              onHide={() => setDeletingPayment(null)}
              title="Delete Payment Record"
              itemName={deletingPayment?.title}
              itemType="payment record"
              details={[
                { label: 'Invoice Title', value: deletingPayment?.title || '—' },
                { label: 'Total Amount', value: formatCurrency(deletingPayment?.amount) },
                { label: 'Due Date', value: formatDate(deletingPayment?.due_date) },
                { label: 'Status', value: deletingPayment?.status || '—' },
              ]}
              loading={isDeleting}
              onConfirm={handleConfirmDeletePayment}
            />

            {/* Document Preview Lightbox Modal (same as complaints) */}
            <AttachmentPreviewModal
              visible={docPreviewVisible}
              onHide={() => setDocPreviewVisible(false)}
              attachments={uploadedDocumentAttachments}
              initialIndex={docPreviewIndex}
            />
          </>
        )}
      </main>
    );
}

