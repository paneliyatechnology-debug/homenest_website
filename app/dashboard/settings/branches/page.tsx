'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Toast } from 'primereact/toast';
import { Branch, BranchStats, BranchMeta } from '@/types/branch';
import { branchService, INITIAL_BRANCH_STATS } from '@/services/branch.service';
import { BranchStatsCards } from '@/components/branches/branch-stats-cards';
import { BranchTable } from '@/components/branches/branch-table';
import { BranchDetailsModal } from '@/components/branches/branch-details-modal';
import { DeleteConfirmationModal } from '@/components/ui/delete-confirmation-modal';

export default function BranchManagementPage() {
  const router = useRouter();
  const toastRef = useRef<Toast>(null);
  const hasShownToast = useRef(false);

  // Consume flash toast from sessionStorage if present (e.g. redirected from create/edit)
  useEffect(() => {
    if (typeof window !== 'undefined' && !hasShownToast.current) {
      const stored = sessionStorage.getItem('homenest_flash_toast');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          toastRef.current?.show({
            severity: parsed.severity || 'success',
            summary: parsed.summary || 'Success',
            detail: parsed.detail || '',
            life: 3000,
          });
        } catch {
          // ignore
        }
        sessionStorage.removeItem('homenest_flash_toast');
        hasShownToast.current = true;
      }
    }
  }, []);

  // States
  const [branches, setBranches] = useState<Branch[]>([]);
  const [stats, setStats] = useState<BranchStats>(INITIAL_BRANCH_STATS);
  const [meta, setMeta] = useState<BranchMeta>({
    page: 1,
    limit: 10,
    total_records: 0,
    total_pages: 1,
    has_next: false,
    has_prev: false,
  });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Modals
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [deletingBranch, setDeletingBranch] = useState<Branch | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast helper
  const showToast = (
    severity: 'success' | 'error' | 'info' | 'warn',
    summary: string,
    detail: string
  ) => {
    toastRef.current?.show({
      severity,
      summary,
      detail,
      life: 3500,
    });
  };

  // Delete Branch action
  const handleDeleteBranch = async () => {
    if (!deletingBranch) return;
    setIsDeleting(true);
    try {
      const res = await branchService.deleteBranch(deletingBranch.id);
      showToast('success', 'Branch Deleted', res.message || 'Branch deleted successfully');
      setDeletingBranch(null);
      setIsDeleteModalOpen(false);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      showToast(
        'error',
        'Delete Failed',
        err instanceof Error ? err.message : 'Failed to delete branch'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Fetch Stats
  useEffect(() => {
    let isMounted = true;
    branchService
      .getBranchStats()
      .then((data) => {
        if (!isMounted) return;
        setStats(data);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [refreshTrigger]);

  // Fetch Branches
  useEffect(() => {
    let isMounted = true;

    branchService
      .getBranches({
        page: currentPage,
        limit: 10,
      })
      .then((res) => {
        if (!isMounted) return;
        setBranches(res.data);
        setMeta(res.meta);
        setLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentPage, refreshTrigger]);

  return (
    <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 max-w-[1600px] w-full mx-auto space-y-5 sm:space-y-6 bg-[#F7F7F5]">
      <Toast ref={toastRef} position="top-right" />

      {/* Header matching Figma: Title & Subtitle + "Add Branch" Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Branch Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-normal mt-0.5">
            Manage and maintain all property branches.
          </p>
        </div>

        <Link
          href="/dashboard/settings/branches/new"
          className="px-6 py-2.5 bg-[#175C46] hover:bg-[#124B38] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors shrink-0 self-start sm:self-auto inline-flex items-center justify-center cursor-pointer"
        >
          Add Branch
        </Link>
      </div>

      {/* 4 Summary Stat Cards matching Figma pixel-for-pixel */}
      <BranchStatsCards stats={stats} />

      {/* Branch Table with Eye (View), Pencil (Edit), and Trash (Delete) */}
      <BranchTable
        branches={branches}
        meta={meta}
        loading={loading}
        onPageChange={(page) => setCurrentPage(page)}
        onView={(branch) => {
          setSelectedBranch(branch);
          setIsDetailsModalOpen(true);
        }}
        onEdit={(branch) => {
          router.push(`/dashboard/settings/branches/${branch.id}/edit`);
        }}
        onDelete={(branch) => {
          setDeletingBranch(branch);
          setIsDeleteModalOpen(true);
        }}
      />

      {/* View Branch Details Modal */}
      <BranchDetailsModal
        visible={isDetailsModalOpen}
        onHide={() => {
          setIsDetailsModalOpen(false);
          setSelectedBranch(null);
        }}
        branch={selectedBranch}
        onEdit={(branch) => {
          router.push(`/dashboard/settings/branches/${branch.id}/edit`);
        }}
      />

      {/* Reusable Delete Confirmation Modal */}
      <DeleteConfirmationModal
        visible={isDeleteModalOpen}
        onHide={() => {
          setIsDeleteModalOpen(false);
          setDeletingBranch(null);
        }}
        title="Delete Branch"
        itemName={deletingBranch?.name}
        itemType="branch"
        loading={isDeleting}
        onConfirm={handleDeleteBranch}
      />
    </main>
  );
}
