import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { NotificationBell } from '../notifications/NotificationBell';
import { useEcho } from '../../hooks/useEcho';
import { useOneSignal } from '../../hooks/useOneSignal';

export function Layout() {
  // Initialize real-time notifications
  useEcho();
  useOneSignal();

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with notification bell */}
        <header className="flex items-center justify-end h-14 px-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <NotificationBell />
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto bg-white dark:bg-gray-900">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
