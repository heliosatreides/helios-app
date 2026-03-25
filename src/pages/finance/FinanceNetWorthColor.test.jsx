import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

// Mock useIDB
vi.mock('../../hooks/useIDB', () => ({
  useIDB: (key, defaultVal) => {
    if (key === 'finance-accounts') return [[{ id: '1', name: 'Checking', balance: 5000, type: 'checking' }], vi.fn()];
    if (key === 'finance-transactions') return [[], vi.fn()];
    if (key === 'finance-budgets') return [[], vi.fn()];
    return [defaultVal, vi.fn()];
  },
}));

vi.mock('../../hooks/useGemini', () => ({
  useGemini: () => ({ generate: vi.fn(), loading: false }),
}));

vi.mock('../../components/Toast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }),
}));

// Mock ConfirmDialog
vi.mock('../../components/ui', async () => {
  const actual = await vi.importActual('../../components/ui');
  return { ...actual };
});

import { MemoryRouter } from 'react-router-dom';
import { FinancePage } from './FinancePage';

test('net worth uses green-400 for positive values, not amber', () => {
  render(
    <MemoryRouter>
      <FinancePage />
    </MemoryRouter>
  );
  const netWorth = screen.getByTestId('net-worth-value');
  expect(netWorth.className).toContain('text-green-400');
  expect(netWorth.className).not.toContain('text-amber');
});
