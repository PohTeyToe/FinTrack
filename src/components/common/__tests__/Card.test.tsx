import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Card from '../Card';

describe('Card', () => {
  it('renders children content', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('renders with variant class', () => {
    const { container } = render(<Card variant="default">Content</Card>);
    expect(container.firstChild).toBeTruthy();
    expect((container.firstChild as HTMLElement).className).toContain('bg-dark-800');
  });

  it('applies padding class', () => {
    const { container } = render(<Card padding="md">Padded</Card>);
    expect((container.firstChild as HTMLElement).className).toContain('p-6');
  });
});
