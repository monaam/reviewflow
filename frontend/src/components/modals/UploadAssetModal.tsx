import { FC, useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileImage, Upload } from 'lucide-react';
import { Modal } from './Modal';
import { assetsApi } from '../../api/assets';
import { Asset } from '../../types';
import { UploadProgress } from '../common/UploadProgress';
import { useUploadProgress } from '../../hooks';

interface UploadAssetModalProps {
  projectId: string;
  onClose: () => void;
  onUploaded: (asset: Asset) => void;
}

export const UploadAssetModal: FC<UploadAssetModalProps> = ({
  projectId,
  onClose,
  onUploaded,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { uploadProgress, onUploadProgress, startUpload, resetUpload } = useUploadProgress();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const f = acceptedFiles[0];
      setFile(f);
      if (!title) {
        setTitle(f.name.replace(/\.[^/.]+$/, ''));
      }
    }
  }, [title]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
      'video/*': ['.mp4', '.mov', '.webm'],
      'application/pdf': ['.pdf'],
    },
    maxSize: 500 * 1024 * 1024,
    multiple: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setError('');
    setIsLoading(true);
    startUpload();

    try {
      const asset = await assetsApi.create(projectId, {
        file,
        title,
        description: description || undefined,
      }, { onUploadProgress });
      onUploaded(asset);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to upload asset');
      resetUpload();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal title="Upload Asset" onClose={onClose} maxWidth="lg">
      {error && (
        <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-md p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-gray-400 bg-gray-50 dark:bg-gray-700/50'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          } ${isLoading ? 'pointer-events-none opacity-50' : ''}`}
        >
          <input {...getInputProps()} disabled={isLoading} />
          {file ? (
            <div>
              <FileImage className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <p className="font-medium text-gray-900 dark:text-white">
                {file.name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          ) : (
            <div>
              <Upload className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-gray-600 dark:text-gray-400">
                Drag and drop a file here, or click to select
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Images, videos, or PDFs up to 500MB
              </p>
            </div>
          )}
        </div>

        {uploadProgress.isUploading && (
          <UploadProgress progress={uploadProgress} fileName={file?.name} />
        )}

        <div>
          <label htmlFor="title" className="label">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input"
            required
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="description" className="label">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input"
            rows={3}
            disabled={isLoading}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading || !file}
          >
            {isLoading ? `Uploading${uploadProgress.progress > 0 ? ` (${uploadProgress.progress}%)` : '...'}` : 'Upload'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
