import { FC, useState } from 'react';
import { Modal } from './Modal';
import { projectsApi } from '../../api/projects';
import { Project } from '../../types';

interface EditProjectModalProps {
  project: Project;
  onClose: () => void;
  onUpdated: (project: Project) => void;
}

export const EditProjectModal: FC<EditProjectModalProps> = ({
  project,
  onClose,
  onUpdated,
}) => {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || '');
  const [clientName, setClientName] = useState(project.client_name || '');
  const [deadline, setDeadline] = useState(
    project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : ''
  );
  const [status, setStatus] = useState(project.status);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const updated = await projectsApi.update(project.id, {
        name,
        description: description || undefined,
        client_name: clientName || undefined,
        deadline: deadline || undefined,
        status,
      });
      onUpdated(updated);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to update project');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal title="Edit Project" onClose={onClose}>
      {error && (
        <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="edit-name" className="label">
            Project Name
          </label>
          <input
            id="edit-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
            rows={3}
          />
        </div>

        <div>
          <label htmlFor="edit-clientName" className="label">
            Client Name
          </label>
          <input
            id="edit-clientName"
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="input"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="edit-deadline" className="label">
              Deadline
            </label>
            <input
              id="edit-deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label htmlFor="edit-status" className="label">
              Status
            </label>
            <select
              id="edit-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              className="input"
            >
              <option value="active">Active</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
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
            {isLoading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
