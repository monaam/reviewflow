import apiClient from './client';
import { Project, User, PaginatedResponse } from '../types';

export interface CreateProjectRequest {
  name: string;
  description?: string;
  client_name?: string;
  deadline?: string;
}

export const projectsApi = {
  list: async (params?: { status?: string; page?: number }): Promise<PaginatedResponse<Project>> => {
    const response = await apiClient.get('/projects', { params });
    return response.data;
  },

  get: async (id: string): Promise<Project> => {
    const response = await apiClient.get(`/projects/${id}`);
    return response.data;
  },

  create: async (data: CreateProjectRequest): Promise<Project> => {
    const response = await apiClient.post('/projects', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateProjectRequest & { status: string }>): Promise<Project> => {
    const response = await apiClient.patch(`/projects/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/projects/${id}`);
  },

  getMembers: async (id: string): Promise<User[]> => {
    const response = await apiClient.get(`/projects/${id}/members`);
    return response.data;
  },

  addMember: async (projectId: string, userId: string, role?: string): Promise<void> => {
    await apiClient.post(`/projects/${projectId}/members`, { user_id: userId, role_in_project: role });
  },

  removeMember: async (projectId: string, userId: string): Promise<void> => {
    await apiClient.delete(`/projects/${projectId}/members/${userId}`);
  },
};
