import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { SpendingByCategory, CATEGORY_CONFIG, ExpenseCategory } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface SpendingPieChartProps {
  data: SpendingByCategory[];
  isLoading?: boolean;
}

const COLORS: Record<ExpenseCategory, string> = {
  food: '#f97316',
  transport: '#3b82f6',
  entertainment: '#a855f7',
  bills: '#ef4444',
  other: '#6b7280',
};

const SpendingPieChart = ({ data, isLoading = false }: SpendingPieChartProps) => {
  const chartData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      name: CATEGORY_CONFIG[item.category].label,
      color: COLORS[item.category],
    }));
  }, [data]);

  const total = useMemo(() => {
    return data.reduce((sum, item) => sum + item.amount, 0);
  }, [data]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: SpendingByCategory & { name: string; color: string } }> }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-dark-700 border border-dark-500 rounded-lg px-4 py-3 shadow-xl">
          <div className="flex items-center gap-2 mb-1">
            <span>{CATEGORY_CONFIG[item.category].icon}</span>
            <span className="text-sm font-medium text-white">{item.name}</span>
          </div>
          <p className="text-lg font-bold text-white">{formatCurrency(item.amount)}</p>
          <p className="text-xs text-gray-400">{item.percentage.toFixed(1)}% of total</p>
        </div>
      );
    }
    return null;
  };

  // Custom legend
  const CustomLegend = ({ payload }: { payload?: Array<{ value: string; color: string }> }) => {
    if (!payload) return null;
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-gray-400">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading chart...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <p className="text-gray-500">No spending data available</p>
      </div>
    );
  }

  return (
    <div>
      {/* Total display */}
      <div className="text-center mb-4">
        <p className="text-sm text-gray-400">Total Spending</p>
        <p className="text-3xl font-bold text-white">{formatCurrency(total)}</p>
      </div>

      {/* Pie chart */}
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={3}
              dataKey="amount"
              animationDuration={750}
              animationBegin={0}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  stroke="transparent"
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Category breakdown */}
      <div className="mt-6 space-y-3">
        {chartData.map((item) => (
          <div key={item.category} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-2 h-8 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <div>
                <p className="text-sm text-white">{item.name}</p>
                <p className="text-xs text-gray-500">{item.percentage.toFixed(1)}%</p>
              </div>
            </div>
            <p className="text-sm font-medium text-white">
              {formatCurrency(item.amount)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpendingPieChart;

