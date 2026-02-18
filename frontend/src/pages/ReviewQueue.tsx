import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileImage, Clock, CheckCircle } from 'lucide-react';
import { projectsApi } from '../api/projects';
import { assetsApi } from '../api/assets';
import { Project, Asset } from '../types';
import { StatusBadge, LoadingSpinner, SearchInput, FilterButtonGroup, EmptyState } from '../components/common';
import { useAuthStore } from '../stores/authStore';
import { useListFilter } from '../hooks/useListFilter';
import { getAssetTypeIcon } from '../config/assetTypeRegistry';
import { formatRelativeTime } from '../utils/date';

export function ReviewQueuePage() {
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [pendingAssets, setPendingAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending_review' | 'in_review'>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Get all projects the user has access to
      const projectsResponse = await projectsApi.list({ status: 'active' });
      setProjects(projectsResponse.data);

      // Fetch assets from all projects
      const allAssets: Asset[] = [];
      for (const project of projectsResponse.data) {
        const assetsResponse = await assetsApi.list(project.id);
        allAssets.push(
          ...assetsResponse.data.filter(
            (a: Asset) => a.status === 'pending_review' || a.status === 'in_review'
          )
        );
      }
      setPendingAssets(allAssets);
    } catch (error) {
      console.error('Failed to fetch review queue:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAssets = useListFilter({
    items: pendingAssets,
    searchQuery,
    searchFields: (a) => [a.title, a.uploader?.name],
    statusFilter,
    getStatus: (a) => a.status,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Review Queue
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Assets awaiting your review and approval
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Review</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {pendingAssets.filter((a) => a.status === 'pending_review').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">In Review</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {pendingAssets.filter((a) => a.status === 'in_review').length}
              </p>
            </div>
            <FileImage className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Queue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {pendingAssets.length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search assets..."
        />

        <FilterButtonGroup
          options={['all', 'pending_review', 'in_review']}
          value={statusFilter}
          onChange={(value) => setStatusFilter(value as typeof statusFilter)}
          variant="primary"
        />
      </div>

      {/* Assets List */}
      {filteredAssets.length === 0 ? (
        <EmptyState
          icon={CheckCircle}
          title={searchQuery ? 'No matching assets' : 'All caught up!'}
          description={
            searchQuery
              ? 'Try adjusting your search terms.'
              : 'No assets are waiting for review right now.'
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredAssets.map((asset) => {
            const Icon = getAssetTypeIcon(asset.type);
            const project = projects.find((p) => p.id === asset.project_id);

            return (
              <Link
                key={asset.id}
                to={`/assets/${asset.id}`}
                className="card p-4 hover:shadow-md transition-shadow flex items-center gap-4"
              >
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <Icon className="w-8 h-8 text-gray-400" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900 dark:text-white truncate">
                      {asset.title}
                    </h3>
                    <StatusBadge status={asset.status} type="asset" />
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {project?.name} · v{asset.current_version} · Uploaded by{' '}
                    {asset.uploader?.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatRelativeTime(asset.created_at)}
                  </p>
                </div>

                <div className="text-sm text-gray-500 capitalize">
                  {asset.type}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
