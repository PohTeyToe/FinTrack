import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addToWatchlist } from '../../store/watchlistSlice';
import { RootState } from '../../store/store';
import { useStockSearch, useStockData } from '../../hooks/useStockData';
import { StockSearchResult, WatchlistItem } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { Modal, Input, Button } from '../common';

interface AddToWatchlistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddToWatchlistModal = ({ isOpen, onClose }: AddToWatchlistModalProps) => {
  const dispatch = useDispatch();
  const watchlist = useSelector((state: RootState) => state.watchlist.items);
  const { results, isSearching, search, clearResults } = useStockSearch();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStock, setSelectedStock] = useState<StockSearchResult | null>(null);
  const { quote, isLoading: isLoadingQuote } = useStockData(selectedStock?.symbol ?? null);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 1) {
        search(searchQuery);
      } else {
        clearResults();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, search, clearResults]);

  // Reset form on close
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSelectedStock(null);
      clearResults();
    }
  }, [isOpen, clearResults]);

  const handleSelectStock = useCallback((stock: StockSearchResult) => {
    setSelectedStock(stock);
    setSearchQuery('');
    clearResults();
  }, [clearResults]);

  const isAlreadyInWatchlist = selectedStock 
    ? watchlist.some((item: WatchlistItem) => item.symbol === selectedStock.symbol)
    : false;

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStock || !quote || isAlreadyInWatchlist) return;

    dispatch(addToWatchlist({
      symbol: selectedStock.symbol,
      name: selectedStock.name,
      currentPrice: quote.price,
      dailyChange: quote.change,
      dailyChangePercent: quote.changePercent,
    }));

    onClose();
  }, [selectedStock, quote, isAlreadyInWatchlist, dispatch, onClose]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add to Watchlist" size="sm">
      <form onSubmit={handleSubmit}>
        {/* Stock Search */}
        {!selectedStock ? (
          <div className="mb-6">
            <Input
              label="Search Stock"
              placeholder="Search by symbol or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
              rightIcon={isSearching ? (
                <div className="w-4 h-4 border-2 border-dark-400 border-t-accent rounded-full animate-spin" />
              ) : undefined}
            />

            {/* Search Results */}
            {results.length > 0 && (
              <div className="mt-2 bg-dark-700 border border-dark-500 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                {results.map((stock) => {
                  const alreadyAdded = watchlist.some((item: WatchlistItem) => item.symbol === stock.symbol);
                  return (
                    <button
                      key={stock.symbol}
                      type="button"
                      onClick={() => !alreadyAdded && handleSelectStock(stock)}
                      disabled={alreadyAdded}
                      className={`
                        w-full px-4 py-3 flex items-center justify-between transition-colors text-left
                        ${alreadyAdded 
                          ? 'opacity-50 cursor-not-allowed' 
                          : 'hover:bg-dark-600'
                        }
                      `}
                    >
                      <div>
                        <p className="font-medium text-white">{stock.symbol}</p>
                        <p className="text-sm text-gray-400 truncate">{stock.name}</p>
                      </div>
                      {alreadyAdded && (
                        <span className="text-xs text-gray-500">In watchlist</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Selected Stock Display */
          <div className="mb-6 p-4 bg-dark-700 rounded-xl border border-dark-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-dark-500 to-dark-600 flex items-center justify-center text-gray-300 font-bold">
                  {selectedStock.symbol.slice(0, 2)}
                </div>
                <div>
                  <p className="font-semibold text-white">{selectedStock.symbol}</p>
                  <p className="text-sm text-gray-400">{selectedStock.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStock(null)}
                className="p-2 text-gray-400 hover:text-white hover:bg-dark-600 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Current Price */}
            {isLoadingQuote ? (
              <div className="mt-3 h-6 bg-dark-600 rounded animate-pulse" />
            ) : quote && (
              <div className="mt-3 flex items-center gap-4 text-sm">
                <span className="text-gray-400">Current Price:</span>
                <span className="font-medium text-white">{formatCurrency(quote.price)}</span>
                <span className={quote.changePercent >= 0 ? 'text-gain' : 'text-loss'}>
                  {quote.changePercent >= 0 ? '+' : ''}{quote.changePercent.toFixed(2)}%
                </span>
              </div>
            )}

            {isAlreadyInWatchlist && (
              <p className="mt-3 text-sm text-yellow-500">
                This stock is already in your watchlist
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            disabled={!selectedStock || !quote || isAlreadyInWatchlist}
            isLoading={isLoadingQuote}
          >
            Add to Watchlist
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddToWatchlistModal;
