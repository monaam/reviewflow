import { FC, useState } from 'react';
import { Modal } from './Modal';

interface DeleteConfirmModalProps {
  title: string;
  message: string;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  confirmLabel?: string;
}

/**
 * Generic confirmation modal for delete operations.
 */
export const DeleteConfirmModal: FC<DeleteConfirmModalProps> = ({
  title,
  message,
  onClose,
  onConfirm,
  confirmLabel = 'Delete',
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    await onConfirm();
    setIsLoading(false);
  };

  return (
    <Modal title={title} onClose={onClose}>
      <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="btn-secondary" disabled={isLoading}>
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          className="btn-primary bg-red-600 hover:bg-red-700"
          disabled={isLoading}
        >
          {isLoading ? 'Deleting...' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
};
