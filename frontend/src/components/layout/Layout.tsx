import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { BottomTabBar } from './BottomTabBar';
import { MobileHeader } from './MobileHeader';
import { NotificationBell } from '../notifications/NotificationBell';
import { ThemeToggle } from '../theme/ThemeToggle';
import { useEcho } from '../../hooks/useEcho';
import { useOneSignal } from '../../hooks/useOneSignal';
import { useIsMobile } from '../../hooks/useMediaQuery';

export function Layout() {
  useEcho();
  useOneSignal();
  const isMobile = useIsMobile();

  return (
    <div className="flex h-[100dvh] bg-white dark:bg-gray-900">
      {/* Desktop sidebar — hidden on mobile */}
      {!isMobile && <Sidebar />}

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        {isMobile && <MobileHeader />}

        {/* Desktop header */}
        {!isMobile && (
          <header className="flex items-center justify-end h-14 px-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <NotificationBell />
            </div>
          </header>
        )}

        {/* Main content — add bottom padding on mobile for tab bar */}
        <main className={`flex-1 overflow-auto bg-white dark:bg-gray-900 ${isMobile ? 'pb-[calc(3.5rem+env(safe-area-inset-bottom))]' : ''}`}>
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      {isMobile && <BottomTabBar />}
    </div>
  );
}
