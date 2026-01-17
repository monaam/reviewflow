interface DonutChartData {
  label: string;
  value: number;
}

interface MiniDonutChartProps {
  data: DonutChartData[];
  size?: number;
  centerLabel?: string;
  centerValue?: number;
}

const COLORS = [
  'fill-gray-800 dark:fill-gray-200',
  'fill-gray-600 dark:fill-gray-400',
  'fill-gray-400 dark:fill-gray-500',
  'fill-gray-200 dark:fill-gray-600',
];

export function MiniDonutChart({
  data,
  size = 120,
  centerLabel,
  centerValue,
}: MiniDonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const strokeWidth = size * 0.15;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  if (total === 0) {
    return (
      <div className="flex flex-col items-center">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-gray-200 dark:text-gray-700"
          />
        </svg>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">No data</p>
      </div>
    );
  }

  let currentOffset = 0;
  const segments = data.map((item, index) => {
    const percentage = item.value / total;
    const dashArray = `${percentage * circumference} ${circumference}`;
    const rotation = currentOffset * 360;
    currentOffset += percentage;

    return {
      ...item,
      dashArray,
      rotation,
      colorClass: COLORS[index % COLORS.length],
    };
  });

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          {segments.map((segment, index) => (
            <circle
              key={index}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              strokeDasharray={segment.dashArray}
              strokeDashoffset="0"
              className={segment.colorClass.replace('fill-', 'text-')}
              style={{
                transform: `rotate(${segment.rotation}deg)`,
                transformOrigin: 'center',
              }}
            />
          ))}
        </svg>
        {(centerLabel || centerValue !== undefined) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {centerValue !== undefined && (
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                {centerValue}
              </span>
            )}
            {centerLabel && (
              <span className="text-xs text-gray-500 dark:text-gray-400">{centerLabel}</span>
            )}
          </div>
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-3">
        {segments.map((segment, index) => (
          <div key={index} className="flex items-center gap-1.5">
            <div
              className={`w-2.5 h-2.5 rounded-sm ${COLORS[index % COLORS.length].replace('fill-', 'bg-')}`}
            />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {segment.label} ({segment.value})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
