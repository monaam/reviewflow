import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ClipboardList, Search, X, Calendar, AlertTriangle } from 'lucide-react';
import { requestsApi } from '../api/requests';
import { CreativeRequest } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { useAuthStore } from '../stores/authStore';
import { formatDistanceToNow } from 'date-fns';

export function RequestsPage() {
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [requests, setRequests] = useState<CreativeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const isReviewer = user?.role === 'reviewer';
  const statusFilter = searchParams.get('status') || 'all';
  const filterType = searchParams.get('filter') || '';

  useEffect(() => {
    // Reviewers cannot access requests
    if (!isReviewer) {
      fetchRequests();
    } else {
      setIsLoading(false);
    }
  }, [statusFilter, filterType, isReviewer]);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (filterType) params.filter = filterType;

      const response = await requestsApi.listAll(params);
      setRequests(response.data);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

  const filteredRequests = requests.filter((request) => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      request.title.toLowerCase().includes(search) ||
      request.description?.toLowerCase().includes(search) ||
      request.project?.name?.toLowerCase().includes(search) ||
      request.assignee?.name?.toLowerCase().includes(search)
    );
  });

  const statusOptions = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'asset_submitted', label: 'Asset Submitted' },
    { value: 'completed', label: 'Completed' },
  ];

  const isOverdue = (deadline: string) => {
    return new Date(deadline) < new Date();
  };

  // Reviewers don't have access to requests
  if (isReviewer) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Access Restricted
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Creative requests are not available for your role.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Requests</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Browse and manage creative requests across your projects
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search requests..."
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
                statusFilter === option.value && !filterType
                  ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {option.label}
            </button>
          ))}
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
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-900 dark:border-gray-600 dark:border-t-gray-100"></div>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center py-16">
          <ClipboardList className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchQuery ? 'No matching requests' : 'No requests found'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery
              ? 'Try adjusting your search or filters.'
              : filterType === 'overdue'
              ? 'No overdue requests. Great job!'
              : 'Requests will appear here when created in projects.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((request) => {
            const overdue = isOverdue(request.deadline);
            return (
              <Link
                key={request.id}
                to={`/requests/${request.id}`}
                className="block p-5 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
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
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
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
                        {formatDistanceToNow(new Date(request.deadline), { addSuffix: true })}
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
      )}
    </div>
  );
}
