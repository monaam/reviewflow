import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Clock, AlertTriangle, PlayCircle } from 'lucide-react';
import { requestsApi } from '../api/requests';
import { CreativeRequest } from '../types';
import { StatusBadge, LoadingSpinner, SearchInput, FilterButtonGroup, EmptyState } from '../components/common';
import { useListFilter } from '../hooks/useListFilter';
import { isOverdue } from '../utils/formatters';

export function CreativeQueuePage() {
  const [requests, setRequests] = useState<CreativeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchQueue();
  }, [filter]);

  const fetchQueue = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await requestsApi.myQueue(params);
      setRequests(response.data);
    } catch (error) {
      console.error('Failed to fetch queue:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStart = async (id: string) => {
    try {
      await requestsApi.start(id);
      fetchQueue();
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
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          My Queue
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
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
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Link
                      to={`/requests/${request.id}`}
                      className="text-lg font-semibold text-gray-900 dark:text-white hover:text-primary-600"
                    >
                      {request.title}
                    </Link>
                    <StatusBadge status={request.priority} type="priority" />
                    <StatusBadge status={request.status} type="request" />
                  </div>

                  <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {request.description}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Project: {request.project?.name}</span>
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {isOverdue(request.deadline, request.status) ? (
                        <span className="text-red-500 font-medium flex items-center">
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          Overdue: {new Date(request.deadline).toLocaleDateString()}
                        </span>
                      ) : (
                        <>Due: {new Date(request.deadline).toLocaleDateString()}</>
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {request.status === 'pending' && (
                    <button
                      onClick={() => handleStart(request.id)}
                      className="btn-primary"
                    >
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Start Working
                    </button>
                  )}
                  <Link to={`/requests/${request.id}`} className="btn-secondary">
                    View Details
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
