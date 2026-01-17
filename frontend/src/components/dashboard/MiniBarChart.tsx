interface BarChartData {
  label: string;
  value: number;
}

interface MiniBarChartProps {
  data: BarChartData[];
  height?: number;
  showLabels?: boolean;
  showValues?: boolean;
}

export function MiniBarChart({
  data,
  height = 120,
  showLabels = true,
  showValues = true,
}: MiniBarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const barWidth = Math.min(40, Math.floor((200 - (data.length - 1) * 8) / data.length));
  const chartWidth = data.length * barWidth + (data.length - 1) * 8;
  const chartHeight = height - (showLabels ? 24 : 0);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="text-sm text-gray-500 dark:text-gray-400">No data</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <svg
        width={chartWidth}
        height={height}
        className="overflow-visible"
        viewBox={`0 0 ${chartWidth} ${height}`}
      >
        {/* Bars */}
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * chartHeight;
          const x = index * (barWidth + 8);
          const y = chartHeight - barHeight;

          return (
            <g key={index}>
              {/* Background bar */}
              <rect
                x={x}
                y={0}
                width={barWidth}
                height={chartHeight}
                rx={4}
                className="fill-gray-100 dark:fill-gray-700"
              />
              {/* Value bar */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={4}
                className="fill-gray-800 dark:fill-gray-300 transition-all duration-300"
              />
              {/* Value label */}
              {showValues && item.value > 0 && (
                <text
                  x={x + barWidth / 2}
                  y={y - 4}
                  textAnchor="middle"
                  className="text-xs fill-gray-600 dark:fill-gray-400"
                >
                  {item.value}
                </text>
              )}
              {/* Label */}
              {showLabels && (
                <text
                  x={x + barWidth / 2}
                  y={height - 4}
                  textAnchor="middle"
                  className="text-xs fill-gray-500 dark:fill-gray-400"
                >
                  {item.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
