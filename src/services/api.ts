/**
 * API service module for communicating with the Django backend.
 *
 * Provides typed functions for every backend endpoint.
 * Falls back to the existing frontend mock data when the
 * backend is unreachable (development without Docker).
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

interface RequestOptions {
  method?: string;
  body?: unknown;
  params?: Record<string, string>;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, params } = options;

  let url = `${API_BASE}${path}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const token = localStorage.getItem('fintrack-token');
  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || error.detail || `API error: ${response.status}`);
  }

  return response.json();
}

// ---------- Portfolio endpoints ----------

export interface PortfolioResponse {
  id: number;
  name: string;
  description: string;
  holdings: HoldingResponse[];
  total_value: number;
  total_gain: number;
  created_at: string;
}

export interface HoldingResponse {
  id: number;
  symbol: string;
  name: string;
  shares: number;
  avg_cost: number;
  current_price: number;
  sector: string;
  market_value: number;
  total_cost: number;
  gain_loss: number;
  gain_loss_percent: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const portfolioApi = {
  list: () => request<PaginatedResponse<PortfolioResponse>>('/portfolios/'),
  get: (id: number) => request<PortfolioResponse>(`/portfolios/${id}/`),
  create: (data: { name: string; description?: string }) =>
    request<PortfolioResponse>('/portfolios/', { method: 'POST', body: data }),
  update: (id: number, data: Partial<{ name: string; description: string }>) =>
    request<PortfolioResponse>(`/portfolios/${id}/`, { method: 'PATCH', body: data }),
  delete: (id: number) =>
    request<void>(`/portfolios/${id}/`, { method: 'DELETE' }),
  holdings: (id: number) =>
    request<HoldingResponse[]>(`/portfolios/${id}/holdings/`),
  addHolding: (id: number, data: { symbol: string; shares: number; avg_cost: number; sector?: string }) =>
    request<HoldingResponse>(`/portfolios/${id}/holdings/`, { method: 'POST', body: data }),
  returns: (id: number, period?: string) =>
    request<PortfolioReturnsResponse>(`/portfolios/${id}/returns/`, {
      params: period ? { period } : undefined,
    }),
  allocation: (id: number) =>
    request<AllocationResponse>(`/portfolios/${id}/allocation/`),
};

export interface PortfolioReturnsResponse {
  total_value: number;
  total_cost: number;
  total_gain: number;
  total_gain_percent: number;
  daily_change: number;
  period_return: number;
  holdings: Array<{ symbol: string; market_value: number; gain_loss: number; gain_loss_pct: number }>;
  time_series: Array<{ date: string; value: number }>;
}

export interface AllocationResponse {
  sectors: Array<{
    sector: string;
    value: number;
    percentage: number;
    count: number;
    symbols: string[];
  }>;
  hhi: number;
  diversification_score: number;
}

// ---------- Analytics endpoints ----------

export interface SpendingBreakdownResponse {
  total: number;
  categories: Array<{
    category: string;
    color: string;
    amount: number;
    percentage: number;
    count: number;
  }>;
  monthly_trend: Array<{ month: string; amount: number; count: number }>;
  anomalies: Array<{
    category: string;
    month: string;
    amount: number;
    expected: number;
    deviation: number;
  }>;
}

export interface TrendResponse {
  direction: 'increasing' | 'decreasing' | 'stable';
  slope: number;
  rolling_7d: Array<{ date: string; value: number }>;
  rolling_30d: Array<{ date: string; value: number }>;
}

export const analyticsApi = {
  breakdown: (period?: string) =>
    request<SpendingBreakdownResponse>('/analytics/spending/breakdown/', {
      params: period ? { period } : undefined,
    }),
  trends: () => request<TrendResponse>('/analytics/spending/trends/'),
  report: (start: string, end: string) =>
    request<Record<string, unknown>>('/analytics/spending/report/', {
      params: { start, end },
    }),
};

// ---------- Watchlist endpoints ----------

export interface WatchlistItemResponse {
  id: number;
  symbol: string;
  name: string;
  target_price: number | null;
  alert_type: 'ABOVE' | 'BELOW';
  notes: string;
  alert_count: number;
  created_at: string;
}

export const watchlistApi = {
  list: () => request<PaginatedResponse<WatchlistItemResponse>>('/watchlist/'),
  create: (data: { symbol: string; name?: string; target_price?: number; alert_type?: string }) =>
    request<WatchlistItemResponse>('/watchlist/', { method: 'POST', body: data }),
  update: (id: number, data: Partial<WatchlistItemResponse>) =>
    request<WatchlistItemResponse>(`/watchlist/${id}/`, { method: 'PATCH', body: data }),
  delete: (id: number) =>
    request<void>(`/watchlist/${id}/`, { method: 'DELETE' }),
};

// ---------- Market data endpoints ----------

export interface MarketQuoteResponse {
  symbol: string;
  name: string;
  price: number;
  change: number;
  change_percent: number;
  high: number;
  low: number;
  open: number;
  previous_close: number;
  volume: number;
}

export interface HistoricalDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export const marketApi = {
  quote: (symbol: string) =>
    request<MarketQuoteResponse>(`/market/${symbol}/`),
  history: (symbol: string, period?: string) =>
    request<HistoricalDataPoint[]>(`/market/${symbol}/history/`, {
      params: period ? { period } : undefined,
    }),
};
