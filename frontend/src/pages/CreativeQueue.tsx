import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Clock, AlertTriangle, PlayCircle } from 'lucide-react';
import { requestsApi } from '../api/requests';
import { CreativeRequest } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';

export function CreativeQueuePage() {
  const [requests, setRequests] = useState<CreativeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');

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

  const isOverdue = (request: CreativeRequest) =>
    new Date(request.deadline) < new Date() &&
    !['completed', 'cancelled'].includes(request.status);

  const sortedRequests = [...requests].sort((a, b) => {
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

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {['all', 'pending', 'in_progress', 'asset_submitted'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filter === status
                ? 'bg-primary-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {status === 'all' ? 'All' : status.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Queue */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : sortedRequests.length === 0 ? (
        <div className="text-center py-12 card">
          <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No requests in your queue
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have any pending requests at the moment.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedRequests.map((request) => (
            <div
              key={request.id}
              className={`card p-4 ${
                isOverdue(request) ? 'border-red-300 dark:border-red-700' : ''
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
                      {isOverdue(request) ? (
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
