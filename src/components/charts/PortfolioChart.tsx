import { useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { ChartDataPoint, TimeRange } from '../../types';
import { formatCurrency, formatChartDate } from '../../utils/formatters';

interface PortfolioChartProps {
  data: ChartDataPoint[];
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  isLoading?: boolean;
}

const timeRanges: TimeRange[] = ['1W', '1M', '3M', '1Y', 'ALL'];

const PortfolioChart = ({
  data,
  timeRange,
  onTimeRangeChange,
  isLoading = false,
}: PortfolioChartProps) => {
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);

  // Calculate if portfolio is up or down
  const isPositive = useMemo(() => {
    if (data.length < 2) return true;
    return data[data.length - 1].value >= data[0].value;
  }, [data]);

  // Calculate percent change
  const percentChange = useMemo(() => {
    if (data.length < 2) return 0;
    const start = data[0].value;
    const end = data[data.length - 1].value;
    return ((end - start) / start) * 100;
  }, [data]);

  const chartColor = isPositive ? '#00d395' : '#ff5252';
  const currentValue = hoveredValue ?? (data.length > 0 ? data[data.length - 1].value : 0);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: ChartDataPoint }> }) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      return (
        <div className="bg-dark-700 border border-dark-500 rounded-lg px-3 py-2 shadow-xl">
          <p className="text-xs text-gray-400">{formatChartDate(point.date, timeRange)}</p>
          <p className="text-sm font-semibold text-white">{formatCurrency(point.value)}</p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading chart...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Value display */}
      <div className="mb-6">
        <p className="text-4xl font-bold text-white mb-1">
          {formatCurrency(currentValue)}
        </p>
        <p className={`text-sm font-medium ${isPositive ? 'text-gain' : 'text-loss'}`}>
          {isPositive ? '+' : ''}{percentChange.toFixed(2)}% {timeRange === '1W' ? 'this week' : timeRange === '1M' ? 'this month' : timeRange === '3M' ? 'past 3 months' : timeRange === '1Y' ? 'this year' : 'all time'}
        </p>
      </div>

      {/* Time range buttons */}
      <div className="flex gap-2 mb-4">
        {timeRanges.map((range) => (
          <button
            key={range}
            onClick={() => onTimeRangeChange(range)}
            className={`
              px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200
              ${
                timeRange === range
                  ? 'bg-accent text-white'
                  : 'text-gray-400 hover:text-white hover:bg-dark-600'
              }
            `}
          >
            {range}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            onMouseMove={(state) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const payload = (state as any)?.activePayload;
              if (payload && payload[0]) {
                setHoveredValue(payload[0].payload.value);
              }
            }}
            onMouseLeave={() => setHoveredValue(null)}
          >
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chartColor} stopOpacity={0.3} />
                <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#2a2a38"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6b7280', fontSize: 11 }}
              tickFormatter={(date) => formatChartDate(date, timeRange)}
              interval="preserveStartEnd"
              minTickGap={50}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6b7280', fontSize: 11 }}
              tickFormatter={(value) => formatCurrency(value, true)}
              domain={['auto', 'auto']}
              width={70}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={chartColor}
              strokeWidth={2}
              fill="url(#colorValue)"
              animationDuration={750}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PortfolioChart;

