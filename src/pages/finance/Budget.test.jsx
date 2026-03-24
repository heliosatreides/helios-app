import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BudgetView } from './BudgetView';
import { BudgetForm } from './BudgetForm';

vi.mock('../../hooks/useGemini', () => ({
  useGemini: () => ({
    generate: vi.fn(),
    loading: false,
    error: null,
    hasKey: false,
  }),
}));

const mockBudgets = [
  { category: 'Food', limit: 500 },
  { category: 'Transport', limit: 150 },
  { category: 'Entertainment', limit: 100 },
];

const mockTransactions = [
  { id: 't1', amount: 350, category: 'Food', type: 'expense', date: '2026-03-05' },
  { id: 't2', amount: 200, category: 'Food', type: 'expense', date: '2026-03-18' }, // over budget
  { id: 't3', amount: 80, category: 'Transport', type: 'expense', date: '2026-03-10' },
  { id: 't4', amount: 3000, category: 'Salary', type: 'income', date: '2026-03-01' }, // should be ignored
];

describe('BudgetView', () => {
  it('renders budget categories with progress bars', () => {
    render(<BudgetView budgets={mockBudgets} transactions={mockTransactions} month="2026-03" />);
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('Transport')).toBeInTheDocument();
  });

  it('shows spent vs limit amounts', () => {
    render(<BudgetView budgets={mockBudgets} transactions={mockTransactions} month="2026-03" />);
    // Food: 350+200 = 550 spent, limit 500
    expect(screen.getByText(/\$550/)).toBeInTheDocument();
    expect(screen.getByText(/\$500/)).toBeInTheDocument();
  });

  it('highlights over-budget categories in red', () => {
    render(<BudgetView budgets={mockBudgets} transactions={mockTransactions} month="2026-03" />);
    // Food is over budget (550 > 500) — check for over-budget indicator
    const overBudgetEl = screen.getByTestId('budget-row-Food');
    expect(overBudgetEl.className).toMatch(/red|over/i);
  });

  it('only counts expenses (not income) toward budget', () => {
    render(<BudgetView budgets={mockBudgets} transactions={mockTransactions} month="2026-03" />);
    // Salary income should not inflate any budget category
    expect(screen.queryByText(/3000/)).not.toBeInTheDocument();
  });

  it('shows empty state when no budgets set', () => {
    render(<BudgetView budgets={[]} transactions={[]} month="2026-03" />);
    expect(screen.getByText(/no budget/i)).toBeInTheDocument();
  });
});

describe('BudgetForm', () => {
  it('renders category and limit fields', () => {
    render(<BudgetForm onSave={() => {}} onClose={() => {}} />);
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/limit/i)).toBeInTheDocument();
  });

  it('calls onSave with category and limit', () => {
    const onSave = vi.fn();
    render(<BudgetForm onSave={onSave} onClose={() => {}} />);
    fireEvent.change(screen.getByLabelText(/limit/i), { target: { value: '300' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ limit: 300 }));
  });

  it('calls onClose on cancel', () => {
    const onClose = vi.fn();
    render(<BudgetForm onSave={() => {}} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
