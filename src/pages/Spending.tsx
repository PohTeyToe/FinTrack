import { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { SpendingByCategory, ExpenseCategory, CATEGORY_CONFIG, Expense } from '../types';
import { Card, CardHeader, CardTitle, Button, Modal } from '../components/common';
import { SpendingPieChart } from '../components/charts';
import { ExpenseForm, ExpenseList, SpendingSummary } from '../components/spending';

const Spending = () => {
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  
  const expenses = useSelector((state: RootState) => state.expenses.expenses);

  // Filter expenses by selected month
  const filteredExpenses = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    return expenses.filter((expense: Expense) => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getFullYear() === year && expenseDate.getMonth() === month - 1;
    });
  }, [expenses, selectedMonth]);

  // Calculate spending by category for selected month
  const spendingByCategory = useMemo((): SpendingByCategory[] => {
    const categoryTotals: Record<ExpenseCategory, number> = {
      food: 0,
      transport: 0,
      entertainment: 0,
      bills: 0,
      other: 0,
    };

    let total = 0;
    filteredExpenses.forEach((expense: Expense) => {
      categoryTotals[expense.category] += expense.amount;
      total += expense.amount;
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
  }, [filteredExpenses]);

  // Generate month options
  const monthOptions = useMemo(() => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      options.push({ value, label });
    }
    return options;
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Spending Tracker</h1>
          <p className="text-gray-400 mt-1">Monitor and categorize your expenses</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Month Selector */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-dark-700 border border-dark-500 text-white rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
          >
            {monthOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Button onClick={() => setIsAddExpenseOpen(true)}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Expense
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart and Summary */}
        <div className="lg:col-span-1 space-y-6">
          <Card variant="gradient" padding="md">
            <CardHeader>
              <CardTitle>Breakdown</CardTitle>
            </CardHeader>
            {spendingByCategory.length > 0 ? (
              <SpendingPieChart data={spendingByCategory} />
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 mb-4 rounded-full bg-dark-600 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-gray-400 text-center">No expenses this month</p>
                <button
                  onClick={() => setIsAddExpenseOpen(true)}
                  className="mt-2 text-accent hover:text-accent-light text-sm transition-colors"
                >
                  Add your first expense →
                </button>
              </div>
            )}
          </Card>

          {/* Summary Stats */}
          <SpendingSummary />
        </div>

        {/* Expense List */}
        <div className="lg:col-span-2">
          <Card variant="default" padding="md">
            <CardHeader>
              <CardTitle>All Expenses</CardTitle>
              <span className="text-sm text-gray-400">
                {filteredExpenses.length} transactions
              </span>
            </CardHeader>
            <div className="max-h-[600px] overflow-y-auto pr-2 -mr-2">
              <ExpenseList />
            </div>
          </Card>
        </div>
      </div>

      {/* Add Expense Modal */}
      <Modal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        title="Add New Expense"
        size="md"
      >
        <ExpenseForm onSuccess={() => setIsAddExpenseOpen(false)} />
      </Modal>
    </div>
  );
};

export default Spending;
