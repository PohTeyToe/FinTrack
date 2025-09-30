import { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { addHolding } from '../../store/portfolioSlice';
import { useStockSearch, useStockData } from '../../hooks/useStockData';
import { StockSearchResult } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { Modal, Input, Button } from '../common';

interface AddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddStockModal = ({ isOpen, onClose }: AddStockModalProps) => {
  const dispatch = useDispatch();
  const { results, isSearching, search, clearResults } = useStockSearch();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStock, setSelectedStock] = useState<StockSearchResult | null>(null);
  const [shares, setShares] = useState('');
  const [avgCost, setAvgCost] = useState('');
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
      setShares('');
      setAvgCost('');
      clearResults();
    }
  }, [isOpen, clearResults]);

  const handleSelectStock = useCallback((stock: StockSearchResult) => {
    setSelectedStock(stock);
    setSearchQuery('');
    clearResults();
  }, [clearResults]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStock || !quote || !shares || !avgCost) return;

    dispatch(addHolding({
      symbol: selectedStock.symbol,
      name: selectedStock.name,
      shares: parseFloat(shares),
      avgCost: parseFloat(avgCost),
      currentPrice: quote.price,
      dailyChange: quote.change,
      dailyChangePercent: quote.changePercent,
    }));

    onClose();
  }, [selectedStock, quote, shares, avgCost, dispatch, onClose]);

  const totalCost = shares && avgCost ? parseFloat(shares) * parseFloat(avgCost) : 0;
  const currentValue = shares && quote ? parseFloat(shares) * quote.price : 0;
  const potentialGain = currentValue - totalCost;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Stock to Portfolio" size="md">
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
              <div className="mt-2 bg-dark-700 border border-dark-500 rounded-xl overflow-hidden">
                {results.map((stock) => (
                  <button
                    key={stock.symbol}
                    type="button"
                    onClick={() => handleSelectStock(stock)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-dark-600 transition-colors text-left"
                  >
                    <div>
                      <p className="font-medium text-white">{stock.symbol}</p>
                      <p className="text-sm text-gray-400 truncate">{stock.name}</p>
                    </div>
                    <span className="text-xs text-gray-500">{stock.type}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Selected Stock Display */
          <div className="mb-6 p-4 bg-dark-700 rounded-xl border border-dark-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center text-accent font-bold">
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
          </div>
        )}

        {/* Shares & Cost Inputs */}
        {selectedStock && (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Input
                label="Number of Shares"
                type="number"
                placeholder="0"
                min="0.001"
                step="0.001"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
              />
              <Input
                label="Average Cost per Share"
                type="number"
                placeholder="0.00"
                min="0.01"
                step="0.01"
                value={avgCost}
                onChange={(e) => setAvgCost(e.target.value)}
                leftIcon={<span className="text-gray-500">$</span>}
              />
            </div>

            {/* Summary */}
            {shares && avgCost && quote && (
              <div className="mb-6 p-4 bg-dark-700/50 rounded-xl space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total Cost</span>
                  <span className="text-white">{formatCurrency(totalCost)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Current Value</span>
                  <span className="text-white">{formatCurrency(currentValue)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-dark-500">
                  <span className="text-gray-400">Gain/Loss</span>
                  <span className={potentialGain >= 0 ? 'text-gain' : 'text-loss'}>
                    {potentialGain >= 0 ? '+' : ''}{formatCurrency(potentialGain)}
                  </span>
                </div>
              </div>
            )}
          </>
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
            disabled={!selectedStock || !shares || !avgCost || !quote}
            isLoading={isLoadingQuote}
          >
            Add to Portfolio
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddStockModal;

