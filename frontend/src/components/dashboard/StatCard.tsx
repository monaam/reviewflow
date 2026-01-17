import { Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  href?: string;
  variant?: 'default' | 'alert';
}

export function StatCard({ title, value, icon: Icon, href, variant = 'default' }: StatCardProps) {
  const content = (
    <div
      className={`card p-6 transition-all ${
        href ? 'hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer' : ''
      } ${variant === 'alert' && value > 0 ? 'border-gray-400 dark:border-gray-500' : ''}`}
    >
      <div className="flex items-center">
        <div
          className={`p-3 rounded-lg ${
            variant === 'alert' && value > 0
              ? 'bg-gray-800 dark:bg-gray-200'
              : 'bg-gray-100 dark:bg-gray-700'
          }`}
        >
          <Icon
            className={`w-6 h-6 ${
              variant === 'alert' && value > 0
                ? 'text-white dark:text-gray-800'
                : 'text-gray-600 dark:text-gray-300'
            }`}
          />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p
            className={`text-2xl font-bold ${
              variant === 'alert' && value > 0
                ? 'text-gray-900 dark:text-white'
                : 'text-gray-900 dark:text-white'
            }`}
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link to={href}>{content}</Link>;
  }

  return content;
}
