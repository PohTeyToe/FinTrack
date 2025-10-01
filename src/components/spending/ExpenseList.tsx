import { useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { removeExpense } from '../../store/expensesSlice';
import { CATEGORY_CONFIG, Expense } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface ExpenseListProps {
  limit?: number;
  showDelete?: boolean;
}

const ExpenseList = ({ limit, showDelete = true }: ExpenseListProps) => {
  const expenses = useSelector((state: RootState) => state.expenses.expenses);
  const dispatch = useDispatch();

  const displayedExpenses = useMemo(() => {
    return limit ? expenses.slice(0, limit) : expenses;
  }, [expenses, limit]);

  // Group expenses by date
  const groupedExpenses = useMemo(() => {
    const groups: Record<string, Expense[]> = {};
    
    displayedExpenses.forEach((expense: Expense) => {
      const dateKey = expense.date;
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(expense);
    });

    return Object.entries(groups).sort((a, b) => 
      new Date(b[0]).getTime() - new Date(a[0]).getTime()
    );
  }, [displayedExpenses]);

  const handleRemove = (id: string) => {
    dispatch(removeExpense(id));
  };

  if (expenses.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-dark-600 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <p className="text-gray-400">No expenses recorded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groupedExpenses.map(([date, dateExpenses]) => (
        <div key={date}>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
            {formatDate(date, 'relative')} · {formatDate(date)}
          </p>
          <div className="space-y-2">
            {dateExpenses.map((expense: Expense, index: number) => {
              const config = CATEGORY_CONFIG[expense.category];
              return (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-3 bg-dark-700/50 rounded-xl hover:bg-dark-700 transition-colors animate-fade-in"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                      style={{ backgroundColor: `${config.color}20` }}
                    >
                      {config.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {expense.description}
                      </p>
                      <p className="text-xs text-gray-500">{config.label}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-white">
                      -{formatCurrency(expense.amount)}
                    </span>
                    {showDelete && (
                      <button
                        onClick={() => handleRemove(expense.id)}
                        className="p-1.5 text-gray-500 hover:text-loss hover:bg-loss/10 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ExpenseList;
