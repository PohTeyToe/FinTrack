// API utilities for stock data
// Uses the backend market data proxy (yfinance) with local mock fallback

import { StockQuote, StockSearchResult } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Static search results for client-side filtering when the backend is unreachable.
const knownStocks: StockSearchResult[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', type: 'Equity', region: 'United States' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'Equity', region: 'United States' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'Equity', region: 'United States' },
  { symbol: 'TSLA', name: 'Tesla Inc.', type: 'Equity', region: 'United States' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'Equity', region: 'United States' },
  { symbol: 'AMD', name: 'Advanced Micro Devices', type: 'Equity', region: 'United States' },
  { symbol: 'META', name: 'Meta Platforms Inc.', type: 'Equity', region: 'United States' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'Equity', region: 'United States' },
  { symbol: 'NFLX', name: 'Netflix Inc.', type: 'Equity', region: 'United States' },
  { symbol: 'DIS', name: 'The Walt Disney Company', type: 'Equity', region: 'United States' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', type: 'Equity', region: 'United States' },
  { symbol: 'V', name: 'Visa Inc.', type: 'Equity', region: 'United States' },
];

/**
 * Fetch stock quote from the backend market data endpoint.
 * Returns a clear error when market data is unavailable instead of fake prices.
 */
export const fetchStockQuote = async (symbol: string): Promise<StockQuote> => {
  try {
    const token = localStorage.getItem('fintrack-token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Token ${token}`;
    }

    const response = await fetch(`${API_BASE}/market/${symbol.toUpperCase()}/`, { headers });

    if (!response.ok) {
      throw new Error(`Market data unavailable for ${symbol}`);
    }

    const data = await response.json();
    return {
      symbol: data.symbol,
      name: data.name || symbol,
      price: data.price,
      change: data.change,
      changePercent: data.change_percent,
      high: data.high,
      low: data.low,
      open: data.open,
      previousClose: data.previous_close,
      volume: data.volume,
    };
  } catch (error) {
    console.error('Error fetching stock quote:', error);
    throw new Error(`Market data unavailable for ${symbol}. The backend may be unreachable.`);
  }
};

/**
 * Search for stocks by keyword using the local known-stocks list.
 */
export const searchStocks = async (query: string): Promise<StockSearchResult[]> => {
  if (!query || query.length < 1) return [];

  const filtered = knownStocks.filter(
    stock =>
      stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
      stock.name.toLowerCase().includes(query.toLowerCase())
  );
  return filtered.slice(0, 5);
};

/**
 * Get multiple stock quotes
 */
export const fetchMultipleQuotes = async (symbols: string[]): Promise<StockQuote[]> => {
  const quotes = await Promise.all(
    symbols.map(symbol => fetchStockQuote(symbol).catch(() => null))
  );
  return quotes.filter((q): q is StockQuote => q !== null);
};
