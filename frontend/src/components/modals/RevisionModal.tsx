import { FC, useState } from 'react';
import { Modal } from './Modal';

interface RevisionModalProps {
  onClose: () => void;
  onSubmit: (comment: string) => void;
}

/**
 * Modal for requesting a revision with optional notes.
 */
export const RevisionModal: FC<RevisionModalProps> = ({ onClose, onSubmit }) => {
  const [comment, setComment] = useState('');

  return (
    <Modal title="Request Revision" onClose={onClose}>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        Add an optional note, or leave blank if you've already added annotations.
      </p>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Additional notes (optional)..."
        className="input mb-4"
        rows={4}
      />
      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="btn-secondary">
          Cancel
        </button>
        <button onClick={() => onSubmit(comment)} className="btn-warning">
          Request Revision
        </button>
      </div>
    </Modal>
  );
};
