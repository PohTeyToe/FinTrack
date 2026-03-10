import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import expensesReducer from '../../../store/expensesSlice';
import portfolioReducer from '../../../store/portfolioSlice';
import watchlistReducer from '../../../store/watchlistSlice';
import ExpenseList from '../ExpenseList';

function makeStore(expenses: Array<{ id: string; amount: number; category: 'food' | 'bills'; description: string; date: string }>) {
  return configureStore({
    reducer: {
      expenses: expensesReducer,
      portfolio: portfolioReducer,
      watchlist: watchlistReducer,
    },
    preloadedState: {
      expenses: { expenses, isLoading: false, error: null },
    },
  });
}

describe('ExpenseList', () => {
  it('shows empty state when there are no expenses', () => {
    const store = makeStore([]);
    render(
      <Provider store={store}>
        <ExpenseList />
      </Provider>
    );
    expect(screen.getByText('No expenses recorded yet')).toBeInTheDocument();
  });

  it('renders expense descriptions', () => {
    const store = makeStore([
      { id: '1', amount: 12.5, category: 'food', description: 'Lunch', date: '2025-12-01' },
      { id: '2', amount: 80, category: 'bills', description: 'Electric bill', date: '2025-12-01' },
    ]);
    render(
      <Provider store={store}>
        <ExpenseList />
      </Provider>
    );
    expect(screen.getByText('Lunch')).toBeInTheDocument();
    expect(screen.getByText('Electric bill')).toBeInTheDocument();
  });

  it('respects the limit prop', () => {
    const expenses = Array.from({ length: 10 }, (_, i) => ({
      id: String(i),
      amount: 10 + i,
      category: 'food' as const,
      description: `Expense ${i}`,
      date: '2025-12-01',
    }));
    const store = makeStore(expenses);
    render(
      <Provider store={store}>
        <ExpenseList limit={3} />
      </Provider>
    );
    expect(screen.getByText('Expense 0')).toBeInTheDocument();
    expect(screen.getByText('Expense 2')).toBeInTheDocument();
    expect(screen.queryByText('Expense 3')).toBeNull();
  });

  it('displays formatted currency amounts', () => {
    const store = makeStore([
      { id: '1', amount: 42.99, category: 'food', description: 'Groceries', date: '2025-12-01' },
    ]);
    render(
      <Provider store={store}>
        <ExpenseList />
      </Provider>
    );
    expect(screen.getByText('-$42.99')).toBeInTheDocument();
  });
});
