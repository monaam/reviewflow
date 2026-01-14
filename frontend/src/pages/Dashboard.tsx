import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  FileImage,
  ClipboardList,
  AlertTriangle,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { dashboardApi } from '../api/dashboard';
import { DashboardData } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { useAuthStore } from '../stores/authStore';

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="card p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await dashboardApi.get();
        setData(response);
      } catch (error) {
        console.error('Failed to fetch dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user?.name}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Here's what's happening with your projects today.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {user?.role === 'admin' && (
          <>
            <StatCard
              title="Total Projects"
              value={data.stats.total_projects || 0}
              icon={FolderKanban}
              color="bg-blue-500"
            />
            <StatCard
              title="Active Projects"
              value={data.stats.active_projects || 0}
              icon={FolderKanban}
              color="bg-green-500"
            />
            <StatCard
              title="Pending Assets"
              value={data.stats.pending_assets || 0}
              icon={FileImage}
              color="bg-yellow-500"
            />
            <StatCard
              title="Overdue Requests"
              value={data.stats.overdue_requests || 0}
              icon={AlertTriangle}
              color="bg-red-500"
            />
          </>
        )}

        {user?.role === 'pm' && (
          <>
            <StatCard
              title="My Projects"
              value={data.stats.my_projects || 0}
              icon={FolderKanban}
              color="bg-blue-500"
            />
            <StatCard
              title="Pending Approval"
              value={data.stats.pending_my_approval || 0}
              icon={Clock}
              color="bg-yellow-500"
            />
            <StatCard
              title="Requests Created"
              value={data.stats.requests_created || 0}
              icon={ClipboardList}
              color="bg-purple-500"
            />
            <StatCard
              title="Overdue Requests"
              value={data.stats.overdue_requests || 0}
              icon={AlertTriangle}
              color="bg-red-500"
            />
          </>
        )}

        {user?.role === 'creative' && (
          <>
            <StatCard
              title="Assigned Requests"
              value={data.stats.assigned_requests || 0}
              icon={ClipboardList}
              color="bg-blue-500"
            />
            <StatCard
              title="Pending Requests"
              value={data.stats.pending_requests || 0}
              icon={Clock}
              color="bg-yellow-500"
            />
            <StatCard
              title="My Assets"
              value={data.stats.my_assets || 0}
              icon={FileImage}
              color="bg-green-500"
            />
            <StatCard
              title="Revisions Needed"
              value={data.stats.revision_requested || 0}
              icon={AlertTriangle}
              color="bg-red-500"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals / Queue */}
        {(user?.role === 'admin' || user?.role === 'pm') && data.pending_approvals && (
          <div className="card">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Pending Approvals
              </h2>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {data.pending_approvals.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No pending approvals
                </div>
              ) : (
                data.pending_approvals.slice(0, 5).map((asset) => (
                  <Link
                    key={asset.id}
                    to={`/assets/${asset.id}`}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {asset.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        {asset.project?.name} · by {asset.uploader?.name}
                      </p>
                    </div>
                    <StatusBadge status={asset.status} type="asset" />
                  </Link>
                ))
              )}
            </div>
          </div>
        )}

        {user?.role === 'creative' && data.my_queue && (
          <div className="card">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                My Queue
              </h2>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {data.my_queue.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No pending requests
                </div>
              ) : (
                data.my_queue.slice(0, 5).map((request) => (
                  <Link
                    key={request.id}
                    to={`/requests/${request.id}`}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {request.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        {request.project?.name} · Due{' '}
                        {new Date(request.deadline).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={request.priority} type="priority" />
                      <StatusBadge status={request.status} type="request" />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        )}

        {/* Projects */}
        {data.my_projects && (
          <div className="card">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                My Projects
              </h2>
              <Link to="/projects" className="text-sm text-primary-600 hover:text-primary-700">
                View all
              </Link>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {data.my_projects.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No projects yet
                </div>
              ) : (
                data.my_projects.map((project) => (
                  <Link
                    key={project.id}
                    to={`/projects/${project.id}`}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {project.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {project.assets_count} assets · {project.creative_requests_count} requests
                      </p>
                    </div>
                    <span className="text-sm text-gray-500 capitalize">
                      {project.status}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>
        )}

        {/* Revisions Needed */}
        {user?.role === 'creative' && data.revision_needed && data.revision_needed.length > 0 && (
          <div className="card">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                Revisions Needed
              </h2>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {data.revision_needed.map((asset) => (
                <Link
                  key={asset.id}
                  to={`/assets/${asset.id}`}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {asset.title}
                    </p>
                    <p className="text-sm text-gray-500">
                      {asset.project?.name}
                    </p>
                  </div>
                  <StatusBadge status={asset.status} type="asset" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
