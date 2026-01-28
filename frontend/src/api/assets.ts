import { AxiosProgressEvent } from 'axios';
import apiClient from './client';
import { Asset, AssetVersion, Comment, MentionableUser, PaginatedResponse, VersionHistoryResponse, DownloadResponse, TimelineItem, TempCommentImage } from '../types';

export interface CreateAssetRequest {
  file: File;
  title: string;
  description?: string;
  request_id?: string;
}

export interface UploadOptions {
  onUploadProgress?: (event: AxiosProgressEvent) => void;
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
  page_number?: number;
  parent_id?: string;
  temp_image_ids?: string[];
}

export const assetsApi = {
  listAll: async (params?: { status?: string; type?: string; uploaded_by?: string; search?: string; page?: number }): Promise<PaginatedResponse<Asset>> => {
    const response = await apiClient.get('/assets', { params });
    return response.data;
  },

  list: async (projectId: string, params?: { status?: string; type?: string; page?: number }): Promise<PaginatedResponse<Asset>> => {
    const response = await apiClient.get(`/projects/${projectId}/assets`, { params });
    return response.data;
  },

  get: async (id: string): Promise<Asset> => {
    const response = await apiClient.get(`/assets/${id}`);
    return response.data;
  },

  create: async (projectId: string, data: CreateAssetRequest, options?: UploadOptions): Promise<Asset> => {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    if (data.request_id) formData.append('request_id', data.request_id);

    const response = await apiClient.post(`/projects/${projectId}/assets`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: options?.onUploadProgress,
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

  uploadVersion: async (id: string, file: File, versionNotes?: string, options?: UploadOptions): Promise<Asset> => {
    const formData = new FormData();
    formData.append('file', file);
    if (versionNotes) formData.append('version_notes', versionNotes);

    const response = await apiClient.post(`/assets/${id}/versions`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: options?.onUploadProgress,
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

  requestRevision: async (id: string, comment?: string): Promise<Asset> => {
    const response = await apiClient.post(`/assets/${id}/request-revision`, { comment });
    return response.data;
  },

  sendToClient: async (id: string): Promise<Asset> => {
    const response = await apiClient.post(`/assets/${id}/send-to-client`);
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

  getMentionableUsers: async (assetId: string, search?: string): Promise<MentionableUser[]> => {
    const params = search ? { search } : {};
    const response = await apiClient.get(`/assets/${assetId}/mentionable-users`, { params });
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

export interface TempImageUploadResponse {
  temp_id: string;
  filename: string;
  preview_url: string;
  size: number;
}

export const commentImagesApi = {
  uploadTemp: async (
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<TempImageUploadResponse> => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await apiClient.post('/comment-images/temp', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event) => {
        if (event.total && onProgress) {
          const progress = Math.round((event.loaded * 100) / event.total);
          onProgress(progress);
        }
      },
    });
    return response.data;
  },

  deleteTemp: async (tempId: string): Promise<void> => {
    await apiClient.delete(`/comment-images/temp/${tempId}`);
  },

  deleteFromComment: async (commentId: string, mediaId: number): Promise<void> => {
    await apiClient.delete(`/comments/${commentId}/images/${mediaId}`);
  },
};
