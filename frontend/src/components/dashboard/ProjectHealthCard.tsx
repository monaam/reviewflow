import { Link } from 'react-router-dom';
import { ProgressBar } from './ProgressBar';

interface ProjectHealthCardProps {
  id: string;
  name: string;
  status: string;
  totalAssets: number;
  approvedAssets: number;
  pendingAssets?: number;
  deadline?: string | null;
}

export function ProjectHealthCard({
  id,
  name,
  status,
  totalAssets,
  approvedAssets,
  pendingAssets = 0,
  deadline,
}: ProjectHealthCardProps) {
  const progress = totalAssets > 0 ? Math.round((approvedAssets / totalAssets) * 100) : 0;
  const isOverdue = deadline && new Date(deadline) < new Date();

  return (
    <Link
      to={`/projects/${id}`}
      className="block p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-gray-900 dark:text-white truncate">{name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{status}</span>
            {deadline && (
              <span
                className={`text-xs ${
                  isOverdue ? 'text-gray-700 dark:text-gray-300 font-medium' : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                Due {new Date(deadline).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        {pendingAssets > 0 && (
          <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-full">
            {pendingAssets} pending
          </span>
        )}
      </div>
      <ProgressBar
        value={approvedAssets}
        max={totalAssets}
        size="sm"
      />
      <div className="flex justify-between mt-2">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {approvedAssets} of {totalAssets} approved
        </span>
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{progress}%</span>
      </div>
    </Link>
  );
}
