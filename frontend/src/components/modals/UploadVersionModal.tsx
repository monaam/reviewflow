import { FC, useState } from 'react';
import { Modal } from './Modal';

interface UploadVersionModalProps {
  onClose: () => void;
  onUpload: (file: File, versionNotes?: string) => void;
}

/**
 * Modal for uploading a new version of an asset.
 */
export const UploadVersionModal: FC<UploadVersionModalProps> = ({
  onClose,
  onUpload,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [versionNotes, setVersionNotes] = useState('');

  return (
    <Modal title="Upload New Version" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label htmlFor="file-upload" className="label">
            File *
          </label>
          <input
            id="file-upload"
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="input"
            accept="image/*,video/*,application/pdf"
          />
        </div>
        <div>
          <label htmlFor="version-notes" className="label">
            Version Notes (optional)
          </label>
          <textarea
            id="version-notes"
            value={versionNotes}
            onChange={(e) => setVersionNotes(e.target.value)}
            placeholder="Describe what changed in this version..."
            className="input"
            rows={3}
            maxLength={1000}
          />
          <p className="text-xs text-gray-500 mt-1">
            {versionNotes.length}/1000 characters
          </p>
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <button onClick={onClose} className="btn-secondary">
          Cancel
        </button>
        <button
          onClick={() => file && onUpload(file, versionNotes || undefined)}
          disabled={!file}
          className="btn-primary"
        >
          Upload
        </button>
      </div>
    </Modal>
  );
};
