import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';

// Mock all heavy child components to isolate the title ordering test
vi.mock('./AccountList', () => ({ AccountList: () => <div data-testid="account-list" /> }));
vi.mock('./AddAccountModal', () => ({ AddAccountModal: () => null }));
vi.mock('./TransactionList', () => ({ TransactionList: () => null }));
vi.mock('./AddTransactionModal', () => ({ AddTransactionModal: () => null }));
vi.mock('./BudgetView', () => ({ BudgetView: () => null }));
vi.mock('./BudgetForm', () => ({ BudgetForm: () => null }));
vi.mock('./SpendingChart', () => ({ SpendingChart: () => null }));
vi.mock('../../components/AiSuggestion', () => ({ AiSuggestion: () => null }));
vi.mock('../../components/ImportButton', () => ({ ImportButton: () => null }));
vi.mock('../../hooks/useGemini', () => ({ useGemini: () => ({ generate: vi.fn(), loading: false, error: null, hasKey: false }) }));

// Provide accounts so the net-worth banner renders
const mockAccounts = [
  { id: '1', name: 'Checking', type: 'Checking', balance: 1000, currency: 'USD' },
];
const mockTransactions = [
  { id: 't1', accountId: '1', type: 'income', amount: 500, category: 'Salary', date: new Date().toISOString().slice(0, 7) + '-01' },
];

vi.mock('../../hooks/useIDB', () => ({
  useIDB: (key, def) => {
    if (key === 'finance-accounts') return [mockAccounts, vi.fn()];
    if (key === 'finance-transactions') return [mockTransactions, vi.fn()];
    return [def, vi.fn()];
  },
}));

import { FinancePage } from './FinancePage';

describe('FinancePage title ordering', () => {
  it('renders the h1 header before the net worth banner', () => {
    const { container } = render(<MemoryRouter><FinancePage /></MemoryRouter>);

    const header = screen.getByRole('heading', { level: 1, name: /finance/i });
    const netWorthBanner = screen.getByTestId('net-worth-banner');

    // The header must come before the net worth banner in DOM order
    const allChildren = Array.from(container.querySelector('.space-y-6').children);
    const headerIndex = allChildren.findIndex((el) => el.contains(header));
    const bannerIndex = allChildren.findIndex((el) => el === netWorthBanner || el.contains(netWorthBanner));

    expect(headerIndex).toBeLessThan(bannerIndex);
  });
});
