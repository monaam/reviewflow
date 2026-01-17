interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showPercentage = false,
  size = 'md',
}: ProgressBarProps) {
  const percentage = Math.min(Math.round((value / max) * 100), 100);

  const heights = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-1">
          {label && (
            <span className="text-xs text-gray-600 dark:text-gray-400">{label}</span>
          )}
          {showPercentage && (
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {percentage}%
            </span>
          )}
        </div>
      )}
      <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full ${heights[size]} overflow-hidden`}>
        <div
          className={`bg-gray-800 dark:bg-gray-300 ${heights[size]} rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
