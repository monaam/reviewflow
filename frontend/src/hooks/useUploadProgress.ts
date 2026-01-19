import { useState, useCallback, useRef } from 'react';
import { AxiosProgressEvent } from 'axios';

export interface UploadProgress {
  /** Upload progress percentage (0-100) */
  progress: number;
  /** Bytes uploaded so far */
  loaded: number;
  /** Total bytes to upload */
  total: number;
  /** Whether upload is currently in progress */
  isUploading: boolean;
  /** Estimated upload speed in bytes per second */
  speed: number;
  /** Estimated time remaining in seconds */
  timeRemaining: number;
}

export interface UseUploadProgressReturn {
  uploadProgress: UploadProgress;
  /** Callback to pass to axios onUploadProgress */
  onUploadProgress: (event: AxiosProgressEvent) => void;
  /** Start tracking a new upload */
  startUpload: () => void;
  /** Reset upload progress state */
  resetUpload: () => void;
}

const initialProgress: UploadProgress = {
  progress: 0,
  loaded: 0,
  total: 0,
  isUploading: false,
  speed: 0,
  timeRemaining: 0,
};

/**
 * Hook for tracking file upload progress with speed and time estimates.
 * Returns progress state and handlers to integrate with axios uploads.
 */
export function useUploadProgress(): UseUploadProgressReturn {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>(initialProgress);
  const startTimeRef = useRef<number>(0);
  const lastLoadedRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const startUpload = useCallback(() => {
    startTimeRef.current = Date.now();
    lastLoadedRef.current = 0;
    lastTimeRef.current = Date.now();
    setUploadProgress({
      ...initialProgress,
      isUploading: true,
    });
  }, []);

  const resetUpload = useCallback(() => {
    setUploadProgress(initialProgress);
  }, []);

  const onUploadProgress = useCallback((event: AxiosProgressEvent) => {
    const now = Date.now();
    const loaded = event.loaded;
    const total = event.total || 0;
    const progress = total > 0 ? Math.round((loaded / total) * 100) : 0;

    // Calculate speed based on recent progress
    const timeDelta = (now - lastTimeRef.current) / 1000; // seconds
    const loadedDelta = loaded - lastLoadedRef.current;

    // Update speed every 100ms to smooth out fluctuations
    let speed = uploadProgress.speed;
    if (timeDelta >= 0.1) {
      speed = loadedDelta / timeDelta;
      lastLoadedRef.current = loaded;
      lastTimeRef.current = now;
    }

    // Calculate time remaining
    const remaining = total - loaded;
    const timeRemaining = speed > 0 ? remaining / speed : 0;

    setUploadProgress({
      progress,
      loaded,
      total,
      isUploading: true,
      speed,
      timeRemaining,
    });
  }, [uploadProgress.speed]);

  return {
    uploadProgress,
    onUploadProgress,
    startUpload,
    resetUpload,
  };
}
