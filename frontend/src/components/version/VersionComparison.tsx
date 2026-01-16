import { useState, useRef, useEffect, useCallback } from 'react';
import { X, ArrowLeftRight, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { AssetVersion, AssetType } from '../../types';
import {
  getAssetTypeHandler,
  getMediaUrlForType,
  supportsTemporalAnnotations,
} from '../../config/assetTypeRegistry';

// Sync tolerance in seconds - videos will sync if they drift more than this
const SYNC_TOLERANCE = 0.1;

interface VersionComparisonProps {
  versions: AssetVersion[];
  assetType: AssetType;
  initialLeftVersion?: number;
  initialRightVersion?: number;
  onClose: () => void;
}

export default function VersionComparison({
  versions,
  assetType,
  initialLeftVersion,
  initialRightVersion,
  onClose,
}: VersionComparisonProps) {
  const sortedVersions = [...versions].sort((a, b) => a.version_number - b.version_number);

  const [leftVersion, setLeftVersion] = useState<number>(
    initialLeftVersion ?? (sortedVersions.length > 1 ? sortedVersions[sortedVersions.length - 2].version_number : 1)
  );
  const [rightVersion, setRightVersion] = useState<number>(
    initialRightVersion ?? sortedVersions[sortedVersions.length - 1].version_number
  );

  const [syncPlayback, setSyncPlayback] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  const leftVideoRef = useRef<HTMLVideoElement>(null);
  const rightVideoRef = useRef<HTMLVideoElement>(null);

  const leftAsset = versions.find(v => v.version_number === leftVersion);
  const rightAsset = versions.find(v => v.version_number === rightVersion);

  // Track if we're currently syncing to prevent infinite loops
  const isSyncingRef = useRef(false);

  const swapVersions = () => {
    const temp = leftVersion;
    setLeftVersion(rightVersion);
    setRightVersion(temp);
  };

  // Pause both videos
  const pauseBoth = useCallback(() => {
    leftVideoRef.current?.pause();
    rightVideoRef.current?.pause();
    setIsPlaying(false);
  }, []);

  // Play both videos in sync
  const playBoth = useCallback(async () => {
    const leftVideo = leftVideoRef.current;
    const rightVideo = rightVideoRef.current;
    if (!leftVideo || !rightVideo) return;

    // Sync times before playing
    const targetTime = leftVideo.currentTime;
    if (Math.abs(rightVideo.currentTime - targetTime) > SYNC_TOLERANCE) {
      rightVideo.currentTime = targetTime;
    }

    // Wait for both to be ready
    try {
      await Promise.all([leftVideo.play(), rightVideo.play()]);
      setIsPlaying(true);
    } catch {
      // If one fails to play, pause both
      pauseBoth();
    }
  }, [pauseBoth]);

  // Synced video playback with robust event handling
  useEffect(() => {
    if (!supportsTemporalAnnotations(assetType) || !syncPlayback) return;

    const leftVideo = leftVideoRef.current;
    const rightVideo = rightVideoRef.current;

    if (!leftVideo || !rightVideo) return;

    // When one video is waiting (buffering), pause the other
    const handleWaiting = (other: HTMLVideoElement) => () => {
      if (!other.paused && !isSyncingRef.current) {
        other.pause();
      }
    };

    // When one video starts playing, sync and play the other
    const handlePlay = (source: HTMLVideoElement, other: HTMLVideoElement) => () => {
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;

      // Sync time
      if (Math.abs(other.currentTime - source.currentTime) > SYNC_TOLERANCE) {
        other.currentTime = source.currentTime;
      }

      // Play the other if paused
      if (other.paused) {
        other.play().catch(() => {
          // If other can't play, pause source too
          source.pause();
        });
      }

      setIsPlaying(true);
      isSyncingRef.current = false;
    };

    // When one video pauses, pause the other
    const handlePause = (other: HTMLVideoElement) => () => {
      if (!isSyncingRef.current && !other.paused) {
        isSyncingRef.current = true;
        other.pause();
        setIsPlaying(false);
        isSyncingRef.current = false;
      }
    };

    // When one video seeks, sync the other
    const handleSeeked = (source: HTMLVideoElement, other: HTMLVideoElement) => () => {
      if (isSyncingRef.current) return;
      if (Math.abs(other.currentTime - source.currentTime) > SYNC_TOLERANCE) {
        isSyncingRef.current = true;
        other.currentTime = source.currentTime;
        isSyncingRef.current = false;
      }
    };

    // Periodic sync check during playback
    const handleTimeUpdate = (source: HTMLVideoElement, other: HTMLVideoElement) => () => {
      if (isSyncingRef.current || source.paused) return;
      if (Math.abs(source.currentTime - other.currentTime) > SYNC_TOLERANCE) {
        isSyncingRef.current = true;
        other.currentTime = source.currentTime;
        isSyncingRef.current = false;
      }
    };

    // When one video ends, pause both
    const handleEnded = () => {
      pauseBoth();
    };

    // Add all event listeners
    const leftWaiting = handleWaiting(rightVideo);
    const rightWaiting = handleWaiting(leftVideo);
    const leftPlay = handlePlay(leftVideo, rightVideo);
    const rightPlay = handlePlay(rightVideo, leftVideo);
    const leftPause = handlePause(rightVideo);
    const rightPause = handlePause(leftVideo);
    const leftSeeked = handleSeeked(leftVideo, rightVideo);
    const rightSeeked = handleSeeked(rightVideo, leftVideo);
    const leftTimeUpdate = handleTimeUpdate(leftVideo, rightVideo);
    const rightTimeUpdate = handleTimeUpdate(rightVideo, leftVideo);

    leftVideo.addEventListener('waiting', leftWaiting);
    rightVideo.addEventListener('waiting', rightWaiting);
    leftVideo.addEventListener('play', leftPlay);
    rightVideo.addEventListener('play', rightPlay);
    leftVideo.addEventListener('pause', leftPause);
    rightVideo.addEventListener('pause', rightPause);
    leftVideo.addEventListener('seeked', leftSeeked);
    rightVideo.addEventListener('seeked', rightSeeked);
    leftVideo.addEventListener('timeupdate', leftTimeUpdate);
    rightVideo.addEventListener('timeupdate', rightTimeUpdate);
    leftVideo.addEventListener('ended', handleEnded);
    rightVideo.addEventListener('ended', handleEnded);

    return () => {
      leftVideo.removeEventListener('waiting', leftWaiting);
      rightVideo.removeEventListener('waiting', rightWaiting);
      leftVideo.removeEventListener('play', leftPlay);
      rightVideo.removeEventListener('play', rightPlay);
      leftVideo.removeEventListener('pause', leftPause);
      rightVideo.removeEventListener('pause', rightPause);
      leftVideo.removeEventListener('seeked', leftSeeked);
      rightVideo.removeEventListener('seeked', rightSeeked);
      leftVideo.removeEventListener('timeupdate', leftTimeUpdate);
      rightVideo.removeEventListener('timeupdate', rightTimeUpdate);
      leftVideo.removeEventListener('ended', handleEnded);
      rightVideo.removeEventListener('ended', handleEnded);
    };
  }, [assetType, syncPlayback, leftVersion, rightVersion, pauseBoth]);

  const togglePlayback = useCallback(() => {
    if (!supportsTemporalAnnotations(assetType)) return;

    if (isPlaying) {
      pauseBoth();
    } else {
      playBoth();
    }
  }, [assetType, isPlaying, pauseBoth, playBoth]);

  const renderVersionSelector = (
    currentVersion: number,
    onChange: (version: number) => void,
    excludeVersion: number
  ) => (
    <select
      value={currentVersion}
      onChange={(e) => onChange(Number(e.target.value))}
      className="bg-gray-700 text-white px-3 py-1.5 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
    >
      {sortedVersions
        .filter(v => v.version_number !== excludeVersion)
        .map((v) => (
          <option key={v.id} value={v.version_number}>
            Version {v.version_number}
          </option>
        ))}
    </select>
  );

  const renderContent = (version: AssetVersion | undefined, videoRef?: React.RefObject<HTMLVideoElement | null>) => {
    if (!version) {
      return (
        <div className="flex items-center justify-center h-full bg-gray-900 rounded">
          <p className="text-gray-500">Version not found</p>
        </div>
      );
    }

    const handler = getAssetTypeHandler(assetType);

    // Use handler-specific rendering for known types, fallback for unknown
    if (!handler) {
      return (
        <div className="flex items-center justify-center h-full bg-gray-900 rounded">
          <p className="text-gray-500">Preview not available for this file type</p>
        </div>
      );
    }

    const mediaUrl = getMediaUrlForType(version.file_url, assetType);

    // Video needs special handling for comparison mode sync
    if (supportsTemporalAnnotations(assetType)) {
      return (
        <div className="flex items-center justify-center h-full bg-gray-900 rounded overflow-hidden">
          <video
            ref={videoRef}
            src={mediaUrl}
            className="max-w-full max-h-full"
            controls={!syncPlayback}
            muted
          />
        </div>
      );
    }

    // For image types
    if (assetType === 'image') {
      return (
        <div className="flex items-center justify-center h-full bg-gray-900 rounded overflow-hidden">
          <img
            src={mediaUrl}
            alt={`Version ${version.version_number}`}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      );
    }

    // For PDF types
    if (assetType === 'pdf') {
      return (
        <div className="h-full bg-gray-900 rounded overflow-hidden">
          <iframe
            src={mediaUrl}
            className="w-full h-full"
            title={`Version ${version.version_number}`}
          />
        </div>
      );
    }

    // Fallback for other types (design, etc.)
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 rounded">
        <p className="text-gray-500">Preview not available for this file type</p>
      </div>
    );
  };

  const renderVersionMeta = (version: AssetVersion | undefined) => {
    if (!version) return null;

    return (
      <div className="mt-2 text-xs text-gray-400 space-y-1">
        <p>Uploaded by: {version.uploader?.name ?? 'Unknown'}</p>
        <p>Size: {version.file_size_formatted ?? `${Math.round(version.file_size / 1024)} KB`}</p>
        <p>Date: {new Date(version.created_at).toLocaleDateString()}</p>
        {version.version_notes && (
          <p className="text-gray-300 bg-gray-800 p-2 rounded mt-2">
            Notes: {version.version_notes}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h2 className="text-xl font-semibold text-white">Version Comparison</h2>

        <div className="flex items-center gap-4">
          {supportsTemporalAnnotations(assetType) && (
            <>
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={syncPlayback}
                  onChange={(e) => setSyncPlayback(e.target.checked)}
                  className="rounded bg-gray-700 border-gray-600"
                />
                Sync playback
              </label>

              {syncPlayback && (
                <button
                  onClick={togglePlayback}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isPlaying ? 'Pause' : 'Play'}
                </button>
              )}
            </>
          )}

          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Comparison View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        <div className="flex-1 flex flex-col p-4 border-r border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ChevronLeft className="w-4 h-4 text-gray-400" />
              {renderVersionSelector(leftVersion, setLeftVersion, rightVersion)}
            </div>
          </div>

          <div className="flex-1 min-h-0">
            {renderContent(leftAsset, leftVideoRef)}
          </div>

          {renderVersionMeta(leftAsset)}
        </div>

        {/* Swap Button */}
        <div className="flex items-center">
          <button
            onClick={swapVersions}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-full transition-colors"
            title="Swap versions"
          >
            <ArrowLeftRight className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Right Panel */}
        <div className="flex-1 flex flex-col p-4 border-l border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {renderVersionSelector(rightVersion, setRightVersion, leftVersion)}
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </div>

          <div className="flex-1 min-h-0">
            {renderContent(rightAsset, rightVideoRef)}
          </div>

          {renderVersionMeta(rightAsset)}
        </div>
      </div>
    </div>
  );
}
