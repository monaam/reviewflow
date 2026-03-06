import { NavLink } from 'react-router-dom';
import {
  Bell,
  Users,
  Settings,
  LogOut,
  Moon,
  Sun,
  CheckSquare,
  ClipboardList,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import { routes } from '../utils/routes';
import type { LucideIcon } from 'lucide-react';

interface MenuItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

export function MoreMenuPage() {
  const { user, logout } = useAuthStore();
  const { resolvedTheme, setTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';
  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');

  const menuItems: MenuItem[] = [
    { name: 'Notifications', href: routes.studio.notifications(), icon: Bell },
  ];

  // Add role-specific items that aren't in bottom tabs
  if (user?.role === 'admin' || user?.role === 'pm') {
    menuItems.push(
      { name: 'Review Queue', href: routes.studio.reviewQueue(), icon: CheckSquare }
    );
  }
  if (user?.role === 'admin') {
    menuItems.push(
      { name: 'Users', href: routes.studio.adminUsers(), icon: Users },
      { name: 'Admin Settings', href: routes.studio.adminSettings(), icon: Settings }
    );
  }

  menuItems.push(
    { name: 'Profile & Settings', href: routes.studio.profile(), icon: Settings }
  );

  return (
    <div className="flex flex-col min-h-full bg-gray-50 dark:bg-gray-900">
      {/* User card */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-lg font-semibold text-primary-600 dark:text-primary-400">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-base font-semibold text-gray-900 dark:text-white">{user?.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Menu items */}
      <div className="px-4 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center justify-between px-4 py-3 rounded-xl transition-colors active:scale-[0.98] ${
                isActive
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
              }`
            }
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.name}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </NavLink>
        ))}

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-3">
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            <span className="text-sm font-medium">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          </div>
        </button>
      </div>

      {/* Logout */}
      <div className="px-4 mt-6">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 active:scale-[0.98] transition-transform"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}
