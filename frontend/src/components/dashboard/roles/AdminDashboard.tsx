import { useState } from 'react';
import {
  FolderKanban,
  FileImage,
  AlertTriangle,
  CheckCircle,
  Inbox,
} from 'lucide-react';
import { DashboardData, Asset } from '../../../types';
import { assetsApi } from '../../../api/assets';
import { StatCard } from '../StatCard';
import { DashboardSection } from '../DashboardSection';
import { EmptyState } from '../EmptyState';
import { MiniDonutChart } from '../MiniDonutChart';
import { AlertBanner } from '../AlertBanner';
import { QuickActionCard } from '../QuickActionCard';
import { ActivityFeed, ActivityItem } from '../ActivityFeed';

interface AdminDashboardProps {
  data: DashboardData;
  onRefresh: () => void;
}

export function AdminDashboard({ data, onRefresh }: AdminDashboardProps) {
  const [loadingAssetId, setLoadingAssetId] = useState<string | null>(null);
  const [dismissedAlert, setDismissedAlert] = useState(false);

  const overdueCount = data.stats.overdue_requests || 0;
  const pendingAssets = data.pending_approvals || [];

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

  // Transform recent activity to ActivityItem format
  const activities: ActivityItem[] = (data.recent_activity || []).map((activity, index) => {
    const activityData = activity.data as {
      id?: string;
      title?: string;
      project?: { name: string };
      uploader?: { name: string };
      creator?: { name: string };
    };

    return {
      id: activityData?.id || `activity-${index}`,
      type: activity.type === 'asset_uploaded' ? 'upload' : 'status_change',
      title: activityData?.title || 'Unknown',
      description: activityData?.project?.name,
      href: activity.type === 'asset_uploaded'
        ? `/assets/${activityData?.id}`
        : `/requests/${activityData?.id}`,
      user: activityData?.uploader || activityData?.creator,
      created_at: activity.created_at,
    };
  });

  // Asset status distribution for donut chart (from backend)
  const assetStatusData = (data.asset_status_distribution || []).filter((d) => d.value > 0);
  const totalAssets = assetStatusData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      {overdueCount > 0 && !dismissedAlert && (
        <AlertBanner
          message={`${overdueCount} overdue request${overdueCount > 1 ? 's' : ''} need${overdueCount === 1 ? 's' : ''} attention`}
          variant="warning"
          href="/requests?filter=overdue"
          linkText="View all"
          onDismiss={() => setDismissedAlert(true)}
        />
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Projects"
          value={data.stats.total_projects || 0}
          icon={FolderKanban}
          href="/projects"
        />
        <StatCard
          title="Active Projects"
          value={data.stats.active_projects || 0}
          icon={FolderKanban}
          href="/projects?status=active"
        />
        <StatCard
          title="Pending Assets"
          value={data.stats.pending_assets || 0}
          icon={FileImage}
          href="/assets?status=pending_review"
        />
        <StatCard
          title="Overdue Requests"
          value={overdueCount}
          icon={AlertTriangle}
          variant={overdueCount > 0 ? 'alert' : 'default'}
          href="/requests?filter=overdue"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardSection title="Asset Status">
          <div className="p-6 flex justify-center">
            {assetStatusData.length > 0 ? (
              <MiniDonutChart
                data={assetStatusData}
                size={140}
                centerValue={totalAssets}
                centerLabel="Assets"
              />
            ) : (
              <EmptyState
                icon={FileImage}
                title="No assets yet"
                description="Asset statistics will appear here once you upload assets."
              />
            )}
          </div>
        </DashboardSection>

        <DashboardSection title="Recent Activity">
          {activities.length > 0 ? (
            <ActivityFeed activities={activities} maxItems={5} />
          ) : (
            <EmptyState
              icon={Inbox}
              title="No recent activity"
              description="Activity will appear here as your team works on projects."
            />
          )}
        </DashboardSection>
      </div>

      {/* Pending Approvals */}
      <DashboardSection
        title="Pending Approvals"
        viewAllHref="/assets?status=pending_review"
      >
        {pendingAssets.length === 0 ? (
          <EmptyState
            icon={CheckCircle}
            title="All caught up!"
            description="No assets waiting for review."
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
    </div>
  );
}
