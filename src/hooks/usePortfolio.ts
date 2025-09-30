import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { PortfolioSummary, ChartDataPoint, TimeRange, Holding } from '../types';

/**
 * Hook for computing portfolio summary statistics
 */
export function usePortfolioSummary(): PortfolioSummary {
  const holdings = useSelector((state: RootState) => state.portfolio.holdings);

  return useMemo(() => {
    if (holdings.length === 0) {
      return {
        totalValue: 0,
        totalCost: 0,
        totalGain: 0,
        totalGainPercent: 0,
        dailyChange: 0,
        dailyChangePercent: 0,
      };
    }

    const totalValue = holdings.reduce(
      (sum: number, h: Holding) => sum + h.currentPrice * h.shares,
      0
    );

    const totalCost = holdings.reduce(
      (sum: number, h: Holding) => sum + h.avgCost * h.shares,
      0
    );

    const totalGain = totalValue - totalCost;
    const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

    const dailyChange = holdings.reduce(
      (sum: number, h: Holding) => sum + h.dailyChange * h.shares,
      0
    );

    const previousValue = totalValue - dailyChange;
    const dailyChangePercent = previousValue > 0 ? (dailyChange / previousValue) * 100 : 0;

    return {
      totalValue,
      totalCost,
      totalGain,
      totalGainPercent,
      dailyChange,
      dailyChangePercent,
    };
  }, [holdings]);
}

/**
 * Hook for filtering historical data based on time range
 */
export function usePortfolioHistory(timeRange: TimeRange): ChartDataPoint[] {
  const historicalData = useSelector((state: RootState) => state.portfolio.historicalData);

  return useMemo(() => {
    if (historicalData.length === 0) return [];

    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case '1W':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case '1M':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case '3M':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 3);
        break;
      case '1Y':
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'ALL':
      default:
        return historicalData;
    }

    return historicalData.filter((point: ChartDataPoint) => new Date(point.date) >= startDate);
  }, [historicalData, timeRange]);
}

/**
 * Hook for getting top gainers and losers
 */
export function usePortfolioMovers() {
  const holdings = useSelector((state: RootState) => state.portfolio.holdings);

  return useMemo(() => {
    const sorted = [...holdings].sort(
      (a, b) => b.dailyChangePercent - a.dailyChangePercent
    );

    return {
      topGainers: sorted.filter(h => h.dailyChangePercent > 0).slice(0, 3),
      topLosers: sorted.filter(h => h.dailyChangePercent < 0).slice(-3).reverse(),
    };
  }, [holdings]);
}

interface AllocationItem {
  symbol: string;
  name: string;
  value: number;
  percentage: number;
}

/**
 * Hook for portfolio allocation breakdown
 */
export function usePortfolioAllocation(): AllocationItem[] {
  const holdings = useSelector((state: RootState) => state.portfolio.holdings);

  return useMemo(() => {
    const totalValue = holdings.reduce(
      (sum: number, h: Holding) => sum + h.currentPrice * h.shares,
      0
    );

    return holdings.map((holding: Holding) => ({
      symbol: holding.symbol,
      name: holding.name,
      value: holding.currentPrice * holding.shares,
      percentage: totalValue > 0 
        ? ((holding.currentPrice * holding.shares) / totalValue) * 100 
        : 0,
    })).sort((a: AllocationItem, b: AllocationItem) => b.value - a.value);
  }, [holdings]);
}

export default usePortfolioSummary;
