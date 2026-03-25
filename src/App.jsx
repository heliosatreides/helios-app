import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/dashboard/Dashboard';
import { TripsPage } from './pages/trips/TripsPage';
import { FinancePage } from './pages/finance/FinancePage';
import { InvestmentsPage } from './pages/investments/InvestmentsPage';
import { SportsPage } from './pages/sports/SportsPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { ResumePage } from './pages/resume/ResumePage';
import { PlannerPage } from './pages/planner/PlannerPage';
import { GoalsPage } from './pages/goals/GoalsPage';
import { NetworkingPage } from './pages/networking/NetworkingPage';
import { HealthPage } from './pages/health/HealthPage';
import { KnowledgePage } from './pages/knowledge/KnowledgePage';
import { DevToolsPage } from './pages/devtools/DevToolsPage';
import { FocusPage } from './pages/focus/FocusPage';
import { NewsPage } from './pages/news/NewsPage';
import { ConverterPage } from './pages/converter/ConverterPage';
import { WorldClockPage } from './pages/worldclock/WorldClockPage';
import { FlashcardsPage } from './pages/flashcards/FlashcardsPage';
import { SplitterPage } from './pages/splitter/SplitterPage';
import { MealsPage } from './pages/meals/MealsPage';
import { SubscriptionsPage } from './pages/subscriptions/SubscriptionsPage';
import { ApiPlaygroundPage } from './pages/apiplayground/ApiPlaygroundPage';
import { ColorsPage } from './pages/colors/ColorsPage';
import { WikiPage } from './pages/wiki/WikiPage';
import { MusicPage } from './pages/music/MusicPage';
import { PackingPage } from './pages/packing/PackingPage';
import { RegexPage } from './pages/regex/RegexPage';
import { CalculatorPage } from './pages/calculator/CalculatorPage';
import { PasswordGenerator } from './pages/password/PasswordGenerator';
import { ChatPage } from './pages/chat/ChatPage';
import { AIChatPage } from './pages/aichat/AIChatPage';
import { ListsPage } from './pages/lists/ListsPage';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { LoginPage } from './auth/LoginPage';
import { LandingPage } from './pages/landing/LandingPage';
import { useAuth } from './auth/AuthContext';
import { useIDB } from './hooks/useIDB';
import { CommandPalette } from './components/CommandPalette';
import { CommandPaletteProvider, useCommandPalette } from './components/CommandPaletteContext';
import { ToastProvider } from './components/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

const ROUTE_LABELS = {
  '/dashboard': 'Dashboard',
  '/planner': 'Planner',
  '/goals': 'Goals',
  '/resume': 'Resume',
  '/trips': 'Trips',
  '/finance': 'Finance',
  '/investments': 'Investments',
  '/sports': 'Sports',
  '/health': 'Health',
  '/meals': 'Meals',
  '/subscriptions': 'Subscriptions',
  '/ai': 'AI Chat',
  '/chat': 'P2P Chat',
  '/focus': 'Focus',
  '/knowledge': 'Knowledge',
  '/networking': 'Networking',
  '/news': 'News',
  '/flashcards': 'Flashcards',
  '/music': 'Music',
  '/splitter': 'Splitter',
  '/packing': 'Packing',
  '/devtools': 'Dev Tools',
  '/converter': 'Converter',
  '/worldclock': 'World Clock',
  '/apiplayground': 'API Playground',
  '/colors': 'Colors',
  '/wiki': 'Wiki',
  '/regex': 'Regex',
  '/calculator': 'Calculator',
  '/password': 'Password Generator',
  '/settings': 'Settings',
};

function getPageLabel(pathname) {
  if (ROUTE_LABELS[pathname]) return ROUTE_LABELS[pathname];
  // Match base path for nested routes like /trips/123
  const basePath = '/' + pathname.split('/').filter(Boolean)[0];
  return ROUTE_LABELS[basePath] || 'Helios';
}

