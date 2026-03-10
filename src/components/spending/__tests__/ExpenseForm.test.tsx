import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import expensesReducer from '../../../store/expensesSlice';
import portfolioReducer from '../../../store/portfolioSlice';
import watchlistReducer from '../../../store/watchlistSlice';
import ExpenseForm from '../ExpenseForm';

function renderWithStore(ui: React.ReactElement) {
  const store = configureStore({
    reducer: {
      expenses: expensesReducer,
      portfolio: portfolioReducer,
      watchlist: watchlistReducer,
    },
  });
  return render(<Provider store={store}>{ui}</Provider>);
}

describe('ExpenseForm', () => {
  it('renders amount input and submit button', () => {
    renderWithStore(<ExpenseForm />);
    expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();
    expect(screen.getByText('Add Expense')).toBeInTheDocument();
  });

  it('submit button is disabled when amount is empty', () => {
    renderWithStore(<ExpenseForm />);
    expect(screen.getByText('Add Expense')).toBeDisabled();
  });

  it('enables submit button when amount is entered', () => {
    renderWithStore(<ExpenseForm />);
    const input = screen.getByPlaceholderText('0.00');
    fireEvent.change(input, { target: { value: '25.50' } });
    expect(screen.getByText('Add Expense')).not.toBeDisabled();
  });

  it('renders all five category buttons', () => {
    renderWithStore(<ExpenseForm />);
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('Transport')).toBeInTheDocument();
    expect(screen.getByText('Entertainment')).toBeInTheDocument();
    expect(screen.getByText('Bills')).toBeInTheDocument();
    expect(screen.getByText('Other')).toBeInTheDocument();
  });

  it('calls onSuccess callback after submitting', () => {
    const onSuccess = vi.fn();
    renderWithStore(<ExpenseForm onSuccess={onSuccess} />);
    const input = screen.getByPlaceholderText('0.00');
    fireEvent.change(input, { target: { value: '10' } });
    fireEvent.click(screen.getByText('Add Expense'));
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('clears the amount field after submission', () => {
    renderWithStore(<ExpenseForm />);
    const input = screen.getByPlaceholderText('0.00') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '10' } });
    fireEvent.click(screen.getByText('Add Expense'));
    expect(input.value).toBe('');
  });
});
