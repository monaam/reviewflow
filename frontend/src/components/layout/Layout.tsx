import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { NotificationBell } from '../notifications/NotificationBell';
import { ThemeToggle } from '../theme/ThemeToggle';
import { useEcho } from '../../hooks/useEcho';
import { useOneSignal } from '../../hooks/useOneSignal';
import { useAuthStore } from '../../stores/authStore';
import { authApi } from '../../api/auth';

export function Layout() {
  // Initialize real-time notifications
  useEcho();
  useOneSignal();

  const { user } = useAuthStore();
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const showVerificationBanner = user && !user.email_verified_at && !bannerDismissed;

  const handleResend = async () => {
    setResending(true);
    try {
      await authApi.resendVerification();
      setResent(true);
    } catch {
      // Silently fail — user can try again
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Email verification banner */}
        {showVerificationBanner && (
          <div className="flex items-center justify-between gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 text-sm text-amber-800 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <span>Please verify your email address.</span>
              {resent ? (
                <span className="text-green-700 dark:text-green-400 font-medium">Verification email sent!</span>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="font-medium underline hover:no-underline disabled:opacity-50"
                >
                  {resending ? 'Sending...' : 'Resend'}
                </button>
              )}
            </div>
            <button
              onClick={() => setBannerDismissed(true)}
              className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 p-0.5"
              aria-label="Dismiss"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Header with theme toggle and notification bell */}
        <header className="flex items-center justify-end h-14 px-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <NotificationBell />
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto bg-white dark:bg-gray-900">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
