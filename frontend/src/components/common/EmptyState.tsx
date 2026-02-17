import { Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';

export interface EmptyStateProps {
  /**
   * Lucide icon to display
   */
  icon: LucideIcon;

  /**
   * Main title text
   */
  title: string;

  /**
   * Description text
   */
  description: string;

  /**
   * Optional action button/link
   */
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };

  /**
   * Icon style variant
   * - simple: Icon without background (default, matches inline empty states)
   * - circular: Icon with circular background (dashboard style)
   */
  variant?: 'simple' | 'circular';

  /**
   * Additional CSS classes for the container
   */
  className?: string;
}

/**
 * Reusable empty state component
 * Replaces 9+ inline empty state implementations
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = 'simple',
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`text-center py-16 ${className}`}>
      {variant === 'circular' ? (
        <div className="flex justify-center mb-4">
          <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-700">
            <Icon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
        </div>
      ) : (
        <Icon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
      )}

      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {title}
      </h3>

      <p className="text-gray-500 dark:text-gray-400">
        {description}
      </p>

      {action && (
        <div className="mt-4">
          {action.href ? (
            <Link
              to={action.href}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors inline-block"
            >
              {action.label}
            </Link>
          ) : action.onClick ? (
            <button
              onClick={action.onClick}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {action.label}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
