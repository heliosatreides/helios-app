import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock heavy dependencies so SettingsPage renders without real IDB/auth
vi.mock('../../hooks/useIDB', () => ({
  useIDB: () => [[], vi.fn()],
}));
vi.mock('../../auth/AuthContext', () => ({
  useAuth: () => ({
    user: { username: 'test' },
    password: 'pw',
    needsReauth: false,
    login: vi.fn(),
  }),
}));
vi.mock('../../auth/crypto', () => ({
  encrypt: vi.fn(),
  decrypt: vi.fn().mockResolvedValue(''),
}));
vi.mock('../../components/Toast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}));

// Ensure localStorage is available in test env
beforeEach(() => {
  const store = {};
  vi.stubGlobal('localStorage', {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, val) => { store[key] = String(val); }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]); }),
  });
});

import { SettingsPage } from './SettingsPage';

function renderWith(initialEntry = '/settings') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <SettingsPage />
    </MemoryRouter>
  );
}

describe('SettingsPage tab URL sync', () => {
  it('defaults to AI Integration tab when no ?tab param', () => {
    renderWith('/settings');
    expect(screen.getByText('AI Integration', { selector: 'h2' })).toBeInTheDocument();
  });

  it('opens Export Data tab when ?tab=export', () => {
    renderWith('/settings?tab=export');
    expect(screen.getByText('Export Your Data')).toBeInTheDocument();
  });

  it('opens Preferences tab when ?tab=preferences', () => {
    renderWith('/settings?tab=preferences');
    expect(screen.getByText('Preferences', { selector: 'h2' })).toBeInTheDocument();
  });

  it('falls back to AI tab for invalid ?tab value', () => {
    renderWith('/settings?tab=bogus');
    expect(screen.getByText('AI Integration', { selector: 'h2' })).toBeInTheDocument();
  });

  it('clicking a tab updates the displayed content', () => {
    renderWith('/settings');
    // Start on AI tab
    expect(screen.getByText('AI Integration', { selector: 'h2' })).toBeInTheDocument();
    // Click Export Data tab
    fireEvent.click(screen.getByText('Export Data'));
    expect(screen.getByText('Export Your Data')).toBeInTheDocument();
  });
});
