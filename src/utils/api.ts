// API utilities for stock data
// Using Alpha Vantage API with fallback to mock data

import { StockQuote, StockSearchResult } from '../types';

const API_KEY = import.meta.env.VITE_ALPHA_VANTAGE_KEY || 'demo';
const BASE_URL = 'https://www.alphavantage.co/query';

// Mock data for when API limits are hit
const mockQuotes: Record<string, StockQuote> = {
  AAPL: {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: 178.72,
    change: 2.34,
    changePercent: 1.33,
    high: 180.12,
    low: 176.55,
    open: 177.25,
    previousClose: 176.38,
    volume: 52436789,
  },
  GOOGL: {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    price: 141.80,
    change: -1.25,
    changePercent: -0.87,
    high: 143.50,
    low: 140.20,
    open: 142.80,
    previousClose: 143.05,
    volume: 21543678,
  },
  MSFT: {
    symbol: 'MSFT',
    name: 'Microsoft Corp.',
    price: 378.91,
    change: 4.56,
    changePercent: 1.22,
    high: 380.25,
    low: 374.10,
    open: 375.50,
    previousClose: 374.35,
    volume: 18765432,
  },
  TSLA: {
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    price: 251.28,
    change: -8.42,
    changePercent: -3.24,
    high: 260.50,
    low: 248.90,
    open: 259.70,
    previousClose: 259.70,
    volume: 98765432,
  },
  NVDA: {
    symbol: 'NVDA',
    name: 'NVIDIA Corp.',
    price: 495.22,
    change: 12.85,
    changePercent: 2.66,
    high: 498.50,
    low: 480.25,
    open: 482.37,
    previousClose: 482.37,
    volume: 45678901,
  },
  AMD: {
    symbol: 'AMD',
    name: 'Advanced Micro Devices',
    price: 145.67,
    change: 3.21,
    changePercent: 2.25,
    high: 147.20,
    low: 142.80,
    open: 143.50,
    previousClose: 142.46,
    volume: 34567890,
  },
  META: {
    symbol: 'META',
    name: 'Meta Platforms Inc.',
    price: 505.42,
    change: -8.15,
    changePercent: -1.59,
    high: 515.30,
    low: 502.10,
    open: 513.57,
    previousClose: 513.57,
    volume: 12345678,
  },
  AMZN: {
    symbol: 'AMZN',
    name: 'Amazon.com Inc.',
    price: 185.30,
    change: 2.45,
    changePercent: 1.34,
    high: 186.80,
    low: 182.90,
    open: 183.50,
    previousClose: 182.85,
    volume: 28976543,
  },
  NFLX: {
    symbol: 'NFLX',
    name: 'Netflix Inc.',
    price: 478.92,
    change: 11.23,
    changePercent: 2.40,
    high: 480.50,
    low: 465.30,
    open: 467.69,
    previousClose: 467.69,
    volume: 8765432,
  },
};

const mockSearchResults: StockSearchResult[] = [
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
 * Fetch stock quote from API with fallback to mock data
 */
export const fetchStockQuote = async (symbol: string): Promise<StockQuote> => {
  // First check mock data
  const mockData = mockQuotes[symbol.toUpperCase()];
  
  if (API_KEY === 'demo' || !API_KEY) {
    if (mockData) {
      // Add some random variation to make it feel more real
      const variation = (Math.random() - 0.5) * 2;
      return {
        ...mockData,
        price: mockData.price + variation,
        change: mockData.change + variation * 0.1,
      };
    }
    throw new Error(`Stock ${symbol} not found in mock data`);
  }

  try {
    const response = await fetch(
      `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error('API request failed');
    }

    const data = await response.json();
    
    // Check for API limit message
    if (data['Note'] || data['Information']) {
      console.warn('API limit reached, using mock data');
      if (mockData) return mockData;
      throw new Error('API limit reached');
    }

    const quote = data['Global Quote'];
    if (!quote || Object.keys(quote).length === 0) {
      if (mockData) return mockData;
      throw new Error(`No data found for ${symbol}`);
    }

    return {
      symbol: quote['01. symbol'],
      name: mockData?.name || symbol,
      price: parseFloat(quote['05. price']),
      change: parseFloat(quote['09. change']),
      changePercent: parseFloat(quote['10. change percent']?.replace('%', '')),
      high: parseFloat(quote['03. high']),
      low: parseFloat(quote['04. low']),
      open: parseFloat(quote['02. open']),
      previousClose: parseFloat(quote['08. previous close']),
      volume: parseInt(quote['06. volume']),
    };
  } catch (error) {
    console.error('Error fetching stock quote:', error);
    if (mockData) return mockData;
    throw error;
  }
};

/**
 * Search for stocks by keyword
 */
export const searchStocks = async (query: string): Promise<StockSearchResult[]> => {
  if (!query || query.length < 1) return [];

  // Filter mock results for demo/no API key
  if (API_KEY === 'demo' || !API_KEY) {
    const filtered = mockSearchResults.filter(
      stock =>
        stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
        stock.name.toLowerCase().includes(query.toLowerCase())
    );
    return filtered.slice(0, 5);
  }

  try {
    const response = await fetch(
      `${BASE_URL}?function=SYMBOL_SEARCH&keywords=${query}&apikey=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error('Search request failed');
    }

    const data = await response.json();

    // Check for API limit
    if (data['Note'] || data['Information']) {
      console.warn('API limit reached, using mock search');
      return mockSearchResults.filter(
        stock =>
          stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
          stock.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5);
    }

    const matches = data['bestMatches'] || [];
    return matches.slice(0, 5).map((match: Record<string, string>) => ({
      symbol: match['1. symbol'],
      name: match['2. name'],
      type: match['3. type'],
      region: match['4. region'],
    }));
  } catch (error) {
    console.error('Error searching stocks:', error);
    // Return mock results as fallback
    return mockSearchResults.filter(
      stock =>
        stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
        stock.name.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);
  }
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

