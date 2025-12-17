import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Holding, ChartDataPoint } from '../types';

interface PortfolioState {
  holdings: Holding[];
  historicalData: ChartDataPoint[];
  isLoading: boolean;
  error: string | null;
}

// Mock initial holdings data
const initialHoldings: Holding[] = [
  {
    id: '1',
    symbol: 'AAPL',
    name: 'Apple Inc.',
    shares: 15,
    avgCost: 142.50,
    currentPrice: 178.72,
    dailyChange: 2.34,
    dailyChangePercent: 1.33,
  },
  {
    id: '2',
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    shares: 8,
    avgCost: 98.20,
    currentPrice: 141.80,
    dailyChange: -1.25,
    dailyChangePercent: -0.87,
  },
  {
    id: '3',
    symbol: 'MSFT',
    name: 'Microsoft Corp.',
    shares: 12,
    avgCost: 285.00,
    currentPrice: 378.91,
    dailyChange: 4.56,
    dailyChangePercent: 1.22,
  },
  {
    id: '4',
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    shares: 5,
    avgCost: 210.00,
    currentPrice: 251.28,
    dailyChange: -8.42,
    dailyChangePercent: -3.24,
  },
  {
    id: '5',
    symbol: 'NVDA',
    name: 'NVIDIA Corp.',
    shares: 10,
    avgCost: 420.00,
    currentPrice: 495.22,
    dailyChange: 12.85,
    dailyChangePercent: 2.66,
  },
];

// Generate mock historical data
const generateHistoricalData = (): ChartDataPoint[] => {
  const data: ChartDataPoint[] = [];
  const today = new Date();
  let value = 42000;
  
  for (let i = 365; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Add some realistic variation
    const change = (Math.random() - 0.48) * 800;
    value = Math.max(35000, Math.min(55000, value + change));
    
    data.push({
      date: date.toISOString().split('T')[0],
      value: Math.round(value * 100) / 100,
    });
  }
  
  return data;
};

const initialState: PortfolioState = {
  holdings: initialHoldings,
  historicalData: generateHistoricalData(),
  isLoading: false,
  error: null,
};

const portfolioSlice = createSlice({
  name: 'portfolio',
  initialState,
  reducers: {
    addHolding: (state, action: PayloadAction<Omit<Holding, 'id'>>) => {
      const newHolding: Holding = {
        ...action.payload,
        id: Date.now().toString(),
      };
      state.holdings.push(newHolding);
    },
    updateHolding: (state, action: PayloadAction<Holding>) => {
      const index = state.holdings.findIndex(h => h.id === action.payload.id);
      if (index !== -1) {
        state.holdings[index] = action.payload;
      }
    },
    removeHolding: (state, action: PayloadAction<string>) => {
      state.holdings = state.holdings.filter(h => h.id !== action.payload);
    },
    updatePrices: (state, action: PayloadAction<{ symbol: string; price: number; change: number; changePercent: number }[]>) => {
      action.payload.forEach(update => {
        const holding = state.holdings.find(h => h.symbol === update.symbol);
        if (holding) {
          holding.currentPrice = update.price;
          holding.dailyChange = update.change;
          holding.dailyChangePercent = update.changePercent;
        }
      });
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setHoldings: (state, action: PayloadAction<Holding[]>) => {
      state.holdings = action.payload;
    },
  },
});

export const {
  addHolding,
  updateHolding,
  removeHolding,
  updatePrices,
  setLoading,
  setError,
  setHoldings,
} = portfolioSlice.actions;

export default portfolioSlice.reducer;

