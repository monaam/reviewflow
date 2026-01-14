import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileImage, Film, FileText, Clock, Search, X, CheckCircle } from 'lucide-react';
import { projectsApi } from '../api/projects';
import { assetsApi } from '../api/assets';
import { Project, Asset } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { useAuthStore } from '../stores/authStore';

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

  const filteredAssets = pendingAssets.filter((asset) => {
    const matchesSearch =
      !searchQuery ||
      asset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.uploader?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || asset.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'video':
        return Film;
      case 'pdf':
        return FileText;
      default:
        return FileImage;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
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
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="flex gap-2">
          {(['all', 'pending_review', 'in_review'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                statusFilter === status
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {status === 'all' ? 'All' : status.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Assets List */}
      {filteredAssets.length === 0 ? (
        <div className="text-center py-12 card">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchQuery ? 'No matching assets' : 'All caught up!'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchQuery
              ? 'Try adjusting your search terms.'
              : 'No assets are waiting for review right now.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAssets.map((asset) => {
            const Icon = getIcon(asset.type);
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
                    {new Date(asset.created_at).toLocaleString()}
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
