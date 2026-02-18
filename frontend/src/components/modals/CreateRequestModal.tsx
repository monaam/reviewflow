import { FC, useEffect, useState } from 'react';
import { Modal } from './Modal';
import { requestsApi } from '../../api/requests';
import { usersApi } from '../../api/users';
import { CreativeRequest, User } from '../../types';

interface CreateRequestModalProps {
  projectId: string;
  onClose: () => void;
  onCreated: (request: CreativeRequest) => void;
}

export const CreateRequestModal: FC<CreateRequestModalProps> = ({
  projectId,
  onClose,
  onCreated,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await usersApi.list({ role: 'creative' });
        setUsers(response.data);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    };
    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const request = await requestsApi.create(projectId, {
        title,
        description,
        ...(assignedTo && { assigned_to: assignedTo }),
        deadline,
        priority,
      });
      onCreated(request);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to create request');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal title="Create Request" onClose={onClose} maxWidth="lg">
      {error && (
        <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
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
            rows={4}
            required
          />
        </div>

        <div>
          <label htmlFor="assignedTo" className="label">
            Assign to
          </label>
          <select
            id="assignedTo"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className="input"
          >
            <option value="">Select a creative (optional)</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="deadline" className="label">
              Deadline
            </label>
            <input
              id="deadline"
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="input"
              required
            />
          </div>

          <div>
            <label htmlFor="priority" className="label">
              Priority
            </label>
            <select
              id="priority"
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
            {isLoading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
