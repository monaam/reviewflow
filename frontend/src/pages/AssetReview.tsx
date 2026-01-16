import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  RotateCcw,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Upload,
  CheckCircle,
  Circle,
  Edit2,
  Trash2,
  Download,
  Lock,
  Unlock,
  Layers,
  Clock,
  Eye,
  EyeOff,
  MoreVertical,
} from 'lucide-react';
import { assetsApi } from '../api/assets';
import { Asset, Comment, AssetVersion, TimelineItem, ApprovalLog } from '../types';
import { ComputedAction, ActionHandlers } from '../types/actions';
import { StatusBadge } from '../components/common/StatusBadge';
import { useAuthStore } from '../stores/authStore';
import { VersionTimeline, VersionComparison } from '../components/version';
import { useAssetActions } from '../hooks/useAssetActions';
import {
  getAssetTypeHandler,
  supportsSpatialAnnotations,
  supportsTemporalAnnotations,
  getMediaUrlForType,
} from '../config/assetTypeRegistry';
import { AnnotationOverlay, ANNOTATION_SHOW_BEFORE, VideoControls } from '../components/assetRenderers';

interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function AssetReviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showAllVersionsComments, setShowAllVersionsComments] = useState(false);
  const [isLocking, setIsLocking] = useState(false);

  // Annotation state
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentRect, setCurrentRect] = useState<Rectangle | null>(null);
  const [selectedRect, setSelectedRect] = useState<Rectangle | null>(null);
  const [newComment, setNewComment] = useState('');
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);

  // Video state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const isScrubbingRef = useRef(false);
  const scrubTimeRef = useRef(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLImageElement | HTMLVideoElement | null>(null);
  const [mediaBounds, setMediaBounds] = useState<DOMRect | null>(null);

  // Update media bounds when media loads or window resizes
  const updateMediaBounds = useCallback(() => {
    if (mediaRef.current) {
      setMediaBounds(mediaRef.current.getBoundingClientRect());
    }
  }, []);

  useEffect(() => {
    updateMediaBounds();
    window.addEventListener('resize', updateMediaBounds);
    return () => window.removeEventListener('resize', updateMediaBounds);
  }, [updateMediaBounds, selectedVersion]);

  useEffect(() => {
    if (id) {
      fetchAsset();
    }
  }, [id]);

  useEffect(() => {
    if (asset) {
      fetchTimeline();
    }
  }, [asset]);

  const fetchAsset = async () => {
    try {
      const data = await assetsApi.get(id!);
      setAsset(data);
      setSelectedVersion(data.current_version);
    } catch (error) {
      console.error('Failed to fetch asset:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTimeline = async () => {
    try {
      const data = await assetsApi.getTimeline(id!, true);
      setTimeline(data);
    } catch (error) {
      console.error('Failed to fetch timeline:', error);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!mediaBounds) return;

    // Check if click is within the media bounds
    const x = (e.clientX - mediaBounds.left) / mediaBounds.width;
    const y = (e.clientY - mediaBounds.top) / mediaBounds.height;

    // Only start drawing if click is within the media
    if (x < 0 || x > 1 || y < 0 || y > 1) return;

    setIsDrawing(true);
    setCurrentRect({ x, y, width: 0, height: 0 });
    setSelectedCommentId(null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !currentRect || !mediaBounds) return;

    // Clamp coordinates to media bounds
    const x = Math.max(0, Math.min(1, (e.clientX - mediaBounds.left) / mediaBounds.width));
    const y = Math.max(0, Math.min(1, (e.clientY - mediaBounds.top) / mediaBounds.height));

    setCurrentRect({
      ...currentRect,
      width: x - currentRect.x,
      height: y - currentRect.y,
    });
  };

  const handleMouseUp = () => {
    if (!currentRect || Math.abs(currentRect.width) < 0.01 || Math.abs(currentRect.height) < 0.01) {
      setIsDrawing(false);
      setCurrentRect(null);
      return;
    }

    // Normalize rectangle (handle negative dimensions)
    const normalized: Rectangle = {
      x: currentRect.width < 0 ? currentRect.x + currentRect.width : currentRect.x,
      y: currentRect.height < 0 ? currentRect.y + currentRect.height : currentRect.y,
      width: Math.abs(currentRect.width),
      height: Math.abs(currentRect.height),
    };

    setSelectedRect(normalized);
    setIsDrawing(false);
    setCurrentRect(null);
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    try {
      const comment = await assetsApi.createComment(id!, {
        content: newComment,
        rectangle: selectedRect || undefined,
        video_timestamp: asset && supportsTemporalAnnotations(asset.type) ? currentTime : undefined,
      });
      const newItem: TimelineItem = {
        type: 'comment',
        id: comment.id,
        created_at: comment.created_at,
        data: comment,
      };
      setTimeline([...timeline, newItem]);
      setNewComment('');
      setSelectedRect(null);
    } catch (error) {
      console.error('Failed to create comment:', error);
    }
  };

  const handleResolveComment = async (commentId: string, resolved: boolean) => {
    try {
      const updated = resolved
        ? await assetsApi.unresolveComment(commentId)
        : await assetsApi.resolveComment(commentId);
      setTimeline(timeline.map((item) =>
        item.type === 'comment' && item.id === commentId
          ? { ...item, data: updated }
          : item
      ));
    } catch (error) {
      console.error('Failed to update comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await assetsApi.deleteComment(commentId);
      setTimeline(timeline.filter((item) => !(item.type === 'comment' && item.id === commentId)));
      if (selectedCommentId === commentId) {
        setSelectedCommentId(null);
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const handleApprove = async (comment?: string) => {
    try {
      await assetsApi.approve(id!, comment);
      fetchAsset();
      fetchTimeline();
      setShowApproveModal(false);
    } catch (error) {
      console.error('Failed to approve:', error);
    }
  };

  const handleRequestRevision = async (comment: string) => {
    try {
      await assetsApi.requestRevision(id!, comment);
      fetchAsset();
      fetchTimeline();
      setShowRevisionModal(false);
    } catch (error) {
      console.error('Failed to request revision:', error);
    }
  };

  const handleUploadVersion = async (file: File, versionNotes?: string) => {
    try {
      await assetsApi.uploadVersion(id!, file, versionNotes);
      fetchAsset();
      fetchTimeline();
      setShowUploadModal(false);
    } catch (error) {
      console.error('Failed to upload version:', error);
    }
  };

  const handleLock = async () => {
    if (!asset) return;
    setIsLocking(true);
    try {
      if (asset.is_locked) {
        await assetsApi.unlock(id!);
      } else {
        await assetsApi.lock(id!);
      }
      fetchAsset();
    } catch (error) {
      console.error('Failed to toggle lock:', error);
    } finally {
      setIsLocking(false);
    }
  };

  const handleDownloadVersion = async (version?: number) => {
    try {
      const response = await assetsApi.download(id!, version);
      const link = document.createElement('a');
      link.href = response.url;
      link.download = response.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download:', error);
    }
  };

  const currentVersionData = asset?.versions?.find((v) => v.version_number === selectedVersion);

  // Use role-based asset actions hook (handles null asset gracefully)
  const { primaryActions, dropdownActions, getCommentActions } = useAssetActions({
    asset,
    user,
  });

  // Action handlers map
  const actionHandlers: ActionHandlers = {
    'approve': () => setShowApproveModal(true),
    'request-revision': () => setShowRevisionModal(true),
    'upload-version': () => setShowUploadModal(true),
    'compare-versions': () => setShowCompareModal(true),
    'view-timeline': () => setShowTimeline(!showTimeline),
    'lock': () => handleLock(),
    'download': () => handleDownload(),
    'download-all': () => handleDownloadAll(),
    'edit': () => setShowEditModal(true),
    'delete': () => setShowDeleteModal(true),
  };

  const handleDelete = async () => {
    try {
      await assetsApi.delete(id!);
      navigate(`/projects/${asset?.project_id}`);
    } catch (error) {
      console.error('Failed to delete asset:', error);
    }
  };

  const handleDownload = () => {
    handleDownloadVersion(selectedVersion);
  };

  const handleDownloadAll = () => {
    asset?.versions?.forEach((version) => {
      handleDownloadVersion(version.version_number);
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Asset not found
        </h2>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-4">
          <Link
            to={`/projects/${asset.project_id}`}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              {asset.title}
            </h1>
            <p className="text-sm text-gray-500">
              {asset.project?.name} · v{selectedVersion}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge status={asset.status} type="asset" />

          {asset.is_locked && (
            <span className="flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded text-sm">
              <Lock className="w-4 h-4" />
              Locked
            </span>
          )}

          {/* Primary actions from hook - rendered dynamically based on role */}
          {primaryActions
            .filter((action) => !['approve', 'request-revision'].includes(action.id))
            .map((action) => (
              <ActionButton
                key={action.id}
                action={action}
                onClick={actionHandlers[action.id]}
                isActive={action.id === 'view-timeline' && showTimeline}
                isLoading={action.id === 'lock' && isLocking}
              />
            ))}

          {/* Actions dropdown */}
          {dropdownActions.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowActionsMenu(!showActionsMenu)}
                className="btn-secondary"
                title="More actions"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {showActionsMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowActionsMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                    <div className="py-1">
                      {dropdownActions.map((action) => (
                        <DropdownActionButton
                          key={action.id}
                          action={action}
                          onClick={() => {
                            actionHandlers[action.id]();
                            setShowActionsMenu(false);
                          }}
                          isLoading={action.id === 'lock' && isLocking}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Upload Version - shown separately for creative role prominence */}
          {primaryActions.find((a) => a.id === 'upload-version') && (
            <ActionButton
              action={primaryActions.find((a) => a.id === 'upload-version')!}
              onClick={actionHandlers['upload-version']}
              showLabel
            />
          )}

          {/* Approval actions at the end for emphasis */}
          {primaryActions
            .filter((action) => ['request-revision', 'approve'].includes(action.id))
            .map((action) => (
              <ActionButton
                key={action.id}
                action={action}
                onClick={actionHandlers[action.id]}
                showLabel
              />
            ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Asset Preview */}
        <div className="flex-1 flex flex-col bg-gray-900 relative">
          <div
            ref={containerRef}
            className="flex-1 relative cursor-crosshair overflow-hidden flex items-center justify-center"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => setIsDrawing(false)}
          >
            {/* Dynamic renderer from registry */}
            {currentVersionData && (() => {
              const handler = getAssetTypeHandler(asset.type);
              if (!handler) return null;

              const Renderer = handler.Renderer;
              const mediaUrl = getMediaUrlForType(currentVersionData.file_url, asset.type);

              return (
                <Renderer
                  fileUrl={mediaUrl}
                  title={asset.title}
                  mediaRef={mediaRef}
                  onLoad={updateMediaBounds}
                  currentTime={currentTime}
                  onTimeUpdate={setCurrentTime}
                  onDurationChange={setDuration}
                  onPlayChange={setIsPlaying}
                />
              );
            })()}

            {/* Annotation overlay - only show for types that support spatial annotations */}
            {supportsSpatialAnnotations(asset.type) && (
              <AnnotationOverlay
                mediaBounds={mediaBounds}
                containerRef={containerRef}
                currentRect={currentRect}
                selectedRect={selectedRect}
                selectedCommentId={selectedCommentId}
                comments={timeline
                  .filter((item) => item.type === 'comment')
                  .map((item) => {
                    const comment = item.data as Comment;
                    return {
                      id: comment.id,
                      rectangle: comment.rectangle,
                      video_timestamp: comment.video_timestamp,
                      is_resolved: comment.is_resolved,
                      asset_version: comment.asset_version,
                    };
                  })}
                selectedVersion={selectedVersion}
                assetType={asset.type}
                currentTime={currentTime}
                onCommentClick={(commentId, videoTimestamp) => {
                  setSelectedCommentId(commentId);
                  // For video annotations, pause and seek to start of annotation visibility
                  const video = mediaRef.current as HTMLVideoElement | null;
                  if (supportsTemporalAnnotations(asset.type) && videoTimestamp !== null && video) {
                    const seekTime = Math.max(0, videoTimestamp - ANNOTATION_SHOW_BEFORE);
                    video.pause();
                    video.currentTime = seekTime;
                    setCurrentTime(seekTime);
                  }
                }}
              />
            )}
          </div>

          {/* Controls from registry (e.g., video controls) */}
          {(() => {
            const handler = getAssetTypeHandler(asset.type);
            if (!handler?.Controls) return null;
            const Controls = handler.Controls;
            return (
              <Controls
                videoRef={mediaRef as React.RefObject<HTMLVideoElement | null>}
                isPlaying={isPlaying}
                currentTime={currentTime}
                duration={duration}
                setCurrentTime={setCurrentTime}
                isScrubbingRef={isScrubbingRef}
                scrubTimeRef={scrubTimeRef}
              />
            );
          })()}

          {/* Version Selector */}
          {asset.versions && asset.versions.length > 1 && (
            <div className="p-4 bg-gray-800 flex items-center justify-center gap-2">
              <button
                onClick={() => setSelectedVersion(Math.max(1, selectedVersion - 1))}
                disabled={selectedVersion === 1}
                className="p-1 hover:bg-gray-700 rounded disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              {asset.versions.map((v) => (
                <button
                  key={v.version_number}
                  onClick={() => setSelectedVersion(v.version_number)}
                  className={`px-3 py-1 rounded text-sm ${
                    selectedVersion === v.version_number
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  v{v.version_number}
                </button>
              ))}
              <button
                onClick={() => setSelectedVersion(Math.min(asset.current_version, selectedVersion + 1))}
                disabled={selectedVersion === asset.current_version}
                className="p-1 hover:bg-gray-700 rounded disabled:opacity-50"
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            </div>
          )}
        </div>

        {/* Timeline Panel (Collapsible) */}
        {showTimeline && (
          <div className="w-80 bg-gray-900 border-l border-gray-700 overflow-y-auto">
            <VersionTimeline
              assetId={asset.id}
              onVersionSelect={(v) => setSelectedVersion(v)}
              currentVersion={selectedVersion}
            />
          </div>
        )}

        {/* Activity Panel */}
        <div className="w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 dark:text-white flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                Activity
              </h2>
              <button
                onClick={() => setShowAllVersionsComments(!showAllVersionsComments)}
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

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {timeline
              .filter((item) => {
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
              })
              .map((item) => {
                if (item.type === 'version') {
                  const version = item.data as AssetVersion;
                  return (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Upload className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                          Version {version.version_number} uploaded
                        </span>
                      </div>
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        by {version.uploader?.name} · {new Date(item.created_at).toLocaleString()}
                      </p>
                      {version.version_notes && (
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                          {version.version_notes}
                        </p>
                      )}
                    </div>
                  );
                }

                if (item.type === 'approval') {
                  const approval = item.data as ApprovalLog;
                  const isApproved = approval.action === 'approved';
                  const isRevision = approval.action === 'revision_requested';
                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-lg border ${
                        isApproved
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                          : isRevision
                          ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                          : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {isApproved ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <RotateCcw className="w-4 h-4 text-orange-600" />
                        )}
                        <span className={`text-sm font-medium ${
                          isApproved ? 'text-green-700 dark:text-green-300' : 'text-orange-700 dark:text-orange-300'
                        }`}>
                          {isApproved ? 'Approved' : 'Revision Requested'}
                        </span>
                        <span className="text-xs bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded">
                          v{approval.asset_version}
                        </span>
                      </div>
                      <p className={`text-xs ${isApproved ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                        by {approval.user?.name} · {new Date(item.created_at).toLocaleString()}
                      </p>
                      {approval.comment && (
                        <p className={`text-sm mt-2 ${isApproved ? 'text-green-700 dark:text-green-300' : 'text-orange-700 dark:text-orange-300'}`}>
                          "{approval.comment}"
                        </p>
                      )}
                    </div>
                  );
                }

                // Comment item
                const comment = item.data as Comment;
                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                      selectedCommentId === comment.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => {
                      setSelectedCommentId(comment.id);
                      // Seek to start of annotation visibility for temporal assets (like video)
                      const video = mediaRef.current as HTMLVideoElement | null;
                      if (supportsTemporalAnnotations(asset.type) && comment.video_timestamp !== null && video) {
                        const seekTime = Math.max(0, comment.video_timestamp - ANNOTATION_SHOW_BEFORE);
                        video.pause();
                        video.currentTime = seekTime;
                        setCurrentTime(seekTime);
                      }
                    }}
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
                      <CommentActions
                        comment={comment}
                        getCommentActions={getCommentActions}
                        onDelete={handleDeleteComment}
                        onResolve={handleResolveComment}
                      />
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {comment.content}
                    </p>
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
                      {comment.video_timestamp !== null && (
                        <span
                          className="bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-1.5 py-0.5 rounded cursor-pointer hover:bg-primary-200 dark:hover:bg-primary-900/50"
                          onClick={(e) => {
                            e.stopPropagation();
                            const video = mediaRef.current as HTMLVideoElement | null;
                            if (video) {
                              const seekTime = Math.max(0, comment.video_timestamp! - ANNOTATION_SHOW_BEFORE);
                              video.pause();
                              video.currentTime = seekTime;
                              setCurrentTime(seekTime);
                              setSelectedCommentId(comment.id);
                            }
                          }}
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
              })}
          </div>

          {/* Add Comment */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            {selectedRect && (
              <div className="mb-2 p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm text-green-700 dark:text-green-300">
                Annotation selected. Your comment will be linked to this area.
              </div>
            )}
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="input mb-2"
              rows={3}
            />
            <div className="flex justify-between">
              {selectedRect && (
                <button
                  onClick={() => setSelectedRect(null)}
                  className="btn-secondary text-sm"
                >
                  Clear Annotation
                </button>
              )}
              <button
                onClick={handleSubmitComment}
                disabled={!newComment.trim()}
                className="btn-primary ml-auto"
              >
                Add Comment
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Approve Modal */}
      {showApproveModal && (
        <ApproveModal
          onClose={() => setShowApproveModal(false)}
          onApprove={handleApprove}
        />
      )}

      {/* Revision Modal */}
      {showRevisionModal && (
        <RevisionModal
          onClose={() => setShowRevisionModal(false)}
          onSubmit={handleRequestRevision}
        />
      )}

      {/* Upload Version Modal */}
      {showUploadModal && (
        <UploadVersionModal
          onClose={() => setShowUploadModal(false)}
          onUpload={handleUploadVersion}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <EditAssetModal
          asset={asset}
          onClose={() => setShowEditModal(false)}
          onUpdated={(updated) => {
            setAsset(updated);
            setShowEditModal(false);
          }}
        />
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <DeleteConfirmModal
          title="Delete Asset"
          message={`Are you sure you want to delete "${asset.title}"? This will remove all versions and comments. This action cannot be undone.`}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
        />
      )}

      {/* Version Comparison Modal */}
      {showCompareModal && asset.versions && asset.versions.length > 1 && (
        <VersionComparison
          versions={asset.versions}
          assetType={asset.type}
          initialRightVersion={selectedVersion}
          onClose={() => setShowCompareModal(false)}
        />
      )}
    </div>
  );
}

// Helper component for rendering toolbar action buttons
function ActionButton({
  action,
  onClick,
  isActive = false,
  isLoading = false,
  showLabel = false,
}: {
  action: ComputedAction;
  onClick: () => void;
  isActive?: boolean;
  isLoading?: boolean;
  showLabel?: boolean;
}) {
  const Icon = action.icon;

  const variantClasses: Record<string, string> = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    success: 'btn-success',
    warning: 'btn-warning',
    danger: 'btn-primary bg-red-600 hover:bg-red-700',
  };

  const baseClass = variantClasses[action.variant] || 'btn-secondary';
  const activeClass = isActive ? 'bg-primary-100 dark:bg-primary-900/30' : '';

  return (
    <button
      onClick={onClick}
      disabled={action.isDisabled || isLoading}
      className={`${baseClass} ${activeClass}`}
      title={action.tooltip || action.label}
    >
      <Icon className={`w-4 h-4 ${showLabel ? 'mr-2' : ''}`} />
      {showLabel && action.label}
    </button>
  );
}

// Helper component for rendering dropdown action buttons
function DropdownActionButton({
  action,
  onClick,
  isLoading = false,
}: {
  action: ComputedAction;
  onClick: () => void;
  isLoading?: boolean;
}) {
  const Icon = action.icon;

  const textClass =
    action.variant === 'danger'
      ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700';

  return (
    <button
      onClick={onClick}
      disabled={action.isDisabled || isLoading}
      className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${textClass}`}
      title={action.tooltip}
    >
      <Icon className="w-4 h-4" />
      {action.label}
    </button>
  );
}

// Helper component for comment actions
function CommentActions({
  comment,
  getCommentActions,
  onDelete,
  onResolve,
}: {
  comment: Comment;
  getCommentActions: (comment: Comment) => { canDelete: boolean; canResolve: boolean };
  onDelete: (commentId: string) => void;
  onResolve: (commentId: string, isResolved: boolean) => void;
}) {
  const { canDelete, canResolve } = getCommentActions(comment);

  return (
    <div className="flex items-center gap-1">
      {canDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm('Delete this comment?')) {
              onDelete(comment.id);
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
            onResolve(comment.id, comment.is_resolved);
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
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function ApproveModal({
  onClose,
  onApprove,
}: {
  onClose: () => void;
  onApprove: (comment?: string) => void;
}) {
  const [comment, setComment] = useState('');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Approve Asset
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Are you sure you want to approve this asset?
        </p>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Optional approval comment..."
          className="input mb-4"
          rows={3}
        />
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button onClick={() => onApprove(comment || undefined)} className="btn-success">
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}

function RevisionModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (comment: string) => void;
}) {
  const [comment, setComment] = useState('');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Request Revision
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Add an optional note, or leave blank if you've already added annotations.
        </p>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Additional notes (optional)..."
          className="input mb-4"
          rows={4}
        />
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={() => onSubmit(comment)}
            className="btn-warning"
          >
            Request Revision
          </button>
        </div>
      </div>
    </div>
  );
}

function UploadVersionModal({
  onClose,
  onUpload,
}: {
  onClose: () => void;
  onUpload: (file: File, versionNotes?: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [versionNotes, setVersionNotes] = useState('');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Upload New Version
        </h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="file-upload" className="label">
              File *
            </label>
            <input
              id="file-upload"
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="input"
              accept="image/*,video/*,application/pdf"
            />
          </div>
          <div>
            <label htmlFor="version-notes" className="label">
              Version Notes (optional)
            </label>
            <textarea
              id="version-notes"
              value={versionNotes}
              onChange={(e) => setVersionNotes(e.target.value)}
              placeholder="Describe what changed in this version..."
              className="input"
              rows={3}
              maxLength={1000}
            />
            <p className="text-xs text-gray-500 mt-1">
              {versionNotes.length}/1000 characters
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={() => file && onUpload(file, versionNotes || undefined)}
            disabled={!file}
            className="btn-primary"
          >
            Upload
          </button>
        </div>
      </div>
    </div>
  );
}

function EditAssetModal({
  asset,
  onClose,
  onUpdated,
}: {
  asset: Asset;
  onClose: () => void;
  onUpdated: (asset: Asset) => void;
}) {
  const [title, setTitle] = useState(asset.title);
  const [description, setDescription] = useState(asset.description || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const updated = await assetsApi.update(asset.id, {
        title,
        description: description || undefined,
      });
      onUpdated(updated);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to update asset');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Edit Asset
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="asset-title" className="label">
              Title *
            </label>
            <input
              id="asset-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input"
              required
            />
          </div>

          <div>
            <label htmlFor="asset-description" className="label">
              Description
            </label>
            <textarea
              id="asset-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirmModal({
  title,
  message,
  onClose,
  onConfirm,
}: {
  title: string;
  message: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    await onConfirm();
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {title}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary" disabled={isLoading}>
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="btn-primary bg-red-600 hover:bg-red-700"
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
