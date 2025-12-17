import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { removeHolding } from '../../store/portfolioSlice';
import { Holding } from '../../types';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import { Card, CardHeader, CardTitle } from '../common';
import { StockMiniChart } from '../charts';

interface HoldingsListProps {
  onAddStock: () => void;
}

const HoldingsList = ({ onAddStock }: HoldingsListProps) => {
  const holdings = useSelector((state: RootState) => state.portfolio.holdings);
  const dispatch = useDispatch();

  const handleRemove = (id: string) => {
    dispatch(removeHolding(id));
  };

  const HoldingRow = ({ holding, index }: { holding: Holding; index: number }) => {
    const totalValue = holding.currentPrice * holding.shares;
    const totalGain = (holding.currentPrice - holding.avgCost) * holding.shares;
    const totalGainPercent = ((holding.currentPrice - holding.avgCost) / holding.avgCost) * 100;
    const isPositive = holding.dailyChange >= 0;

    return (
      <div
        className="flex items-center justify-between py-4 border-b border-dark-600 last:border-0 hover:bg-dark-700/50 -mx-6 px-6 transition-colors animate-fade-in"
        style={{ animationDelay: `${index * 50}ms` }}
      >
        {/* Stock info */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center text-accent font-bold text-sm">
            {holding.symbol.slice(0, 2)}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-white truncate">{holding.symbol}</p>
            <p className="text-sm text-gray-400 truncate">{holding.name}</p>
          </div>
        </div>

        {/* Mini chart - hidden on mobile */}
        <div className="hidden md:block mx-4">
          <StockMiniChart isPositive={isPositive} />
        </div>

        {/* Shares */}
        <div className="hidden sm:block text-right mx-4 min-w-[80px]">
          <p className="text-sm text-gray-400">Shares</p>
          <p className="font-medium text-white">{holding.shares}</p>
        </div>

        {/* Current Price */}
        <div className="text-right mx-4 min-w-[100px]">
          <p className="font-semibold text-white">{formatCurrency(holding.currentPrice)}</p>
          <p className={`text-sm ${isPositive ? 'text-gain' : 'text-loss'}`}>
            {formatPercent(holding.dailyChangePercent)}
          </p>
        </div>

        {/* Total Value */}
        <div className="text-right min-w-[120px]">
          <p className="font-semibold text-white">{formatCurrency(totalValue)}</p>
          <p className={`text-sm ${totalGain >= 0 ? 'text-gain' : 'text-loss'}`}>
            {totalGain >= 0 ? '+' : ''}{formatCurrency(totalGain)} ({formatPercent(totalGainPercent)})
          </p>
        </div>

        {/* Actions */}
        <div className="ml-4">
          <button
            onClick={() => handleRemove(holding.id)}
            className="p-2 text-gray-400 hover:text-loss hover:bg-loss/10 rounded-lg transition-colors"
            title="Remove holding"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    );
  };

  return (
    <Card variant="default" padding="md">
      <CardHeader>
        <CardTitle>Holdings</CardTitle>
        <button
          onClick={onAddStock}
          className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-dark text-white text-sm font-medium rounded-xl transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Stock
        </button>
      </CardHeader>

      {holdings.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-dark-600 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p className="text-gray-400 mb-4">No holdings yet</p>
          <button
            onClick={onAddStock}
            className="text-accent hover:text-accent-light transition-colors"
          >
            Add your first stock →
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          {/* Header */}
          <div className="flex items-center justify-between py-3 border-b border-dark-600 text-xs text-gray-500 uppercase tracking-wider">
            <div className="flex-1 min-w-0">Asset</div>
            <div className="hidden md:block mx-4 w-[80px]"></div>
            <div className="hidden sm:block text-right mx-4 min-w-[80px]">Shares</div>
            <div className="text-right mx-4 min-w-[100px]">Price</div>
            <div className="text-right min-w-[120px]">Total Value</div>
            <div className="ml-4 w-8"></div>
          </div>

          {/* Rows */}
          {holdings.map((holding: Holding, index: number) => (
            <HoldingRow key={holding.id} holding={holding} index={index} />
          ))}
        </div>
      )}
    </Card>
  );
};

export default HoldingsList;
