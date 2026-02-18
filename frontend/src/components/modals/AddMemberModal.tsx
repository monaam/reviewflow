import { FC, useEffect, useState } from 'react';
import { Modal } from './Modal';
import { projectsApi } from '../../api/projects';
import { adminApi } from '../../api/admin';
import { User } from '../../types';

interface AddMemberModalProps {
  projectId: string;
  existingMemberIds: string[];
  onClose: () => void;
  onAdded: () => void;
}

export const AddMemberModal: FC<AddMemberModalProps> = ({
  projectId,
  existingMemberIds,
  onClose,
  onAdded,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await adminApi.getUsers({ active: true });
        setUsers(response.data.filter((u: User) => !existingMemberIds.includes(u.id)));
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    };
    fetchUsers();
  }, [existingMemberIds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    setError('');
    setIsLoading(true);

    try {
      await projectsApi.addMember(projectId, selectedUserId);
      onAdded();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to add member');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal title="Add Team Member" onClose={onClose}>
      {error && (
        <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="member-select" className="label">
            Select User
          </label>
          <select
            id="member-select"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="input"
            required
          >
            <option value="">Choose a user...</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email}) - {user.role}
              </option>
            ))}
          </select>
        </div>

        {users.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No available users to add. All active users are already members.
          </p>
        )}

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
            disabled={isLoading || !selectedUserId}
          >
            {isLoading ? 'Adding...' : 'Add'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
