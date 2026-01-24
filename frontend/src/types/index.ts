export type UserRole = 'admin' | 'pm' | 'creative' | 'reviewer';
export type ProjectStatus = 'active' | 'on_hold' | 'completed' | 'archived';
export type AssetStatus = 'pending_review' | 'in_review' | 'client_review' | 'approved' | 'revision_requested';
// AssetType is a string to allow extensibility via the registry
// Common types are 'image' | 'video' | 'pdf' | 'design' but new types can be added
export type AssetType = string;
export type RequestStatus = 'pending' | 'in_progress' | 'asset_submitted' | 'completed' | 'cancelled';
export type Priority = 'low' | 'normal' | 'high' | 'urgent';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  client_name: string | null;
  deadline: string | null;
  cover_image: string | null;
  status: ProjectStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  creator?: User;
  members?: User[];
  assets_count?: number;
  approved_assets_count?: number;
  pending_assets_count?: number;
  creative_requests_count?: number;
}

export interface Asset {
  id: string;
  project_id: string;
  uploaded_by: string;
  title: string;
  description: string | null;
  type: AssetType;
  status: AssetStatus;
  current_version: number;
  deadline: string | null;
  is_locked: boolean;
  locked_by: string | null;
  locked_at: string | null;
  created_at: string;
  updated_at: string;
  project?: Project;
  uploader?: User;
  locker?: User;
  versions?: AssetVersion[];
  latest_version?: AssetVersion;
  comments?: Comment[];
  approval_logs?: ApprovalLog[];
  version_locks?: VersionLock[];
}

export interface AssetVersion {
  id: string;
  asset_id: string;
  version_number: number;
  file_url: string;
  file_path: string;
  file_size: number;
  file_size_formatted?: string;
  file_meta: Record<string, unknown>;
  thumbnail_url?: string | null;
  version_notes: string | null;
  uploaded_by: string;
  created_at: string;
  uploader?: User;
}

export interface MentionableUser {
  id: string;
  name: string;
  avatar: string | null;
}

export interface Comment {
  id: string;
  asset_id: string;
  asset_version: number;
  user_id: string;
  parent_id: string | null;
  content: string;
  rectangle: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  video_timestamp: number | null;
  page_number: number | null;
  is_resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  user?: User;
  resolver?: User;
  replies?: Comment[];
  mentions?: User[];
}

export interface CreativeRequest {
  id: string;
  project_id: string;
  title: string;
  description: string;
  created_by: string;
  assigned_to: string;
  deadline: string;
  priority: Priority;
  status: RequestStatus;
  specs: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  project?: Project;
  creator?: User;
  assignee?: User;
  attachments?: RequestAttachment[];
  assets?: Asset[];
}

export interface RequestAttachment {
  id: string;
  request_id: string;
  file_url: string;
  file_name: string;
  uploaded_by: string;
  created_at: string;
  uploader?: User;
}

export interface ApprovalLog {
  id: string;
  asset_id: string;
  asset_version: number;
  user_id: string;
  action: 'approved' | 'revision_requested' | 'reopened';
  comment: string | null;
  created_at: string;
  user?: User;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface DashboardData {
  role: UserRole;
  stats: Record<string, number>;
  pending_approvals?: Asset[];
  pending_review?: Asset[];
  my_projects?: Project[];
  my_queue?: CreativeRequest[];
  revision_needed?: Asset[];
  recent_uploads?: Asset[];
  overdue_requests?: CreativeRequest[];
  asset_status_distribution?: Array<{
    label: string;
    value: number;
  }>;
  recent_activity?: Array<{
    type: string;
    data: unknown;
    created_at: string;
  }>;
}

export interface VersionLock {
  id: string;
  asset_id: string;
  user_id: string;
  action: 'locked' | 'unlocked';
  reason: string | null;
  created_at: string;
  user?: User;
}

export interface TimelineEvent {
  id: string;
  type: 'version' | 'approval' | 'lock';
  created_at: string;
  // Version event fields
  version_number?: number;
  file_url?: string;
  file_size?: number;
  file_size_formatted?: string;
  file_meta?: Record<string, unknown>;
  version_notes?: string | null;
  uploaded_by?: User;
  // Approval event fields
  action?: string;
  asset_version?: number;
  comment?: string | null;
  // Lock event fields
  reason?: string | null;
  // Common
  user?: User;
}

export interface VersionHistoryResponse {
  versions: AssetVersion[];
  timeline: TimelineEvent[];
  is_locked: boolean;
  locked_by: User | null;
  locked_at: string | null;
}

export interface DownloadResponse {
  url: string;
  filename: string;
  version: number;
  file_size: number;
}

export interface TimelineItem {
  type: 'comment' | 'version' | 'approval';
  id: string;
  created_at: string;
  data: Comment | AssetVersion | ApprovalLog;
}

// Notification types
export type NotificationType =
  | 'comment.created'
  | 'comment.reply'
  | 'comment.mention'
  | 'asset.uploaded'
  | 'asset.new_version'
  | 'asset.approved'
  | 'asset.revision_requested'
  | 'request.assigned'
  | 'request.status_changed';

export interface NotificationData {
  type: NotificationType;
  title: string;
  message: string;
  actor?: {
    id: string;
    name: string;
    avatar: string | null;
  };
  asset_id?: string;
  comment_id?: string;
  parent_comment_id?: string;
  project_id?: string;
  request_id?: string;
  feedback?: string;
  version?: number;
  old_status?: string;
  new_status?: string;
}

export interface Notification {
  id: string;
  type: string;
  data: NotificationData;
  read_at: string | null;
  created_at: string;
}

export interface UnreadNotificationsResponse {
  notifications: Notification[];
  unread_count: number;
}
