import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  FileImage,
  ClipboardList,
  Users,
  Settings,
  LogOut,
  CheckSquare,
  Bell,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { routes } from '../../utils/routes';

const navigation = [
  { name: 'Dashboard', href: routes.studio.dashboard(), icon: LayoutDashboard },
  { name: 'Projects', href: routes.studio.projects(), icon: FolderKanban },
  { name: 'My Queue', href: routes.studio.queue(), icon: ClipboardList, roles: ['creative'] },
  { name: 'Review Queue', href: routes.studio.reviewQueue(), icon: CheckSquare, roles: ['reviewer', 'pm', 'admin'] },
  { name: 'Notifications', href: routes.studio.notifications(), icon: Bell },
];

const adminNavigation = [
  { name: 'Users', href: routes.studio.adminUsers(), icon: Users },
  { name: 'Settings', href: routes.studio.adminSettings(), icon: Settings },
];

export function Sidebar() {
  const { user, logout } = useAuthStore();

  const filteredNav = navigation.filter(
    (item) => !item.roles || item.roles.includes(user?.role || '')
  );

  return (
    <div className="flex flex-col w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
      <div className="flex items-center h-16 px-4">
        <img src="/logo.svg" alt="Briefloop" className="h-10 w-auto dark:hidden" />
        <img src="/logo-dark.svg" alt="Briefloop" className="h-10 w-auto hidden dark:block" />
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {filteredNav.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive
                  ? 'text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/30'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
              }`
            }
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.name}
          </NavLink>
        ))}

        {user?.role === 'admin' && (
          <>
            <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-800">
              <p className="px-3 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Admin
              </p>
            </div>
            {adminNavigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/30'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`
                }
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center mb-3">
          <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-sm font-medium text-primary-600 dark:text-primary-400">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
          </div>
        </div>
        <NavLink
          to={routes.studio.profile()}
          className={({ isActive }) =>
            `flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              isActive
                ? 'text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-800'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
            }`
          }
        >
          <Settings className="w-5 h-5 mr-3" />
          Settings
        </NavLink>
        <button
          onClick={logout}
          className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 rounded-md hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </button>
      </div>
    </div>
  );
}
