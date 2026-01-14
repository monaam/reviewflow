import apiClient from './client';
import { User, PaginatedResponse } from '../types';

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'pm' | 'creative' | 'reviewer';
}

export interface AnalyticsData {
  stats: Record<string, number>;
  assets_by_date: Array<{ date: string; count: number }>;
}

export const adminApi = {
  getUsers: async (params?: { role?: string; active?: boolean; search?: string; page?: number }): Promise<PaginatedResponse<User>> => {
    const response = await apiClient.get('/admin/users', { params });
    return response.data;
  },

  createUser: async (data: CreateUserRequest): Promise<User> => {
    const response = await apiClient.post('/admin/users', data);
    return response.data;
  },

  updateUser: async (id: string, data: Partial<CreateUserRequest & { is_active: boolean }>): Promise<User> => {
    const response = await apiClient.patch(`/admin/users/${id}`, data);
    return response.data;
  },

  deleteUser: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/users/${id}`);
  },

  getSettings: async (): Promise<Record<string, string>> => {
    const response = await apiClient.get('/admin/settings');
    return response.data;
  },

  updateSettings: async (settings: Record<string, string>): Promise<Record<string, string>> => {
    const response = await apiClient.patch('/admin/settings', settings);
    return response.data;
  },

  getAnalytics: async (period?: number): Promise<AnalyticsData> => {
    const response = await apiClient.get('/admin/analytics', { params: { period } });
    return response.data;
  },
};
