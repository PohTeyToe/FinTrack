import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { SpendingByCategory, CATEGORY_CONFIG, ExpenseCategory, Expense } from '../../types';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import { Card } from '../common';

const SpendingSummary = () => {
  const expenses = useSelector((state: RootState) => state.expenses.expenses);

  // Calculate this month's and last month's totals
  const { thisMonth, lastMonth, percentChange, categoryBreakdown } = useMemo(() => {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    let thisMonthTotal = 0;
    let lastMonthTotal = 0;
    const categoryTotals: Record<ExpenseCategory, number> = {
      food: 0,
      transport: 0,
      entertainment: 0,
      bills: 0,
      other: 0,
    };

    expenses.forEach((expense: Expense) => {
      const expenseDate = new Date(expense.date);
      
      if (expenseDate >= thisMonthStart) {
        thisMonthTotal += expense.amount;
        categoryTotals[expense.category] += expense.amount;
      } else if (expenseDate >= lastMonthStart && expenseDate <= lastMonthEnd) {
        lastMonthTotal += expense.amount;
      }
    });

    const change = lastMonthTotal > 0 
      ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 
      : 0;

    // Build category breakdown
    const breakdown: SpendingByCategory[] = Object.entries(categoryTotals)
      .filter(([, amount]) => amount > 0)
      .map(([category, amount]) => ({
        category: category as ExpenseCategory,
        amount,
        percentage: thisMonthTotal > 0 ? (amount / thisMonthTotal) * 100 : 0,
        color: CATEGORY_CONFIG[category as ExpenseCategory].color,
      }))
      .sort((a, b) => b.amount - a.amount);

    return {
      thisMonth: thisMonthTotal,
      lastMonth: lastMonthTotal,
      percentChange: change,
      categoryBreakdown: breakdown,
    };
  }, [expenses]);

  const isSpendingUp = percentChange > 0;

  return (
    <div className="space-y-4">
      {/* Monthly Total Card */}
      <Card variant="gradient" padding="md">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-1">This Month</p>
            <p className="text-3xl font-bold text-white">{formatCurrency(thisMonth)}</p>
            {lastMonth > 0 && (
              <p className={`text-sm mt-2 flex items-center gap-1 ${isSpendingUp ? 'text-loss' : 'text-gain'}`}>
                <svg className={`w-4 h-4 ${isSpendingUp ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                {formatPercent(Math.abs(percentChange))} vs last month
              </p>
            )}
          </div>
          <div className={`p-3 rounded-xl ${isSpendingUp ? 'bg-loss/10 text-loss' : 'bg-gain/10 text-gain'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
            </svg>
          </div>
        </div>
      </Card>

      {/* Last Month Comparison */}
      <Card variant="default" padding="sm">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">Last Month Total</p>
          <p className="text-sm font-medium text-white">{formatCurrency(lastMonth)}</p>
        </div>
      </Card>

      {/* Quick Category Stats */}
      {categoryBreakdown.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Top Categories</p>
          {categoryBreakdown.slice(0, 3).map((cat) => {
            const config = CATEGORY_CONFIG[cat.category];
            return (
              <div
                key={cat.category}
                className="flex items-center justify-between p-3 bg-dark-700/30 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{config.icon}</span>
                  <span className="text-sm text-gray-300">{config.label}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{formatCurrency(cat.amount)}</p>
                  <p className="text-xs text-gray-500">{cat.percentage.toFixed(0)}%</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SpendingSummary;
