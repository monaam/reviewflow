const API_BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || '';

/**
 * Converts a storage URL to the correct format for the current environment.
 * In development, uses relative paths for Vite proxy.
 * In production, uses the full API URL.
 *
 * Dev: /storage/assets/uuid/file.pdf (proxied to localhost:8000)
 * Prod: https://api.example.com/storage/assets/uuid/file.pdf
 */
export function toRelativeStorageUrl(url: string): string {
  if (!url) return url;

  // Extract the path starting from /storage/
  const storageIndex = url.indexOf('/storage/');
  if (storageIndex !== -1) {
    const storagePath = url.substring(storageIndex);
    // In production (when API_BASE_URL is set), use full URL
    // In development, use relative path for Vite proxy
    return API_BASE_URL ? `${API_BASE_URL}${storagePath}` : storagePath;
  }

  return url;
}

/**
 * Converts a storage URL to a streaming URL for video files.
 * This enables HTTP range requests for seeking in HTML5 video elements.
 *
 * Dev: /api/stream/assets/uuid/video.mp4 (proxied)
 * Prod: https://api.example.com/api/stream/assets/uuid/video.mp4
 */
export function getVideoStreamUrl(storageUrl: string): string {
  if (!storageUrl) return storageUrl;

  // Extract the path and replace /storage/ with /api/stream/
  const storageIndex = storageUrl.indexOf('/storage/');
  if (storageIndex !== -1) {
    const streamPath = storageUrl.substring(storageIndex).replace('/storage/', '/api/stream/');
    return API_BASE_URL ? `${API_BASE_URL}${streamPath}` : streamPath;
  }

  return storageUrl;
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
