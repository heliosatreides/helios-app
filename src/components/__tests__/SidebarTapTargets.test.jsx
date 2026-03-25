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

test('sidebar nav links have py-2 for mobile tap targets', () => {
  renderSidebar();
  const dashLink = screen.getByText('Dashboard');
  expect(dashLink.className).toMatch(/py-2\b/);
});

test('sidebar search button has responsive padding (py-2 md:py-1.5)', () => {
  renderSidebar();
  const searchBtn = screen.getByText('Search...');
  const button = searchBtn.closest('button');
  expect(button.className).toMatch(/py-2\b/);
  expect(button.className).toMatch(/md:py-1\.5/);
});
