import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { AuthProvider } from '../auth/AuthContext';
import { CommandPaletteProvider } from './CommandPaletteContext';

// Mock localStorage and sessionStorage
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

function SidebarTestWrapper({ initialOpen = false }) {
  const [sidebarOpen, setSidebarOpen] = useState(initialOpen);

  return (
    <MemoryRouter>
      <AuthProvider>
        <CommandPaletteProvider>
        <div>
          {/* Overlay */}
          {sidebarOpen && (
            <div
              data-testid="sidebar-overlay"
              onClick={() => setSidebarOpen(false)}
            />
          )}
          {/* Hamburger */}
          <button
            data-testid="hamburger-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            ☰
          </button>
          {/* Sidebar */}
          <div
            data-testid="sidebar-wrapper"
            style={{ transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)' }}
          >
            <Sidebar onNavClick={() => setSidebarOpen(false)} />
          </div>
        </div>
        </CommandPaletteProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

test('sidebar: hamburger button opens the sidebar', () => {
  render(<SidebarTestWrapper initialOpen={false} />);

  const wrapper = screen.getByTestId('sidebar-wrapper');
  expect(wrapper).toHaveStyle({ transform: 'translateX(-100%)' });

  fireEvent.click(screen.getByTestId('hamburger-btn'));

  expect(wrapper).toHaveStyle({ transform: 'translateX(0)' });
});

test('sidebar: overlay appears when sidebar is open', () => {
  render(<SidebarTestWrapper initialOpen={true} />);
  expect(screen.getByTestId('sidebar-overlay')).toBeInTheDocument();
});

test('sidebar: clicking overlay closes the sidebar', () => {
  render(<SidebarTestWrapper initialOpen={true} />);

  const overlay = screen.getByTestId('sidebar-overlay');
  expect(overlay).toBeInTheDocument();

  fireEvent.click(overlay);

  expect(screen.queryByTestId('sidebar-overlay')).not.toBeInTheDocument();
});
