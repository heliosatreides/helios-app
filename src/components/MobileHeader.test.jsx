import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

// We need to test the AppShell mobile header inside App.jsx.
// Since AppShell is not exported, we'll test via a lightweight approach:
// import App and render at specific routes, then check the mobile header text.

// Mock all page components to keep tests fast
vi.mock('../pages/dashboard/Dashboard', () => ({ Dashboard: () => <div>Dashboard Page</div> }));
vi.mock('../pages/trips/TripsPage', () => ({ TripsPage: () => <div>Trips Page</div> }));
vi.mock('../pages/finance/FinancePage', () => ({ FinancePage: () => <div>Finance Page</div> }));
vi.mock('../pages/investments/InvestmentsPage', () => ({ InvestmentsPage: () => <div>Investments Page</div> }));
vi.mock('../pages/sports/SportsPage', () => ({ SportsPage: () => <div>Sports Page</div> }));
vi.mock('../pages/settings/SettingsPage', () => ({ SettingsPage: () => <div>Settings Page</div> }));
vi.mock('../pages/resume/ResumePage', () => ({ ResumePage: () => <div>Resume Page</div> }));
vi.mock('../pages/planner/PlannerPage', () => ({ PlannerPage: () => <div>Planner Page</div> }));
vi.mock('../pages/goals/GoalsPage', () => ({ GoalsPage: () => <div>Goals Page</div> }));
vi.mock('../pages/networking/NetworkingPage', () => ({ NetworkingPage: () => <div>Networking Page</div> }));
vi.mock('../pages/health/HealthPage', () => ({ HealthPage: () => <div>Health Page</div> }));
vi.mock('../pages/knowledge/KnowledgePage', () => ({ KnowledgePage: () => <div>Knowledge Page</div> }));
vi.mock('../pages/devtools/DevToolsPage', () => ({ DevToolsPage: () => <div>DevTools Page</div> }));
vi.mock('../pages/focus/FocusPage', () => ({ FocusPage: () => <div>Focus Page</div> }));
vi.mock('../pages/news/NewsPage', () => ({ NewsPage: () => <div>News Page</div> }));
vi.mock('../pages/converter/ConverterPage', () => ({ ConverterPage: () => <div>Converter Page</div> }));
vi.mock('../pages/worldclock/WorldClockPage', () => ({ WorldClockPage: () => <div>WorldClock Page</div> }));
vi.mock('../pages/flashcards/FlashcardsPage', () => ({ FlashcardsPage: () => <div>Flashcards Page</div> }));
vi.mock('../pages/splitter/SplitterPage', () => ({ SplitterPage: () => <div>Splitter Page</div> }));
vi.mock('../pages/meals/MealsPage', () => ({ MealsPage: () => <div>Meals Page</div> }));
vi.mock('../pages/subscriptions/SubscriptionsPage', () => ({ SubscriptionsPage: () => <div>Subscriptions Page</div> }));
vi.mock('../pages/apiplayground/ApiPlaygroundPage', () => ({ ApiPlaygroundPage: () => <div>API Playground Page</div> }));
vi.mock('../pages/colors/ColorsPage', () => ({ ColorsPage: () => <div>Colors Page</div> }));
vi.mock('../pages/wiki/WikiPage', () => ({ WikiPage: () => <div>Wiki Page</div> }));
vi.mock('../pages/music/MusicPage', () => ({ MusicPage: () => <div>Music Page</div> }));
vi.mock('../pages/packing/PackingPage', () => ({ PackingPage: () => <div>Packing Page</div> }));
vi.mock('../pages/regex/RegexPage', () => ({ RegexPage: () => <div>Regex Page</div> }));
vi.mock('../pages/calculator/CalculatorPage', () => ({ CalculatorPage: () => <div>Calculator Page</div> }));
vi.mock('../pages/password/PasswordGenerator', () => ({ PasswordGenerator: () => <div>Password Page</div> }));
vi.mock('../pages/lists/ListsPage', () => ({ ListsPage: () => <div>Lists Page</div> }));
vi.mock('../pages/aichat/AIChatPage', () => ({ AIChatPage: () => <div>AI Chat Page</div> }));
vi.mock('../pages/landing/LandingPage', () => ({ LandingPage: () => <div>Landing</div> }));
vi.mock('./Sidebar', () => ({ Sidebar: () => <nav>Sidebar</nav> }));
vi.mock('./CommandPalette', () => ({ CommandPalette: () => null }));
const mockOpenCommandPalette = vi.fn();
vi.mock('./CommandPaletteContext', () => ({
  CommandPaletteProvider: ({ children }) => children,
  useCommandPalette: () => ({ open: false, setOpen: vi.fn(), openCommandPalette: mockOpenCommandPalette, closeCommandPalette: vi.fn(), toggleCommandPalette: vi.fn() }),
}));
vi.mock('../components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }) => children,
}));

// Mock auth to always be authenticated
vi.mock('../auth/AuthContext', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => ({ user: { name: 'Test' }, login: vi.fn(), logout: vi.fn() }),
}));
vi.mock('../auth/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }) => children,
}));
vi.mock('../auth/LoginPage', () => ({ LoginPage: () => <div>Login</div> }));

