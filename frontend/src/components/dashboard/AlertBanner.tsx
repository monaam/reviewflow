import { Link } from 'react-router-dom';
import { AlertTriangle, Info, X, LucideIcon } from 'lucide-react';

interface AlertBannerProps {
  message: string;
  variant?: 'warning' | 'info';
  href?: string;
  linkText?: string;
  onDismiss?: () => void;
  icon?: LucideIcon;
}

export function AlertBanner({
  message,
  variant = 'info',
  href,
  linkText,
  onDismiss,
  icon,
}: AlertBannerProps) {
  const DefaultIcon = variant === 'warning' ? AlertTriangle : Info;
  const Icon = icon || DefaultIcon;

  return (
    <div
      className={`flex items-center justify-between gap-4 px-4 py-3 rounded-lg border ${
        variant === 'warning'
          ? 'border-gray-400 bg-gray-50 dark:border-gray-500 dark:bg-gray-800'
          : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon
          className={`w-5 h-5 flex-shrink-0 ${
            variant === 'warning'
              ? 'text-gray-700 dark:text-gray-300'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        />
        <p className="text-sm text-gray-700 dark:text-gray-300">{message}</p>
        {href && linkText && (
          <Link
            to={href}
            className="text-sm font-medium text-gray-900 dark:text-white hover:underline whitespace-nowrap"
          >
            {linkText}
          </Link>
        )}
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </button>
      )}
    </div>
  );
}
