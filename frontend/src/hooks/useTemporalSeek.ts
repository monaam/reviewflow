import { RefObject, useCallback } from 'react';
import { supportsTemporalAnnotations } from '../config/assetTypeRegistry';
import { ANNOTATION_SHOW_BEFORE } from '../components/assetRenderers';

interface UseTemporalSeekOptions {
  mediaRef: RefObject<HTMLElement | null>;
  assetType: string;
  onTimeChange?: (time: number) => void;
}

interface UseTemporalSeekResult {
  /**
   * Seeks to a timestamp, accounting for annotation visibility window.
   * Pauses media and seeks to (timestamp - ANNOTATION_SHOW_BEFORE).
   */
  seekToTimestamp: (timestamp: number | null) => void;
  /**
   * Seeks to an exact time without offset.
   */
  seekToTime: (time: number) => void;
  /**
   * Whether the current asset type supports temporal seeking.
   */
  canSeek: boolean;
}

/**
 * Hook for handling temporal (time-based) seeking in media elements.
 * Centralizes the logic for video/audio timestamp navigation.
 */
export function useTemporalSeek({
  mediaRef,
  assetType,
  onTimeChange,
}: UseTemporalSeekOptions): UseTemporalSeekResult {
  const canSeek = supportsTemporalAnnotations(assetType);

  const seekToTime = useCallback(
    (time: number) => {
      const media = mediaRef.current as HTMLVideoElement | HTMLAudioElement | null;
      if (!media || !canSeek) return;

      media.pause();
      media.currentTime = time;
      onTimeChange?.(time);
    },
    [mediaRef, canSeek, onTimeChange]
  );

  const seekToTimestamp = useCallback(
    (timestamp: number | null) => {
      if (timestamp === null || !canSeek) return;

      // Seek to the start of the annotation visibility window
      const seekTime = Math.max(0, timestamp - ANNOTATION_SHOW_BEFORE);
      seekToTime(seekTime);
    },
    [canSeek, seekToTime]
  );

  return {
    seekToTimestamp,
    seekToTime,
    canSeek,
  };
}
