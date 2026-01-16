/**
 * Time formatting utilities for media playback.
 */

/**
 * Formats seconds into MM:SS format.
 * @param seconds - Time in seconds
 * @returns Formatted time string (e.g., "02:35")
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Formats seconds into HH:MM:SS format for longer durations.
 * @param seconds - Time in seconds
 * @returns Formatted time string (e.g., "01:02:35")
 */
export function formatTimeLong(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return formatTime(seconds);
}

/**
 * Parses a time string (MM:SS or HH:MM:SS) into seconds.
 * @param timeString - Formatted time string
 * @returns Time in seconds, or 0 if invalid
 */
export function parseTime(timeString: string): number {
  const parts = timeString.split(':').map(Number);
  if (parts.some(isNaN)) return 0;

  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
}
