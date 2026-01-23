import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import {
  MessageSquare,
  Reply,
  Upload,
  FileUp,
  CheckCircle,
  AlertCircle,
  UserPlus,
  RefreshCw,
  X,
} from 'lucide-react';
import { Notification, NotificationType } from '../../types';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
}

const iconMap: Record<NotificationType, typeof MessageSquare> = {
  'comment.created': MessageSquare,
  'comment.reply': Reply,
  'asset.uploaded': Upload,
  'asset.new_version': FileUp,
  'asset.approved': CheckCircle,
  'asset.revision_requested': AlertCircle,
  'request.assigned': UserPlus,
  'request.status_changed': RefreshCw,
};

const colorMap: Record<NotificationType, string> = {
  'comment.created': 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
  'comment.reply': 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
  'asset.uploaded': 'text-purple-500 bg-purple-50 dark:bg-purple-900/20',
  'asset.new_version': 'text-purple-500 bg-purple-50 dark:bg-purple-900/20',
  'asset.approved': 'text-green-500 bg-green-50 dark:bg-green-900/20',
  'asset.revision_requested': 'text-orange-500 bg-orange-50 dark:bg-orange-900/20',
  'request.assigned': 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20',
  'request.status_changed': 'text-gray-500 bg-gray-50 dark:bg-gray-900/20',
};

function getNotificationLink(notification: Notification): string {
  const { data } = notification;

  if (data.asset_id) {
    return `/assets/${data.asset_id}`;
  }

  if (data.request_id) {
    return `/requests/${data.request_id}`;
  }

  if (data.project_id) {
    return `/projects/${data.project_id}`;
  }

  return '/';
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  compact = false,
}: NotificationItemProps) {
  const { data, read_at, created_at } = notification;
  const notificationType = data.type as NotificationType;
  const Icon = iconMap[notificationType] || MessageSquare;
  const colorClass = colorMap[notificationType] || 'text-gray-500 bg-gray-50 dark:bg-gray-900/20';
  const link = getNotificationLink(notification);

  const handleClick = () => {
    if (!read_at && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  };

  return (
    <div
      className={`relative group ${
        !read_at ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
      }`}
    >
      <Link
        to={link}
        onClick={handleClick}
        className={`block ${compact ? 'px-3 py-2' : 'px-4 py-3'} hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors`}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${colorClass}`}
          >
            <Icon className="w-4 h-4" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p
              className={`text-sm font-medium text-gray-900 dark:text-white ${
                compact ? 'line-clamp-1' : ''
              }`}
            >
              {data.title}
            </p>
            <p
              className={`text-sm text-gray-600 dark:text-gray-400 ${
                compact ? 'line-clamp-1' : 'line-clamp-2'
              }`}
            >
              {data.message}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {formatDistanceToNow(new Date(created_at), { addSuffix: true })}
            </p>
          </div>

          {/* Unread indicator */}
          {!read_at && (
            <div className="flex-shrink-0">
              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
            </div>
          )}
        </div>
      </Link>

      {/* Delete button (visible on hover) */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(notification.id);
          }}
          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Delete notification"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
