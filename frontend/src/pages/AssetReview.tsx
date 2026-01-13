import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  RotateCcw,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Upload,
  CheckCircle,
  Circle,
} from 'lucide-react';
import { assetsApi } from '../api/assets';
import { Asset, Comment, AssetVersion } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { useAuthStore } from '../stores/authStore';

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
  const [comments, setComments] = useState<Comment[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Annotation state
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentRect, setCurrentRect] = useState<Rectangle | null>(null);
  const [selectedRect, setSelectedRect] = useState<Rectangle | null>(null);
  const [newComment, setNewComment] = useState('');
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);

  // Video state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      fetchAsset();
    }
  }, [id]);

  useEffect(() => {
    if (asset) {
      fetchComments();
    }
  }, [asset, selectedVersion]);

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

  const fetchComments = async () => {
    try {
      const data = await assetsApi.getComments(id!, selectedVersion);
      setComments(data);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    setIsDrawing(true);
    setCurrentRect({ x, y, width: 0, height: 0 });
    setSelectedCommentId(null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !currentRect || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

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
        video_timestamp: asset?.type === 'video' ? currentTime : undefined,
      });
      setComments([...comments, comment]);
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
      setComments(comments.map((c) => (c.id === commentId ? updated : c)));
    } catch (error) {
      console.error('Failed to update comment:', error);
    }
  };

  const handleApprove = async (comment?: string) => {
    try {
      await assetsApi.approve(id!, comment);
      fetchAsset();
      setShowApproveModal(false);
    } catch (error) {
      console.error('Failed to approve:', error);
    }
  };

  const handleRequestRevision = async (comment: string) => {
    try {
      await assetsApi.requestRevision(id!, comment);
      fetchAsset();
      setShowRevisionModal(false);
    } catch (error) {
      console.error('Failed to request revision:', error);
    }
  };

  const handleUploadVersion = async (file: File) => {
    try {
      await assetsApi.uploadVersion(id!, file);
      fetchAsset();
      setShowUploadModal(false);
    } catch (error) {
      console.error('Failed to upload version:', error);
    }
  };

  const canApprove = user?.role === 'admin' || user?.role === 'pm';
  const canUploadVersion = user?.role === 'admin' || user?.role === 'pm' ||
    (user?.role === 'creative' && asset?.uploaded_by === user.id);

  const currentVersionData = asset?.versions?.find((v) => v.version_number === selectedVersion);

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

          {canUploadVersion && asset.status === 'revision_requested' && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="btn-secondary"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload New Version
            </button>
          )}

          {canApprove && asset.status !== 'approved' && (
            <>
              <button
                onClick={() => setShowRevisionModal(true)}
                className="btn-warning"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Request Revision
              </button>
              <button
                onClick={() => setShowApproveModal(true)}
                className="btn-success"
              >
                <Check className="w-4 h-4 mr-2" />
                Approve
              </button>
            </>
          )}
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
            {asset.type === 'image' && currentVersionData && (
              <img
                src={currentVersionData.file_url}
                alt={asset.title}
                className="max-w-full max-h-full object-contain"
                draggable={false}
              />
            )}

            {asset.type === 'video' && currentVersionData && (
              <video
                ref={videoRef}
                src={currentVersionData.file_url}
                className="max-w-full max-h-full object-contain"
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
            )}

            {asset.type === 'pdf' && currentVersionData && (
              <iframe
                src={currentVersionData.file_url}
                className="w-full h-full"
                title={asset.title}
              />
            )}

            {/* Drawing rectangle */}
            {currentRect && (
              <div
                className="absolute border-2 border-primary-500 bg-primary-500/20 pointer-events-none"
                style={{
                  left: `${Math.min(currentRect.x, currentRect.x + currentRect.width) * 100}%`,
                  top: `${Math.min(currentRect.y, currentRect.y + currentRect.height) * 100}%`,
                  width: `${Math.abs(currentRect.width) * 100}%`,
                  height: `${Math.abs(currentRect.height) * 100}%`,
                }}
              />
            )}

            {/* Selected rectangle */}
            {selectedRect && (
              <div
                className="absolute border-2 border-green-500 bg-green-500/20 pointer-events-none"
                style={{
                  left: `${selectedRect.x * 100}%`,
                  top: `${selectedRect.y * 100}%`,
                  width: `${selectedRect.width * 100}%`,
                  height: `${selectedRect.height * 100}%`,
                }}
              />
            )}

            {/* Comment rectangles */}
            {comments
              .filter((c) => c.rectangle && c.asset_version === selectedVersion)
              .map((comment) => (
                <div
                  key={comment.id}
                  className={`absolute border-2 cursor-pointer transition-colors ${
                    selectedCommentId === comment.id
                      ? 'border-primary-500 bg-primary-500/30'
                      : comment.is_resolved
                      ? 'border-green-500 bg-green-500/20'
                      : 'border-yellow-500 bg-yellow-500/20'
                  }`}
                  style={{
                    left: `${comment.rectangle!.x * 100}%`,
                    top: `${comment.rectangle!.y * 100}%`,
                    width: `${comment.rectangle!.width * 100}%`,
                    height: `${comment.rectangle!.height * 100}%`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCommentId(comment.id);
                  }}
                />
              ))}
          </div>

          {/* Video Controls */}
          {asset.type === 'video' && (
            <div className="p-4 bg-gray-800 flex items-center gap-4">
              <button
                onClick={() => {
                  if (videoRef.current) {
                    isPlaying ? videoRef.current.pause() : videoRef.current.play();
                  }
                }}
                className="p-2 hover:bg-gray-700 rounded"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-white" />
                ) : (
                  <Play className="w-5 h-5 text-white" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={duration}
                value={currentTime}
                onChange={(e) => {
                  if (videoRef.current) {
                    videoRef.current.currentTime = parseFloat(e.target.value);
                  }
                }}
                className="flex-1"
              />
              <span className="text-white text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
          )}

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

        {/* Comments Panel */}
        <div className="w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              Comments ({comments.filter((c) => c.asset_version === selectedVersion).length})
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {comments
              .filter((c) => c.asset_version === selectedVersion)
              .map((comment) => (
                <div
                  key={comment.id}
                  className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                    selectedCommentId === comment.id
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedCommentId(comment.id)}
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleResolveComment(comment.id, comment.is_resolved);
                      }}
                      className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        comment.is_resolved ? 'text-green-500' : 'text-gray-400'
                      }`}
                    >
                      {comment.is_resolved ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {comment.content}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    {comment.video_timestamp !== null && (
                      <span className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
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
              ))}
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
          Please explain what changes are needed.
        </p>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Describe the required changes..."
          className="input mb-4"
          rows={4}
          required
        />
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={() => onSubmit(comment)}
            disabled={!comment.trim()}
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
  onUpload: (file: File) => void;
}) {
  const [file, setFile] = useState<File | null>(null);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Upload New Version
        </h2>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="input mb-4"
          accept="image/*,video/*,application/pdf"
        />
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={() => file && onUpload(file)}
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
