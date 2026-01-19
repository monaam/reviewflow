import { FC, useState } from 'react';
import { Modal } from './Modal';
import { assetsApi } from '../../api/assets';
import { useUploadProgress } from '../../hooks';
import { UploadProgress } from '../common/UploadProgress';

interface UploadVersionModalProps {
  assetId: string;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Modal for uploading a new version of an asset with progress tracking.
 */
export const UploadVersionModal: FC<UploadVersionModalProps> = ({
  assetId,
  onClose,
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [versionNotes, setVersionNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { uploadProgress, onUploadProgress, startUpload, resetUpload } = useUploadProgress();

  const handleUpload = async () => {
    if (!file) return;

    setError('');
    setIsLoading(true);
    startUpload();

    try {
      await assetsApi.uploadVersion(assetId, file, versionNotes || undefined, { onUploadProgress });
      onSuccess();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to upload version');
      resetUpload();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal title="Upload New Version" onClose={onClose}>
      {error && (
        <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-sm">
          {error}
        </div>
      )}

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
            disabled={isLoading}
          />
        </div>

        {uploadProgress.isUploading && (
          <UploadProgress progress={uploadProgress} fileName={file?.name} />
        )}

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
            disabled={isLoading}
          />
          <p className="text-xs text-gray-500 mt-1">
            {versionNotes.length}/1000 characters
          </p>
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <button onClick={onClose} className="btn-secondary" disabled={isLoading}>
          Cancel
        </button>
        <button
          onClick={handleUpload}
          disabled={!file || isLoading}
          className="btn-primary"
        >
          {isLoading ? `Uploading${uploadProgress.progress > 0 ? ` (${uploadProgress.progress}%)` : '...'}` : 'Upload'}
        </button>
      </div>
    </Modal>
  );
};
