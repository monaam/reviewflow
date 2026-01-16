import { FC } from 'react';
import { AnnotationOverlayProps, Rectangle } from '../../types/assetTypes';

// Video annotation timing configuration (in seconds)
const ANNOTATION_SHOW_BEFORE = 1; // How long before the timestamp to start showing
const ANNOTATION_SHOW_AFTER = 1;  // How long after the timestamp to keep showing

interface AnnotationRectProps {
  rect: Rectangle;
  isSelected: boolean;
  isResolved: boolean;
  onClick: (e: React.MouseEvent) => void;
}

const AnnotationRect: FC<AnnotationRectProps> = ({
  rect,
  isSelected,
  isResolved,
  onClick,
}) => {
  const baseClass = isSelected
    ? 'border-primary-500 bg-primary-500/30'
    : isResolved
    ? 'border-green-500 bg-green-500/20'
    : 'border-yellow-500 bg-yellow-500/20';

  return (
    <div
      className={`absolute border-2 cursor-pointer pointer-events-auto transition-all duration-300 ${baseClass}`}
      style={{
        left: `${rect.x * 100}%`,
        top: `${rect.y * 100}%`,
        width: `${rect.width * 100}%`,
        height: `${rect.height * 100}%`,
      }}
      onClick={onClick}
    />
  );
};

export const AnnotationOverlay: FC<AnnotationOverlayProps> = ({
  mediaBounds,
  containerRef,
  currentRect,
  selectedRect,
  selectedCommentId,
  comments,
  selectedVersion,
  assetType,
  currentTime,
  onCommentClick,
}) => {
  if (!mediaBounds || !containerRef.current) {
    return null;
  }

  const containerRect = containerRef.current.getBoundingClientRect();

  // Filter comments to show based on version and timing
  const visibleComments = comments
    .filter((c) => c.rectangle && c.asset_version === selectedVersion)
    .filter((c) => {
      // For videos, only show annotations within the configured time window
      if (assetType === 'video' && c.video_timestamp !== null) {
        const timeDiff = currentTime - c.video_timestamp;
        return timeDiff >= -ANNOTATION_SHOW_BEFORE && timeDiff <= ANNOTATION_SHOW_AFTER;
      }
      // For non-video assets or comments without timestamp, always show
      return true;
    });

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: mediaBounds.left - containerRect.left,
        top: mediaBounds.top - containerRect.top,
        width: mediaBounds.width,
        height: mediaBounds.height,
      }}
    >
      {/* Drawing rectangle (in progress) */}
      {currentRect && (
        <div
          className="absolute border-2 border-primary-500 bg-primary-500/20"
          style={{
            left: `${Math.min(currentRect.x, currentRect.x + currentRect.width) * 100}%`,
            top: `${Math.min(currentRect.y, currentRect.y + currentRect.height) * 100}%`,
            width: `${Math.abs(currentRect.width) * 100}%`,
            height: `${Math.abs(currentRect.height) * 100}%`,
          }}
        />
      )}

      {/* Selected rectangle (ready to submit) */}
      {selectedRect && (
        <div
          className="absolute border-2 border-green-500 bg-green-500/20"
          style={{
            left: `${selectedRect.x * 100}%`,
            top: `${selectedRect.y * 100}%`,
            width: `${selectedRect.width * 100}%`,
            height: `${selectedRect.height * 100}%`,
          }}
        />
      )}

      {/* Comment rectangles */}
      {visibleComments.map((comment) => (
        <AnnotationRect
          key={comment.id}
          rect={comment.rectangle!}
          isSelected={selectedCommentId === comment.id}
          isResolved={comment.is_resolved}
          onClick={(e) => {
            e.stopPropagation();
            onCommentClick(comment.id, comment.video_timestamp);
          }}
        />
      ))}
    </div>
  );
};

// Export the timing constants for use in other components
export { ANNOTATION_SHOW_BEFORE, ANNOTATION_SHOW_AFTER };