function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { openCommandPalette } = useCommandPalette();
  const location = useLocation();
  const pageLabel = getPageLabel(location.pathname);
  const [trips, , tripsReady] = useIDB('helios-trips', []);
  const [accounts, , accountsReady] = useIDB('finance-accounts', []);
  const [transactions, , txReady] = useIDB('finance-transactions', []);
  const [budgets, , budgetsReady] = useIDB('finance-budgets', []);
  const [portfolio, , portfolioReady] = useIDB('investments-portfolio', []);

  const idbReady = tripsReady && accountsReady && txReady && budgetsReady && portfolioReady;

  if (!idbReady) {
    return (
      <div className="flex items-center justify-center bg-background" style={{ height: '100dvh' }} data-testid="idb-loading">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-muted-foreground border-t-foreground rounded-full animate-spin" />
          <span className="text-muted-foreground text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-background overflow-hidden" style={{ height: '100dvh', paddingTop: 'env(safe-area-inset-top)' }}>
      <CommandPalette />
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed md:relative inset-y-0 left-0 z-30 bg-background transform transition-transform duration-200 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <Sidebar onNavClick={() => setSidebarOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-background">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-muted-foreground hover:text-foreground p-3 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Open menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <span className="text-foreground font-semibold text-sm" data-testid="mobile-header-title">{pageLabel}</span>
          <button
            onClick={openCommandPalette}
            className="text-muted-foreground hover:text-foreground p-3 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Search"
            data-testid="mobile-search-btn"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </header>

        {/* AI Chat renders full-bleed (no padding/max-width) to avoid layout hacks */}
        {location.pathname === '/ai' ? (
          <div className="flex-1 overflow-hidden">
            <ErrorBoundary>
              <ProtectedRoute><AIChatPage /></ProtectedRoute>
            </ErrorBoundary>
          </div>
        ) : (
        <main className="flex-1 overflow-y-auto p-6">
          <ErrorBoundary>
          <div className="max-w-5xl mx-auto">
            <Routes>
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard trips={trips} accounts={accounts} transactions={transactions} budgets={budgets} portfolio={portfolio} /></ProtectedRoute>} />
              <Route path="/trips/*" element={<ProtectedRoute><TripsPage /></ProtectedRoute>} />
              <Route path="/finance" element={<ProtectedRoute><FinancePage /></ProtectedRoute>} />
              <Route path="/investments" element={<ProtectedRoute><InvestmentsPage /></ProtectedRoute>} />
              <Route path="/sports" element={<ProtectedRoute><SportsPage /></ProtectedRoute>} />
              <Route path="/resume" element={<ProtectedRoute><ResumePage /></ProtectedRoute>} />
              <Route path="/planner" element={<ProtectedRoute><PlannerPage /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
              <Route path="/goals" element={<ProtectedRoute><GoalsPage /></ProtectedRoute>} />
              <Route path="/networking" element={<ProtectedRoute><NetworkingPage /></ProtectedRoute>} />
              <Route path="/health" element={<ProtectedRoute><HealthPage /></ProtectedRoute>} />
              <Route path="/knowledge" element={<ProtectedRoute><KnowledgePage /></ProtectedRoute>} />
              <Route path="/devtools" element={<ProtectedRoute><DevToolsPage /></ProtectedRoute>} />
              <Route path="/focus" element={<ProtectedRoute><FocusPage /></ProtectedRoute>} />
              <Route path="/news" element={<ProtectedRoute><NewsPage /></ProtectedRoute>} />
              <Route path="/converter" element={<ProtectedRoute><ConverterPage /></ProtectedRoute>} />
              <Route path="/worldclock" element={<ProtectedRoute><WorldClockPage /></ProtectedRoute>} />
              <Route path="/flashcards" element={<ProtectedRoute><FlashcardsPage /></ProtectedRoute>} />
              <Route path="/splitter" element={<ProtectedRoute><SplitterPage /></ProtectedRoute>} />
              <Route path="/meals" element={<ProtectedRoute><MealsPage /></ProtectedRoute>} />
              <Route path="/subscriptions" element={<ProtectedRoute><SubscriptionsPage /></ProtectedRoute>} />
              <Route path="/apiplayground" element={<ProtectedRoute><ApiPlaygroundPage /></ProtectedRoute>} />
              <Route path="/colors" element={<ProtectedRoute><ColorsPage /></ProtectedRoute>} />
              <Route path="/wiki" element={<ProtectedRoute><WikiPage /></ProtectedRoute>} />
              <Route path="/music" element={<ProtectedRoute><MusicPage /></ProtectedRoute>} />
              <Route path="/packing" element={<ProtectedRoute><PackingPage /></ProtectedRoute>} />
              <Route path="/regex" element={<ProtectedRoute><RegexPage /></ProtectedRoute>} />
              <Route path="/calculator" element={<ProtectedRoute><CalculatorPage /></ProtectedRoute>} />
              <Route path="/password" element={<ProtectedRoute><PasswordGenerator /></ProtectedRoute>} />
              <Route path="/ai" element={<ProtectedRoute><AIChatPage /></ProtectedRoute>} />
            </Routes>
          </div>
          </ErrorBoundary>
        </main>
        )}
      </div>
    </div>
  );
}

function RootRoute() {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;
  return <LandingPage />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CommandPaletteProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<RootRoute />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/lists" element={<ListsPage />} />
            <Route path="/*" element={<AppShell />} />
          </Routes>
        </ToastProvider>
        </CommandPaletteProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
