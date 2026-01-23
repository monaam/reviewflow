import { useEffect, useRef } from 'react';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { useAuthStore } from '../stores/authStore';
import { useNotificationStore } from '../stores/notificationStore';
import { Notification, NotificationData, NotificationType } from '../types';

interface BroadcastNotification {
  id?: string;
  type: NotificationType;
  title: string;
  message: string;
  actor?: NotificationData['actor'];
  asset_id?: string;
  comment_id?: string;
  project_id?: string;
  request_id?: string;
  parent_comment_id?: string;
  feedback?: string;
  version?: number;
  old_status?: string;
  new_status?: string;
}

declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo: Echo<'reverb'> | null;
  }
}

export function useEcho() {
  const { user, token, isAuthenticated } = useAuthStore();
  const { addNotification, fetchUnread } = useNotificationStore();
  const echoRef = useRef<Echo<'reverb'> | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user || !token) {
      // Clean up if not authenticated
      if (echoRef.current) {
        echoRef.current.disconnect();
        echoRef.current = null;
        window.Echo = null;
      }
      return;
    }

    // Check if Reverb is configured
    const reverbKey = import.meta.env.VITE_REVERB_APP_KEY;
    if (!reverbKey) {
      console.log('Reverb not configured, skipping real-time notifications');
      return;
    }

    window.Pusher = Pusher;

    const echo = new Echo({
      broadcaster: 'reverb',
      key: reverbKey,
      wsHost: import.meta.env.VITE_REVERB_HOST || 'localhost',
      wsPort: import.meta.env.VITE_REVERB_PORT ? parseInt(import.meta.env.VITE_REVERB_PORT) : 8080,
      wssPort: import.meta.env.VITE_REVERB_PORT ? parseInt(import.meta.env.VITE_REVERB_PORT) : 443,
      forceTLS: (import.meta.env.VITE_REVERB_SCHEME || 'http') === 'https',
      enabledTransports: ['ws', 'wss'],
      authEndpoint: `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/broadcasting/auth`,
      auth: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    echoRef.current = echo;
    window.Echo = echo;

    // Subscribe to user's private notification channel
    echo
      .private(`App.Models.User.${user.id}`)
      .notification((notification: unknown) => {
        const data = notification as BroadcastNotification;
        // Transform broadcast notification to Notification type
        const notificationData: Notification = {
          id: data.id || crypto.randomUUID(),
          type: data.type,
          data: {
            type: data.type,
            title: data.title,
            message: data.message,
            actor: data.actor,
            asset_id: data.asset_id,
            comment_id: data.comment_id,
            project_id: data.project_id,
            request_id: data.request_id,
          },
          read_at: null,
          created_at: new Date().toISOString(),
        };
        addNotification(notificationData);
      });

    // Fetch initial notifications
    fetchUnread();

    return () => {
      echo.disconnect();
      echoRef.current = null;
      window.Echo = null;
    };
  }, [isAuthenticated, user?.id, token]);

  return echoRef.current;
}
