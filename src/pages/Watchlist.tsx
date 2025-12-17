import { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { WatchlistItem } from '../types';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { Card, Button } from '../components/common';
import { WatchlistCard, AddToWatchlistModal } from '../components/watchlist';
import { StockMiniChart } from '../components/charts';

const Watchlist = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const watchlist = useSelector((state: RootState) => state.watchlist.items);

  // Calculate watchlist summary
  const summary = {
    gainers: watchlist.filter((item: WatchlistItem) => item.dailyChangePercent > 0).length,
    losers: watchlist.filter((item: WatchlistItem) => item.dailyChangePercent < 0).length,
    avgChange: watchlist.length > 0
      ? watchlist.reduce((sum: number, item: WatchlistItem) => sum + item.dailyChangePercent, 0) / watchlist.length
      : 0,
  };

  // Top movers
  const topGainer = [...watchlist].sort((a, b) => b.dailyChangePercent - a.dailyChangePercent)[0];
  const topLoser = [...watchlist].sort((a, b) => a.dailyChangePercent - b.dailyChangePercent)[0];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Watchlist</h1>
          <p className="text-gray-400 mt-1">Track stocks you're interested in</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add to Watchlist
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="gradient" padding="md">
          <p className="text-sm text-gray-400 mb-1">Watching</p>
          <p className="text-2xl font-bold text-white">{watchlist.length}</p>
          <p className="text-xs text-gray-500 mt-1">stocks</p>
        </Card>
        <Card variant="gradient" padding="md">
          <p className="text-sm text-gray-400 mb-1">Gainers Today</p>
          <p className="text-2xl font-bold text-gain">{summary.gainers}</p>
          <p className="text-xs text-gray-500 mt-1">stocks up</p>
        </Card>
        <Card variant="gradient" padding="md">
          <p className="text-sm text-gray-400 mb-1">Losers Today</p>
          <p className="text-2xl font-bold text-loss">{summary.losers}</p>
          <p className="text-xs text-gray-500 mt-1">stocks down</p>
        </Card>
        <Card variant="gradient" padding="md">
          <p className="text-sm text-gray-400 mb-1">Avg. Change</p>
          <p className={`text-2xl font-bold ${summary.avgChange >= 0 ? 'text-gain' : 'text-loss'}`}>
            {formatPercent(summary.avgChange)}
          </p>
          <p className="text-xs text-gray-500 mt-1">today</p>
        </Card>
      </div>

      {/* Top Movers */}
      {watchlist.length >= 2 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topGainer && topGainer.dailyChangePercent > 0 && (
            <Card variant="default" padding="md" className="border-gain/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                    🚀 Top Gainer
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gain/10 flex items-center justify-center text-gain font-bold">
                      {topGainer.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{topGainer.symbol}</p>
                      <p className="text-sm text-gray-400">{topGainer.name}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-white">{formatCurrency(topGainer.currentPrice)}</p>
                  <p className="text-gain font-medium">{formatPercent(topGainer.dailyChangePercent)}</p>
                </div>
              </div>
              <div className="mt-4">
                <StockMiniChart isPositive={true} height={50} />
              </div>
            </Card>
          )}

          {topLoser && topLoser.dailyChangePercent < 0 && (
            <Card variant="default" padding="md" className="border-loss/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                    📉 Top Loser
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-loss/10 flex items-center justify-center text-loss font-bold">
                      {topLoser.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{topLoser.symbol}</p>
                      <p className="text-sm text-gray-400">{topLoser.name}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-white">{formatCurrency(topLoser.currentPrice)}</p>
                  <p className="text-loss font-medium">{formatPercent(topLoser.dailyChangePercent)}</p>
                </div>
              </div>
              <div className="mt-4">
                <StockMiniChart isPositive={false} height={50} />
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Main Watchlist */}
      <WatchlistCard />

      {/* Add to Watchlist Modal */}
      <AddToWatchlistModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
};

export default Watchlist;
