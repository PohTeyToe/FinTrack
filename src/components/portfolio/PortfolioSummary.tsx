import { usePortfolioSummary } from '../../hooks/usePortfolio';
import { formatCurrency, formatPercent, formatChange } from '../../utils/formatters';
import { Card } from '../common';

const PortfolioSummary = () => {
  const summary = usePortfolioSummary();

  const summaryCards = [
    {
      label: 'Total Value',
      value: formatCurrency(summary.totalValue),
      change: null,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Total Gain/Loss',
      value: formatCurrency(Math.abs(summary.totalGain)),
      change: summary.totalGainPercent,
      isGain: summary.totalGain >= 0,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    },
    {
      label: "Today's Change",
      value: formatChange(summary.dailyChange),
      change: summary.dailyChangePercent,
      isGain: summary.dailyChange >= 0,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Total Invested',
      value: formatCurrency(summary.totalCost),
      change: null,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {summaryCards.map((card, index) => (
        <Card
          key={card.label}
          variant="gradient"
          padding="md"
          className="animate-fade-in"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">{card.label}</p>
              <p className={`text-2xl font-bold ${
                card.isGain !== undefined
                  ? card.isGain
                    ? 'text-gain'
                    : 'text-loss'
                  : 'text-white'
              }`}>
                {card.isGain !== undefined && !card.isGain && card.value.startsWith('$') ? '-' : ''}
                {card.value}
              </p>
              {card.change !== null && (
                <p className={`text-sm mt-1 ${card.isGain ? 'text-gain' : 'text-loss'}`}>
                  {formatPercent(card.change)}
                </p>
              )}
            </div>
            <div className={`p-2 rounded-lg ${
              card.isGain !== undefined
                ? card.isGain
                  ? 'bg-gain/10 text-gain'
                  : 'bg-loss/10 text-loss'
                : 'bg-accent/10 text-accent'
            }`}>
              {card.icon}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default PortfolioSummary;

