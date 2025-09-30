import { useState, useEffect, useCallback } from 'react';
import { StockQuote, StockSearchResult } from '../types';
import { fetchStockQuote, searchStocks } from '../utils/api';

interface UseStockDataReturn {
  quote: StockQuote | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching a single stock quote
 */
export function useStockData(symbol: string | null): UseStockDataReturn {
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!symbol) {
      setQuote(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchStockQuote(symbol);
      setQuote(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stock data');
      setQuote(null);
    } finally {
      setIsLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { quote, isLoading, error, refetch: fetchData };
}

interface UseStockSearchReturn {
  results: StockSearchResult[];
  isSearching: boolean;
  searchError: string | null;
  search: (query: string) => Promise<void>;
  clearResults: () => void;
}

/**
 * Hook for searching stocks
 */
export function useStockSearch(): UseStockSearchReturn {
  const [results, setResults] = useState<StockSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query || query.length < 1) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const data = await searchStocks(query);
      setResults(data);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setSearchError(null);
  }, []);

  return { results, isSearching, searchError, search, clearResults };
}

/**
 * Hook for managing multiple stock quotes with auto-refresh
 */
export function useMultipleStocks(
  symbols: string[],
  refreshInterval: number = 60000 // 1 minute default
) {
  const [quotes, setQuotes] = useState<Map<string, StockQuote>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllQuotes = useCallback(async () => {
    if (symbols.length === 0) {
      setQuotes(new Map());
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const quotesMap = new Map<string, StockQuote>();
      
      await Promise.all(
        symbols.map(async symbol => {
          try {
            const quote = await fetchStockQuote(symbol);
            quotesMap.set(symbol, quote);
          } catch {
            // Individual failures don't stop the whole batch
            console.warn(`Failed to fetch ${symbol}`);
          }
        })
      );

      setQuotes(quotesMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch quotes');
    } finally {
      setIsLoading(false);
    }
  }, [symbols]);

  useEffect(() => {
    fetchAllQuotes();

    // Set up auto-refresh
    const interval = setInterval(fetchAllQuotes, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchAllQuotes, refreshInterval]);

  return { quotes, isLoading, error, refetch: fetchAllQuotes };
}

export default useStockData;

