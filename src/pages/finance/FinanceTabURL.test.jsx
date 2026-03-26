import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';

// Mock heavy children
vi.mock('./AccountList', () => ({ AccountList: () => <div data-testid="account-list" /> }));
vi.mock('./AddAccountModal', () => ({ AddAccountModal: () => null }));
vi.mock('./TransactionList', () => ({ TransactionList: () => <div data-testid="transaction-list" /> }));
vi.mock('./AddTransactionModal', () => ({ AddTransactionModal: () => null }));
vi.mock('./BudgetView', () => ({ BudgetView: () => <div data-testid="budget-view" /> }));
vi.mock('./BudgetForm', () => ({ BudgetForm: () => null }));
vi.mock('./SpendingChart', () => ({ SpendingChart: () => null }));
vi.mock('../../components/AiSuggestion', () => ({ AiSuggestion: () => null }));
vi.mock('../../components/ImportButton', () => ({ ImportButton: () => null }));
vi.mock('../../hooks/useGemini', () => ({ useGemini: () => ({ generate: vi.fn(), loading: false, error: null, hasKey: false }) }));
vi.mock('../../hooks/useIDB', () => ({
  useIDB: (_key, def) => [def, vi.fn()],
}));

import { FinancePage } from './FinancePage';

describe('FinancePage tab URL persistence', () => {
  it('defaults to Accounts tab when no query param', () => {
    render(
      <MemoryRouter initialEntries={['/finance']}>
        <FinancePage />
      </MemoryRouter>
    );
    expect(screen.getByTestId('account-list')).toBeTruthy();
  });

  it('opens Transactions tab when ?tab=Transactions', () => {
    render(
      <MemoryRouter initialEntries={['/finance?tab=Transactions']}>
        <FinancePage />
      </MemoryRouter>
    );
    expect(screen.getByTestId('transaction-list')).toBeTruthy();
  });

  it('opens Budget tab when ?tab=Budget', () => {
    render(
      <MemoryRouter initialEntries={['/finance?tab=Budget']}>
        <FinancePage />
      </MemoryRouter>
    );
    expect(screen.getByTestId('budget-view')).toBeTruthy();
  });

  it('falls back to Accounts for invalid tab param', () => {
    render(
      <MemoryRouter initialEntries={['/finance?tab=Invalid']}>
        <FinancePage />
      </MemoryRouter>
    );
    expect(screen.getByTestId('account-list')).toBeTruthy();
  });

  it('clicking a tab updates the active tab content', () => {
    render(
      <MemoryRouter initialEntries={['/finance']}>
        <FinancePage />
      </MemoryRouter>
    );
    // Should start on Accounts
    expect(screen.getByTestId('account-list')).toBeTruthy();

    // Click Transactions tab
    fireEvent.click(screen.getByRole('button', { name: /transactions/i }));
    expect(screen.getByTestId('transaction-list')).toBeTruthy();
  });
});
