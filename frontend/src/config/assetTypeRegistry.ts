import { FileImage, Film, FileText, FileQuestion } from 'lucide-react';
import { AssetTypeHandler } from '../types/assetTypes';
import {
  ImageRenderer,
  VideoRenderer,
  PdfRenderer,
  DesignRenderer,
  VideoControls,
} from '../components/assetRenderers';
import { getVideoStreamUrl } from '../utils/media';

/**
 * Registry of all asset type handlers.
 * To add a new asset type, add a new entry to this registry.
 */
export const assetTypeRegistry: Record<string, AssetTypeHandler> = {
  image: {
    type: 'image',
    displayName: 'Image',
    icon: FileImage,
    mimePatterns: ['image/'],
    extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff'],
    annotations: {
      supportsSpatialAnnotations: true,
      supportsTemporalAnnotations: false,
    },
    Renderer: ImageRenderer,
    supportsThumbnail: true,
  },

  video: {
    type: 'video',
    displayName: 'Video',
    icon: Film,
    mimePatterns: ['video/'],
    extensions: ['mp4', 'mov', 'webm', 'avi', 'mkv', 'wmv', 'm4v'],
    annotations: {
      supportsSpatialAnnotations: true,
      supportsTemporalAnnotations: true,
    },
    Renderer: VideoRenderer,
    Controls: VideoControls,
    getMediaUrl: getVideoStreamUrl,
    supportsThumbnail: true,
  },

  pdf: {
    type: 'pdf',
    displayName: 'PDF Document',
    icon: FileText,
    mimePatterns: ['application/pdf'],
    extensions: ['pdf'],
    annotations: {
      supportsSpatialAnnotations: false,
      supportsTemporalAnnotations: false,
    },
    Renderer: PdfRenderer,
    supportsThumbnail: false,
  },

  design: {
    type: 'design',
    displayName: 'Design File',
    icon: FileQuestion,
    mimePatterns: [
      'application/postscript',
      'application/illustrator',
      'application/x-photoshop',
      'image/vnd.adobe.photoshop',
      'application/x-indesign',
      'application/sketch',
      'application/figma',
    ],
    extensions: ['ai', 'psd', 'eps', 'indd', 'sketch', 'fig', 'xd'],
    annotations: {
      supportsSpatialAnnotations: false,
      supportsTemporalAnnotations: false,
    },
    Renderer: DesignRenderer,
    supportsThumbnail: false,
  },
};

/**
 * Get the handler for a specific asset type.
 */
export function getAssetTypeHandler(type: string): AssetTypeHandler | undefined {
  return assetTypeRegistry[type];
}

/**
 * Check if an asset type supports spatial annotations.
 */
export function supportsSpatialAnnotations(type: string): boolean {
  const handler = getAssetTypeHandler(type);
  return handler?.annotations.supportsSpatialAnnotations ?? false;
}

/**
 * Check if an asset type supports temporal annotations.
 */
export function supportsTemporalAnnotations(type: string): boolean {
  const handler = getAssetTypeHandler(type);
  return handler?.annotations.supportsTemporalAnnotations ?? false;
}

/**
 * Check if an asset type supports any kind of annotation.
 */
export function supportsAnnotations(type: string): boolean {
  return supportsSpatialAnnotations(type) || supportsTemporalAnnotations(type);
}

/**
 * Get the icon component for an asset type.
 */
export function getAssetTypeIcon(type: string) {
  const handler = getAssetTypeHandler(type);
  return handler?.icon ?? FileQuestion;
}

/**
 * Get the display name for an asset type.
 */
export function getAssetTypeDisplayName(type: string): string {
  const handler = getAssetTypeHandler(type);
  return handler?.displayName ?? type;
}

/**
 * Check if an asset type supports thumbnail preview.
 */
export function supportsThumbnail(type: string): boolean {
  const handler = getAssetTypeHandler(type);
  return handler?.supportsThumbnail ?? false;
}

/**
 * Get the appropriate media URL for an asset type.
 */
export function getMediaUrlForType(url: string, type: string): string {
  if (!url) return url;

  const handler = getAssetTypeHandler(type);
  if (handler?.getMediaUrl) {
    return handler.getMediaUrl(url);
  }

  return url;
}

/**
 * Get all registered asset types.
 */
export function getAllAssetTypes(): string[] {
  return Object.keys(assetTypeRegistry);
}

/**
 * Determine asset type from file MIME type or extension.
 * This is a client-side helper for upload previews.
 */
export function determineAssetType(mimeType: string, extension: string): string {
  const ext = extension.toLowerCase().replace('.', '');

  for (const handler of Object.values(assetTypeRegistry)) {
    // Check MIME patterns
    for (const pattern of handler.mimePatterns) {
      if (pattern.endsWith('/')) {
        if (mimeType.startsWith(pattern)) {
          return handler.type;
        }
      } else if (mimeType === pattern) {
        return handler.type;
      }
    }

    // Check extensions
    if (handler.extensions.includes(ext)) {
      return handler.type;
    }
  }

  // Fallback to design for unknown types
  return 'design';
}
