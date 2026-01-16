import { FC, useState } from 'react';
import { Modal } from './Modal';
import { assetsApi } from '../../api/assets';
import { Asset } from '../../types';

interface EditAssetModalProps {
  asset: Asset;
  onClose: () => void;
  onUpdated: (asset: Asset) => void;
}

/**
 * Modal for editing asset title and description.
 */
export const EditAssetModal: FC<EditAssetModalProps> = ({
  asset,
  onClose,
  onUpdated,
}) => {
  const [title, setTitle] = useState(asset.title);
  const [description, setDescription] = useState(asset.description || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const updated = await assetsApi.update(asset.id, {
        title,
        description: description || undefined,
      });
      onUpdated(updated);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to update asset');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal title="Edit Asset" onClose={onClose}>
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="asset-title" className="label">
            Title *
          </label>
          <input
            id="asset-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input"
            required
          />
        </div>

        <div>
          <label htmlFor="asset-description" className="label">
            Description
          </label>
          <textarea
            id="asset-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input"
            rows={3}
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
          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
