import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AccountList } from './AccountList';
import { AddAccountModal } from './AddAccountModal';

const mockAccounts = [
  { id: '1', name: 'Chase Checking', type: 'Checking', balance: 2500, currency: 'USD' },
  { id: '2', name: 'High Yield Savings', type: 'Savings', balance: 10000, currency: 'USD' },
  { id: '3', name: 'Visa Credit', type: 'Credit Card', balance: -450, currency: 'USD' },
];

describe('AccountList', () => {
  it('renders a list of accounts', () => {
    render(<AccountList accounts={mockAccounts} onEdit={() => {}} onDelete={() => {}} />);
    expect(screen.getByText('Chase Checking')).toBeInTheDocument();
    expect(screen.getByText('High Yield Savings')).toBeInTheDocument();
    expect(screen.getByText('Visa Credit')).toBeInTheDocument();
  });

  it('shows account types', () => {
    render(<AccountList accounts={mockAccounts} onEdit={() => {}} onDelete={() => {}} />);
    expect(screen.getByText('Checking')).toBeInTheDocument();
    expect(screen.getByText('Savings')).toBeInTheDocument();
    expect(screen.getByText('Credit Card')).toBeInTheDocument();
  });

  it('calculates and displays net worth', () => {
    render(<AccountList accounts={mockAccounts} onEdit={() => {}} onDelete={() => {}} />);
    // net worth = 2500 + 10000 + (-450) = 12050
    expect(screen.getByText(/12,050/)).toBeInTheDocument();
  });

  it('calls onDelete when delete button clicked', () => {
    const onDelete = vi.fn();
    render(<AccountList accounts={[mockAccounts[0]]} onEdit={() => {}} onDelete={onDelete} />);
    fireEvent.click(screen.getByTestId('delete-account-1'));
    expect(onDelete).toHaveBeenCalledWith('1');
  });

  it('calls onEdit when edit button clicked', () => {
    const onEdit = vi.fn();
    render(<AccountList accounts={[mockAccounts[0]]} onEdit={onEdit} onDelete={() => {}} />);
    fireEvent.click(screen.getByTestId('edit-account-1'));
    expect(onEdit).toHaveBeenCalledWith(mockAccounts[0]);
  });

  it('shows empty state when no accounts', () => {
    render(<AccountList accounts={[]} onEdit={() => {}} onDelete={() => {}} />);
    expect(screen.getByText(/add your first account to get started/i)).toBeInTheDocument();
  });
});

describe('AddAccountModal', () => {
  it('renders form fields', () => {
    render(<AddAccountModal onSave={() => {}} onClose={() => {}} />);
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/balance/i)).toBeInTheDocument();
  });

  it('calls onSave with form data on submit', () => {
    const onSave = vi.fn();
    render(<AddAccountModal onSave={onSave} onClose={() => {}} />);
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'My Account' } });
    fireEvent.change(screen.getByLabelText(/balance/i), { target: { value: '1000' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'My Account', balance: 1000 })
    );
  });

  it('calls onClose when cancel clicked', () => {
    const onClose = vi.fn();
    render(<AddAccountModal onSave={() => {}} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('pre-fills form when editing existing account', () => {
    render(<AddAccountModal account={mockAccounts[0]} onSave={() => {}} onClose={() => {}} />);
    expect(screen.getByLabelText(/name/i).value).toBe('Chase Checking');
    expect(screen.getByLabelText(/balance/i).value).toBe('2500');
  });
});
