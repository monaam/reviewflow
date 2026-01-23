import apiClient from './client';
import { Notification, UnreadNotificationsResponse, PaginatedResponse } from '../types';

export const notificationsApi = {
  list: async (page = 1): Promise<PaginatedResponse<Notification>> => {
    const response = await apiClient.get('/notifications', { params: { page } });
    return response.data;
  },

  getUnread: async (): Promise<UnreadNotificationsResponse> => {
    const response = await apiClient.get('/notifications/unread');
    return response.data;
  },

  markAsRead: async (id: string): Promise<Notification> => {
    const response = await apiClient.post(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient.post('/notifications/read-all');
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/notifications/${id}`);
  },

  registerPushSubscription: async (playerId: string): Promise<void> => {
    await apiClient.post('/user/push-subscription', { player_id: playerId });
  },

  updatePushPreferences: async (enabled: boolean): Promise<void> => {
    await apiClient.put('/user/push-preferences', { enabled });
  },
};
