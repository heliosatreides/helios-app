import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from './LoginPage';

// Mock AuthContext
const mockLogin = vi.fn();
const mockRegister = vi.fn();
vi.mock('./AuthContext', () => ({
  useAuth: () => ({ login: mockLogin, register: mockRegister }),
}));

const renderLogin = () =>
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  );

beforeEach(() => {
  vi.clearAllMocks();
});

describe('LoginPage', () => {
  it('shows local-only context above the form', () => {
    renderLogin();
    expect(screen.getByText(/local-only/i)).toBeTruthy();
    expect(screen.getByText(/no cloud, no tracking/i)).toBeTruthy();
  });

  it('shows "Unlock your data" heading in login mode', () => {
    renderLogin();
    expect(screen.getByText('Unlock your data')).toBeTruthy();
  });

  it('shows "Unlock" on the submit button in login mode', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: 'Unlock' })).toBeTruthy();
  });

  it('switches to register mode with local-first copy', async () => {
    renderLogin();
    await userEvent.click(screen.getByText('Set up profile'));
    expect(screen.getByText('Set up your local profile')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Get started' })).toBeTruthy();
  });

  it('shows "Choose a password" label in register mode', async () => {
    renderLogin();
    await userEvent.click(screen.getByText('Set up profile'));
    expect(screen.getByText('Choose a password')).toBeTruthy();
  });

  it('does not show old cloud-service language', () => {
    renderLogin();
    expect(screen.queryByText('Sign in to your account')).toBeNull();
    expect(screen.queryByText('Create a new account')).toBeNull();
    expect(screen.queryByText('Sign in')).toBeNull();
    expect(screen.queryByText('Create account')).toBeNull();
  });

  it('shows password encryption explanation in register placeholder', async () => {
    renderLogin();
    await userEvent.click(screen.getByText('Set up profile'));
    const passwordInput = screen.getByPlaceholderText('Used to encrypt your local data');
    expect(passwordInput).toBeTruthy();
  });

  it('shows "First time?" toggle text in login mode', () => {
    renderLogin();
    expect(screen.getByText('First time?')).toBeTruthy();
  });

  it('shows "Already set up?" toggle text in register mode', async () => {
    renderLogin();
    await userEvent.click(screen.getByText('Set up profile'));
    expect(screen.getByText('Already set up?')).toBeTruthy();
  });
});