// Mock useIDB to return ready immediately (avoids hydration guard blocking)
vi.mock('../hooks/useIDB', () => ({
  useIDB: (key, initial) => [initial, vi.fn(), true],
}));

// We can't use BrowserRouter inside App since it already has one.
// Instead, we'll directly test AppShell by extracting the mobile header logic.
// But since AppShell isn't exported, we'll render App with initial entries via a workaround.

// Actually, App uses BrowserRouter internally. We need to mock react-router-dom partially
// to control the initial route. Let's use a different approach: render App and manipulate
// window.location.

// Simplest approach: App uses BrowserRouter which reads window.location.
// In jsdom, we can set window.location before rendering.

import App from '../App';

function renderAppAtRoute(route) {
  // jsdom lets us push state to change location
  window.history.pushState({}, '', route);
  return render(<App />);
}

describe('Mobile header shows current page name', () => {
  it('shows "Finance" when on /finance route', () => {
    renderAppAtRoute('/finance');
    const header = screen.getByTestId('mobile-header-title');
    expect(header).toHaveTextContent('Finance');
  });

  it('shows "Trips" when on /trips route', () => {
    renderAppAtRoute('/trips');
    const header = screen.getByTestId('mobile-header-title');
    expect(header).toHaveTextContent('Trips');
  });

  it('shows "Trips" when on nested /trips/123 route', () => {
    renderAppAtRoute('/trips/123');
    const header = screen.getByTestId('mobile-header-title');
    expect(header).toHaveTextContent('Trips');
  });

  it('shows "Dashboard" when on /dashboard route', () => {
    renderAppAtRoute('/dashboard');
    const header = screen.getByTestId('mobile-header-title');
    expect(header).toHaveTextContent('Dashboard');
  });

  it('shows "Helios" as fallback for unknown routes', () => {
    renderAppAtRoute('/some-unknown-route');
    const header = screen.getByTestId('mobile-header-title');
    expect(header).toHaveTextContent('Helios');
  });

  it('renders a search button in mobile header that opens CommandPalette', () => {
    mockOpenCommandPalette.mockClear();
    renderAppAtRoute('/dashboard');
    const searchBtn = screen.getByTestId('mobile-search-btn');
    expect(searchBtn).toBeInTheDocument();
    expect(searchBtn).toHaveAttribute('aria-label', 'Search');
    fireEvent.click(searchBtn);
    expect(mockOpenCommandPalette).toHaveBeenCalledTimes(1);
  });

  it('search button has 44px minimum tap target', () => {
    renderAppAtRoute('/dashboard');
    const searchBtn = screen.getByTestId('mobile-search-btn');
    expect(searchBtn.className).toContain('min-w-[44px]');
    expect(searchBtn.className).toContain('min-h-[44px]');
  });

  it('shows back button on nested routes like /trips/123', () => {
    renderAppAtRoute('/trips/123');
    const backBtn = screen.getByTestId('mobile-back-btn');
    expect(backBtn).toBeInTheDocument();
    expect(backBtn).toHaveAttribute('aria-label', 'Go back');
    // Should NOT show the hamburger menu button
    expect(screen.queryByTestId('mobile-menu-btn')).not.toBeInTheDocument();
  });

  it('back button has 44px minimum tap target', () => {
    renderAppAtRoute('/trips/123');
    const backBtn = screen.getByTestId('mobile-back-btn');
    expect(backBtn.className).toContain('min-w-[44px]');
    expect(backBtn.className).toContain('min-h-[44px]');
  });

  it('shows hamburger menu on top-level routes like /trips', () => {
    renderAppAtRoute('/trips');
    const menuBtn = screen.getByTestId('mobile-menu-btn');
    expect(menuBtn).toBeInTheDocument();
    expect(menuBtn).toHaveAttribute('aria-label', 'Open menu');
    // Should NOT show the back button
    expect(screen.queryByTestId('mobile-back-btn')).not.toBeInTheDocument();
  });

  it('shows hamburger menu on /dashboard (top-level)', () => {
    renderAppAtRoute('/dashboard');
    expect(screen.getByTestId('mobile-menu-btn')).toBeInTheDocument();
    expect(screen.queryByTestId('mobile-back-btn')).not.toBeInTheDocument();
  });

  it('shows back button on /trips/new (nested route)', () => {
    renderAppAtRoute('/trips/new');
    expect(screen.getByTestId('mobile-back-btn')).toBeInTheDocument();
    expect(screen.queryByTestId('mobile-menu-btn')).not.toBeInTheDocument();
  });

  it('does not render global mobile header on /ai route (AI Chat has its own)', () => {
    renderAppAtRoute('/ai');
    expect(screen.queryByTestId('mobile-header-title')).not.toBeInTheDocument();
    // AI Chat page renders its own mobile header with Chats/New buttons
    expect(screen.getByText('AI Chat Page')).toBeInTheDocument();
  });
});
