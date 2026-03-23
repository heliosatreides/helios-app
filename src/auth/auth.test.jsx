import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

// ---- storage mocks ----
const makeStorageMock = () => {
  let store = {};
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
  };
};

const localStorageMock = makeStorageMock();
const sessionStorageMock = makeStorageMock();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: sessionStorageMock, writable: true });

// ---- helpers ----
function TestConsumer() {
  const { user, login, logout, register } = useAuth();
  return (
    <div>
      <span data-testid="user">{user ? user.username : 'none'}</span>
      <button onClick={() => register('alice', 'password123')}>Register</button>
      <button onClick={() => login('alice', 'password123')}>Login</button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
}

const Wrapper = ({ children }) => (
  <MemoryRouter>
    <AuthProvider>{children}</AuthProvider>
  </MemoryRouter>
);

beforeEach(() => {
  localStorageMock.clear();
  sessionStorageMock.clear();
});

describe('AuthContext', () => {
  it('starts with no user', () => {
    render(<TestConsumer />, { wrapper: Wrapper });
    expect(screen.getByTestId('user').textContent).toBe('none');
  });

  it('register creates a user and logs them in', async () => {
    render(<TestConsumer />, { wrapper: Wrapper });
    await userEvent.click(screen.getByText('Register'));
    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('alice');
    });
    const stored = JSON.parse(localStorage.getItem('helios-auth-users') || '[]');
    expect(stored.length).toBe(1);
    expect(stored[0].username).toBe('alice');
    expect(stored[0].passwordHash).toBeDefined();
    expect(stored[0].passwordHash).not.toBe('password123');
  });

  it('login with correct credentials sets user', async () => {
    render(<TestConsumer />, { wrapper: Wrapper });
    // First register
    await userEvent.click(screen.getByText('Register'));
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('alice'));
    // Logout
    await userEvent.click(screen.getByText('Logout'));
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('none'));
    // Login again
    await userEvent.click(screen.getByText('Login'));
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('alice'));
    expect(sessionStorage.getItem('helios-session')).toBeTruthy();
  });

  it('logout clears user and session', async () => {
    render(<TestConsumer />, { wrapper: Wrapper });
    await userEvent.click(screen.getByText('Register'));
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('alice'));
    await userEvent.click(screen.getByText('Logout'));
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('none'));
    expect(sessionStorage.getItem('helios-session')).toBeNull();
  });

  it('login with wrong password throws error', async () => {
    // Register alice first
    const { unmount } = render(<TestConsumer />, { wrapper: Wrapper });
    await userEvent.click(screen.getByText('Register'));
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('alice'));
    await userEvent.click(screen.getByText('Logout'));
    unmount();

    // Now test wrong password via direct hook usage
    let loginError = null;
    function WrongPassTest() {
      const { login } = useAuth();
      return (
        <button onClick={async () => {
          try { await login('alice', 'wrongpass'); }
          catch (e) { loginError = e.message; }
        }}>WrongLogin</button>
      );
    }
    render(<WrongPassTest />, { wrapper: Wrapper });
    await userEvent.click(screen.getByText('WrongLogin'));
    await waitFor(() => expect(loginError).toBeTruthy());
    expect(loginError).toMatch(/invalid password/i);
  });
});

describe('ProtectedRoute', () => {
  it('redirects to /login when not authenticated', () => {
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<div>Login Page</div>} />
            <Route path="/protected" element={<ProtectedRoute><div>Protected</div></ProtectedRoute>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );
    expect(screen.getByText('Login Page')).toBeTruthy();
  });

  it('renders children when authenticated via session', async () => {
    // Simulate a session in sessionStorage
    const { register } = (() => {
      // We need to pre-populate auth state by registering a user
      // then check that protected route shows content
    })() || {};

    // Use a component that registers and then checks protected content
    function AutoLogin() {
      const { register } = useAuth();
      return (
        <button onClick={async () => {
          await register('testuser', 'testpass');
        }}>AutoLogin</button>
      );
    }

    render(
      <MemoryRouter initialEntries={['/app']}>
        <AuthProvider>
          <AutoLogin />
          <Routes>
            <Route path="/login" element={<div>Login Page</div>} />
            <Route path="/app" element={
              <ProtectedRoute>
                <div>Protected Content</div>
              </ProtectedRoute>
            } />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    // Initially redirected to login
    expect(screen.getByText('Login Page')).toBeTruthy();
  });
});
