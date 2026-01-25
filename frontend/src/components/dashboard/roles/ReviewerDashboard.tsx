import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  Eye,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';
import { DashboardData, Asset } from '../../../types';
import { getAssetTypeIcon } from '../../../config/assetTypeRegistry';
import { assetsApi } from '../../../api/assets';
import { StatCard } from '../StatCard';
import { DashboardSection } from '../DashboardSection';
import { EmptyState } from '../EmptyState';
import { QuickActionCard } from '../QuickActionCard';
import { StatusBadge } from '../../common/StatusBadge';
import { formatDistanceToNow } from 'date-fns';

interface ReviewerDashboardProps {
  data: DashboardData;
  onRefresh: () => void;
}

export function ReviewerDashboard({ data, onRefresh }: ReviewerDashboardProps) {
  const [loadingAssetId, setLoadingAssetId] = useState<string | null>(null);

  const pendingReviewCount = data.stats.pending_review || 0;
  const pendingReview = data.pending_review || [];

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
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard
          title="Accessible Projects"
          value={data.stats.accessible_projects || 0}
          icon={FolderKanban}
          href="/projects"
        />
        <StatCard
          title="Pending Review"
          value={pendingReviewCount}
          icon={Eye}
          href="/assets?status=pending_review"
        />
      </div>

      {/* Review Queue */}
      <DashboardSection
        title="Review Queue"
        viewAllHref="/assets?status=pending_review"
      >
        {pendingReview.length === 0 ? (
          <EmptyState
            icon={CheckCircle}
            title="Nothing to review right now"
            description="All caught up! New assets will appear here when they're ready for review."
          />
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {pendingReview.map((asset: Asset) => (
              <div
                key={asset.id}
                className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
              >
                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-700 overflow-hidden flex-shrink-0">
                  {(() => {
                    const displayUrl = asset.latest_version?.display_thumbnail_url;
                    const TypeIcon = getAssetTypeIcon(asset.type);

                    if (displayUrl) {
                      return (
                        <img
                          src={displayUrl}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      );
                    }

                    return (
                      <div className="w-full h-full flex items-center justify-center">
                        <TypeIcon className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                      </div>
                    );
                  })()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/assets/${asset.id}`}
                    className="font-medium text-gray-900 dark:text-white hover:underline truncate block"
                  >
                    {asset.title}
                  </Link>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
                    <span>{asset.project?.name}</span>
                    <span>·</span>
                    <span>{asset.uploader?.name}</span>
                    <span>·</span>
                    <span>
                      {formatDistanceToNow(new Date(asset.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {loadingAssetId === asset.id ? (
                    <div className="w-5 h-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                  ) : (
                    <>
                      <button
                        onClick={() => handleApprove(asset.id)}
                        className="px-3 py-1.5 text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
                      >
                        Approve
                      </button>
                      <Link
                        to={`/assets/${asset.id}`}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        Review
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </DashboardSection>
    </div>
  );
}
