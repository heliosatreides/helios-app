import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
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
import { UtilitiesPage } from './pages/utilities/UtilitiesPage';
import { AIChatPage } from './pages/aichat/AIChatPage';
import { ListsPage } from './pages/lists/ListsPage';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { LoginPage } from './auth/LoginPage';
import { LandingPage } from './pages/landing/LandingPage';
import { useAuth } from './auth/AuthContext';
import { CommandPalette } from './components/CommandPalette';
import { CommandPaletteProvider, useCommandPalette } from './components/CommandPaletteContext';
import { ToastProvider } from './components/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { BottomNav } from './components/BottomNav';
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
  '/focus': 'Focus',
  '/knowledge': 'Knowledge',
  '/networking': 'Networking',
  '/news': 'News',
  '/flashcards': 'Flashcards',
  '/music': 'Playlist Suggester',
  '/splitter': 'Splitter',
  '/packing': 'Packing',
  '/devtools': 'Dev Tools',
  '/utilities': 'Utilities',
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
  const navigate = useNavigate();
  const pageLabel = getPageLabel(location.pathname);

  // Detect nested routes (e.g. /trips/123, /trips/new) for back navigation on mobile
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const isNestedRoute = pathSegments.length > 1;
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
        {/* AI Chat has its own mobile header — skip the global one to avoid double-header */}
        {location.pathname !== '/ai' && (
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-background">
          {isNestedRoute ? (
            <button
              onClick={() => navigate('/' + pathSegments[0])}
              className="text-muted-foreground hover:text-foreground p-3 min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Go back"
              data-testid="mobile-back-btn"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          ) : (
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-muted-foreground hover:text-foreground p-3 min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Open menu"
              data-testid="mobile-menu-btn"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          )}
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
        )}

        {/* AI Chat renders full-bleed (no padding/max-width) to avoid layout hacks */}
        {location.pathname === '/ai' ? (
          <div className="flex-1 overflow-hidden pb-24 md:pb-0">
            <ErrorBoundary pageName="AI Chat">
              <ProtectedRoute><AIChatPage onOpenSidebar={() => setSidebarOpen(true)} onOpenSearch={openCommandPalette} /></ProtectedRoute>
            </ErrorBoundary>
          </div>
        ) : (
        <main className="flex-1 overflow-y-auto p-6 pb-24 md:pb-6">
          <div className="max-w-5xl mx-auto">
            <Routes>
              <Route path="/dashboard" element={<ErrorBoundary pageName="Dashboard"><ProtectedRoute><Dashboard /></ProtectedRoute></ErrorBoundary>} />
              <Route path="/trips/*" element={<ErrorBoundary pageName="Trips"><ProtectedRoute><TripsPage /></ProtectedRoute></ErrorBoundary>} />
              <Route path="/finance" element={<ErrorBoundary pageName="Finance"><ProtectedRoute><FinancePage /></ProtectedRoute></ErrorBoundary>} />
              <Route path="/investments" element={<ErrorBoundary pageName="Investments"><ProtectedRoute><InvestmentsPage /></ProtectedRoute></ErrorBoundary>} />
              <Route path="/sports" element={<ErrorBoundary pageName="Sports"><ProtectedRoute><SportsPage /></ProtectedRoute></ErrorBoundary>} />
              <Route path="/resume" element={<ErrorBoundary pageName="Resume"><ProtectedRoute><ResumePage /></ProtectedRoute></ErrorBoundary>} />
              <Route path="/planner" element={<ErrorBoundary pageName="Planner"><ProtectedRoute><PlannerPage /></ProtectedRoute></ErrorBoundary>} />
              <Route path="/settings" element={<ErrorBoundary pageName="Settings"><ProtectedRoute><SettingsPage /></ProtectedRoute></ErrorBoundary>} />
              <Route path="/goals" element={<ErrorBoundary pageName="Goals"><ProtectedRoute><GoalsPage /></ProtectedRoute></ErrorBoundary>} />
              <Route path="/networking" element={<ErrorBoundary pageName="Networking"><ProtectedRoute><NetworkingPage /></ProtectedRoute></ErrorBoundary>} />
              <Route path="/health" element={<ErrorBoundary pageName="Health"><ProtectedRoute><HealthPage /></ProtectedRoute></ErrorBoundary>} />
              <Route path="/knowledge" element={<ErrorBoundary pageName="Knowledge"><ProtectedRoute><KnowledgePage /></ProtectedRoute></ErrorBoundary>} />
              <Route path="/devtools" element={<ErrorBoundary pageName="Dev Tools"><ProtectedRoute><DevToolsPage /></ProtectedRoute></ErrorBoundary>} />
              <Route path="/focus" element={<ErrorBoundary pageName="Focus"><ProtectedRoute><FocusPage /></ProtectedRoute></ErrorBoundary>} />
              <Route path="/news" element={<ErrorBoundary pageName="News"><ProtectedRoute><NewsPage /></ProtectedRoute></ErrorBoundary>} />
              <Route path="/utilities" element={<ErrorBoundary pageName="Utilities"><ProtectedRoute><UtilitiesPage /></ProtectedRoute></ErrorBoundary>} />
              <Route path="/converter" element={<Navigate to="/utilities?tab=converter" replace />} />
              <Route path="/worldclock" element={<Navigate to="/utilities?tab=worldclock" replace />} />
              <Route path="/regex" element={<Navigate to="/utilities?tab=regex" replace />} />
              <Route path="/calculator" element={<Navigate to="/utilities?tab=calculator" replace />} />
              <Route path="/password" element={<Navigate to="/utilities?tab=passwords" replace />} />
              <Route path="/flashcards" element={<ErrorBoundary pageName="Flashcards"><ProtectedRoute><FlashcardsPage /></ProtectedRoute></ErrorBoundary>} />
              <Route path="/splitter" element={<ErrorBoundary pageName="Splitter"><ProtectedRoute><SplitterPage /></ProtectedRoute></ErrorBoundary>} />
              <Route path="/meals" element={<ErrorBoundary pageName="Meals"><ProtectedRoute><MealsPage /></ProtectedRoute></ErrorBoundary>} />
              <Route path="/subscriptions" element={<ErrorBoundary pageName="Subscriptions"><ProtectedRoute><SubscriptionsPage /></ProtectedRoute></ErrorBoundary>} />
              <Route path="/apiplayground" element={<ErrorBoundary pageName="API Playground"><ProtectedRoute><ApiPlaygroundPage /></ProtectedRoute></ErrorBoundary>} />
              <Route path="/colors" element={<ErrorBoundary pageName="Colors"><ProtectedRoute><ColorsPage /></ProtectedRoute></ErrorBoundary>} />
              <Route path="/wiki" element={<ErrorBoundary pageName="Wiki"><ProtectedRoute><WikiPage /></ProtectedRoute></ErrorBoundary>} />
              <Route path="/music" element={<ErrorBoundary pageName="Music"><ProtectedRoute><MusicPage /></ProtectedRoute></ErrorBoundary>} />
              <Route path="/packing" element={<ErrorBoundary pageName="Packing"><ProtectedRoute><PackingPage /></ProtectedRoute></ErrorBoundary>} />
              {/* /ai is handled full-bleed above, not in the padded Routes block */}
              <Route path="/lists" element={<ErrorBoundary pageName="Lists"><ProtectedRoute><ListsPage /></ProtectedRoute></ErrorBoundary>} />
            </Routes>
          </div>
        </main>
        )}
      </div>

      {/* Mobile bottom navigation bar */}
      <BottomNav onOpenSidebar={() => setSidebarOpen(true)} />
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
            <Route path="/*" element={<AppShell />} />
          </Routes>
        </ToastProvider>
        </CommandPaletteProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
