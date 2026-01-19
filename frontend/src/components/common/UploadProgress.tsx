import { FC } from 'react';
import { UploadProgress as UploadProgressType } from '../../hooks';

interface UploadProgressProps {
  progress: UploadProgressType;
  fileName?: string;
}

/**
 * Formats bytes into human readable string (KB, MB, GB)
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Formats seconds into human readable time string
 */
function formatTime(seconds: number): string {
  if (seconds < 1) return 'less than a second';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (minutes < 60) return `${minutes}m ${secs}s`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

/**
 * Reusable upload progress component showing progress bar, speed, and ETA.
 */
export const UploadProgress: FC<UploadProgressProps> = ({ progress, fileName }) => {
  const { progress: percent, loaded, total, speed, timeRemaining, isUploading } = progress;

  if (!isUploading) return null;

  return (
    <div className="space-y-2">
      {fileName && (
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
          {fileName}
        </p>
      )}

      {/* Progress bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-gray-900 dark:bg-gray-100 rounded-full transition-all duration-150"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Progress details */}
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>
          {formatBytes(loaded)} / {formatBytes(total)} ({percent}%)
        </span>
        <span>
          {speed > 0 && (
            <>
              {formatBytes(speed)}/s
              {timeRemaining > 0 && ` - ${formatTime(timeRemaining)} remaining`}
            </>
          )}
        </span>
      </div>
    </div>
  );
};
