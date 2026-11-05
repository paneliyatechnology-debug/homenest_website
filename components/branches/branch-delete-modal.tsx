'use client';

import React, { useState } from 'react';
import { Branch } from '@/types/branch';
import { branchService } from '@/services/branch.service';
import { DeleteConfirmationModal } from '@/components/ui/delete-confirmation-modal';

interface BranchDeleteModalProps {
  visible: boolean;
  onHide: () => void;
  branch: Branch | null;
  onSuccess: () => void;
  showToast: (severity: 'success' | 'error' | 'info' | 'warn', summary: string, detail: string) => void;
}

export const BranchDeleteModal: React.FC<BranchDeleteModalProps> = ({
  visible,
  onHide,
  branch,
  onSuccess,
  showToast,
}) => {
  const [deleting, setDeleting] = useState(false);

  if (!branch) return null;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await branchService.deleteBranch(branch.id);
      showToast('success', 'Branch Deleted', res.message || 'Branch deleted successfully');
      onSuccess();
      onHide();
    } catch (err) {
      showToast(
        'error',
        'Delete Failed',
        err instanceof Error ? err.message : 'Failed to delete branch'
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DeleteConfirmationModal
      visible={visible}
      onHide={onHide}
      title="Delete Branch"
      subtitle="This action is permanent and cannot be undone"
      confirmLabel="Delete Branch"
      itemType="branch"
      itemName={branch.name}
      loading={deleting}
      onConfirm={handleDelete}
    />
  );
};
