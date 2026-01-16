/**
 * Converts an absolute storage URL to a relative path.
 * This allows the Vite proxy to handle the request during development.
 *
 * Absolute URL: http://localhost:8000/storage/assets/uuid/file.pdf
 * Relative URL: /storage/assets/uuid/file.pdf
 */
export function toRelativeStorageUrl(url: string): string {
  if (!url) return url;

  // Extract the path starting from /storage/
  const storageIndex = url.indexOf('/storage/');
  if (storageIndex !== -1) {
    return url.substring(storageIndex);
  }

  return url;
}

/**
 * Converts a storage URL to a streaming URL for video files.
 * This enables HTTP range requests for seeking in HTML5 video elements.
 *
 * Storage URL: http://localhost:8000/storage/assets/uuid/video.mp4
 * Stream URL:  http://localhost:8000/api/stream/assets/uuid/video.mp4
 */
export function getVideoStreamUrl(storageUrl: string): string {
  if (!storageUrl) return storageUrl;

  // Replace /storage/ with /api/stream/
  return storageUrl.replace('/storage/', '/api/stream/');
}

/**
 * Returns the appropriate URL for media based on type.
 * Videos use streaming URL for range request support.
 * Other types use the regular storage URL.
 *
 * @deprecated Use getMediaUrlForType from '../config/assetTypeRegistry' instead
 * for registry-based URL transformation.
 */
export function getMediaUrl(url: string, type: string): string {
  if (!url) return url;

  // Video types need streaming URL
  if (type === 'video') {
    return getVideoStreamUrl(url);
  }

  return url;
}
