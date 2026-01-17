import { Link } from 'react-router-dom';
import {
  FileImage,
  CheckCircle,
  AlertTriangle,
  Upload,
  MessageSquare,
  LucideIcon,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export interface ActivityItem {
  id: string;
  type: 'upload' | 'approval' | 'revision' | 'comment' | 'status_change';
  title: string;
  description?: string;
  href?: string;
  user?: {
    name: string;
    avatar?: string | null;
  };
  created_at: string;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  maxItems?: number;
}

const activityIcons: Record<ActivityItem['type'], LucideIcon> = {
  upload: Upload,
  approval: CheckCircle,
  revision: AlertTriangle,
  comment: MessageSquare,
  status_change: FileImage,
};

export function ActivityFeed({ activities, maxItems = 5 }: ActivityFeedProps) {
  const displayedActivities = activities.slice(0, maxItems);

  if (displayedActivities.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500 dark:text-gray-400">
        No recent activity
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {displayedActivities.map((activity, index) => {
        const Icon = activityIcons[activity.type];
        const content = (
          <div className="flex items-start gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
            <div className="flex-shrink-0 mt-0.5">
              <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-700">
                <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {activity.title}
              </p>
              {activity.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {activity.description}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1">
                {activity.user && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {activity.user.name}
                  </span>
                )}
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
        );

        if (activity.href) {
          return (
            <Link key={activity.id || index} to={activity.href} className="block">
              {content}
            </Link>
          );
        }

        return <div key={activity.id || index}>{content}</div>;
      })}
    </div>
  );
}
