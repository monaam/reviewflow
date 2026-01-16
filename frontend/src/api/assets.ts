import apiClient from './client';
import { Asset, AssetVersion, Comment, PaginatedResponse, VersionHistoryResponse, DownloadResponse, TimelineItem } from '../types';

export interface CreateAssetRequest {
  file: File;
  title: string;
  description?: string;
  request_id?: string;
}

export interface CreateCommentRequest {
  content: string;
  rectangle?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  video_timestamp?: number;
}

export const assetsApi = {
  list: async (projectId: string, params?: { status?: string; type?: string; page?: number }): Promise<PaginatedResponse<Asset>> => {
    const response = await apiClient.get(`/projects/${projectId}/assets`, { params });
    return response.data;
  },

  get: async (id: string): Promise<Asset> => {
    const response = await apiClient.get(`/assets/${id}`);
    return response.data;
  },

  create: async (projectId: string, data: CreateAssetRequest): Promise<Asset> => {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    if (data.request_id) formData.append('request_id', data.request_id);

    const response = await apiClient.post(`/projects/${projectId}/assets`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  update: async (id: string, data: { title?: string; description?: string; deadline?: string }): Promise<Asset> => {
    const response = await apiClient.patch(`/assets/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/assets/${id}`);
  },

  uploadVersion: async (id: string, file: File, versionNotes?: string): Promise<Asset> => {
    const formData = new FormData();
    formData.append('file', file);
    if (versionNotes) formData.append('version_notes', versionNotes);

    const response = await apiClient.post(`/assets/${id}/versions`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getVersions: async (id: string): Promise<AssetVersion[]> => {
    const response = await apiClient.get(`/assets/${id}/versions`);
    return response.data;
  },

  approve: async (id: string, comment?: string): Promise<Asset> => {
    const response = await apiClient.post(`/assets/${id}/approve`, { comment });
    return response.data;
  },

  requestRevision: async (id: string, comment: string): Promise<Asset> => {
    const response = await apiClient.post(`/assets/${id}/request-revision`, { comment });
    return response.data;
  },

  linkRequest: async (id: string, requestId: string): Promise<Asset> => {
    const response = await apiClient.post(`/assets/${id}/link-request`, { request_id: requestId });
    return response.data;
  },

  // Comments
  getComments: async (assetId: string, version?: number): Promise<Comment[]> => {
    const params = version ? { version } : { all: true };
    const response = await apiClient.get(`/assets/${assetId}/comments`, { params });
    return response.data;
  },

  getTimeline: async (assetId: string, all?: boolean): Promise<TimelineItem[]> => {
    const params = { timeline: true, ...(all ? { all: true } : {}) };
    const response = await apiClient.get(`/assets/${assetId}/comments`, { params });
    return response.data;
  },

  createComment: async (assetId: string, data: CreateCommentRequest): Promise<Comment> => {
    const response = await apiClient.post(`/assets/${assetId}/comments`, data);
    return response.data;
  },

  updateComment: async (commentId: string, content: string): Promise<Comment> => {
    const response = await apiClient.patch(`/comments/${commentId}`, { content });
    return response.data;
  },

  deleteComment: async (commentId: string): Promise<void> => {
    await apiClient.delete(`/comments/${commentId}`);
  },

  resolveComment: async (commentId: string): Promise<Comment> => {
    const response = await apiClient.post(`/comments/${commentId}/resolve`);
    return response.data;
  },

  unresolveComment: async (commentId: string): Promise<Comment> => {
    const response = await apiClient.post(`/comments/${commentId}/unresolve`);
    return response.data;
  },

  // Version Control
  lock: async (id: string, reason?: string): Promise<Asset> => {
    const response = await apiClient.post(`/assets/${id}/lock`, { reason });
    return response.data;
  },

  unlock: async (id: string, reason?: string): Promise<Asset> => {
    const response = await apiClient.post(`/assets/${id}/unlock`, { reason });
    return response.data;
  },

  download: async (id: string, version?: number): Promise<DownloadResponse> => {
    const url = version ? `/assets/${id}/download/${version}` : `/assets/${id}/download`;
    const response = await apiClient.get(url);
    return response.data;
  },

  getHistory: async (id: string): Promise<VersionHistoryResponse> => {
    const response = await apiClient.get(`/assets/${id}/history`);
    return response.data;
  },
};
