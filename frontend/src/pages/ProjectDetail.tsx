import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import {
  ArrowLeft,
  Upload,
  FileImage,
  Plus,
  Users,
  Calendar,
  ClipboardList,
  Edit2,
  Trash2,
  UserPlus,
  UserMinus,
  Search,
  X,
  Download,
} from 'lucide-react';
import { projectsApi } from '../api/projects';
import { assetsApi } from '../api/assets';
import { requestsApi } from '../api/requests';
import { adminApi } from '../api/admin';
import { Project, Asset, CreativeRequest, User } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { useAuthStore } from '../stores/authStore';
import { usersApi } from '../api/users';
import { getAssetTypeIcon, supportsThumbnail } from '../config/assetTypeRegistry';

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [project, setProject] = useState<Project | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [requests, setRequests] = useState<CreativeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'assets' | 'requests' | 'members'>('assets');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredAssets = assets.filter((a) => {
    const matchesFilter = filter === 'all' || a.status === filter;
    const matchesSearch = !searchQuery ||
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.uploader?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filteredRequests = requests.filter((r) => {
    const matchesSearch = !searchQuery ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.assignee?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const canUpload = user?.role === 'admin' || user?.role === 'pm' || user?.role === 'creative';
  const canCreateRequest = user?.role === 'admin' || user?.role === 'pm';
  const canEditProject = user?.role === 'admin' || user?.role === 'pm';
  const canDeleteProject = user?.role === 'admin';
  const canManageMembers = user?.role === 'admin' || user?.role === 'pm';

  const handleDeleteProject = async () => {
    try {
      await projectsApi.delete(id!);
      navigate('/projects');
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      await projectsApi.removeMember(id!, userId);
      fetchProject();
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-900 dark:border-gray-600 dark:border-t-gray-100"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">
          Project not found
        </h2>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/projects"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Projects
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {project.name}
            </h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
              {project.client_name && (
                <span>{project.client_name}</span>
              )}
              {project.deadline && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Due {new Date(project.deadline).toLocaleDateString()}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {project.members?.length || 0} members
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            {canEditProject && (
              <button
                onClick={() => setShowEditModal(true)}
                className="btn-secondary"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </button>
            )}
            {canDeleteProject && (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="btn-secondary"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </button>
            )}
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
          <p className="mt-4 text-gray-500 dark:text-gray-400">
            {project.description}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-800 mb-6">
        <nav className="flex gap-6">
          <button
            onClick={() => setActiveTab('assets')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'assets'
                ? 'border-gray-900 text-gray-900 dark:border-gray-100 dark:text-white'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Assets ({assets.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'requests'
                ? 'border-gray-900 text-gray-900 dark:border-gray-100 dark:text-white'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Requests ({requests.length})
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'members'
                ? 'border-gray-900 text-gray-900 dark:border-gray-100 dark:text-white'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Members ({project.members?.length || 0})
          </button>
        </nav>
      </div>

      {/* Search Bar */}
      {(activeTab === 'assets' || activeTab === 'requests') && (
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 pr-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      {activeTab === 'assets' && (
        <>
          {/* Asset Filters */}
          <div className="flex gap-1 mb-6">
            {['all', 'pending_review', 'in_review', 'approved', 'revision_requested'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  filter === status
                    ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {status === 'all' ? 'All' : status.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          {/* Assets Grid */}
          {filteredAssets.length === 0 ? (
            <div className="text-center py-16">
              <FileImage className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No assets yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
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
          {filteredRequests.length === 0 ? (
            <div className="text-center py-16">
              <ClipboardList className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchQuery ? 'No matching requests' : 'No requests yet'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {searchQuery
                  ? 'Try adjusting your search terms.'
                  : 'Create a request to assign work to your creative team.'}
              </p>
              {!searchQuery && canCreateRequest && (
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
            <div className="space-y-3">
              {filteredRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'members' && (
        <div className="border border-gray-100 dark:border-gray-800 rounded-lg">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h3 className="font-medium text-gray-900 dark:text-white">
              Project Members
            </h3>
            {canManageMembers && (
              <button
                onClick={() => setShowAddMemberModal(true)}
                className="btn-primary text-sm"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add Member
              </button>
            )}
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {project.members?.map((member) => (
              <div
                key={member.id}
                className="p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-300">
                    {member.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {member.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {member.email} · <span className="capitalize">{member.role}</span>
                    </p>
                  </div>
                </div>
                {canManageMembers && member.id !== project.created_by && (
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
                    title="Remove member"
                  >
                    <UserMinus className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            {(!project.members || project.members.length === 0) && (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                No members added to this project yet.
              </div>
            )}
          </div>
        </div>
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

      {/* Edit Project Modal */}
      {showEditModal && (
        <EditProjectModal
          project={project}
          onClose={() => setShowEditModal(false)}
          onUpdated={(updatedProject) => {
            setProject(updatedProject);
            setShowEditModal(false);
          }}
        />
      )}

      {/* Delete Project Modal */}
      {showDeleteModal && (
        <DeleteConfirmModal
          title="Delete Project"
          message={`Are you sure you want to delete "${project.name}"? This action cannot be undone and will remove all assets and requests associated with this project.`}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteProject}
        />
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <AddMemberModal
          projectId={id!}
          existingMemberIds={project.members?.map((m) => m.id) || []}
          onClose={() => setShowAddMemberModal(false)}
          onAdded={() => {
            fetchProject();
            setShowAddMemberModal(false);
          }}
        />
      )}
    </div>
  );
}

function AssetCard({ asset }: { asset: Asset }) {
  const Icon = getAssetTypeIcon(asset.type);
  const thumbnailUrl = asset.latest_version?.file_url;
  const canShowThumbnail = thumbnailUrl && supportsThumbnail(asset.type);

  return (
    <Link
      to={`/assets/${asset.id}`}
      className="block rounded-lg border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors overflow-hidden"
    >
      <div className="aspect-video bg-gray-50 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
        {canShowThumbnail ? (
          <img
            src={thumbnailUrl}
            alt={asset.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <Icon className={`w-10 h-10 text-gray-300 dark:text-gray-600 ${canShowThumbnail ? 'hidden' : ''}`} />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-medium text-gray-900 dark:text-white line-clamp-1">
            {asset.title}
          </h3>
          <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">v{asset.current_version}</span>
        </div>
        <div className="flex items-center justify-between">
          <StatusBadge status={asset.status} type="asset" />
          <span className="text-xs text-gray-400 dark:text-gray-500">
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
      className="block p-4 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 dark:text-white">
            {request.title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
            {request.description}
          </p>
          <div className="flex items-center gap-4 mt-3 text-sm text-gray-400 dark:text-gray-500">
            <span>Assigned to: {request.assignee?.name ?? 'Unassigned'}</span>
            <span className={isOverdue ? 'text-gray-900 dark:text-white font-medium' : ''}>
              Due: {new Date(request.deadline).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 ml-4">
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
    <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 max-w-lg w-full mx-4">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Upload Asset
          </h2>

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
              }`}
            >
              <input {...getInputProps()} />
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
    <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Create Request
          </h2>

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
        </div>
      </div>
    </div>
  );
}

function EditProjectModal({
  project,
  onClose,
  onUpdated,
}: {
  project: Project;
  onClose: () => void;
  onUpdated: (project: Project) => void;
}) {
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
    <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 max-w-md w-full mx-4">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Edit Project
          </h2>

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

            <div className="grid grid-cols-2 gap-4">
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
    <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 max-w-md w-full mx-4 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {title}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary" disabled={isLoading}>
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddMemberModal({
  projectId,
  existingMemberIds,
  onClose,
  onAdded,
}: {
  projectId: string;
  existingMemberIds: string[];
  onClose: () => void;
  onAdded: () => void;
}) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await adminApi.getUsers({ active: true });
        // Filter out existing members
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
    <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 max-w-md w-full mx-4 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Add Team Member
        </h2>

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
      </div>
    </div>
  );
}
