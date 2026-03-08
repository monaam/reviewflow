import { FC, useState } from 'react';
import { Modal } from './Modal';
import { requestsApi } from '../../api/requests';
import { CreativeRequest } from '../../types';

interface EditRequestModalProps {
  request: CreativeRequest;
  onClose: () => void;
  onUpdated: () => void;
}

export const EditRequestModal: FC<EditRequestModalProps> = ({
  request,
  onClose,
  onUpdated,
}) => {
  const [title, setTitle] = useState(request.title);
  const [description, setDescription] = useState(request.description);
  const [deadline, setDeadline] = useState(
    new Date(request.deadline).toISOString().slice(0, 16)
  );
  const [priority, setPriority] = useState(request.priority);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await requestsApi.update(request.id, {
        title,
        description,
        deadline,
        priority,
      });
      onUpdated();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to update request');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal title="Edit Request" onClose={onClose} maxWidth="lg">
      {error && (
        <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="edit-title" className="label">
            Title
          </label>
          <input
            id="edit-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input"
            required
          />
        </div>

        <div>
          <label htmlFor="edit-description" className="label">
            Description
          </label>
          <textarea
            id="edit-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input"
            rows={4}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="edit-deadline" className="label">
              Deadline
            </label>
            <input
              id="edit-deadline"
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="input"
              required
            />
          </div>

          <div>
            <label htmlFor="edit-priority" className="label">
              Priority
            </label>
            <select
              id="edit-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as typeof priority)}
              className="input"
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
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
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
