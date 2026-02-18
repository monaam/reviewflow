import { FC, useEffect, useState } from 'react';
import { Modal } from './Modal';
import { adminApi } from '../../api/admin';
import { requestsApi } from '../../api/requests';
import { CreativeRequest, User } from '../../types';

interface ReassignModalProps {
  request: CreativeRequest;
  onClose: () => void;
  onReassigned: () => void;
}

export const ReassignModal: FC<ReassignModalProps> = ({
  request,
  onClose,
  onReassigned,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState(request.assigned_to);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await adminApi.getUsers({ role: 'creative', active: true });
        setUsers(response.data);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    };
    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || selectedUserId === request.assigned_to) {
      onClose();
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await requestsApi.update(request.id, {
        assigned_to: selectedUserId,
      });
      onReassigned();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to reassign request');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal title="Reassign Request" onClose={onClose}>
      {error && (
        <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="reassign-user" className="label">
            Assign to
          </label>
          <select
            id="reassign-user"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="input"
            required
          >
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} {user.id === request.assigned_to ? '(current)' : ''}
              </option>
            ))}
          </select>
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
            {isLoading ? 'Reassigning...' : 'Reassign'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
