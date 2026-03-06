import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Clock, AlertTriangle, PlayCircle } from 'lucide-react';
import { requestsApi } from '../api/requests';
import { CreativeRequest } from '../types';
import { StatusBadge, LoadingSpinner, SearchInput, FilterButtonGroup, EmptyState } from '../components/common';
import { useFetch, useListFilter } from '../hooks';
import { isOverdue } from '../utils/formatters';
import { formatRelativeTime } from '../utils/date';
import { routes } from '../utils/routes';

export function CreativeQueuePage() {
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: requests, isLoading, refetch } = useFetch({
    fetcher: () => {
      const params = filter !== 'all' ? { status: filter } : {};
      return requestsApi.myQueue(params).then(r => r.data);
    },
    deps: [filter],
    initial: [] as CreativeRequest[],
  });

  const handleStart = async (id: string) => {
    try {
      await requestsApi.start(id);
      refetch();
    } catch (error) {
      console.error('Failed to start request:', error);
    }
  };

  const filteredRequests = useListFilter({
    items: requests,
    searchQuery,
    searchFields: (r) => [r.title, r.description, r.project?.name],
  });

  const sortedRequests = [...filteredRequests].sort((a, b) => {
    // Sort by deadline, soonest first
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });

  return (
    <div className="px-4 py-6 sm:p-6">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          My Queue
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          Requests assigned to you, sorted by deadline
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search requests..."
          className="max-w-md"
        />
      </div>

      {/* Filters */}
      <div className="mb-6">
        <FilterButtonGroup
          options={['all', 'pending', 'in_progress', 'asset_submitted']}
          value={filter}
          onChange={setFilter}
          variant="primary"
        />
      </div>

      {/* Queue */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : sortedRequests.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={searchQuery ? 'No matching requests' : 'No requests in your queue'}
          description={
            searchQuery
              ? 'Try adjusting your search terms.'
              : "You don't have any pending requests at the moment."
          }
        />
      ) : (
        <div className="space-y-4">
          {sortedRequests.map((request) => (
            <div
              key={request.id}
              className={`card p-4 ${
                isOverdue(request.deadline, request.status) ? 'border-red-300 dark:border-red-700' : ''
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                    <Link
                      to={routes.studio.request(request.id)}
                      className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white hover:text-primary-600"
                    >
                      {request.title}
                    </Link>
                    <StatusBadge status={request.priority} type="priority" />
                    <StatusBadge status={request.status} type="request" />
                  </div>

                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {request.description}
                  </p>

                  <div className="flex items-center gap-3 sm:gap-4 text-sm text-gray-500 flex-wrap">
                    <span>Project: {request.project?.name}</span>
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {isOverdue(request.deadline, request.status) ? (
                        <span className="text-red-500 font-medium flex items-center">
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          Overdue: {formatRelativeTime(request.deadline)}
                        </span>
                      ) : (
                        <>Due: {formatRelativeTime(request.deadline)}</>
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {request.status === 'pending' && (
                    <button
                      onClick={() => handleStart(request.id)}
                      className="btn-primary"
                    >
                      <PlayCircle className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Start Working</span>
                    </button>
                  )}
                  <Link to={routes.studio.request(request.id)} className="btn-secondary">
                    <span className="hidden sm:inline">View Details</span>
                    <span className="sm:hidden">View</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
