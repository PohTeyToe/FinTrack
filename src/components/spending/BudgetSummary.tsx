import { useState, useEffect } from 'react';
import { analyticsApi, BudgetCategoryResponse } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import { Card, CardHeader, CardTitle } from '../common';

const BudgetSummary = () => {
  const [categories, setCategories] = useState<BudgetCategoryResponse[]>([]);
  const [month, setMonth] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsApi
      .budgetSummary()
      .then((data) => {
        setCategories(data.categories);
        setMonth(data.month);
      })
      .catch(() => {
        // Silently fail -- budget summary is supplemental
      })
      .finally(() => setLoading(false));
  }, []);

  const budgeted = categories.filter((c) => c.budget_limit !== null && c.budget_limit > 0);

  if (loading) {
    return (
      <Card variant="default" padding="md">
        <CardHeader>
          <CardTitle>Budget Tracking</CardTitle>
        </CardHeader>
        <p className="text-sm text-gray-500">Loading...</p>
      </Card>
    );
  }

  if (budgeted.length === 0) {
    return null;
  }

  return (
    <Card variant="default" padding="md">
      <CardHeader>
        <CardTitle>Budget Tracking</CardTitle>
        <span className="text-sm text-gray-400">{month}</span>
      </CardHeader>
      <div className="space-y-4 mt-2">
        {budgeted.map((cat) => {
          const pct = cat.percentage_used ?? 0;
          const barColor = cat.over_budget ? 'bg-red-500' : pct > 80 ? 'bg-yellow-500' : 'bg-accent';
          return (
            <div key={cat.id}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full inline-block"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-sm text-gray-300">{cat.name}</span>
                </div>
                <span className="text-sm text-gray-400">
                  {formatCurrency(cat.spent)} / {formatCurrency(cat.budget_limit!)}
                </span>
              </div>
              <div className="w-full h-2 bg-dark-600 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              {cat.over_budget && (
                <p className="text-xs text-red-400 mt-1">
                  Over budget by {formatCurrency(Math.abs(cat.remaining!))}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default BudgetSummary;
