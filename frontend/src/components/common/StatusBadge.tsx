import { AssetStatus, RequestStatus, Priority } from '../../types';

interface StatusBadgeProps {
  status: AssetStatus | RequestStatus | Priority;
  type?: 'asset' | 'request' | 'priority';
}

const assetStatusConfig: Record<AssetStatus, { label: string; className: string }> = {
  pending_review: { label: 'Pending Review', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  in_review: { label: 'In Review', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  client_review: { label: 'Client Review', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  approved: { label: 'Approved', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  revision_requested: { label: 'Revision Requested', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
};

const requestStatusConfig: Record<RequestStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  asset_submitted: { label: 'Asset Submitted', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400' },
};

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  low: { label: 'Low', className: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400' },
  normal: { label: 'Normal', className: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300' },
  high: { label: 'High', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
  urgent: { label: 'Urgent', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
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
