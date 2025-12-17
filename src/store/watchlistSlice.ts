import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { WatchlistItem } from '../types';

interface WatchlistState {
  items: WatchlistItem[];
  isLoading: boolean;
  error: string | null;
}

// Mock initial watchlist data
const initialWatchlist: WatchlistItem[] = [
  {
    id: '1',
    symbol: 'AMD',
    name: 'Advanced Micro Devices',
    currentPrice: 145.67,
    dailyChange: 3.21,
    dailyChangePercent: 2.25,
  },
  {
    id: '2',
    symbol: 'META',
    name: 'Meta Platforms Inc.',
    currentPrice: 505.42,
    dailyChange: -8.15,
    dailyChangePercent: -1.59,
  },
  {
    id: '3',
    symbol: 'AMZN',
    name: 'Amazon.com Inc.',
    currentPrice: 185.30,
    dailyChange: 2.45,
    dailyChangePercent: 1.34,
  },
  {
    id: '4',
    symbol: 'NFLX',
    name: 'Netflix Inc.',
    currentPrice: 478.92,
    dailyChange: 11.23,
    dailyChangePercent: 2.40,
  },
];

const initialState: WatchlistState = {
  items: initialWatchlist,
  isLoading: false,
  error: null,
};

const watchlistSlice = createSlice({
  name: 'watchlist',
  initialState,
  reducers: {
    addToWatchlist: (state, action: PayloadAction<Omit<WatchlistItem, 'id'>>) => {
      const exists = state.items.some(item => item.symbol === action.payload.symbol);
      if (!exists) {
        state.items.push({
          ...action.payload,
          id: Date.now().toString(),
        });
      }
    },
    removeFromWatchlist: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.id !== action.payload);
    },
    updateWatchlistPrices: (state, action: PayloadAction<{ symbol: string; price: number; change: number; changePercent: number }[]>) => {
      action.payload.forEach(update => {
        const item = state.items.find(i => i.symbol === update.symbol);
        if (item) {
          item.currentPrice = update.price;
          item.dailyChange = update.change;
          item.dailyChangePercent = update.changePercent;
        }
      });
    },
    setWatchlistLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setWatchlistError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setWatchlist: (state, action: PayloadAction<WatchlistItem[]>) => {
      state.items = action.payload;
    },
  },
});

export const {
  addToWatchlist,
  removeFromWatchlist,
  updateWatchlistPrices,
  setWatchlistLoading,
  setWatchlistError,
  setWatchlist,
} = watchlistSlice.actions;

export default watchlistSlice.reducer;

