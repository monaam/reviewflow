import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import {
  ArrowLeft,
  Upload,
  FileImage,
  Film,
  FileText,
  Plus,
  Users,
  Calendar,
  ClipboardList,
} from 'lucide-react';
import { projectsApi } from '../api/projects';
import { assetsApi } from '../api/assets';
import { requestsApi } from '../api/requests';
import { Project, Asset, CreativeRequest, User } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { useAuthStore } from '../stores/authStore';
import { adminApi } from '../api/admin';

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const [project, setProject] = useState<Project | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [requests, setRequests] = useState<CreativeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'assets' | 'requests'>('assets');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (id) {
      fetchProject();
    }
  }, [id]);

  const fetchProject = async () => {
    try {
      const [projectData, assetsData, requestsData] = await Promise.all([
        projectsApi.get(id!),
        assetsApi.list(id!),
        requestsApi.list(id!),
      ]);
      setProject(projectData);
      setAssets(assetsData.data);
      setRequests(requestsData.data);
    } catch (error) {
      console.error('Failed to fetch project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAssets = filter === 'all'
    ? assets
    : assets.filter((a) => a.status === filter);

  const canUpload = user?.role === 'admin' || user?.role === 'pm' || user?.role === 'creative';
  const canCreateRequest = user?.role === 'admin' || user?.role === 'pm';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Project not found
        </h2>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/projects"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Projects
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {project.name}
            </h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
              {project.client_name && (
                <span>{project.client_name}</span>
              )}
              {project.deadline && (
                <span className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Due {new Date(project.deadline).toLocaleDateString()}
                </span>
              )}
              <span className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                {project.members?.length || 0} members
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            {canCreateRequest && (
              <button
                onClick={() => setShowRequestModal(true)}
                className="btn-secondary"
              >
                <ClipboardList className="w-4 h-4 mr-2" />
                New Request
              </button>
            )}
            {canUpload && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="btn-primary"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Asset
              </button>
            )}
          </div>
        </div>

        {project.description && (
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            {project.description}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('assets')}
            className={`pb-4 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'assets'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Assets ({assets.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`pb-4 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'requests'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Requests ({requests.length})
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'assets' && (
        <>
          {/* Asset Filters */}
          <div className="flex gap-2 mb-6">
            {['all', 'pending_review', 'in_review', 'approved', 'revision_requested'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  filter === status
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {status === 'all' ? 'All' : status.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          {/* Assets Grid */}
          {filteredAssets.length === 0 ? (
            <div className="text-center py-12 card">
              <FileImage className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No assets yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Upload your first asset to get started.
              </p>
              {canUpload && (
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="btn-primary"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Asset
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredAssets.map((asset) => (
                <AssetCard key={asset.id} asset={asset} />
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'requests' && (
        <>
          {requests.length === 0 ? (
            <div className="text-center py-12 card">
              <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No requests yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Create a request to assign work to your creative team.
              </p>
              {canCreateRequest && (
                <button
                  onClick={() => setShowRequestModal(true)}
                  className="btn-primary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Request
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadAssetModal
          projectId={id!}
          onClose={() => setShowUploadModal(false)}
          onUploaded={(asset) => {
            setAssets([asset, ...assets]);
            setShowUploadModal(false);
          }}
        />
      )}

      {/* Create Request Modal */}
      {showRequestModal && (
        <CreateRequestModal
          projectId={id!}
          onClose={() => setShowRequestModal(false)}
          onCreated={(request) => {
            setRequests([request, ...requests]);
            setShowRequestModal(false);
          }}
        />
      )}
    </div>
  );
}

function AssetCard({ asset }: { asset: Asset }) {
  const getIcon = () => {
    switch (asset.type) {
      case 'video':
        return Film;
      case 'pdf':
        return FileText;
      default:
        return FileImage;
    }
  };

  const Icon = getIcon();

  return (
    <Link
      to={`/assets/${asset.id}`}
      className="card hover:shadow-md transition-shadow"
    >
      <div className="aspect-video bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
        <Icon className="w-12 h-12 text-gray-400" />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-medium text-gray-900 dark:text-white line-clamp-1">
            {asset.title}
          </h3>
          <span className="text-xs text-gray-500">v{asset.current_version}</span>
        </div>
        <div className="flex items-center justify-between">
          <StatusBadge status={asset.status} type="asset" />
          <span className="text-xs text-gray-500">
            {asset.uploader?.name}
          </span>
        </div>
      </div>
    </Link>
  );
}

function RequestCard({ request }: { request: CreativeRequest }) {
  const isOverdue = new Date(request.deadline) < new Date() &&
    !['completed', 'cancelled'].includes(request.status);

  return (
    <Link
      to={`/requests/${request.id}`}
      className={`card p-4 hover:shadow-md transition-shadow ${
        isOverdue ? 'border-red-300 dark:border-red-700' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white">
            {request.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
            {request.description}
          </p>
          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
            <span>Assigned to: {request.assignee?.name}</span>
            <span className={isOverdue ? 'text-red-500 font-medium' : ''}>
              Due: {new Date(request.deadline).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={request.priority} type="priority" />
          <StatusBadge status={request.status} type="request" />
        </div>
      </div>
    </Link>
  );
}

function UploadAssetModal({
  projectId,
  onClose,
  onUploaded,
}: {
  projectId: string;
  onClose: () => void;
  onUploaded: (asset: Asset) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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

    try {
      const asset = await assetsApi.create(projectId, {
        file,
        title,
        description: description || undefined,
      });
      onUploaded(asset);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to upload asset');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Upload Asset
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              {file ? (
                <div>
                  <FileImage className="w-12 h-12 text-primary-500 mx-auto mb-2" />
                  <p className="font-medium text-gray-900 dark:text-white">
                    {file.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div>
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Drag and drop a file here, or click to select
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Images, videos, or PDFs up to 500MB
                  </p>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="title" className="label">
                Title *
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
              <button
                type="submit"
                className="btn-primary"
                disabled={isLoading || !file}
              >
                {isLoading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function CreateRequestModal({
  projectId,
  onClose,
  onCreated,
}: {
  projectId: string;
  onClose: () => void;
  onCreated: (request: CreativeRequest) => void;
}) {
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
    setError('');
    setIsLoading(true);

    try {
      const request = await requestsApi.create(projectId, {
        title,
        description,
        assigned_to: assignedTo,
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Create Request
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="label">
                Title *
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
                Description *
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
                Assign to *
              </label>
              <select
                id="assignedTo"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="input"
                required
              >
                <option value="">Select a creative</option>
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
                  Deadline *
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
                {isLoading ? 'Creating...' : 'Create Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
