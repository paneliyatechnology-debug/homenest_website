'use client';

import React, { useState } from 'react';
import { AgreementRecord } from '@/types/agreement';
import { agreementService } from '@/services/agreement.service';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface AgreementDeleteModalProps {
  visible: boolean;
  onHide: () => void;
  record: AgreementRecord | null;
  onSuccess: () => void;
  showToast: (severity: 'success' | 'error' | 'info' | 'warn', summary: string, detail: string) => void;
}

export const AgreementDeleteModal: React.FC<AgreementDeleteModalProps> = ({
  visible,
  onHide,
  record,
  onSuccess,
  showToast,
}) => {
  const [deleting, setDeleting] = useState(false);

  if (!record) return null;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await agreementService.deleteAgreement(record.id);
      showToast('success', 'Agreement Deleted', res.message || 'Agreement deleted successfully');
      onSuccess();
      onHide();
    } catch (err) {
      showToast('error', 'Delete Failed', err instanceof Error ? err.message : 'Failed to delete agreement');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ConfirmDialog
      visible={visible}
      onHide={onHide}
      title="Delete Agreement"
      subtitle="This action cannot be undone"
      confirmLabel="Delete"
      loading={deleting}
      onConfirm={handleDelete}
      message={
        <span>
          Are you sure you want to delete agreement{' '}
          <strong className="text-gray-900 font-semibold">{record.agreement_no}</strong> for resident{' '}
          <strong className="text-gray-900 font-semibold">{record.resident_name}</strong>?
        </span>
      }
    />
  );
};
