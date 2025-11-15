import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PortfolioChart } from '../PortfolioChart';

const mockData = [
  { date: '2025-12-01', value: 10000 },
  { date: '2025-12-02', value: 10150 },
  { date: '2025-12-03', value: 10200 },
  { date: '2025-12-04', value: 10050 },
  { date: '2025-12-05', value: 10300 },
];

describe('PortfolioChart', () => {
  it('renders without crashing', () => {
    const { container } = render(<PortfolioChart data={mockData} />);
    expect(container).toBeTruthy();
  });

  it('renders SVG element for chart', () => {
    const { container } = render(<PortfolioChart data={mockData} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
  });
});
