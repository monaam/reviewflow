import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FileImage, Eye, Loader2 } from 'lucide-react';
import { assetsApi } from '../api/assets';
import { Asset, PaginatedResponse } from '../types';
import { StatusBadge, LoadingSpinner, SearchInput, FilterButtonGroup, EmptyState } from '../components/common';
import { getAssetTypeIcon } from '../config/assetTypeRegistry';
import { useAuthStore } from '../stores/authStore';
import { isReviewer as isReviewerRole } from '../utils/permissions';
import { useListFilter } from '../hooks';
import { getAssetStatusFilters } from '../config/statusFilters';
import { formatRelativeTime } from '../utils/date';
import { routes } from '../utils/routes';

export function AssetsPage() {
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const statusFilter = searchParams.get('status') || 'all';
  const uploadedByFilter = searchParams.get('uploaded_by') || 'all';

  const loadAssets = useCallback(async (page = 1) => {
    try {
      if (page === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const params: Record<string, string | number> = { page };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (uploadedByFilter === 'me') params.uploaded_by = 'me';

      const response: PaginatedResponse<Asset> = await assetsApi.listAll(params);

      if (page === 1) {
        setAssets(response.data);
      } else {
        setAssets((prev) => [...prev, ...response.data]);
      }

      setCurrentPage(response.current_page);
      setLastPage(response.last_page);
    } catch (error) {
      console.error('Failed to load assets:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [statusFilter, uploadedByFilter]);

  useEffect(() => {
    loadAssets(1);
  }, [loadAssets]);

  const setFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === 'all') {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    setSearchParams(newParams);
  };

  const filteredAssets = useListFilter({
    items: assets,
    searchQuery,
    searchFields: (a) => [a.title, a.project?.name, a.uploader?.name],
  });

  const isReviewer = isReviewerRole(user?.role);

  const statusOptions = getAssetStatusFilters(isReviewer);

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
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search assets..."
        />

        <FilterButtonGroup
          options={statusOptions}
          value={statusFilter}
          onChange={(value) => setFilter('status', value)}
          variant="default"
          className="flex-wrap"
        />
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
          <LoadingSpinner size="md" variant="gray" />
        </div>
      ) : filteredAssets.length === 0 ? (
        <EmptyState
          icon={FileImage}
          title={searchQuery ? 'No matching assets' : 'No assets found'}
          description={
            searchQuery
              ? 'Try adjusting your search or filters.'
              : 'Assets will appear here when uploaded to projects.'
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAssets.map((asset) => (
              <Link
                key={asset.id}
                to={routes.studio.asset(asset.id)}
                className="group block rounded-lg border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 overflow-hidden transition-colors"
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
                  {(() => {
                    const displayUrl = asset.latest_version?.display_thumbnail_url;
                    const TypeIcon = getAssetTypeIcon(asset.type);

                    if (displayUrl) {
                      return (
                        <img
                          src={displayUrl}
                          alt={asset.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      );
                    }

                    return (
                      <div className="w-full h-full flex items-center justify-center">
                        <TypeIcon className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                      </div>
                    );
                  })()}
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
                    <span>{formatRelativeTime(asset.created_at)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {currentPage < lastPage && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => loadAssets(currentPage + 1)}
                disabled={isLoadingMore}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {isLoadingMore ? (
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
    </div>
  );
}
