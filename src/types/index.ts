// Core data types for FinTrack

export interface Holding {
  id: string;
  symbol: string;
  name: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  dailyChange: number;
  dailyChangePercent: number;
}

export interface Expense {
  id: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  date: string;
}

export type ExpenseCategory = 'food' | 'transport' | 'entertainment' | 'bills' | 'other';

export interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  currentPrice: number;
  dailyChange: number;
  dailyChangePercent: number;
}

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  volume: number;
}

export interface StockSearchResult {
  symbol: string;
  name: string;
  type: string;
  region: string;
}

export interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalGain: number;
  totalGainPercent: number;
  dailyChange: number;
  dailyChangePercent: number;
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface SpendingByCategory {
  category: ExpenseCategory;
  amount: number;
  percentage: number;
  color: string;
}

export type TimeRange = '1W' | '1M' | '3M' | '1Y' | 'ALL';

export interface ApiError {
  message: string;
  code?: string;
}

// Category display configuration
export const CATEGORY_CONFIG: Record<ExpenseCategory, { label: string; color: string; icon: string }> = {
  food: { label: 'Food & Dining', color: '#f97316', icon: '🍔' },
  transport: { label: 'Transport', color: '#3b82f6', icon: '🚗' },
  entertainment: { label: 'Entertainment', color: '#a855f7', icon: '🎬' },
  bills: { label: 'Bills & Utilities', color: '#ef4444', icon: '📄' },
  other: { label: 'Other', color: '#6b7280', icon: '📦' },
};

