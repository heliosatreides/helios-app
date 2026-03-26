import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from '../Sidebar';
import { AuthProvider } from '../../auth/AuthContext';
import { CommandPaletteProvider } from '../CommandPaletteContext';

// Mock localStorage/sessionStorage
const makeStorageMock = () => {
  let store = {};
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
  };
};
Object.defineProperty(globalThis, 'localStorage', { value: makeStorageMock(), writable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: makeStorageMock(), writable: true });

function renderSidebar() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <CommandPaletteProvider>
          <Sidebar onNavClick={() => {}} />
        </CommandPaletteProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

test('sidebar search button has min-h-[44px] for mobile tap target', () => {
  renderSidebar();
  const searchBtn = screen.getByText('Search...');
  const button = searchBtn.closest('button');
  expect(button.className).toMatch(/min-h-\[44px\]/);
});

test('sidebar nav links have min-h-[44px] for mobile tap targets', () => {
  renderSidebar();
  const dashLink = screen.getByText('Dashboard');
  expect(dashLink.className).toMatch(/min-h-\[44px\]/);
  expect(dashLink.className).toMatch(/py-3\b/);
});

test('logout button has min-h-[44px] tap target and border styling', () => {
  // Simulate a logged-in user
  const session = { username: 'testuser' };
  const users = [{ username: 'testuser', passwordHash: 'abc', salt: 'xyz' }];
  localStorage.setItem('helios-session', JSON.stringify(session));
  sessionStorage.setItem('helios-session', JSON.stringify(session));
  localStorage.setItem('helios-auth-users', JSON.stringify(users));

  const { unmount } = renderSidebar();
  const logoutBtn = screen.getByTitle('Sign out');
  expect(logoutBtn.className).toMatch(/min-h-\[44px\]/);
  expect(logoutBtn.className).toMatch(/border/);
  unmount();

  // Clean up
  localStorage.removeItem('helios-session');
  sessionStorage.removeItem('helios-session');
  localStorage.removeItem('helios-auth-users');
});

test('sidebar search button has responsive padding (py-2 md:py-1.5)', () => {
  renderSidebar();
  const searchBtn = screen.getByText('Search...');
  const button = searchBtn.closest('button');
  expect(button.className).toMatch(/py-2\b/);
  expect(button.className).toMatch(/md:py-1\.5/);
});
