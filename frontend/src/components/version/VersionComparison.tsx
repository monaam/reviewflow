import { useState, useRef, useEffect } from 'react';
import { X, ArrowLeftRight, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { AssetVersion, AssetType } from '../../types';

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

  const swapVersions = () => {
    const temp = leftVersion;
    setLeftVersion(rightVersion);
    setRightVersion(temp);
  };

  // Synced video playback
  useEffect(() => {
    if (assetType !== 'video' || !syncPlayback) return;

    const leftVideo = leftVideoRef.current;
    const rightVideo = rightVideoRef.current;

    if (!leftVideo || !rightVideo) return;

    const handleTimeUpdate = (source: HTMLVideoElement, target: HTMLVideoElement) => {
      if (Math.abs(source.currentTime - target.currentTime) > 0.5) {
        target.currentTime = source.currentTime;
      }
    };

    const handleLeftTimeUpdate = () => handleTimeUpdate(leftVideo, rightVideo);
    const handleRightTimeUpdate = () => handleTimeUpdate(rightVideo, leftVideo);

    leftVideo.addEventListener('timeupdate', handleLeftTimeUpdate);
    rightVideo.addEventListener('timeupdate', handleRightTimeUpdate);

    return () => {
      leftVideo.removeEventListener('timeupdate', handleLeftTimeUpdate);
      rightVideo.removeEventListener('timeupdate', handleRightTimeUpdate);
    };
  }, [assetType, syncPlayback, leftVersion, rightVersion]);

  const togglePlayback = () => {
    if (assetType !== 'video') return;

    const leftVideo = leftVideoRef.current;
    const rightVideo = rightVideoRef.current;

    if (isPlaying) {
      leftVideo?.pause();
      rightVideo?.pause();
    } else {
      leftVideo?.play();
      if (syncPlayback) {
        rightVideo?.play();
      }
    }
    setIsPlaying(!isPlaying);
  };

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

    switch (assetType) {
      case 'image':
        return (
          <div className="flex items-center justify-center h-full bg-gray-900 rounded overflow-hidden">
            <img
              src={version.file_url}
              alt={`Version ${version.version_number}`}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        );

      case 'video':
        return (
          <div className="flex items-center justify-center h-full bg-gray-900 rounded overflow-hidden">
            <video
              ref={videoRef}
              src={version.file_url}
              className="max-w-full max-h-full"
              controls={!syncPlayback}
              muted
            />
          </div>
        );

      case 'pdf':
        return (
          <div className="h-full bg-gray-900 rounded overflow-hidden">
            <iframe
              src={version.file_url}
              className="w-full h-full"
              title={`Version ${version.version_number}`}
            />
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center h-full bg-gray-900 rounded">
            <p className="text-gray-500">Preview not available for this file type</p>
          </div>
        );
    }
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
          {assetType === 'video' && (
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
