import { configureStore, combineReducers } from '@reduxjs/toolkit';
import portfolioReducer from './portfolioSlice';
import watchlistReducer from './watchlistSlice';
import expensesReducer from './expensesSlice';

const rootReducer = combineReducers({
  portfolio: portfolioReducer,
  watchlist: watchlistReducer,
  expenses: expensesReducer,
});

// Infer root state type from root reducer
export type RootState = ReturnType<typeof rootReducer>;

// Load state from localStorage
const loadState = (): RootState | undefined => {
  try {
    const serializedState = localStorage.getItem('fintrack-state');
    if (serializedState === null) {
      return undefined;
    }
    return JSON.parse(serializedState) as RootState;
  } catch {
    return undefined;
  }
};

// Save state to localStorage
const saveState = (state: RootState) => {
  try {
    const serializedState = JSON.stringify({
      portfolio: {
        holdings: state.portfolio.holdings,
        historicalData: state.portfolio.historicalData,
        isLoading: false,
        error: null,
      },
      watchlist: {
        items: state.watchlist.items,
        isLoading: false,
        error: null,
      },
      expenses: {
        expenses: state.expenses.expenses,
        isLoading: false,
        error: null,
      },
    });
    localStorage.setItem('fintrack-state', serializedState);
  } catch {
    // Ignore write errors
  }
};

export const store = configureStore({
  reducer: rootReducer,
  preloadedState: loadState(),
});

// Subscribe to store changes and save to localStorage
let saveTimeout: ReturnType<typeof setTimeout>;
store.subscribe(() => {
  // Debounce saves to avoid excessive localStorage writes
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveState(store.getState());
  }, 1000);
});

export type AppDispatch = typeof store.dispatch;
