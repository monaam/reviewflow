import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FileImage, Search, X, Eye } from 'lucide-react';
import { assetsApi } from '../api/assets';
import { Asset } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { useAuthStore } from '../stores/authStore';
import { formatDistanceToNow } from 'date-fns';

export function AssetsPage() {
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const statusFilter = searchParams.get('status') || 'all';
  const uploadedByFilter = searchParams.get('uploaded_by') || 'all';

  useEffect(() => {
    fetchAssets();
  }, [statusFilter, uploadedByFilter]);

  const fetchAssets = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (uploadedByFilter === 'me') params.uploaded_by = 'me';

      const response = await assetsApi.listAll(params);
      setAssets(response.data);
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === 'all') {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    setSearchParams(newParams);
  };

  const filteredAssets = assets.filter((asset) => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      asset.title.toLowerCase().includes(search) ||
      asset.project?.name?.toLowerCase().includes(search) ||
      asset.uploader?.name?.toLowerCase().includes(search)
    );
  });

  const statusOptions = [
    { value: 'all', label: 'All' },
    { value: 'pending_review', label: 'Pending Review' },
    { value: 'in_review', label: 'In Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'revision_requested', label: 'Revision Requested' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Assets</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Browse and manage all assets across your projects
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
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
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex gap-1 flex-wrap">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter('status', option.value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                statusFilter === option.value
                  ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* My Assets Toggle for creatives */}
      {user?.role === 'creative' && (
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('uploaded_by', 'all')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              uploadedByFilter === 'all'
                ? 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            All Assets
          </button>
          <button
            onClick={() => setFilter('uploaded_by', 'me')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              uploadedByFilter === 'me'
                ? 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            My Assets
          </button>
        </div>
      )}

      {/* Assets List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-900 dark:border-gray-600 dark:border-t-gray-100"></div>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="text-center py-16">
          <FileImage className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchQuery ? 'No matching assets' : 'No assets found'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery
              ? 'Try adjusting your search or filters.'
              : 'Assets will appear here when uploaded to projects.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAssets.map((asset) => (
            <Link
              key={asset.id}
              to={`/assets/${asset.id}`}
              className="group block rounded-lg border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 overflow-hidden transition-colors"
            >
              {/* Thumbnail */}
              <div className="aspect-video bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
                {asset.latest_version?.file_url && asset.type === 'image' ? (
                  <img
                    src={asset.latest_version.file_url}
                    alt={asset.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileImage className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                  <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-medium text-gray-900 dark:text-white truncate flex-1">
                    {asset.title}
                  </h3>
                  <StatusBadge status={asset.status} type="asset" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate mb-2">
                  {asset.project?.name}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
                  <span>{asset.uploader?.name}</span>
                  <span>{formatDistanceToNow(new Date(asset.created_at), { addSuffix: true })}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
