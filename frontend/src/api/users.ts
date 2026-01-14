import apiClient from './client';
import { User } from '../types';

export const usersApi = {
  list: async (params?: { role?: string; search?: string }): Promise<{ data: User[] }> => {
    const response = await apiClient.get('/users', { params });
    return response.data;
  },
};
