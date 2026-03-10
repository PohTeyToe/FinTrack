import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PortfolioChart from '../PortfolioChart';

const mockData = [
  { date: '2025-12-01', value: 10000 },
  { date: '2025-12-02', value: 10150 },
  { date: '2025-12-03', value: 10200 },
  { date: '2025-12-04', value: 10050 },
  { date: '2025-12-05', value: 10300 },
];

describe('PortfolioChart', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <PortfolioChart data={mockData} timeRange="1M" onTimeRangeChange={vi.fn()} />
    );
    expect(container).toBeTruthy();
  });

  it('displays the current portfolio value', () => {
    render(
      <PortfolioChart data={mockData} timeRange="1M" onTimeRangeChange={vi.fn()} />
    );
    // Last value in the data set is $10,300
    expect(screen.getByText('$10,300.00')).toBeInTheDocument();
  });

  it('renders all time range buttons', () => {
    render(
      <PortfolioChart data={mockData} timeRange="1M" onTimeRangeChange={vi.fn()} />
    );
    expect(screen.getByText('1W')).toBeInTheDocument();
    expect(screen.getByText('1M')).toBeInTheDocument();
    expect(screen.getByText('3M')).toBeInTheDocument();
    expect(screen.getByText('1Y')).toBeInTheDocument();
    expect(screen.getByText('ALL')).toBeInTheDocument();
  });

  it('calls onTimeRangeChange when a range button is clicked', () => {
    const handleChange = vi.fn();
    render(
      <PortfolioChart data={mockData} timeRange="1M" onTimeRangeChange={handleChange} />
    );
    fireEvent.click(screen.getByText('1Y'));
    expect(handleChange).toHaveBeenCalledWith('1Y');
  });

  it('shows loading state', () => {
    render(
      <PortfolioChart data={[]} timeRange="1M" onTimeRangeChange={vi.fn()} isLoading />
    );
    expect(screen.getByText('Loading chart...')).toBeInTheDocument();
  });

  it('shows positive percentage for upward trend', () => {
    render(
      <PortfolioChart data={mockData} timeRange="1M" onTimeRangeChange={vi.fn()} />
    );
    // 10300 vs 10000 = +3.00%
    expect(screen.getByText(/\+3\.00%/)).toBeInTheDocument();
  });
});
