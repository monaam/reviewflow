import apiClient from './client';
import { CreativeRequest, PaginatedResponse, Priority } from '../types';

export interface CreateRequestData {
  title: string;
  description: string;
  assigned_to?: string;
  deadline: string;
  priority?: Priority;
  specs?: Record<string, unknown>;
}

export const requestsApi = {
  list: async (projectId: string, params?: { status?: string; priority?: string; page?: number }): Promise<PaginatedResponse<CreativeRequest>> => {
    const response = await apiClient.get(`/projects/${projectId}/requests`, { params });
    return response.data;
  },

  myQueue: async (params?: { status?: string; page?: number }): Promise<PaginatedResponse<CreativeRequest>> => {
    const response = await apiClient.get('/requests/my-queue', { params });
    return response.data;
  },

  get: async (id: string): Promise<CreativeRequest> => {
    const response = await apiClient.get(`/requests/${id}`);
    return response.data;
  },

  create: async (projectId: string, data: CreateRequestData): Promise<CreativeRequest> => {
    const response = await apiClient.post(`/projects/${projectId}/requests`, data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateRequestData & { status: string }>): Promise<CreativeRequest> => {
    const response = await apiClient.patch(`/requests/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/requests/${id}`);
  },

  start: async (id: string): Promise<CreativeRequest> => {
    const response = await apiClient.post(`/requests/${id}/start`);
    return response.data;
  },

  complete: async (id: string): Promise<CreativeRequest> => {
    const response = await apiClient.post(`/requests/${id}/complete`);
    return response.data;
  },

  addAttachment: async (id: string, file: File): Promise<void> => {
    const formData = new FormData();
    formData.append('file', file);
    await apiClient.post(`/requests/${id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  removeAttachment: async (requestId: string, attachmentId: string): Promise<void> => {
    await apiClient.delete(`/requests/${requestId}/attachments/${attachmentId}`);
  },
};
