import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  Clock,
  ClipboardList,
  AlertTriangle,
  CheckCircle,
  Inbox,
} from 'lucide-react';
import { DashboardData, Asset, CreativeRequest, Project } from '../../../types';
import { assetsApi } from '../../../api/assets';
import { StatCard } from '../StatCard';
import { DashboardSection } from '../DashboardSection';
import { EmptyState } from '../EmptyState';
import { AlertBanner } from '../AlertBanner';
import { QuickActionCard } from '../QuickActionCard';
import { ProjectHealthCard } from '../ProjectHealthCard';
import { StatusBadge } from '../../common/StatusBadge';
import { formatDistanceToNow } from 'date-fns';

interface PMDashboardProps {
  data: DashboardData;
  onRefresh: () => void;
}

export function PMDashboard({ data, onRefresh }: PMDashboardProps) {
  const [loadingAssetId, setLoadingAssetId] = useState<string | null>(null);
  const [dismissedAlert, setDismissedAlert] = useState(false);

  const pendingCount = data.stats.pending_my_approval || 0;
  const overdueCount = data.stats.overdue_requests || 0;
  const pendingAssets = data.pending_approvals || [];
  const myProjects = data.my_projects || [];
  const overdueRequests = data.overdue_requests || [];

  const handleApprove = async (assetId: string) => {
    setLoadingAssetId(assetId);
    try {
      await assetsApi.approve(assetId);
      onRefresh();
    } catch (error) {
      console.error('Failed to approve asset:', error);
    } finally {
      setLoadingAssetId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      {pendingCount > 0 && !dismissedAlert && (
        <AlertBanner
          message={`${pendingCount} asset${pendingCount > 1 ? 's' : ''} awaiting your approval`}
          variant="info"
          href="/assets?status=pending_review"
          linkText="Review now"
          onDismiss={() => setDismissedAlert(true)}
        />
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="My Projects"
          value={data.stats.my_projects || 0}
          icon={FolderKanban}
          href="/projects"
        />
        <StatCard
          title="Pending Approval"
          value={pendingCount}
          icon={Clock}
          href="/assets?status=pending_review"
        />
        <StatCard
          title="Requests Created"
          value={data.stats.requests_created || 0}
          icon={ClipboardList}
          href="/requests"
        />
        <StatCard
          title="Overdue Requests"
          value={overdueCount}
          icon={AlertTriangle}
          variant={overdueCount > 0 ? 'alert' : 'default'}
          href="/requests?filter=overdue"
        />
      </div>

      {/* My Projects Health */}
      {myProjects.length > 0 && (
        <DashboardSection
          title="My Projects Health"
          viewAllHref="/projects"
        >
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myProjects.map((project: Project) => (
              <ProjectHealthCard
                key={project.id}
                id={project.id}
                name={project.name}
                status={project.status}
                totalAssets={project.assets_count || 0}
                approvedAssets={project.approved_assets_count || 0}
                pendingAssets={project.pending_assets_count || 0}
                deadline={project.deadline}
              />
            ))}
          </div>
        </DashboardSection>
      )}

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals */}
        <DashboardSection
          title="Pending My Approval"
          viewAllHref="/assets?status=pending_review"
        >
          {pendingAssets.length === 0 ? (
            <EmptyState
              icon={CheckCircle}
              title="All caught up!"
              description="No assets waiting for your review."
            />
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {pendingAssets.slice(0, 5).map((asset: Asset) => (
                <QuickActionCard
                  key={asset.id}
                  id={asset.id}
                  title={asset.title}
                  subtitle={`${asset.project?.name} · by ${asset.uploader?.name}`}
                  href={`/assets/${asset.id}`}
                  isLoading={loadingAssetId === asset.id}
                  actions={[
                    {
                      label: 'Review',
                      onClick: () => window.location.href = `/assets/${asset.id}`,
                      variant: 'secondary',
                    },
                    {
                      label: 'Approve',
                      onClick: () => handleApprove(asset.id),
                      variant: 'primary',
                    },
                  ]}
                />
              ))}
            </div>
          )}
        </DashboardSection>

        {/* Overdue Requests */}
        <DashboardSection
          title="Overdue Requests"
          viewAllHref="/requests?filter=overdue"
        >
          {overdueRequests.length === 0 ? (
            <EmptyState
              icon={CheckCircle}
              title="Great news!"
              description="No overdue requests."
            />
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {overdueRequests.slice(0, 5).map((request: CreativeRequest) => (
                <Link
                  key={request.id}
                  to={`/requests/${request.id}`}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {request.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {request.project?.name}
                      </span>
                      {request.assignee && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          · {request.assignee.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      Due {formatDistanceToNow(new Date(request.deadline), { addSuffix: true })}
                    </span>
                    <StatusBadge status={request.priority} type="priority" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </DashboardSection>
      </div>
    </div>
  );
}
