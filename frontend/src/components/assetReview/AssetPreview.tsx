import { FC, RefObject } from 'react';
import { Asset, AssetVersion, Comment } from '../../types';
import {
  getAssetTypeHandler,
  supportsSpatialAnnotations,
  getMediaUrlForType,
} from '../../config/assetTypeRegistry';
import { AnnotationOverlay, PdfControls } from '../assetRenderers';
import { Rectangle } from '../../hooks/useAssetReviewState';
import { VersionSelector } from './VersionSelector';
import { AssetRendererProps } from '../../types/assetTypes';

interface AssetPreviewProps {
  asset: Asset;
  currentVersionData: AssetVersion | undefined;
  containerRef: RefObject<HTMLDivElement | null>;
  mediaRef: RefObject<HTMLImageElement | HTMLVideoElement | null>;
  mediaBounds: DOMRect | null;
  selectedVersion: number;

  // Drawing state
  isDrawing: boolean;
  currentRect: Rectangle | null;
  selectedRect: Rectangle | null;
  selectedCommentId: string | null;

  // Video state
  currentTime: number;
  isPlaying: boolean;
  duration: number;

  // PDF state
  currentPage: number;
  totalPages: number;
  zoomLevel: number;
  pdfFitMode: 'width' | 'height' | 'none';

  // Callbacks
  onMediaLoad: () => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
  onPlayChange: (isPlaying: boolean) => void;
  onPageChange: (page: number) => void;
  onTotalPagesChange: (totalPages: number) => void;
  onZoomChange: (zoom: number) => void;
  onFitModeChange: (mode: 'width' | 'height' | 'none') => void;
  onCommentClick: (commentId: string, videoTimestamp: number | null, pageNumber: number | null) => void;

  // Comments for annotation display
  comments: Comment[];

  // Video control refs
  isScrubbingRef: React.MutableRefObject<boolean>;
  scrubTimeRef: React.MutableRefObject<number>;

  // Version selection
  onVersionSelect: (version: number) => void;
}

/**
 * Asset preview component with dynamic renderer and annotation overlay.
 * Handles all media rendering and annotation display/interaction.
 */
export const AssetPreview: FC<AssetPreviewProps> = ({
  asset,
  currentVersionData,
  containerRef,
  mediaRef,
  mediaBounds,
  selectedVersion,
  isDrawing,
  currentRect,
  selectedRect,
  selectedCommentId,
  currentTime,
  isPlaying,
  duration,
  currentPage,
  totalPages,
  zoomLevel,
  pdfFitMode,
  onMediaLoad,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseLeave,
  onTimeUpdate,
  onDurationChange,
  onPlayChange,
  onPageChange,
  onTotalPagesChange,
  onZoomChange,
  onFitModeChange,
  onCommentClick,
  comments,
  isScrubbingRef,
  scrubTimeRef,
  onVersionSelect,
}) => {
  const handler = getAssetTypeHandler(asset.type);

  // Prepare comments for annotation overlay
  const annotationComments = comments.map((comment) => ({
    id: comment.id,
    rectangle: comment.rectangle,
    video_timestamp: comment.video_timestamp,
    page_number: comment.page_number,
    is_resolved: comment.is_resolved,
    asset_version: comment.asset_version,
  }));

  return (
    <div className="flex-1 flex flex-col bg-gray-900 relative">
      <div
        ref={containerRef}
        className="flex-1 relative cursor-crosshair overflow-hidden flex items-center justify-center"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
      >
        {/* Dynamic renderer from registry */}
        {currentVersionData && handler && (() => {
          const Renderer = handler.Renderer;
          const mediaUrl = getMediaUrlForType(currentVersionData.file_url, asset.type);

          // Base props for all renderers
          const baseProps: AssetRendererProps = {
            fileUrl: mediaUrl,
            title: asset.title,
            mediaRef: mediaRef,
            onLoad: onMediaLoad,
          };

          // Add video-specific props
          if (asset.type === 'video') {
            return (
              <Renderer
                {...baseProps}
                currentTime={currentTime}
                onTimeUpdate={onTimeUpdate}
                onDurationChange={onDurationChange}
                onPlayChange={onPlayChange}
              />
            );
          }

          // Add PDF-specific props (cast needed for extended props)
          if (asset.type === 'pdf') {
            const PdfRendererComponent = Renderer as FC<AssetRendererProps & {
              currentPage?: number;
              zoomLevel?: number;
              fitMode?: 'width' | 'height' | 'none';
              onPageChange?: (page: number) => void;
              onTotalPagesChange?: (totalPages: number) => void;
              overlay?: React.ReactNode;
            }>;
            // PDF annotation overlay is rendered inside PdfRenderer so it scrolls with the page
            const pdfOverlay = (
              <AnnotationOverlay
                mediaBounds={null}
                containerRef={containerRef}
                currentRect={currentRect}
                selectedRect={selectedRect}
                selectedCommentId={selectedCommentId}
                comments={annotationComments}
                selectedVersion={selectedVersion}
                assetType={asset.type}
                currentTime={currentTime}
                currentPage={currentPage}
                onCommentClick={onCommentClick}
                fillContainer={true}
              />
            );
            return (
              <PdfRendererComponent
                {...baseProps}
                currentPage={currentPage}
                zoomLevel={zoomLevel}
                fitMode={pdfFitMode}
                onPageChange={onPageChange}
                onTotalPagesChange={onTotalPagesChange}
                overlay={pdfOverlay}
              />
            );
          }

          // Default rendering for other types
          return <Renderer {...baseProps} />;
        })()}

        {/* Annotation overlay - only show for types that support spatial annotations (except PDF which renders its own) */}
        {supportsSpatialAnnotations(asset.type) && asset.type !== 'pdf' && (
          <AnnotationOverlay
            mediaBounds={mediaBounds}
            containerRef={containerRef}
            currentRect={currentRect}
            selectedRect={selectedRect}
            selectedCommentId={selectedCommentId}
            comments={annotationComments}
            selectedVersion={selectedVersion}
            assetType={asset.type}
            currentTime={currentTime}
            currentPage={currentPage}
            onCommentClick={onCommentClick}
          />
        )}
      </div>

      {/* Controls from registry (e.g., video controls, PDF controls) */}
      {handler?.Controls && asset.type === 'video' && (
        <handler.Controls
          videoRef={mediaRef as React.RefObject<HTMLVideoElement | null>}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          setCurrentTime={onTimeUpdate}
          isScrubbingRef={isScrubbingRef}
          scrubTimeRef={scrubTimeRef}
        />
      )}
      {asset.type === 'pdf' && (
        <PdfControls
          currentPage={currentPage}
          totalPages={totalPages}
          zoomLevel={zoomLevel}
          fitMode={pdfFitMode}
          onPageChange={onPageChange}
          onZoomChange={onZoomChange}
          onFitModeChange={onFitModeChange}
        />
      )}

      {/* Version Selector */}
      {asset.versions && asset.versions.length > 1 && (
        <VersionSelector
          versions={asset.versions}
          selectedVersion={selectedVersion}
          currentVersion={asset.current_version}
          onVersionSelect={onVersionSelect}
        />
      )}
    </div>
  );
};
