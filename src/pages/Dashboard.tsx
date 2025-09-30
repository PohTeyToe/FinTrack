import { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { TimeRange, SpendingByCategory, ExpenseCategory, CATEGORY_CONFIG, Expense } from '../types';
import { usePortfolioHistory } from '../hooks/usePortfolio';
import { Card, CardHeader, CardTitle } from '../components/common';
import { PortfolioChart, SpendingPieChart } from '../components/charts';
import { PortfolioSummary, HoldingsList, AddStockModal } from '../components/portfolio';
import { WatchlistCard } from '../components/watchlist';
import { ExpenseList, SpendingSummary } from '../components/spending';

const Dashboard = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('1M');
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
  const historicalData = usePortfolioHistory(timeRange);
  const expenses = useSelector((state: RootState) => state.expenses.expenses);

  // Calculate spending by category for current month
  const spendingByCategory = useMemo((): SpendingByCategory[] => {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const categoryTotals: Record<ExpenseCategory, number> = {
      food: 0,
      transport: 0,
      entertainment: 0,
      bills: 0,
      other: 0,
    };

    let total = 0;
    expenses.forEach((expense: Expense) => {
      if (new Date(expense.date) >= thisMonthStart) {
        categoryTotals[expense.category] += expense.amount;
        total += expense.amount;
      }
    });

    return Object.entries(categoryTotals)
      .filter(([, amount]) => amount > 0)
      .map(([category, amount]) => ({
        category: category as ExpenseCategory,
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0,
        color: CATEGORY_CONFIG[category as ExpenseCategory].color,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [expenses]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">Track your investments and spending</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-2 px-3 py-1.5 bg-gain/10 text-gain text-sm rounded-full">
            <span className="w-2 h-2 bg-gain rounded-full animate-pulse"></span>
            Markets Open
          </span>
        </div>
      </div>

      {/* Portfolio Summary Cards */}
      <PortfolioSummary />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Portfolio Chart - Takes 2 columns */}
        <div className="lg:col-span-2">
          <Card variant="default" padding="md">
            <CardHeader>
              <CardTitle>Portfolio Performance</CardTitle>
            </CardHeader>
            <PortfolioChart
              data={historicalData}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
            />
          </Card>
        </div>

        {/* Spending Overview */}
        <div>
          <Card variant="default" padding="md" className="h-full">
            <CardHeader>
              <CardTitle>Monthly Spending</CardTitle>
            </CardHeader>
            {spendingByCategory.length > 0 ? (
              <SpendingPieChart data={spendingByCategory} />
            ) : (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-gray-500">No spending this month</p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Holdings and Watchlist */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Holdings List - Takes 2 columns */}
        <div className="xl:col-span-2">
          <HoldingsList onAddStock={() => setIsAddStockModalOpen(true)} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Watchlist Preview */}
          <Card variant="default" padding="md">
            <CardHeader>
              <CardTitle>Watchlist</CardTitle>
              <a
                href="/watchlist"
                className="text-sm text-accent hover:text-accent-light transition-colors"
              >
                View all →
              </a>
            </CardHeader>
            <WatchlistCard compact />
          </Card>

          {/* Spending Summary */}
          <Card variant="default" padding="md">
            <CardHeader>
              <CardTitle>Spending Summary</CardTitle>
              <a
                href="/spending"
                className="text-sm text-accent hover:text-accent-light transition-colors"
              >
                View all →
              </a>
            </CardHeader>
            <SpendingSummary />
          </Card>

          {/* Recent Transactions */}
          <Card variant="default" padding="md">
            <CardHeader>
              <CardTitle>Recent Expenses</CardTitle>
            </CardHeader>
            <ExpenseList limit={3} showDelete={false} />
          </Card>
        </div>
      </div>

      {/* Add Stock Modal */}
      <AddStockModal
        isOpen={isAddStockModalOpen}
        onClose={() => setIsAddStockModalOpen(false)}
      />
    </div>
  );
};

export default Dashboard;
