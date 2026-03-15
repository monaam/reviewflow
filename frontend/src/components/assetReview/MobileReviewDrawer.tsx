import { FC, useRef, useEffect, useState, useCallback } from 'react';
import { motion, useMotionValue, animate, PanInfo } from 'framer-motion';
import { MessageSquare, Layers, MapPin } from 'lucide-react';
import { TimelineItem, Comment, TempCommentImage, TextAnchor } from '../../types';
import { Rectangle } from '../../hooks/useAssetReviewState';
import { ActivityPanel } from './ActivityPanel';
import { VersionTimeline } from '../version';
import { supportsSpatialAnnotations } from '../../config/assetTypeRegistry';

type SnapPoint = 'peek' | 'half' | 'full';
type DrawerTab = 'comments' | 'versions';

const PEEK_HEIGHT = 64;
const HANDLE_HEIGHT = 32;

interface MobileReviewDrawerProps {
  // Activity panel pass-through
  timeline: TimelineItem[];
  selectedVersion: number;
  assetType: string;
  assetId: string;
  selectedCommentId: string | null;
  selectedRect: Rectangle | null;
  selectedTextAnchor?: TextAnchor | null;
  newComment: string;
  showAllVersionsComments: boolean;
  pendingImages: TempCommentImage[];
  onCommentChange: (comment: string) => void;
  onPendingImagesChange: (images: TempCommentImage[]) => void;
  onSubmitComment: () => void;
  onClearAnnotation: () => void;
  onCommentClick: (comment: Comment) => void;
  onDeleteComment: (commentId: string) => void;
  onResolveComment: (commentId: string, isResolved: boolean) => void;
  onToggleShowAllVersions: () => void;
  onSubmitReply: (parentId: string, content: string, tempImageIds?: string[]) => Promise<void>;
  onToggleReaction: (commentId: string, emoji: string) => void;
  getCommentActions: (comment: Comment) => { canDelete: boolean; canResolve: boolean };

  // Version timeline
  onVersionSelect: (version: number) => void;

  // Annotation mode
  onStartAnnotation: () => void;

  // Drawer control from parent
  snapTo?: SnapPoint;
  onSnapChange?: (snap: SnapPoint) => void;
}

