import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Track ready states per key
let readyStates = {};

vi.mock('../hooks/useIDB', () => ({
  useIDB: (key, initial) => {
    const ready = readyStates[key] ?? false;
    return [initial, vi.fn(), ready];
  },
}));

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
vi.mock('../pages/chat/ChatPage', () => ({ ChatPage: () => <div>Chat Page</div> }));
vi.mock('../pages/aichat/AIChatPage', () => ({ AIChatPage: () => <div>AI Chat Page</div> }));
vi.mock('../pages/landing/LandingPage', () => ({ LandingPage: () => <div>Landing</div> }));
vi.mock('./Sidebar', () => ({ Sidebar: () => <nav>Sidebar</nav> }));
vi.mock('./CommandPalette', () => ({ CommandPalette: () => null }));
vi.mock('./CommandPaletteContext', () => ({
  CommandPaletteProvider: ({ children }) => children,
  useCommandPalette: () => ({ open: false, setOpen: vi.fn(), openCommandPalette: vi.fn(), closeCommandPalette: vi.fn(), toggleCommandPalette: vi.fn() }),
}));
vi.mock('../components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }) => children,
}));
vi.mock('../auth/AuthContext', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => ({ user: { name: 'Test' }, login: vi.fn(), logout: vi.fn() }),
}));
vi.mock('../auth/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }) => children,
}));
vi.mock('../auth/LoginPage', () => ({ LoginPage: () => <div>Login</div> }));

import App from '../App';

describe('IDB hydration guard', () => {
  beforeEach(() => {
    readyStates = {};
  });

  it('shows loading spinner when IDB stores are not ready', () => {
    // All stores not ready
    readyStates = {};
    window.history.pushState({}, '', '/dashboard');
    render(<App />);
    expect(screen.getByTestId('idb-loading')).toBeInTheDocument();
  });

  it('shows loading spinner when only some stores are ready', () => {
    readyStates = {
      'helios-trips': true,
      'finance-accounts': true,
      'finance-transactions': false,
      'finance-budgets': true,
      'investments-portfolio': true,
    };
    window.history.pushState({}, '', '/dashboard');
    render(<App />);
    expect(screen.getByTestId('idb-loading')).toBeInTheDocument();
  });

  it('renders app content when all IDB stores are ready', () => {
    readyStates = {
      'helios-trips': true,
      'finance-accounts': true,
      'finance-transactions': true,
      'finance-budgets': true,
      'investments-portfolio': true,
    };
    window.history.pushState({}, '', '/dashboard');
    render(<App />);
    expect(screen.queryByTestId('idb-loading')).not.toBeInTheDocument();
    expect(screen.getByTestId('mobile-header-title')).toBeInTheDocument();
  });
});
