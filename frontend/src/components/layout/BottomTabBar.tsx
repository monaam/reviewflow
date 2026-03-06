import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  FileImage,
  ClipboardList,
  CheckSquare,
  MoreHorizontal,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { routes } from '../../utils/routes';
import type { LucideIcon } from 'lucide-react';

interface TabItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

function getTabsForRole(role: string): TabItem[] {
  const common: TabItem[] = [
    { name: 'Home', href: routes.studio.dashboard(), icon: LayoutDashboard },
    { name: 'Projects', href: routes.studio.projects(), icon: FolderKanban },
    { name: 'Assets', href: routes.studio.assets(), icon: FileImage },
  ];

  const roleTab: TabItem =
    role === 'creative'
      ? { name: 'Queue', href: routes.studio.queue(), icon: ClipboardList }
      : role === 'reviewer'
        ? { name: 'Queue', href: routes.studio.reviewQueue(), icon: CheckSquare }
        : { name: 'Requests', href: routes.studio.requests(), icon: ClipboardList };

  return [...common, roleTab, { name: 'More', href: '/studio/more', icon: MoreHorizontal }];
}

// Pattern: /studio/assets/:id (but not /studio/assets)
const ASSET_REVIEW_PATTERN = /^\/studio\/assets\/[^/]+$/;

export function BottomTabBar() {
  const { user } = useAuthStore();
  const location = useLocation();
  const tabs = getTabsForRole(user?.role || 'reviewer');

  // Hide on asset review page — MobileReviewDrawer replaces the tab bar
  if (ASSET_REVIEW_PATTERN.test(location.pathname)) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="flex items-center justify-around h-14">
        {tabs.map((tab) => (
          <NavLink
            key={tab.name}
            to={tab.href}
            end={tab.href === routes.studio.dashboard()}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 h-full pt-1 transition-colors active:scale-95 ${
                isActive
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-400 dark:text-gray-500'
              }`
            }
          >
            <tab.icon className="w-5 h-5" strokeWidth={1.8} />
            <span className="text-[10px] mt-0.5 font-medium">{tab.name}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
