import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ClipboardList, Calendar, AlertTriangle, Loader2 } from 'lucide-react';
import { requestsApi } from '../api/requests';
import { CreativeRequest, PaginatedResponse } from '../types';
import { StatusBadge, LoadingSpinner, SearchInput, FilterButtonGroup, EmptyState } from '../components/common';
import { useAuthStore } from '../stores/authStore';
import { isReviewer as isReviewerRole } from '../utils/permissions';
import { useListFilter } from '../hooks';
import { isOverdue, cardLinkClass } from '../utils/formatters';
import { formatRelativeTime } from '../utils/date';
import { routes } from '../utils/routes';

export function RequestsPage() {
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [requests, setRequests] = useState<CreativeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const isReviewer = isReviewerRole(user?.role);
  const statusFilter = searchParams.get('status') || 'all';
  const filterType = searchParams.get('filter') || '';

  const loadRequests = useCallback(async (page = 1) => {
    if (isReviewer) return;

    try {
      if (page === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const params: Record<string, string | number> = { page };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (filterType) params.filter = filterType;

      const response: PaginatedResponse<CreativeRequest> = await requestsApi.listAll(params);

      if (page === 1) {
        setRequests(response.data);
      } else {
        setRequests((prev) => [...prev, ...response.data]);
      }

      setCurrentPage(response.current_page);
      setLastPage(response.last_page);
    } catch (error) {
      console.error('Failed to load requests:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [statusFilter, filterType, isReviewer]);

  useEffect(() => {
    loadRequests(1);
  }, [loadRequests]);

  const setFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === 'all' || value === '') {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    // Clear status filter when setting special filter
    if (key === 'filter' && value) {
      newParams.delete('status');
    }
    // Clear special filter when setting status
    if (key === 'status') {
      newParams.delete('filter');
    }
    setSearchParams(newParams);
  };

  const filteredRequests = useListFilter({
    items: requests,
    searchQuery,
    searchFields: (r) => [r.title, r.description, r.project?.name, r.assignee?.name],
  });

  const statusOptions = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'asset_submitted', label: 'Asset Submitted' },
    { value: 'completed', label: 'Completed' },
  ];

  // Reviewers don't have access to requests
  if (isReviewer) {
    return (
      <div className="px-4 py-6 sm:p-8 max-w-7xl mx-auto">
        <EmptyState
          icon={ClipboardList}
          title="Access Restricted"
          description="Creative requests are not available for your role."
        />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Requests</h1>
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">
          Browse and manage creative requests across your projects
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search requests..."
        />

        <div className="flex gap-1 flex-wrap">
          <FilterButtonGroup
            options={statusOptions}
            value={statusFilter}
            onChange={(value) => setFilter('status', value)}
            variant="default"
          />
          <button
            onClick={() => setFilter('filter', filterType === 'overdue' ? '' : 'overdue')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
              filterType === 'overdue'
                ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Overdue
          </button>
        </div>
      </div>

      {/* Requests List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <LoadingSpinner size="md" variant="gray" />
        </div>
      ) : filteredRequests.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={searchQuery ? 'No matching requests' : 'No requests found'}
          description={
            searchQuery
              ? 'Try adjusting your search or filters.'
              : filterType === 'overdue'
              ? 'No overdue requests. Great job!'
              : 'Requests will appear here when created in projects.'
          }
        />
      ) : (
        <>
          <div className="space-y-3">
            {filteredRequests.map((request) => {
              const overdue = isOverdue(request.deadline);
              return (
                <Link
                  key={request.id}
                  to={routes.studio.request(request.id)}
                  className={cardLinkClass}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                        <h3 className="font-medium text-gray-900 dark:text-white truncate">
                          {request.title}
                        </h3>
                        <StatusBadge status={request.status} type="request" />
                        <StatusBadge status={request.priority} type="priority" />
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
                        {request.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
                        <span>{request.project?.name}</span>
                        {request.assignee && (
                          <>
                            <span>·</span>
                            <span>Assigned to {request.assignee.name}</span>
                          </>
                        )}
                        <span>·</span>
                        <span>by {request.creator?.name}</span>
                      </div>
                    </div>
                    <div className="flex sm:flex-col items-start sm:items-end gap-2 flex-shrink-0">
                      <div
                        className={`flex items-center gap-1.5 text-sm ${
                          overdue && request.status !== 'completed'
                            ? 'text-gray-700 dark:text-gray-300 font-medium'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        <Calendar className="w-4 h-4" />
                        <span>
                          {overdue && request.status !== 'completed' ? 'Overdue · ' : ''}
                          {formatRelativeTime(request.deadline)}
                        </span>
                      </div>
                      {request.assets && request.assets.length > 0 && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {request.assets.length} asset{request.assets.length > 1 ? 's' : ''} linked
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {currentPage < lastPage && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => loadRequests(currentPage + 1)}
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
