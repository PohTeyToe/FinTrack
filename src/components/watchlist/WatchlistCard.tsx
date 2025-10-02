import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { removeFromWatchlist } from '../../store/watchlistSlice';
import { addHolding } from '../../store/portfolioSlice';
import { WatchlistItem } from '../../types';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import { Card, CardHeader, CardTitle } from '../common';
import { StockMiniChart } from '../charts';

interface WatchlistCardProps {
  onAddToPortfolio?: (symbol: string) => void;
  compact?: boolean;
}

const WatchlistCard = ({ onAddToPortfolio, compact = false }: WatchlistCardProps) => {
  const items = useSelector((state: RootState) => state.watchlist.items);
  const dispatch = useDispatch();

  const handleRemove = (id: string) => {
    dispatch(removeFromWatchlist(id));
  };

  const handleQuickAdd = (item: WatchlistItem) => {
    if (onAddToPortfolio) {
      onAddToPortfolio(item.symbol);
    } else {
      // Quick add with 1 share at current price
      dispatch(addHolding({
        symbol: item.symbol,
        name: item.name,
        shares: 1,
        avgCost: item.currentPrice,
        currentPrice: item.currentPrice,
        dailyChange: item.dailyChange,
        dailyChangePercent: item.dailyChangePercent,
      }));
      dispatch(removeFromWatchlist(item.id));
    }
  };

  const WatchlistRow = ({ item, index }: { item: WatchlistItem; index: number }) => {
    const isPositive = item.dailyChange >= 0;

    return (
      <div
        className={`
          flex items-center justify-between py-3 border-b border-dark-600 last:border-0
          hover:bg-dark-700/50 transition-colors animate-fade-in
          ${compact ? '' : '-mx-6 px-6'}
        `}
        style={{ animationDelay: `${index * 50}ms` }}
      >
        {/* Stock info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`
            ${compact ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'}
            rounded-xl bg-gradient-to-br from-dark-500 to-dark-600 
            flex items-center justify-center text-gray-300 font-semibold
          `}>
            {item.symbol.slice(0, 2)}
          </div>
          <div className="min-w-0">
            <p className={`font-semibold text-white ${compact ? 'text-sm' : ''}`}>{item.symbol}</p>
            {!compact && <p className="text-sm text-gray-400 truncate">{item.name}</p>}
          </div>
        </div>

        {/* Mini chart - only on non-compact */}
        {!compact && (
          <div className="hidden sm:block mx-4">
            <StockMiniChart isPositive={isPositive} />
          </div>
        )}

        {/* Price */}
        <div className={`text-right ${compact ? 'mx-2' : 'mx-4'}`}>
          <p className={`font-semibold text-white ${compact ? 'text-sm' : ''}`}>
            {formatCurrency(item.currentPrice)}
          </p>
          <p className={`${compact ? 'text-xs' : 'text-sm'} ${isPositive ? 'text-gain' : 'text-loss'}`}>
            {formatPercent(item.dailyChangePercent)}
          </p>
        </div>

        {/* Actions */}
        {!compact && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleQuickAdd(item)}
              className="p-2 text-gray-400 hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
              title="Add to portfolio"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <button
              onClick={() => handleRemove(item.id)}
              className="p-2 text-gray-400 hover:text-loss hover:bg-loss/10 rounded-lg transition-colors"
              title="Remove from watchlist"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    );
  };

  if (compact) {
    return (
      <div>
        {items.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No stocks in watchlist
          </p>
        ) : (
          items.slice(0, 4).map((item: WatchlistItem, index: number) => (
            <WatchlistRow key={item.id} item={item} index={index} />
          ))
        )}
      </div>
    );
  }

  return (
    <Card variant="default" padding="md">
      <CardHeader>
        <CardTitle>Watchlist</CardTitle>
        <span className="text-sm text-gray-400">{items.length} stocks</span>
      </CardHeader>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-dark-600 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <p className="text-gray-400 mb-2">Your watchlist is empty</p>
          <p className="text-sm text-gray-500">
            Add stocks you want to track
          </p>
        </div>
      ) : (
        <div>
          {/* Header */}
          <div className="flex items-center justify-between py-2 border-b border-dark-600 text-xs text-gray-500 uppercase tracking-wider">
            <span className="flex-1">Symbol</span>
            <span className="hidden sm:block mx-4 w-[80px]"></span>
            <span className="text-right mx-4">Price</span>
            <span className="w-[72px]"></span>
          </div>

          {/* Rows */}
          {items.map((item: WatchlistItem, index: number) => (
            <WatchlistRow key={item.id} item={item} index={index} />
          ))}
        </div>
      )}
    </Card>
  );
};

export default WatchlistCard;
