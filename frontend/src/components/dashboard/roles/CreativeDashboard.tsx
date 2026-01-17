import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList,
  Clock,
  FileImage,
  AlertTriangle,
  CheckCircle,
  Inbox,
  Upload,
} from 'lucide-react';
import { DashboardData, Asset, CreativeRequest, Project } from '../../../types';
import { StatCard } from '../StatCard';
import { DashboardSection } from '../DashboardSection';
import { EmptyState } from '../EmptyState';
import { AlertBanner } from '../AlertBanner';
import { QuickActionCard } from '../QuickActionCard';
import { StatusBadge } from '../../common/StatusBadge';
import { formatDistanceToNow } from 'date-fns';

interface CreativeDashboardProps {
  data: DashboardData;
  onRefresh: () => void;
}

export function CreativeDashboard({ data, onRefresh }: CreativeDashboardProps) {
  const [dismissedAlert, setDismissedAlert] = useState(false);

  const revisionCount = data.stats.revision_requested || 0;
  const myQueue = data.my_queue || [];
  const revisionNeeded = data.revision_needed || [];
  const recentUploads = data.recent_uploads || [];
  const myProjects = data.my_projects || [];

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      {revisionCount > 0 && !dismissedAlert && (
        <AlertBanner
          message={`${revisionCount} asset${revisionCount > 1 ? 's' : ''} need${revisionCount === 1 ? 's' : ''} revision`}
          variant="warning"
          href="/assets?status=revision_requested"
          linkText="View all"
          onDismiss={() => setDismissedAlert(true)}
        />
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Assigned Requests"
          value={data.stats.assigned_requests || 0}
          icon={ClipboardList}
          href="/requests"
        />
        <StatCard
          title="Pending Requests"
          value={data.stats.pending_requests || 0}
          icon={Clock}
          href="/requests?status=pending"
        />
        <StatCard
          title="My Assets"
          value={data.stats.my_assets || 0}
          icon={FileImage}
          href="/assets"
        />
        <StatCard
          title="Revisions Needed"
          value={revisionCount}
          icon={AlertTriangle}
          variant={revisionCount > 0 ? 'alert' : 'default'}
          href="/assets?status=revision_requested"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Queue */}
        <DashboardSection
          title="My Queue"
          viewAllHref="/requests"
        >
          {myQueue.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="Your queue is empty"
              description="Check back later for new assignments."
            />
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {myQueue.slice(0, 5).map((request: CreativeRequest) => {
                const isOverdue = new Date(request.deadline) < new Date();
                return (
                  <Link
                    key={request.id}
                    to={`/requests/${request.id}`}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {request.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {request.project?.name}
                        </span>
                        <span
                          className={`text-sm ${
                            isOverdue
                              ? 'text-gray-700 dark:text-gray-300 font-medium'
                              : 'text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          Due {formatDistanceToNow(new Date(request.deadline), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <StatusBadge status={request.priority} type="priority" />
                      <StatusBadge status={request.status} type="request" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </DashboardSection>

        {/* Revisions Needed */}
        <DashboardSection
          title="Revisions Needed"
          viewAllHref="/assets?status=revision_requested"
        >
          {revisionNeeded.length === 0 ? (
            <EmptyState
              icon={CheckCircle}
              title="All clear!"
              description="No revisions requested for your assets."
            />
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {revisionNeeded.slice(0, 5).map((asset: Asset) => (
                <QuickActionCard
                  key={asset.id}
                  id={asset.id}
                  title={asset.title}
                  subtitle={asset.project?.name}
                  href={`/assets/${asset.id}`}
                  actions={[
                    {
                      label: 'Upload Revision',
                      onClick: () => window.location.href = `/assets/${asset.id}`,
                      variant: 'primary',
                    },
                  ]}
                />
              ))}
            </div>
          )}
        </DashboardSection>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Uploads */}
        <DashboardSection
          title="Recent Uploads"
          viewAllHref="/assets"
        >
          {recentUploads.length === 0 ? (
            <EmptyState
              icon={Upload}
              title="No uploads yet"
              description="Your uploaded assets will appear here."
            />
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {recentUploads.slice(0, 5).map((asset: Asset) => (
                <Link
                  key={asset.id}
                  to={`/assets/${asset.id}`}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {asset.latest_version?.file_url && (
                      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 overflow-hidden flex-shrink-0">
                        <img
                          src={asset.latest_version.file_url}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {asset.title}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {asset.project?.name} · v{asset.current_version}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={asset.status} type="asset" />
                </Link>
              ))}
            </div>
          )}
        </DashboardSection>

        {/* My Projects */}
        <DashboardSection
          title="My Projects"
          viewAllHref="/projects"
        >
          {myProjects.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No projects"
              description="You'll see your projects here when assigned."
            />
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {myProjects.slice(0, 5).map((project: Project) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {project.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {project.assets_count} assets · {project.creative_requests_count} requests
                    </p>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                    {project.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </DashboardSection>
      </div>
    </div>
  );
}
