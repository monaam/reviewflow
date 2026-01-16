import { FC } from 'react';
import {
  MessageSquare,
  Upload,
  CheckCircle,
  RotateCcw,
  Circle,
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { TimelineItem, Comment, AssetVersion, ApprovalLog } from '../../types';
import { supportsTemporalAnnotations } from '../../config/assetTypeRegistry';
import { formatTime } from '../../utils/time';
import { Rectangle } from '../../hooks/useAssetReviewState';

interface ActivityPanelProps {
  timeline: TimelineItem[];
  selectedVersion: number;
  assetType: string;
  selectedCommentId: string | null;
  selectedRect: Rectangle | null;
  newComment: string;
  showAllVersionsComments: boolean;

  // Callbacks
  onCommentChange: (comment: string) => void;
  onSubmitComment: () => void;
  onClearAnnotation: () => void;
  onCommentClick: (comment: Comment) => void;
  onDeleteComment: (commentId: string) => void;
  onResolveComment: (commentId: string, isResolved: boolean) => void;
  onToggleShowAllVersions: () => void;

  // Comment actions (from useAssetActions hook)
  getCommentActions: (comment: Comment) => { canDelete: boolean; canResolve: boolean };
}

/**
 * Activity panel showing comments, versions, and approvals.
 * Also contains the new comment form.
 */
export const ActivityPanel: FC<ActivityPanelProps> = ({
  timeline,
  selectedVersion,
  assetType,
  selectedCommentId,
  selectedRect,
  newComment,
  showAllVersionsComments,
  onCommentChange,
  onSubmitComment,
  onClearAnnotation,
  onCommentClick,
  onDeleteComment,
  onResolveComment,
  onToggleShowAllVersions,
  getCommentActions,
}) => {
  // Filter timeline items based on version visibility
  const filteredTimeline = timeline.filter((item) => {
    if (showAllVersionsComments) return true;
    if (item.type === 'comment') {
      return (item.data as Comment).asset_version === selectedVersion;
    }
    if (item.type === 'version') {
      return (item.data as AssetVersion).version_number === selectedVersion;
    }
    if (item.type === 'approval') {
      return (item.data as ApprovalLog).asset_version === selectedVersion;
    }
    return true;
  });

  return (
    <div className="w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center">
            <MessageSquare className="w-5 h-5 mr-2" />
            Activity
          </h2>
          <button
            onClick={onToggleShowAllVersions}
            className={`p-1.5 rounded transition-colors ${
              showAllVersionsComments
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500'
            }`}
            title={showAllVersionsComments ? 'Show current version only' : 'Show all versions'}
          >
            {showAllVersionsComments ? (
              <Eye className="w-4 h-4" />
            ) : (
              <EyeOff className="w-4 h-4" />
            )}
          </button>
        </div>
        {showAllVersionsComments && (
          <p className="text-xs text-gray-500 mt-1">Showing activity from all versions</p>
        )}
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredTimeline.map((item) => {
          if (item.type === 'version') {
            return (
              <VersionItem
                key={item.id}
                version={item.data as AssetVersion}
                createdAt={item.created_at}
              />
            );
          }

          if (item.type === 'approval') {
            return (
              <ApprovalItem
                key={item.id}
                approval={item.data as ApprovalLog}
                createdAt={item.created_at}
              />
            );
          }

          // Comment item
          const comment = item.data as Comment;
          return (
            <CommentItem
              key={item.id}
              comment={comment}
              isSelected={selectedCommentId === comment.id}
              selectedVersion={selectedVersion}
              showAllVersionsComments={showAllVersionsComments}
              assetType={assetType}
              onClick={() => onCommentClick(comment)}
              onDelete={() => onDeleteComment(comment.id)}
              onResolve={() => onResolveComment(comment.id, comment.is_resolved)}
              getCommentActions={getCommentActions}
            />
          );
        })}
      </div>

      {/* New Comment Form */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        {selectedRect && (
          <div className="mb-2 p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm text-green-700 dark:text-green-300">
            Annotation selected. Your comment will be linked to this area.
          </div>
        )}
        <textarea
          value={newComment}
          onChange={(e) => onCommentChange(e.target.value)}
          placeholder="Add a comment..."
          className="input mb-2"
          rows={3}
        />
        <div className="flex justify-between">
          {selectedRect && (
            <button onClick={onClearAnnotation} className="btn-secondary text-sm">
              Clear Annotation
            </button>
          )}
          <button
            onClick={onSubmitComment}
            disabled={!newComment.trim()}
            className="btn-primary ml-auto"
          >
            Add Comment
          </button>
        </div>
      </div>
    </div>
  );
};

// Sub-components

interface VersionItemProps {
  version: AssetVersion;
  createdAt: string;
}

const VersionItem: FC<VersionItemProps> = ({ version, createdAt }) => (
  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
    <div className="flex items-center gap-2 mb-1">
      <Upload className="w-4 h-4 text-blue-600" />
      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
        Version {version.version_number} uploaded
      </span>
    </div>
    <p className="text-xs text-blue-600 dark:text-blue-400">
      by {version.uploader?.name} · {new Date(createdAt).toLocaleString()}
    </p>
    {version.version_notes && (
      <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
        {version.version_notes}
      </p>
    )}
  </div>
);

interface ApprovalItemProps {
  approval: ApprovalLog;
  createdAt: string;
}

const ApprovalItem: FC<ApprovalItemProps> = ({ approval, createdAt }) => {
  const isApproved = approval.action === 'approved';
  const isRevision = approval.action === 'revision_requested';

  const bgClass = isApproved
    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
    : isRevision
    ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
    : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600';

  const textClass = isApproved
    ? 'text-green-700 dark:text-green-300'
    : 'text-orange-700 dark:text-orange-300';

  const subTextClass = isApproved
    ? 'text-green-600 dark:text-green-400'
    : 'text-orange-600 dark:text-orange-400';

  return (
    <div className={`p-3 rounded-lg border ${bgClass}`}>
      <div className="flex items-center gap-2 mb-1">
        {isApproved ? (
          <CheckCircle className="w-4 h-4 text-green-600" />
        ) : (
          <RotateCcw className="w-4 h-4 text-orange-600" />
        )}
        <span className={`text-sm font-medium ${textClass}`}>
          {isApproved ? 'Approved' : 'Revision Requested'}
        </span>
        <span className="text-xs bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded">
          v{approval.asset_version}
        </span>
      </div>
      <p className={`text-xs ${subTextClass}`}>
        by {approval.user?.name} · {new Date(createdAt).toLocaleString()}
      </p>
      {approval.comment && (
        <p className={`text-sm mt-2 ${textClass}`}>"{approval.comment}"</p>
      )}
    </div>
  );
};

interface CommentItemProps {
  comment: Comment;
  isSelected: boolean;
  selectedVersion: number;
  showAllVersionsComments: boolean;
  assetType: string;
  onClick: () => void;
  onDelete: () => void;
  onResolve: () => void;
  getCommentActions: (comment: Comment) => { canDelete: boolean; canResolve: boolean };
}

const CommentItem: FC<CommentItemProps> = ({
  comment,
  isSelected,
  selectedVersion,
  showAllVersionsComments,
  assetType,
  onClick,
  onDelete,
  onResolve,
  getCommentActions,
}) => {
  const { canDelete, canResolve } = getCommentActions(comment);

  return (
    <div
      className={`p-3 rounded-lg border transition-colors cursor-pointer ${
        isSelected
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center text-xs text-white font-medium">
            {comment.user?.name?.charAt(0)}
          </div>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {comment.user?.name}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {canDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Delete this comment?')) {
                  onDelete();
                }
              }}
              className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500"
              title="Delete comment"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {canResolve && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onResolve();
              }}
              className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
                comment.is_resolved ? 'text-green-500' : 'text-gray-400'
              }`}
              title={comment.is_resolved ? 'Mark as unresolved' : 'Mark as resolved'}
            >
              {comment.is_resolved ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <Circle className="w-5 h-5" />
              )}
            </button>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-700 dark:text-gray-300">{comment.content}</p>

      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 flex-wrap">
        {showAllVersionsComments && (
          <span
            className={`px-1.5 py-0.5 rounded ${
              comment.asset_version === selectedVersion
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600'
                : 'bg-gray-100 dark:bg-gray-700'
            }`}
          >
            v{comment.asset_version}
          </span>
        )}
        {comment.video_timestamp !== null && supportsTemporalAnnotations(assetType) && (
          <span
            className="bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-1.5 py-0.5 rounded cursor-pointer hover:bg-primary-200 dark:hover:bg-primary-900/50"
            title="Click to jump to this timestamp"
          >
            {formatTime(comment.video_timestamp)}
          </span>
        )}
        {comment.rectangle && (
          <span className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
            Annotation
          </span>
        )}
        <span>{new Date(comment.created_at).toLocaleString()}</span>
      </div>
    </div>
  );
};
