import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  User,
  FileText,
  Upload,
  PlayCircle,
  CheckCircle,
  AlertTriangle,
  Edit2,
  Trash2,
  UserCheck,
} from 'lucide-react';
import { requestsApi } from '../api/requests';
import { assetsApi } from '../api/assets';
import { adminApi } from '../api/admin';
import { CreativeRequest, Asset, User as UserType } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { useAuthStore } from '../stores/authStore';

export function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [request, setRequest] = useState<CreativeRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchRequest();
    }
  }, [id]);

  const fetchRequest = async () => {
    try {
      const data = await requestsApi.get(id!);
      setRequest(data);
    } catch (error) {
      console.error('Failed to fetch request:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStart = async () => {
    try {
      await requestsApi.start(id!);
      fetchRequest();
    } catch (error) {
      console.error('Failed to start request:', error);
    }
  };

  const handleComplete = async () => {
    try {
      await requestsApi.complete(id!);
      fetchRequest();
    } catch (error) {
      console.error('Failed to complete request:', error);
    }
  };

  const handleUploadAsset = async (file: File, title: string) => {
    try {
      const asset = await assetsApi.create(request!.project_id, {
        file,
        title,
        request_id: id,
      });
      setShowUploadModal(false);
      navigate(`/assets/${asset.id}`);
    } catch (error) {
      console.error('Failed to upload asset:', error);
    }
  };

  const isAssignee = user?.id === request?.assigned_to;
  const isCreator = user?.id === request?.created_by;
  const isReviewer = user?.role === 'reviewer';
  const canComplete = (isCreator || user?.role === 'admin') && request?.status === 'asset_submitted';
  const canEdit = isCreator || user?.role === 'admin';
  const canDelete = isCreator || user?.role === 'admin';
  const canReassign = (isCreator || user?.role === 'admin') && !['completed', 'cancelled'].includes(request?.status || '');

  const isOverdue = request &&
    new Date(request.deadline) < new Date() &&
    !['completed', 'cancelled'].includes(request.status);

  const handleDelete = async () => {
    try {
      await requestsApi.delete(id!);
      navigate(`/projects/${request?.project_id}`);
    } catch (error) {
      console.error('Failed to delete request:', error);
    }
  };

  // Reviewers don't have access to requests
  if (isReviewer) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Access Restricted
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Creative requests are not available for your role.
          </p>
          <Link
            to="/"
            className="inline-flex items-center mt-4 text-primary-600 hover:text-primary-700"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Request not found
        </h2>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          to={`/projects/${request.project_id}`}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Project
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {request.title}
              </h1>
              <StatusBadge status={request.priority} type="priority" />
              <StatusBadge status={request.status} type="request" />
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              {request.project?.name}
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            {canEdit && (
              <button onClick={() => setShowEditModal(true)} className="btn-secondary">
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </button>
            )}
            {canReassign && (
              <button onClick={() => setShowReassignModal(true)} className="btn-secondary">
                <UserCheck className="w-4 h-4 mr-2" />
                Reassign
              </button>
            )}
            {canDelete && (
              <button onClick={() => setShowDeleteModal(true)} className="btn-secondary text-red-600 hover:bg-red-50">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </button>
            )}
            {isAssignee && request.status === 'pending' && (
              <button onClick={handleStart} className="btn-primary">
                <PlayCircle className="w-4 h-4 mr-2" />
                Start Working
              </button>
            )}
            {isAssignee && request.status === 'in_progress' && (
              <button onClick={() => setShowUploadModal(true)} className="btn-primary">
                <Upload className="w-4 h-4 mr-2" />
                Upload Asset
              </button>
            )}
            {canComplete && (
              <button onClick={handleComplete} className="btn-success">
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark Complete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Description
            </h2>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {request.description}
            </p>
          </div>

          {/* Specs */}
          {request.specs && Object.keys(request.specs).length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Specifications
              </h2>
              <dl className="grid grid-cols-2 gap-4">
                {Object.entries(request.specs).map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-sm font-medium text-gray-500 capitalize">
                      {key.replace(/_/g, ' ')}
                    </dt>
                    <dd className="text-gray-900 dark:text-white">
                      {String(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* Attachments */}
          {request.attachments && request.attachments.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Reference Attachments
              </h2>
              <div className="space-y-2">
                {request.attachments.map((attachment) => (
                  <a
                    key={attachment.id}
                    href={attachment.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    <FileText className="w-5 h-5 text-gray-500 mr-3" />
                    <span className="text-gray-900 dark:text-white">
                      {attachment.file_name}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Linked Assets */}
          {request.assets && request.assets.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Submitted Assets
              </h2>
              <div className="space-y-2">
                {request.assets.map((asset) => (
                  <Link
                    key={asset.id}
                    to={`/assets/${asset.id}`}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-gray-500 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {asset.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          v{asset.current_version} · {asset.type}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={asset.status} type="asset" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Details */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Details
            </h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Assigned To
                </dt>
                <dd className="mt-1 text-gray-900 dark:text-white">
                  {request.assignee?.name}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Created By
                </dt>
                <dd className="mt-1 text-gray-900 dark:text-white">
                  {request.creator?.name}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  Deadline
                </dt>
                <dd className={`mt-1 ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-900 dark:text-white'}`}>
                  {isOverdue && <AlertTriangle className="w-4 h-4 inline mr-1" />}
                  {new Date(request.deadline).toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  Created At
                </dt>
                <dd className="mt-1 text-gray-900 dark:text-white">
                  {new Date(request.created_at).toLocaleString()}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadAssetModal
          onClose={() => setShowUploadModal(false)}
          onUpload={handleUploadAsset}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <EditRequestModal
          request={request}
          onClose={() => setShowEditModal(false)}
          onUpdated={(updated) => {
            setRequest(updated);
            setShowEditModal(false);
          }}
        />
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <DeleteConfirmModal
          title="Delete Request"
          message={`Are you sure you want to delete "${request.title}"? This action cannot be undone.`}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
        />
      )}

      {/* Reassign Modal */}
      {showReassignModal && (
        <ReassignModal
          request={request}
          onClose={() => setShowReassignModal(false)}
          onReassigned={(updated) => {
            setRequest(updated);
            setShowReassignModal(false);
          }}
        />
      )}
    </div>
  );
}

function UploadAssetModal({
  onClose,
  onUpload,
}: {
  onClose: () => void;
  onUpload: (file: File, title: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) return;
    setIsLoading(true);
    await onUpload(file, title);
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Upload Asset for Request
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="file" className="label">
              File
            </label>
            <input
              id="file"
              type="file"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setFile(f);
                  if (!title) {
                    setTitle(f.name.replace(/\.[^/.]+$/, ''));
                  }
                }
              }}
              className="input"
              accept="image/*,video/*,application/pdf"
              required
            />
          </div>
          <div>
            <label htmlFor="title" className="label">
              Asset Title
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
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !file || !title}
              className="btn-primary"
            >
              {isLoading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditRequestModal({
  request,
  onClose,
  onUpdated,
}: {
  request: CreativeRequest;
  onClose: () => void;
  onUpdated: (request: CreativeRequest) => void;
}) {
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
      const updated = await requestsApi.update(request.id, {
        title,
        description,
        deadline,
        priority,
      });
      onUpdated(updated);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to update request');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Edit Request
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="edit-title" className="label">
                Title *
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
                Description *
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit-deadline" className="label">
                  Deadline *
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
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({
  title,
  message,
  onClose,
  onConfirm,
}: {
  title: string;
  message: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    await onConfirm();
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {title}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary" disabled={isLoading}>
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="btn-primary bg-red-600 hover:bg-red-700"
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReassignModal({
  request,
  onClose,
  onReassigned,
}: {
  request: CreativeRequest;
  onClose: () => void;
  onReassigned: (request: CreativeRequest) => void;
}) {
  const [users, setUsers] = useState<UserType[]>([]);
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
      const updated = await requestsApi.update(request.id, {
        assigned_to: selectedUserId,
      });
      onReassigned(updated);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to reassign request');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Reassign Request
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
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
      </div>
    </div>
  );
}
