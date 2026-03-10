import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import portfolioReducer from '../../../store/portfolioSlice';
import watchlistReducer from '../../../store/watchlistSlice';
import expensesReducer from '../../../store/expensesSlice';
import HoldingsList from '../HoldingsList';

const mockHoldings = [
  {
    id: '1',
    symbol: 'AAPL',
    name: 'Apple Inc.',
    shares: 10,
    avgCost: 150,
    currentPrice: 175,
    dailyChange: 2.5,
    dailyChangePercent: 1.45,
  },
  {
    id: '2',
    symbol: 'MSFT',
    name: 'Microsoft Corp.',
    shares: 5,
    avgCost: 300,
    currentPrice: 380,
    dailyChange: -1.2,
    dailyChangePercent: -0.31,
  },
];

function makeStore(holdings = mockHoldings) {
  return configureStore({
    reducer: {
      portfolio: portfolioReducer,
      watchlist: watchlistReducer,
      expenses: expensesReducer,
    },
    preloadedState: {
      portfolio: { holdings, historicalData: [], isLoading: false, error: null },
    },
  });
}

describe('HoldingsList', () => {
  it('renders the Holdings heading', () => {
    render(
      <Provider store={makeStore()}>
        <HoldingsList onAddStock={vi.fn()} />
      </Provider>
    );
    expect(screen.getByText('Holdings')).toBeInTheDocument();
  });

  it('renders each holding symbol', () => {
    render(
      <Provider store={makeStore()}>
        <HoldingsList onAddStock={vi.fn()} />
      </Provider>
    );
    expect(screen.getByText('AAPL')).toBeInTheDocument();
    expect(screen.getByText('MSFT')).toBeInTheDocument();
  });

  it('renders the Add Stock button and calls handler', () => {
    const onAddStock = vi.fn();
    render(
      <Provider store={makeStore()}>
        <HoldingsList onAddStock={onAddStock} />
      </Provider>
    );
    fireEvent.click(screen.getByText('Add Stock'));
    expect(onAddStock).toHaveBeenCalledTimes(1);
  });

  it('shows empty state when there are no holdings', () => {
    render(
      <Provider store={makeStore([])}>
        <HoldingsList onAddStock={vi.fn()} />
      </Provider>
    );
    expect(screen.getByText('No holdings yet')).toBeInTheDocument();
    expect(screen.getByText(/Add your first stock/)).toBeInTheDocument();
  });

  it('displays formatted total value for a holding', () => {
    render(
      <Provider store={makeStore()}>
        <HoldingsList onAddStock={vi.fn()} />
      </Provider>
    );
    // AAPL: 10 shares * $175 = $1,750.00
    expect(screen.getByText('$1,750.00')).toBeInTheDocument();
  });
});
