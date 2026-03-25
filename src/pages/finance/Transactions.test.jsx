import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TransactionList } from './TransactionList';
import { AddTransactionModal } from './AddTransactionModal';

const mockAccounts = [
  { id: 'a1', name: 'Checking', type: 'Checking', balance: 2500, currency: 'USD' },
  { id: 'a2', name: 'Savings', type: 'Savings', balance: 5000, currency: 'USD' },
];

const mockTransactions = [
  { id: 't1', amount: 50, description: 'Groceries', category: 'Food', date: '2026-03-01', accountId: 'a1', type: 'expense' },
  { id: 't2', amount: 3000, description: 'Paycheck', category: 'Salary', date: '2026-03-15', accountId: 'a1', type: 'income' },
  { id: 't3', amount: 100, description: 'Bus pass', category: 'Transport', date: '2026-03-10', accountId: 'a2', type: 'expense' },
];

describe('TransactionList', () => {
  it('renders list of transactions', () => {
    render(<TransactionList transactions={mockTransactions} accounts={mockAccounts} onDelete={() => {}} />);
    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.getByText('Paycheck')).toBeInTheDocument();
    expect(screen.getByText('Bus pass')).toBeInTheDocument();
  });

  it('shows income as positive and expense as negative', () => {
    render(<TransactionList transactions={mockTransactions} accounts={mockAccounts} onDelete={() => {}} />);
    expect(screen.getByText('+$3,000.00')).toBeInTheDocument();
    expect(screen.getByText('-$50.00')).toBeInTheDocument();
  });

  it('filters by account', () => {
    render(<TransactionList transactions={mockTransactions} accounts={mockAccounts} onDelete={() => {}} filterAccountId="a2" />);
    expect(screen.queryByText('Groceries')).not.toBeInTheDocument();
    expect(screen.getByText('Bus pass')).toBeInTheDocument();
  });

  it('filters by category', () => {
    render(<TransactionList transactions={mockTransactions} accounts={mockAccounts} onDelete={() => {}} filterCategory="Salary" />);
    expect(screen.getByText('Paycheck')).toBeInTheDocument();
    expect(screen.queryByText('Groceries')).not.toBeInTheDocument();
  });

  it('shows empty state when no transactions', () => {
    render(<TransactionList transactions={[]} accounts={mockAccounts} onDelete={() => {}} />);
    expect(screen.getByText(/no transactions/i)).toBeInTheDocument();
  });

  it('calls onDelete when delete clicked', () => {
    const onDelete = vi.fn();
    render(<TransactionList transactions={[mockTransactions[0]]} accounts={mockAccounts} onDelete={onDelete} />);
    fireEvent.click(screen.getByTestId('delete-transaction-t1'));
    expect(onDelete).toHaveBeenCalledWith('t1');
  });

  it('renders edit button when onEdit is provided', () => {
    const onEdit = vi.fn();
    render(<TransactionList transactions={[mockTransactions[0]]} accounts={mockAccounts} onDelete={() => {}} onEdit={onEdit} />);
    expect(screen.getByTestId('edit-transaction-t1')).toBeInTheDocument();
  });

  it('does not render edit button when onEdit is not provided', () => {
    render(<TransactionList transactions={[mockTransactions[0]]} accounts={mockAccounts} onDelete={() => {}} />);
    expect(screen.queryByTestId('edit-transaction-t1')).not.toBeInTheDocument();
  });

  it('calls onEdit with transaction when edit clicked', () => {
    const onEdit = vi.fn();
    render(<TransactionList transactions={[mockTransactions[0]]} accounts={mockAccounts} onDelete={() => {}} onEdit={onEdit} />);
    fireEvent.click(screen.getByTestId('edit-transaction-t1'));
    expect(onEdit).toHaveBeenCalledWith(mockTransactions[0]);
  });
});

describe('AddTransactionModal', () => {
  it('renders form fields', () => {
    render(<AddTransactionModal accounts={mockAccounts} onSave={() => {}} onClose={() => {}} />);
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/account/i)).toBeInTheDocument();
  });

  it('calls onSave with form data', () => {
    const onSave = vi.fn();
    render(<AddTransactionModal accounts={mockAccounts} onSave={onSave} onClose={() => {}} />);
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '75' } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Lunch' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 75, description: 'Lunch' })
    );
  });

  it('calls onClose when cancel clicked', () => {
    const onClose = vi.fn();
    render(<AddTransactionModal accounts={mockAccounts} onSave={() => {}} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows "Edit Transaction" title when transaction prop is passed', () => {
    const tx = mockTransactions[0];
    render(<AddTransactionModal accounts={mockAccounts} onSave={() => {}} onClose={() => {}} transaction={tx} />);
    expect(screen.getByText('Edit Transaction')).toBeInTheDocument();
  });

  it('pre-fills form with transaction data when editing', () => {
    const tx = mockTransactions[0];
    render(<AddTransactionModal accounts={mockAccounts} onSave={() => {}} onClose={() => {}} transaction={tx} />);
    expect(screen.getByLabelText(/amount/i)).toHaveValue(50);
    expect(screen.getByLabelText(/description/i)).toHaveValue('Groceries');
  });

  it('includes transaction id in save data when editing', () => {
    const onSave = vi.fn();
    const tx = mockTransactions[0];
    render(<AddTransactionModal accounts={mockAccounts} onSave={onSave} onClose={() => {}} transaction={tx} />);
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Updated Groceries' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ id: 't1', description: 'Updated Groceries' })
    );
  });
});
