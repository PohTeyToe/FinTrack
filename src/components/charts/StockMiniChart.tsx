import { useMemo } from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface StockMiniChartProps {
  data?: number[];
  isPositive?: boolean;
  height?: number;
}

// Generate mock mini chart data
const generateMockData = (isPositive: boolean) => {
  const data = [];
  let value = 100;
  const trend = isPositive ? 0.02 : -0.02;

  for (let i = 0; i < 20; i++) {
    const change = (Math.random() - 0.5) * 3 + trend * 5;
    value = Math.max(90, Math.min(110, value + change));
    data.push({ value });
  }

  return data;
};

const StockMiniChart = ({
  data,
  isPositive = true,
  height = 40,
}: StockMiniChartProps) => {
  const chartData = useMemo(() => {
    if (data && data.length > 0) {
      return data.map((value) => ({ value }));
    }
    return generateMockData(isPositive);
  }, [data, isPositive]);

  const color = isPositive ? '#00d395' : '#ff5252';

  return (
    <div style={{ height, width: 80 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            animationDuration={500}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StockMiniChart;

