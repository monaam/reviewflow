import { FC, useRef, useCallback, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { VideoControlsProps } from '../../types/assetTypes';

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export const VideoControls: FC<VideoControlsProps> = ({
  videoRef,
  isPlaying,
  currentTime,
  duration,
  setCurrentTime,
  isScrubbingRef,
  scrubTimeRef,
}) => {
  const progressBarRef = useRef<HTMLDivElement>(null);

  const calculateTimeFromEvent = useCallback((clientX: number) => {
    if (!progressBarRef.current || !duration) return 0;
    const rect = progressBarRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return percent * duration;
  }, [duration]);

  const handleScrubStart = useCallback((clientX: number) => {
    isScrubbingRef.current = true;
    const time = calculateTimeFromEvent(clientX);
    scrubTimeRef.current = time;
    setCurrentTime(time);
  }, [calculateTimeFromEvent, isScrubbingRef, scrubTimeRef, setCurrentTime]);

  const handleScrubMove = useCallback((clientX: number) => {
    if (!isScrubbingRef.current) return;
    const time = calculateTimeFromEvent(clientX);
    scrubTimeRef.current = time;
    setCurrentTime(time);
  }, [calculateTimeFromEvent, isScrubbingRef, scrubTimeRef, setCurrentTime]);

  const handleScrubEnd = useCallback(() => {
    if (!isScrubbingRef.current) return;
    isScrubbingRef.current = false;
    if (videoRef.current) {
      videoRef.current.currentTime = scrubTimeRef.current;
      videoRef.current.pause();
    }
  }, [isScrubbingRef, scrubTimeRef, videoRef]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => handleScrubMove(e.clientX);
    const handleMouseUp = () => handleScrubEnd();
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) handleScrubMove(e.touches[0].clientX);
    };
    const handleTouchEnd = () => handleScrubEnd();

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleScrubMove, handleScrubEnd]);

  const progress = duration ? (currentTime / duration) * 100 : 0;

  const togglePlayback = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  return (
    <div className="p-4 bg-gray-800 flex items-center gap-4 relative z-20">
      <button
        onClick={togglePlayback}
        className="p-2 hover:bg-gray-700 rounded"
      >
        {isPlaying ? (
          <Pause className="w-5 h-5 text-white" />
        ) : (
          <Play className="w-5 h-5 text-white" />
        )}
      </button>
      <div
        ref={progressBarRef}
        className="flex-1 relative h-6 flex items-center cursor-pointer group"
        onMouseDown={(e) => handleScrubStart(e.clientX)}
        onTouchStart={(e) => {
          if (e.touches.length > 0) handleScrubStart(e.touches[0].clientX);
        }}
      >
        <div className="absolute inset-x-0 h-1 bg-gray-600 rounded-full group-hover:h-2 transition-all">
          <div
            className="h-full bg-primary-500 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div
          className="absolute w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `calc(${progress}% - 6px)` }}
        />
      </div>
      <span className="text-white text-sm whitespace-nowrap">
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>
    </div>
  );
};
