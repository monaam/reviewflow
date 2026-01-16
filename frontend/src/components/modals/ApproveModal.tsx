import { FC, useState } from 'react';
import { Modal } from './Modal';

interface ApproveModalProps {
  onClose: () => void;
  onApprove: (comment?: string) => void;
}

/**
 * Modal for approving an asset with optional comment.
 */
export const ApproveModal: FC<ApproveModalProps> = ({ onClose, onApprove }) => {
  const [comment, setComment] = useState('');

  return (
    <Modal title="Approve Asset" onClose={onClose}>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        Are you sure you want to approve this asset?
      </p>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Optional approval comment..."
        className="input mb-4"
        rows={3}
      />
      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="btn-secondary">
          Cancel
        </button>
        <button
          onClick={() => onApprove(comment || undefined)}
          className="btn-success"
        >
          Approve
        </button>
      </div>
    </Modal>
  );
};
