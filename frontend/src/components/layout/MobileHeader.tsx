import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { NotificationBell } from '../notifications/NotificationBell';
import { ROOT_PATHS } from '../../utils/routes';

const PAGE_TITLES: Record<string, string> = {
  '/studio': 'Home',
  '/studio/projects': 'Projects',
  '/studio/assets': 'Assets',
  '/studio/requests': 'Requests',
  '/studio/queue': 'My Queue',
  '/studio/review-queue': 'Review Queue',
  '/studio/notifications': 'Notifications',
  '/studio/profile': 'Settings',
  '/studio/admin/users': 'Users',
  '/studio/admin/settings': 'Settings',
  '/studio/more': 'More',
};

export function MobileHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  const title = PAGE_TITLES[path] || '';
  const isRoot = ROOT_PATHS.has(path);

  return (
    <header className="flex items-center h-12 px-2 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 lg:hidden">
      <div className="w-10 flex items-center justify-center">
        {!isRoot && (
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 -ml-1 rounded-lg text-gray-600 dark:text-gray-400 active:bg-gray-100 dark:active:bg-gray-800 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex-1 text-center">
        {isRoot ? (
          <img src="/logo.svg" alt="Briefloop" className="h-6 mx-auto dark:hidden" />
        ) : (
          <h1 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {title}
          </h1>
        )}
        {isRoot && (
          <img src="/logo-dark.svg" alt="Briefloop" className="h-6 mx-auto hidden dark:block" />
        )}
      </div>

      <div className="w-10 flex items-center justify-center">
        <NotificationBell />
      </div>
    </header>
  );
}
