import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface QuickAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

interface QuickActionCardProps {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  thumbnail?: string | null;
  actions?: QuickAction[];
  isLoading?: boolean;
}

export function QuickActionCard({
  id,
  title,
  subtitle,
  href,
  thumbnail,
  actions,
  isLoading,
}: QuickActionCardProps) {
  const getActionStyles = (variant: QuickAction['variant'] = 'secondary') => {
    switch (variant) {
      case 'primary':
        return 'bg-gray-900 text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200';
      case 'danger':
        return 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600';
      default:
        return 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600';
    }
  };

  return (
    <div
      className={`flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
        isLoading ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      <Link to={href} className="flex items-center gap-3 flex-1 min-w-0">
        {thumbnail && (
          <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 overflow-hidden flex-shrink-0">
            <img src={thumbnail} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-medium text-gray-900 dark:text-white truncate">{title}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{subtitle}</p>
          )}
        </div>
      </Link>
      {actions && actions.length > 0 && (
        <div className="flex items-center gap-2 ml-4 flex-shrink-0">
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          ) : (
            actions.map((action, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  action.onClick();
                }}
                disabled={action.disabled}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${getActionStyles(
                  action.variant
                )}`}
              >
                {action.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
