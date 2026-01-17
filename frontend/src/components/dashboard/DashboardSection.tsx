import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface DashboardSectionProps {
  title: string;
  children: ReactNode;
  viewAllHref?: string;
  viewAllLabel?: string;
  className?: string;
}

export function DashboardSection({
  title,
  children,
  viewAllHref,
  viewAllLabel = 'View all',
  className = '',
}: DashboardSectionProps) {
  return (
    <div className={`card ${className}`}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
        {viewAllHref && (
          <Link
            to={viewAllHref}
            className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
          >
            {viewAllLabel}
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}
