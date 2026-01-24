import { AssetStatus, RequestStatus, Priority } from '../../types';

interface StatusBadgeProps {
  status: AssetStatus | RequestStatus | Priority;
  type?: 'asset' | 'request' | 'priority';
}

const assetStatusConfig: Record<AssetStatus, { label: string; className: string }> = {
  pending_review: { label: 'Pending Review', className: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
  in_review: { label: 'In Review', className: 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200' },
  client_review: { label: 'Client Review', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  approved: { label: 'Approved', className: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
  revision_requested: { label: 'Revision Requested', className: 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200' },
};

const requestStatusConfig: Record<RequestStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
  in_progress: { label: 'In Progress', className: 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200' },
  asset_submitted: { label: 'Asset Submitted', className: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
  completed: { label: 'Completed', className: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
  cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400' },
};

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  low: { label: 'Low', className: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400' },
  normal: { label: 'Normal', className: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
  high: { label: 'High', className: 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200' },
  urgent: { label: 'Urgent', className: 'bg-gray-300 text-gray-800 dark:bg-gray-500 dark:text-gray-100' },
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