export const MobileReviewDrawer: FC<MobileReviewDrawerProps> = ({
  timeline,
  selectedVersion,
  assetType,
  assetId,
  selectedCommentId,
  selectedRect,
  selectedTextAnchor,
  newComment,
  showAllVersionsComments,
  pendingImages,
  onCommentChange,
  onPendingImagesChange,
  onSubmitComment,
  onClearAnnotation,
  onCommentClick,
  onDeleteComment,
  onResolveComment,
  onToggleShowAllVersions,
  onSubmitReply,
  onToggleReaction,
  getCommentActions,
  onVersionSelect,
  onStartAnnotation,
  snapTo,
  onSnapChange,
}) => {
  const [activeTab, setActiveTab] = useState<DrawerTab>('comments');
  const [currentSnap, setCurrentSnap] = useState<SnapPoint>('peek');
  const containerRef = useRef<HTMLDivElement>(null);

  // Use visualViewport on iOS Safari for accurate visible height
  const getViewportHeight = useCallback(() => {
    return window.visualViewport?.height ?? window.innerHeight;
  }, []);

  // Get snap point heights
  const getSnapHeight = useCallback((snap: SnapPoint) => {
    const vh = getViewportHeight();
    switch (snap) {
      case 'peek': return PEEK_HEIGHT;
      case 'half': return Math.round(vh * 0.5);
      case 'full': return Math.round(vh * 0.85);
    }
  }, [getViewportHeight]);

  const y = useMotionValue(0);

  // Animate to a snap point
  const animateToSnap = useCallback((snap: SnapPoint) => {
    const vh = getViewportHeight();
    const targetHeight = getSnapHeight(snap);
    // y represents offset from full height position. Higher y = smaller drawer.
    const targetY = vh - targetHeight;
    animate(y, targetY, { type: 'spring', stiffness: 400, damping: 40 });
    setCurrentSnap(snap);
    onSnapChange?.(snap);
  }, [y, getSnapHeight, getViewportHeight, onSnapChange]);

  // Initialize position
  useEffect(() => {
    const vh = getViewportHeight();
    y.set(vh - PEEK_HEIGHT);
  }, [y, getViewportHeight]);

  // React to parent snap requests
  useEffect(() => {
    if (snapTo && snapTo !== currentSnap) {
      animateToSnap(snapTo);
    }
  }, [snapTo]);

  // Drag end handler — snap to nearest point
  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const vh = getViewportHeight();
    const currentY = y.get();
    const velocity = info.velocity.y;

    // If flicked fast, go in that direction
    if (Math.abs(velocity) > 500) {
      if (velocity > 0) {
        // Flicked down
        if (currentSnap === 'full') animateToSnap('half');
        else animateToSnap('peek');
      } else {
        // Flicked up
        if (currentSnap === 'peek') animateToSnap('half');
        else animateToSnap('full');
      }
      return;
    }

    // Otherwise snap to nearest
    const currentHeight = vh - currentY;
    const peekH = getSnapHeight('peek');
    const halfH = getSnapHeight('half');
    const fullH = getSnapHeight('full');

    const distances = [
      { snap: 'peek' as SnapPoint, d: Math.abs(currentHeight - peekH) },
      { snap: 'half' as SnapPoint, d: Math.abs(currentHeight - halfH) },
      { snap: 'full' as SnapPoint, d: Math.abs(currentHeight - fullH) },
    ];
    distances.sort((a, b) => a.d - b.d);
    animateToSnap(distances[0].snap);
  };

  const handleInputFocus = () => {
    if (currentSnap === 'peek') {
      animateToSnap('half');
    }
  };

  const handleSubmitAndExpand = () => {
    onSubmitComment();
    if (currentSnap === 'peek') {
      animateToSnap('half');
    }
  };

  const commentCount = timeline.filter((item) => item.type === 'comment').length;
  const canAnnotate = supportsSpatialAnnotations(assetType);

  return (
    <motion.div
      ref={containerRef}
      className="fixed inset-x-0 bottom-0 z-40 lg:hidden"
      style={{ y, height: '100dvh' }}
      drag="y"
      dragConstraints={{
        top: getViewportHeight() - getSnapHeight('full'),
        bottom: getViewportHeight() - getSnapHeight('peek'),
      }}
      dragElastic={0.1}
      dragMomentum={false}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-t-2xl shadow-2xl border-t border-gray-200 dark:border-gray-700">
        {/* Drag handle */}
        <div className="flex items-center justify-center pt-2 pb-1 cursor-grab active:cursor-grabbing"
          style={{ height: HANDLE_HEIGHT, touchAction: 'none' }}
        >
          <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
        </div>

        {/* Peek state: just the comment input bar */}
        {currentSnap === 'peek' && (
          <div className="px-3 pb-2 flex items-center gap-2">
            <button
              onClick={() => animateToSnap('half')}
              className="flex-1 flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-500 dark:text-gray-400"
            >
              <MessageSquare className="w-4 h-4" />
              Add a comment...
              {commentCount > 0 && (
                <span className="ml-auto text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-1.5 py-0.5 rounded-full">
                  {commentCount}
                </span>
              )}
            </button>
            {canAnnotate && (
              <button
                onClick={onStartAnnotation}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 active:scale-95 transition-transform"
                title="Add annotation"
              >
                <MapPin className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Expanded state: tabs + content */}
        {currentSnap !== 'peek' && (
          <>
            {/* Tab bar */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 px-4">
              <button
                onClick={() => setActiveTab('comments')}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'comments'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                Comments
                {commentCount > 0 && (
                  <span className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full">
                    {commentCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('versions')}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'versions'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400'
                }`}
              >
                <Layers className="w-4 h-4" />
                Versions
              </button>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto overscroll-contain" style={{ touchAction: 'pan-y' }}>
              {activeTab === 'comments' && (
                <ActivityPanel
                  timeline={timeline}
                  selectedVersion={selectedVersion}
                  assetType={assetType}
                  assetId={assetId}
                  selectedCommentId={selectedCommentId}
                  selectedRect={selectedRect}
                  selectedTextAnchor={selectedTextAnchor}
                  newComment={newComment}
                  showAllVersionsComments={showAllVersionsComments}
                  pendingImages={pendingImages}
                  onCommentChange={onCommentChange}
                  onPendingImagesChange={onPendingImagesChange}
                  onSubmitComment={handleSubmitAndExpand}
                  onClearAnnotation={onClearAnnotation}
                  onCommentClick={onCommentClick}
                  onDeleteComment={onDeleteComment}
                  onResolveComment={onResolveComment}
                  onToggleShowAllVersions={onToggleShowAllVersions}
                  onSubmitReply={onSubmitReply}
                  onToggleReaction={onToggleReaction}
                  getCommentActions={getCommentActions}
                  isMobile
                  onAnnotateClick={canAnnotate ? onStartAnnotation : undefined}
                  onInputFocus={handleInputFocus}
                />
              )}
              {activeTab === 'versions' && (
                <div className="bg-gray-900 min-h-full">
                  <VersionTimeline
                    assetId={assetId}
                    onVersionSelect={onVersionSelect}
                    currentVersion={selectedVersion}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};
