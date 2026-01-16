import { FC, useCallback } from 'react';
import { AssetRendererProps } from '../../types/assetTypes';

export const VideoRenderer: FC<AssetRendererProps> = ({
  fileUrl,
  mediaRef,
  onLoad,
  onTimeUpdate,
  onDurationChange,
  onPlayChange,
}) => {
  const handleTimeUpdate = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    onTimeUpdate?.(e.currentTarget.currentTime);
  }, [onTimeUpdate]);

  const handleLoadedMetadata = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    onDurationChange?.(e.currentTarget.duration);
    onLoad?.();
  }, [onDurationChange, onLoad]);

  const handlePlay = useCallback(() => {
    onPlayChange?.(true);
  }, [onPlayChange]);

  const handlePause = useCallback(() => {
    onPlayChange?.(false);
  }, [onPlayChange]);

  // Use mediaRef directly - it will hold the video element
  return (
    <video
      ref={mediaRef as React.RefObject<HTMLVideoElement>}
      src={fileUrl}
      className="max-w-full max-h-full object-contain"
      onTimeUpdate={handleTimeUpdate}
      onLoadedMetadata={handleLoadedMetadata}
      onPlay={handlePlay}
      onPause={handlePause}
    />
  );
};
