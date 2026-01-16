import { FC, RefObject } from 'react';
import { LucideIcon } from 'lucide-react';

/**
 * Props passed to all asset renderer components.
 */
export interface AssetRendererProps {
  fileUrl: string;
  title: string;
  mediaRef: RefObject<HTMLElement | null>;
  onLoad?: () => void;
  // Video-specific props
  currentTime?: number;
  onTimeUpdate?: (time: number) => void;
  onDurationChange?: (duration: number) => void;
  onPlayChange?: (isPlaying: boolean) => void;
}

/**
 * Props for video control components.
 */
export interface VideoControlsProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  setCurrentTime: (time: number) => void;
  isScrubbingRef: React.MutableRefObject<boolean>;
  scrubTimeRef: React.MutableRefObject<number>;
}

/**
 * PDF fit modes for zoom behavior.
 */
export type PdfFitMode = 'width' | 'height' | 'none';

/**
 * Props for PDF control components.
 */
export interface PdfControlsProps {
  currentPage: number;
  totalPages: number;
  zoomLevel: number;
  fitMode: PdfFitMode;
  onPageChange: (page: number) => void;
  onZoomChange: (zoom: number) => void;
  onFitModeChange: (mode: PdfFitMode) => void;
}

/**
 * Annotation capability configuration.
 */
export interface AnnotationCapabilities {
  /** Whether this type supports position-based annotations (x, y, width, height) */
  supportsSpatialAnnotations: boolean;
  /** Whether this type supports time-based annotations */
  supportsTemporalAnnotations: boolean;
}

/**
 * Configuration for an asset type handler.
 */
export interface AssetTypeHandler {
  /** Unique type identifier (e.g., 'image', 'video') */
  type: string;
  /** Human-readable display name */
  displayName: string;
  /** Icon component for this type */
  icon: LucideIcon;
  /** MIME type patterns this handler supports */
  mimePatterns: string[];
  /** Supported file extensions */
  extensions: string[];
  /** Annotation capabilities */
  annotations: AnnotationCapabilities;
  /** The main renderer component */
  Renderer: FC<AssetRendererProps>;
  /** Optional controls component (e.g., video playback controls) */
  Controls?: FC<VideoControlsProps>;
  /** Transform storage URL to appropriate media URL */
  getMediaUrl?: (storageUrl: string) => string;
  /** Whether this type supports thumbnail preview */
  supportsThumbnail: boolean;
}

/**
 * Rectangle for spatial annotations.
 */
export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Props for the annotation overlay component.
 */
export interface AnnotationOverlayProps {
  mediaBounds: DOMRect | null;
  containerRef: RefObject<HTMLDivElement | null>;
  currentRect: Rectangle | null;
  selectedRect: Rectangle | null;
  selectedCommentId: string | null;
  comments: Array<{
    id: string;
    rectangle: Rectangle | null;
    video_timestamp: number | null;
    page_number: number | null;
    is_resolved: boolean;
    asset_version: number;
  }>;
  selectedVersion: number;
  assetType: string;
  currentTime: number;
  currentPage: number;
  onCommentClick: (commentId: string, videoTimestamp: number | null, pageNumber: number | null) => void;
  /** When true, fills parent container instead of using mediaBounds (used for PDF) */
  fillContainer?: boolean;
}
