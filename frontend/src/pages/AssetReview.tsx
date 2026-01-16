import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock } from 'lucide-react';
import { assetsApi } from '../api/assets';
import { Asset, Comment, TimelineItem } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { useAuthStore } from '../stores/authStore';
import { VersionTimeline, VersionComparison } from '../components/version';
import { useAssetActions, useAssetReviewState, useTemporalSeek, ModalType } from '../hooks';
import { supportsTemporalAnnotations } from '../config/assetTypeRegistry';
import {
  AssetPreview,
  ActivityPanel,
  HeaderActions,
} from '../components/assetReview';
import {
  ApproveModal,
  RevisionModal,
  UploadVersionModal,
  EditAssetModal,
  DeleteConfirmModal,
} from '../components/modals';

/**
 * Asset review page - main component for reviewing and annotating assets.
 * Orchestrates sub-components for preview, activity, and actions.
 */
export function AssetReviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Data state
  const [asset, setAsset] = useState<Asset | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([])
  const [selectedVersion, setSelectedVersion] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');

  // UI state via reducer
  const {
    state,
    openModal,
    closeModal,
    toggleTimeline,
    toggleAllVersionsComments,
    toggleActionsMenu,
    closeActionsMenu,
    startDrawing,
    updateDrawing,
    finishDrawing,
    cancelDrawing,
    setSelectedRect,
    setSelectedCommentId,
    resetAnnotation,
    setIsPlaying,
    setCurrentTime,
    setDuration,
    setCurrentPage,
    setTotalPages,
    setZoomLevel,
    setPdfFitMode,
    setIsLocking,
  } = useAssetReviewState();

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLImageElement | HTMLVideoElement | null>(null);
  const isScrubbingRef = useRef(false);
  const scrubTimeRef = useRef(0);
  const [mediaBounds, setMediaBounds] = useState<DOMRect | null>(null);

  // Temporal seek hook
  const { seekToTimestamp } = useTemporalSeek({
    mediaRef,
    assetType: asset?.type || '',
    onTimeChange: setCurrentTime,
  });

  // Role-based actions
  const { primaryActions, dropdownActions, getCommentActions } = useAssetActions({
    asset,
    user,
  });

  // Update media bounds
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

  // Fetch asset
  useEffect(() => {
    if (id) {
      fetchAsset();
    }
  }, [id]);

  // Fetch timeline when asset changes
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

  // Drawing handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!mediaBounds) return;
    const x = (e.clientX - mediaBounds.left) / mediaBounds.width;
    const y = (e.clientY - mediaBounds.top) / mediaBounds.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) return;
    startDrawing({ x, y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!state.isDrawing || !state.currentRect || !mediaBounds) return;
    const x = Math.max(0, Math.min(1, (e.clientX - mediaBounds.left) / mediaBounds.width));
    const y = Math.max(0, Math.min(1, (e.clientY - mediaBounds.top) / mediaBounds.height));
    updateDrawing({
      ...state.currentRect,
      width: x - state.currentRect.x,
      height: y - state.currentRect.y,
    });
  };

  const handleMouseUp = () => {
    if (!state.currentRect || Math.abs(state.currentRect.width) < 0.01 || Math.abs(state.currentRect.height) < 0.01) {
      cancelDrawing();
      return;
    }
    // Normalize rectangle
    const normalized = {
      x: state.currentRect.width < 0 ? state.currentRect.x + state.currentRect.width : state.currentRect.x,
      y: state.currentRect.height < 0 ? state.currentRect.y + state.currentRect.height : state.currentRect.y,
      width: Math.abs(state.currentRect.width),
      height: Math.abs(state.currentRect.height),
    };
    finishDrawing(normalized);
  };

  // Comment handlers
  const handleSubmitComment = async () => {
    if (!newComment.trim() || !asset) return;
    try {
      const comment = await assetsApi.createComment(id!, {
        content: newComment,
        rectangle: state.selectedRect || undefined,
        video_timestamp: supportsTemporalAnnotations(asset.type) ? state.currentTime : undefined,
        page_number: asset.type === 'pdf' ? state.currentPage : undefined,
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

  const handleCommentClick = (comment: Comment) => {
    setSelectedCommentId(comment.id);
    if (supportsTemporalAnnotations(asset?.type || '') && comment.video_timestamp !== null) {
      seekToTimestamp(comment.video_timestamp);
    }
    // Navigate to page for PDF comments
    if (asset?.type === 'pdf' && comment.page_number !== null) {
      setCurrentPage(comment.page_number);
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
      if (state.selectedCommentId === commentId) {
        setSelectedCommentId(null);
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  // Asset action handlers
  const handleApprove = async (comment?: string) => {
    try {
      await assetsApi.approve(id!, comment);
      fetchAsset();
      fetchTimeline();
      closeModal();
    } catch (error) {
      console.error('Failed to approve:', error);
    }
  };

  const handleRequestRevision = async (comment: string) => {
    try {
      await assetsApi.requestRevision(id!, comment);
      fetchAsset();
      fetchTimeline();
      closeModal();
    } catch (error) {
      console.error('Failed to request revision:', error);
    }
  };

  const handleUploadVersion = async (file: File, versionNotes?: string) => {
    try {
      await assetsApi.uploadVersion(id!, file, versionNotes);
      fetchAsset();
      fetchTimeline();
      closeModal();
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

  const handleDelete = async () => {
    try {
      await assetsApi.delete(id!);
      navigate(`/projects/${asset?.project_id}`);
    } catch (error) {
      console.error('Failed to delete asset:', error);
    }
  };

  // Action handler map
  const handleAction = (actionId: string) => {
    const actions: Record<string, () => void> = {
      'approve': () => openModal('approve'),
      'request-revision': () => openModal('revision'),
      'upload-version': () => openModal('upload'),
      'compare-versions': () => openModal('compare'),
      'view-timeline': toggleTimeline,
      'lock': handleLock,
      'download': () => handleDownloadVersion(selectedVersion),
      'download-all': () => asset?.versions?.forEach((v) => handleDownloadVersion(v.version_number)),
      'edit': () => openModal('edit'),
      'delete': () => openModal('delete'),
    };
    actions[actionId]?.();
  };

  const currentVersionData = asset?.versions?.find((v) => v.version_number === selectedVersion);
  const comments = timeline
    .filter((item) => item.type === 'comment')
    .map((item) => item.data as Comment);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Not found state
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
          <HeaderActions
            primaryActions={primaryActions}
            dropdownActions={dropdownActions}
            showActionsMenu={state.showActionsMenu}
            showTimeline={state.showTimeline}
            isLocking={state.isLocking}
            onActionClick={handleAction}
            onToggleActionsMenu={toggleActionsMenu}
            onCloseActionsMenu={closeActionsMenu}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Asset Preview */}
        <AssetPreview
          asset={asset}
          currentVersionData={currentVersionData}
          containerRef={containerRef}
          mediaRef={mediaRef}
          mediaBounds={mediaBounds}
          selectedVersion={selectedVersion}
          isDrawing={state.isDrawing}
          currentRect={state.currentRect}
          selectedRect={state.selectedRect}
          selectedCommentId={state.selectedCommentId}
          currentTime={state.currentTime}
          isPlaying={state.isPlaying}
          duration={state.duration}
          currentPage={state.currentPage}
          totalPages={state.totalPages}
          zoomLevel={state.zoomLevel}
          pdfFitMode={state.pdfFitMode}
          onMediaLoad={updateMediaBounds}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={cancelDrawing}
          onTimeUpdate={setCurrentTime}
          onDurationChange={setDuration}
          onPlayChange={setIsPlaying}
          onPageChange={setCurrentPage}
          onTotalPagesChange={setTotalPages}
          onZoomChange={setZoomLevel}
          onFitModeChange={setPdfFitMode}
          onCommentClick={(commentId, videoTimestamp, pageNumber) => {
            setSelectedCommentId(commentId);
            if (videoTimestamp !== null) {
              seekToTimestamp(videoTimestamp);
            }
            if (pageNumber !== null) {
              setCurrentPage(pageNumber);
            }
          }}
          comments={comments}
          isScrubbingRef={isScrubbingRef}
          scrubTimeRef={scrubTimeRef}
          onVersionSelect={setSelectedVersion}
        />

        {/* Timeline Panel (Collapsible) */}
        {state.showTimeline && (
          <div className="w-80 bg-gray-900 border-l border-gray-700 overflow-y-auto">
            <VersionTimeline
              assetId={asset.id}
              onVersionSelect={setSelectedVersion}
              currentVersion={selectedVersion}
            />
          </div>
        )}

        {/* Activity Panel */}
        <ActivityPanel
          timeline={timeline}
          selectedVersion={selectedVersion}
          assetType={asset.type}
          selectedCommentId={state.selectedCommentId}
          selectedRect={state.selectedRect}
          newComment={newComment}
          showAllVersionsComments={state.showAllVersionsComments}
          onCommentChange={setNewComment}
          onSubmitComment={handleSubmitComment}
          onClearAnnotation={resetAnnotation}
          onCommentClick={handleCommentClick}
          onDeleteComment={handleDeleteComment}
          onResolveComment={handleResolveComment}
          onToggleShowAllVersions={toggleAllVersionsComments}
          getCommentActions={getCommentActions}
        />
      </div>

      {/* Modals */}
      {state.activeModal === 'approve' && (
        <ApproveModal onClose={closeModal} onApprove={handleApprove} />
      )}
      {state.activeModal === 'revision' && (
        <RevisionModal onClose={closeModal} onSubmit={handleRequestRevision} />
      )}
      {state.activeModal === 'upload' && (
        <UploadVersionModal onClose={closeModal} onUpload={handleUploadVersion} />
      )}
      {state.activeModal === 'edit' && (
        <EditAssetModal
          asset={asset}
          onClose={closeModal}
          onUpdated={(updated) => {
            setAsset(updated);
            closeModal();
          }}
        />
      )}
      {state.activeModal === 'delete' && (
        <DeleteConfirmModal
          title="Delete Asset"
          message={`Are you sure you want to delete "${asset.title}"? This will remove all versions and comments. This action cannot be undone.`}
          onClose={closeModal}
          onConfirm={handleDelete}
        />
      )}
      {state.activeModal === 'compare' && asset.versions && asset.versions.length > 1 && (
        <VersionComparison
          versions={asset.versions}
          assetType={asset.type}
          initialRightVersion={selectedVersion}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
