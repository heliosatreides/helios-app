import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import { ChatPage } from './pages/chat/ChatPage';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { LoginPage } from './auth/LoginPage';
import { LandingPage } from './pages/landing/LandingPage';
import { useAuth } from './auth/AuthContext';
import { useIDB } from './hooks/useIDB';
import { CommandPalette } from './components/CommandPalette';
import './index.css';

function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [trips] = useIDB('helios-trips', []);
  const [accounts] = useIDB('finance-accounts', []);
  const [transactions] = useIDB('finance-transactions', []);
  const [budgets] = useIDB('finance-budgets', []);
  const [portfolio] = useIDB('investments-portfolio', []);

  return (
    <div className="flex h-screen bg-[#0a0a0b] overflow-hidden">
      <CommandPalette />
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed md:relative inset-y-0 left-0 z-30
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <Sidebar onNavClick={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile) */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-[#1c1c20] bg-[#0c0c0e]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-[#71717a] hover:text-[#e4e4e7] p-1.5 rounded-lg hover:bg-[#18181b] transition-colors"
            aria-label="Open menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-xs font-bold text-black">H</div>
            <span className="text-[#e4e4e7] font-bold text-sm">Helios</span>
          </div>
          <div className="w-8" />
        </header>

        <main className="flex-1 overflow-y-auto p-6">
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
            </Routes>
          </div>
        </main>
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
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<RootRoute />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/*" element={<AppShell />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
