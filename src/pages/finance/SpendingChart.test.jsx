import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SpendingChart, buildCategorySpend } from './SpendingChart';

const mockTransactions = [
  { id: 't1', amount: 200, description: 'Groceries', category: 'Food', date: '2026-03-05', accountId: 'a1', type: 'expense' },
  { id: 't2', amount: 50,  description: 'Lunch out',  category: 'Food', date: '2026-03-10', accountId: 'a1', type: 'expense' },
  { id: 't3', amount: 120, description: 'Electricity', category: 'Utilities', date: '2026-03-08', accountId: 'a1', type: 'expense' },
  { id: 't4', amount: 80,  description: 'Bus pass',   category: 'Transport', date: '2026-03-12', accountId: 'a1', type: 'expense' },
  { id: 't5', amount: 3000, description: 'Paycheck',  category: 'Salary',   date: '2026-03-15', accountId: 'a1', type: 'income' },
  // Different month — should be excluded
  { id: 't6', amount: 999, description: 'Old expense', category: 'Food',   date: '2026-02-20', accountId: 'a1', type: 'expense' },
];

describe('buildCategorySpend', () => {
  it('sums expenses by category for the given month', () => {
    const result = buildCategorySpend(mockTransactions, '2026-03');
    expect(result.find(r => r.category === 'Food').amount).toBe(250); // 200 + 50
    expect(result.find(r => r.category === 'Utilities').amount).toBe(120);
    expect(result.find(r => r.category === 'Transport').amount).toBe(80);
  });

  it('excludes income transactions', () => {
    const result = buildCategorySpend(mockTransactions, '2026-03');
    expect(result.find(r => r.category === 'Salary')).toBeUndefined();
  });

  it('excludes transactions from other months', () => {
    const result = buildCategorySpend(mockTransactions, '2026-03');
    // Food total should be 250, not 1249 (which would include Feb)
    expect(result.find(r => r.category === 'Food').amount).toBe(250);
  });

  it('returns rows sorted descending by amount', () => {
    const result = buildCategorySpend(mockTransactions, '2026-03');
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].amount).toBeGreaterThanOrEqual(result[i].amount);
    }
  });

  it('returns empty array when no matching transactions', () => {
    expect(buildCategorySpend([], '2026-03')).toEqual([]);
    expect(buildCategorySpend(mockTransactions, '2025-01')).toEqual([]);
  });

  it('includes pct field (0-100) for each row', () => {
    const result = buildCategorySpend(mockTransactions, '2026-03');
    expect(result[0].pct).toBe(100); // top category = 100%
    result.forEach(r => {
      expect(r.pct).toBeGreaterThanOrEqual(0);
      expect(r.pct).toBeLessThanOrEqual(100);
    });
  });
});

describe('SpendingChart', () => {
  it('renders category bars', () => {
    render(<SpendingChart transactions={mockTransactions} month="2026-03" />);
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('Utilities')).toBeInTheDocument();
    expect(screen.getByText('Transport')).toBeInTheDocument();
  });

  it('shows total monthly spend', () => {
    render(<SpendingChart transactions={mockTransactions} month="2026-03" />);
    // Total: 200 + 50 + 120 + 80 = 450
    expect(screen.getByTestId('total-spend')).toHaveTextContent('$450');
  });

  it('shows dollar amounts for each category', () => {
    render(<SpendingChart transactions={mockTransactions} month="2026-03" />);
    expect(screen.getByText('$250')).toBeInTheDocument();
    expect(screen.getByText('$120')).toBeInTheDocument();
    expect(screen.getByText('$80')).toBeInTheDocument();
  });

  it('renders empty state when no expense transactions for month', () => {
    render(<SpendingChart transactions={[]} month="2026-03" />);
    expect(screen.getByTestId('spending-chart-empty')).toBeInTheDocument();
  });

  it('renders a bar element for each category', () => {
    render(<SpendingChart transactions={mockTransactions} month="2026-03" />);
    const bars = screen.getAllByTestId(/^spend-bar-/);
    expect(bars).toHaveLength(3); // Food, Utilities, Transport
  });

  it('marks over-budget categories when budgets provided', () => {
    const budgets = [{ category: 'Food', limit: 100 }]; // 250 spent vs 100 limit
    render(<SpendingChart transactions={mockTransactions} month="2026-03" budgets={budgets} />);
    expect(screen.getByTestId('spend-bar-Food')).toHaveClass('over-budget');
  });

  it('does not mark under-budget categories as over-budget', () => {
    const budgets = [{ category: 'Transport', limit: 500 }]; // 80 spent vs 500 limit
    render(<SpendingChart transactions={mockTransactions} month="2026-03" budgets={budgets} />);
    expect(screen.getByTestId('spend-bar-Transport')).not.toHaveClass('over-budget');
  });
});
