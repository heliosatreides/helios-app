import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/dashboard/Dashboard';
import { TripsPage } from './pages/trips/TripsPage';
import { FinancePage } from './pages/finance/FinancePage';
import { InvestmentsPage } from './pages/investments/InvestmentsPage';
import { SportsPage } from './pages/sports/SportsPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { LoginPage } from './auth/LoginPage';
import { useLocalStorage } from './hooks/useLocalStorage';
import './index.css';

function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [trips] = useLocalStorage('helios-trips', []);
  const [accounts] = useLocalStorage('finance-accounts', []);
  const [transactions] = useLocalStorage('finance-transactions', []);
  const [budgets] = useLocalStorage('finance-budgets', []);
  const [portfolio] = useLocalStorage('investments-portfolio', []);

  return (
    <div className="flex h-screen bg-[#0a0a0b] overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
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
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-[#27272a] bg-[#111113]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-[#71717a] hover:text-[#e4e4e7] p-1"
            aria-label="Open menu"
          >
            ☰
          </button>
          <span className="text-[#e4e4e7] font-bold">Helios ☀️</span>
          <div className="w-7" />
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto">
            <Routes>
              <Route path="/" element={<ProtectedRoute><Dashboard trips={trips} accounts={accounts} transactions={transactions} budgets={budgets} portfolio={portfolio} /></ProtectedRoute>} />
              <Route path="/trips/*" element={<ProtectedRoute><TripsPage /></ProtectedRoute>} />
              <Route path="/finance" element={<ProtectedRoute><FinancePage /></ProtectedRoute>} />
              <Route path="/investments" element={<ProtectedRoute><InvestmentsPage /></ProtectedRoute>} />
              <Route path="/sports" element={<ProtectedRoute><SportsPage /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={<AppShell />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
