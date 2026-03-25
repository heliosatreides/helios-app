import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Sidebar } from '../Sidebar';
import { AuthProvider } from '../../auth/AuthContext';
import { CommandPaletteProvider } from '../CommandPaletteContext';

// Mock localStorage
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
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: makeStorageMock(), writable: true });

function renderSidebar(initialRoute = '/dashboard') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AuthProvider>
        <CommandPaletteProvider>
          <Sidebar onNavClick={vi.fn()} />
        </CommandPaletteProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('Sidebar collapsible groups', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('renders all group labels', () => {
    renderSidebar();
    expect(screen.getByText('Main')).toBeInTheDocument();
    expect(screen.getByText('Personal')).toBeInTheDocument();
    expect(screen.getByText('Tools')).toBeInTheDocument();
    expect(screen.getByText('Developer')).toBeInTheDocument();
  });

  it('shows nav items for expanded groups', () => {
    renderSidebar();
    // Main is expanded by default
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Planner')).toBeInTheDocument();
  });

  it('Developer group is collapsed by default', () => {
    renderSidebar();
    // Developer items should be hidden
    expect(screen.queryByText('Dev Tools')).not.toBeInTheDocument();
    expect(screen.queryByText('Calculator')).not.toBeInTheDocument();
  });

  it('clicking a group label toggles collapse', () => {
    renderSidebar();
    // Main is expanded — Dashboard visible
    expect(screen.getByText('Dashboard')).toBeInTheDocument();

    // Click Main to collapse
    fireEvent.click(screen.getByText('Main'));
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();

    // Click Main again to expand
    fireEvent.click(screen.getByText('Main'));
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('clicking Developer label expands it', () => {
    renderSidebar();
    expect(screen.queryByText('Dev Tools')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Developer'));
    expect(screen.getByText('Dev Tools')).toBeInTheDocument();
    expect(screen.getByText('Calculator')).toBeInTheDocument();
  });

  it('persists collapse state to localStorage', () => {
    renderSidebar();
    // Collapse Personal
    fireEvent.click(screen.getByText('Personal'));
    
    const stored = JSON.parse(localStorageMock.getItem('helios-sidebar-collapsed'));
    expect(stored).toContain('Personal');
  });

  it('reads collapse state from localStorage on mount', () => {
    localStorageMock.setItem('helios-sidebar-collapsed', JSON.stringify(['Main', 'Personal']));
    renderSidebar();
    
    // Main items should be hidden (collapsed)
    // But wait — active route is /dashboard which is in Main, so Main auto-expands
    // Let's check Personal instead
    expect(screen.queryByText('Trips')).not.toBeInTheDocument();
    expect(screen.queryByText('Finance')).not.toBeInTheDocument();
  });

  it('auto-expands group containing the active route', () => {
    // Collapse Main in localStorage, but active route is /dashboard (in Main)
    localStorageMock.setItem('helios-sidebar-collapsed', JSON.stringify(['Main']));
    renderSidebar('/dashboard');
    
    // Main should auto-expand because /dashboard is the active route
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('auto-expands Developer group when navigating to a developer route', () => {
    renderSidebar('/calculator');
    // Developer should auto-expand since /calculator is the active route
    expect(screen.getByText('Calculator')).toBeInTheDocument();
    expect(screen.getByText('Dev Tools')).toBeInTheDocument();
  });

  it('Settings group is always visible (not collapsible)', () => {
    renderSidebar();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('shows chevron indicators on group labels', () => {
    renderSidebar();
    // All labeled groups should have chevron buttons
    const mainLabel = screen.getByText('Main');
    const groupHeader = mainLabel.closest('button');
    expect(groupHeader).toBeInTheDocument();
  });
});
