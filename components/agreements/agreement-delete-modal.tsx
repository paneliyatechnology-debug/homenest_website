'use client';

import React, { useState } from 'react';
import { AgreementRecord } from '@/types/agreement';
import { agreementService } from '@/services/agreement.service';
import { DeleteConfirmationModal } from '@/components/ui/delete-confirmation-modal';

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
    <DeleteConfirmationModal
      visible={visible}
      onHide={onHide}
      title="Delete Agreement"
      subtitle="This action cannot be undone"
      confirmLabel="Delete Agreement"
      itemType="agreement"
      itemName={record.agreement_no ? `${record.agreement_no} (${record.resident_name})` : record.resident_name}
      loading={deleting}
      onConfirm={handleDelete}
    />
  );
};
