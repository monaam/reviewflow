import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Upload,
  FileImage,
  FileEdit,
  Users,
  Calendar,
  ClipboardList,
  Edit2,
  Trash2,
  UserPlus,
  UserMinus,
  Loader2,
} from 'lucide-react';
import { projectsApi } from '../api/projects';
import { assetsApi } from '../api/assets';
import { requestsApi } from '../api/requests';
import { Project, Asset, CreativeRequest, PaginatedResponse } from '../types';

import { StatusBadge, LoadingSpinner, SearchInput, FilterButtonGroup, EmptyState } from '../components/common';
import { useAuthStore } from '../stores/authStore';
import { getAssetTypeIcon, supportsThumbnail } from '../config/assetTypeRegistry';
import { useListFilter } from '../hooks/useListFilter';
import {
  isReviewer as isReviewerRole,
  canUpload as canUploadRole,
  canCreateRequest as canCreateRequestRole,
  canEditProject as canEditProjectRole,
  canManageMembers as canManageMembersRole,
  isAdmin,
} from '../utils/permissions';
import { isOverdue } from '../utils/formatters';
import { getAssetStatusFilters } from '../config/statusFilters';
import { routes } from '../utils/routes';
import { formatRelativeTime } from '../utils/date';
import {
  UploadAssetModal,
  CreateRequestModal,
  EditProjectModal,
  DeleteConfirmModal,
  AddMemberModal,
} from '../components/modals';

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
  const [isLoadingMoreAssets, setIsLoadingMoreAssets] = useState(false);
  const [assetsCurrentPage, setAssetsCurrentPage] = useState(1);
  const [assetsLastPage, setAssetsLastPage] = useState(1);

  const isReviewer = isReviewerRole(user?.role);

  useEffect(() => {
    if (id) {
      fetchProject();
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchAssets(1);
    }
  }, [id, filter]);

  const fetchProject = async () => {
    try {
      const projectData = await projectsApi.get(id!);
      setProject(projectData);

      if (!isReviewer) {
        const requestsData = await requestsApi.list(id!);
        setRequests(requestsData.data);
      } else {
        setRequests([]);
      }
    } catch (error) {
      console.error('Failed to fetch project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAssets = async (page = 1) => {
    try {
      if (page > 1) {
        setIsLoadingMoreAssets(true);
      }

      const params: Record<string, string | number> = { page };
      if (filter !== 'all') params.status = filter;
      const response: PaginatedResponse<Asset> = await assetsApi.list(id!, params);

      if (page === 1) {
        setAssets(response.data);
      } else {
        setAssets((prev) => [...prev, ...response.data]);
      }

      setAssetsCurrentPage(response.current_page);
      setAssetsLastPage(response.last_page);
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    } finally {
      setIsLoadingMoreAssets(false);
    }
  };

  const filteredAssets = useListFilter({
    items: assets,
    searchQuery,
    searchFields: (a) => [a.title, a.uploader?.name],
  });

  const filteredRequests = useListFilter({
    items: requests,
    searchQuery,
    searchFields: (r) => [r.title, r.description, r.assignee?.name],
  });

  const canUpload = canUploadRole(user?.role);
  const canCreateRequest = canCreateRequestRole(user?.role);
  const canEditProject = canEditProjectRole(user?.role);
  const canDeleteProject = isAdmin(user?.role);
  const canManageMembers = canManageMembersRole(user?.role);

  const handleDeleteProject = async () => {
    try {
      await projectsApi.delete(id!);
      navigate(routes.studio.projects());
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
        <LoadingSpinner size="md" variant="gray" />
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
          to={routes.studio.projects()}
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
                  Due {formatRelativeTime(project.deadline)}
                </span>
              )}
              {!isReviewer && (
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {project.members?.length || 0} members
                </span>
              )}
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
                onClick={() => navigate(routes.studio.projectDocumentNew(id!))}
                className="btn-secondary"
              >
                <FileEdit className="w-4 h-4 mr-2" />
                Write Document
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
            Assets ({project.assets_count ?? 0})
          </button>
          {!isReviewer && (
            <>
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
            </>
          )}
        </nav>
      </div>

      {/* Search Bar */}
      {(activeTab === 'assets' || activeTab === 'requests') && (
        <div className="mb-6">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={`Search ${activeTab}...`}
            className="max-w-md"
          />
        </div>
      )}

      {/* Content */}
      {activeTab === 'assets' && (
        <>
          {/* Asset Filters */}
          <div className="mb-6">
            <FilterButtonGroup
              options={getAssetStatusFilters(isReviewer).map((opt) => ({
                value: opt.value,
                label: `${opt.label} (${
                  opt.value === 'all'
                    ? project.assets_count ?? 0
                    : project.asset_status_counts?.[opt.value] ?? 0
                })`,
              }))}
              value={filter}
              onChange={setFilter}
              variant="default"
              className="flex-wrap"
            />
          </div>

          {/* Assets Grid */}
          {filteredAssets.length === 0 ? (
            <EmptyState
              icon={FileImage}
              title="No assets yet"
              description="Upload your first asset to get started."
              action={
                canUpload
                  ? {
                      label: 'Upload Asset',
                      onClick: () => setShowUploadModal(true),
                    }
                  : undefined
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredAssets.map((asset) => (
                  <AssetCard key={asset.id} asset={asset} />
                ))}
              </div>

              {assetsCurrentPage < assetsLastPage && (
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={() => fetchAssets(assetsCurrentPage + 1)}
                    disabled={isLoadingMoreAssets}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    {isLoadingMoreAssets ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Load more'
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {activeTab === 'requests' && (
        <>
          {filteredRequests.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title={searchQuery ? 'No matching requests' : 'No requests yet'}
              description={
                searchQuery
                  ? 'Try adjusting your search terms.'
                  : 'Create a request to assign work to your creative team.'
              }
              action={
                !searchQuery && canCreateRequest
                  ? {
                      label: 'New Request',
                      onClick: () => setShowRequestModal(true),
                    }
                  : undefined
              }
            />
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
          onUploaded={() => {
            fetchProject();
            fetchAssets();
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
  const thumbnailUrl = asset.latest_version?.display_thumbnail_url;
  const canShowThumbnail = thumbnailUrl && supportsThumbnail(asset.type);

  return (
    <Link
      to={routes.studio.asset(asset.id)}
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
  const overdue = isOverdue(request.deadline, request.status);

  return (
    <Link
      to={routes.studio.request(request.id)}
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
            <span className={overdue ? 'text-gray-900 dark:text-white font-medium' : ''}>
              Due: {formatRelativeTime(request.deadline)}
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
