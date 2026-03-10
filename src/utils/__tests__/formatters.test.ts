import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatPercent,
  formatChange,
  formatNumber,
  getChangeColor,
  truncateText,
} from '../formatters';

describe('formatCurrency', () => {
  it('formats positive dollars', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('formats negative values', () => {
    expect(formatCurrency(-42.1)).toBe('-$42.10');
  });

  it('uses compact notation for large values', () => {
    const result = formatCurrency(2500000, true);
    expect(result).toMatch(/\$2\.5/);
  });
});

describe('formatPercent', () => {
  it('adds + sign for positive values', () => {
    expect(formatPercent(3.14)).toBe('+3.14%');
  });

  it('does not add sign for negative values', () => {
    expect(formatPercent(-1.5)).toBe('-1.50%');
  });

  it('omits sign when includeSign is false', () => {
    expect(formatPercent(3.14, false)).toBe('3.14%');
  });
});

describe('formatChange', () => {
  it('formats positive change with sign', () => {
    expect(formatChange(5.5)).toBe('+$5.50');
  });

  it('formats negative change', () => {
    expect(formatChange(-3.2)).toBe('-$3.20');
  });
});

describe('formatNumber', () => {
  it('abbreviates billions', () => {
    expect(formatNumber(1500000000)).toBe('1.50B');
  });

  it('abbreviates millions', () => {
    expect(formatNumber(2300000)).toBe('2.30M');
  });

  it('abbreviates thousands', () => {
    expect(formatNumber(4500)).toBe('4.50K');
  });

  it('leaves small numbers as-is', () => {
    expect(formatNumber(42)).toBe('42.00');
  });
});

describe('getChangeColor', () => {
  it('returns gain class for positive', () => {
    expect(getChangeColor(1)).toBe('text-gain');
  });

  it('returns loss class for negative', () => {
    expect(getChangeColor(-1)).toBe('text-loss');
  });

  it('returns neutral class for zero', () => {
    expect(getChangeColor(0)).toBe('text-gray-400');
  });
});

describe('truncateText', () => {
  it('returns short text unchanged', () => {
    expect(truncateText('hello', 10)).toBe('hello');
  });

  it('truncates long text with ellipsis', () => {
    expect(truncateText('hello world this is long', 11)).toBe('hello world...');
  });
});
