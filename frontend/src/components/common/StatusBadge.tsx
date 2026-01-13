import { AssetStatus, RequestStatus, Priority } from '../../types';

interface StatusBadgeProps {
  status: AssetStatus | RequestStatus | Priority;
  type?: 'asset' | 'request' | 'priority';
}

const assetStatusConfig: Record<AssetStatus, { label: string; className: string }> = {
  pending_review: { label: 'Pending Review', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  in_review: { label: 'In Review', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  approved: { label: 'Approved', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  revision_requested: { label: 'Revision Requested', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
};

const requestStatusConfig: Record<RequestStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' },
  in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  asset_submitted: { label: 'Asset Submitted', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' },
};

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  low: { label: 'Low', className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' },
  normal: { label: 'Normal', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  high: { label: 'High', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
  urgent: { label: 'Urgent', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
};

export function StatusBadge({ status, type = 'asset' }: StatusBadgeProps) {
  let config;

  if (type === 'asset') {
    config = assetStatusConfig[status as AssetStatus];
  } else if (type === 'request') {
    config = requestStatusConfig[status as RequestStatus];
  } else {
    config = priorityConfig[status as Priority];
  }

  if (!config) return null;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
