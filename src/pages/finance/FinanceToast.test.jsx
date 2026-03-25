import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

const mockSuccess = vi.fn();
const mockInfo = vi.fn();

vi.mock('../../components/Toast', () => ({
  useToast: () => ({ success: mockSuccess, error: vi.fn(), info: mockInfo }),
}));

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

import { MemoryRouter } from 'react-router-dom';
import { FinancePage } from './FinancePage';

beforeEach(() => {
  mockSuccess.mockClear();
  mockInfo.mockClear();
});

test('FinancePage imports useToast', async () => {
  // Verify that FinancePage can render with useToast mock
  render(
    <MemoryRouter>
      <FinancePage />
    </MemoryRouter>
  );
  expect(screen.getByText('Finance')).toBeInTheDocument();
});
