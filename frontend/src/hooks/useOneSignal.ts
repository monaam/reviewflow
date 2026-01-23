import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { notificationsApi } from '../api/notifications';

declare global {
  interface Window {
    OneSignalDeferred: Array<(OneSignal: OneSignalType) => void>;
  }
}

interface OneSignalType {
  init: (config: { appId: string }) => Promise<void>;
  User: {
    PushSubscription: {
      id: string | null;
      addEventListener: (event: string, callback: (event: { current: { id: string | null } }) => void) => void;
    };
  };
}

export function useOneSignal() {
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const appId = import.meta.env.VITE_ONESIGNAL_APP_ID;
    if (!appId) {
      console.log('OneSignal not configured, skipping push notifications');
      return;
    }

    // Check if script already loaded
    if (document.querySelector('script[src*="OneSignalSDK"]')) {
      return;
    }

    // Load OneSignal SDK
    const script = document.createElement('script');
    script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async (OneSignal: OneSignalType) => {
        try {
          await OneSignal.init({ appId });

          // Get subscription state
          const subscription = OneSignal.User.PushSubscription;
          if (subscription.id) {
            // Register player ID with backend
            await notificationsApi.registerPushSubscription(subscription.id);
          }

          // Listen for subscription changes
          subscription.addEventListener('change', async (event: { current: { id: string | null } }) => {
            if (event.current.id) {
              await notificationsApi.registerPushSubscription(event.current.id);
            }
          });
        } catch (error) {
          console.error('Failed to initialize OneSignal:', error);
        }
      });
    };

    return () => {
      // Don't remove script on cleanup as it may be needed for other components
    };
  }, [isAuthenticated, user?.id]);
}
