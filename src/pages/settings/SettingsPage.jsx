import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { encrypt, decrypt } from '../../auth/crypto';
import { useIDB } from '../../hooks/useIDB';
import { exportAllAsJSON, exportAsCSV } from '../../utils/exportData';
import { ImportButton } from '../../components/ImportButton';
import { mergeById, mergeByTicker } from '../../utils/importData';

const AI_KEY_ENC_LS = 'helios-gemini-key-enc';

export function useGeminiKey() {
  const { password, user } = useAuth();

  const get = async () => {
    const ciphertext = localStorage.getItem(AI_KEY_ENC_LS);
    if (!ciphertext || !password || !user) return '';
    try {
      return await decrypt(ciphertext, password, user.username);
    } catch {
      return '';
    }
  };

  const set = async (apiKey) => {
    if (apiKey && password && user) {
      const ciphertext = await encrypt(apiKey, password, user.username);
      localStorage.setItem(AI_KEY_ENC_LS, ciphertext);
      localStorage.removeItem('helios-gemini-key');
    } else {
      localStorage.removeItem(AI_KEY_ENC_LS);
      localStorage.removeItem('helios-gemini-key');
    }
  };

  return { getKey: get, setKey: set };
}

export async function callGemini(apiKey, prompt) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.candidates[0].content.parts[0].text;
}

export function SettingsPage() {
  const { user, password } = useAuth();
  const [activeTab, setActiveTab] = useState('ai');

  // AI Integration state
  const [apiKey, setApiKey] = useState('');
  const [decryptError, setDecryptError] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // null | 'ok' | 'error'
  const [testMsg, setTestMsg] = useState('');
  const [saved, setSaved] = useState(false);

  // Export/Import state
  const [exportFlash, setExportFlash] = useState(null);
  const [importFlash, setImportFlash] = useState(null);

  // IDB data for export/import
  const [trips, setTrips] = useIDB('helios-trips', []);
  const [accounts, setAccounts] = useIDB('finance-accounts', []);
  const [transactions, setTransactions] = useIDB('finance-transactions', []);
  const [budgets, setBudgets] = useIDB('finance-budgets', []);
  const [portfolio, setPortfolio] = useIDB('investments-portfolio', []);
  const [watchlist, setWatchlist] = useIDB('investments-watchlist', []);
  const [strategyNotes] = useIDB('investments-strategy-notes', '');
  const [favorites] = useIDB('helios-sports-favorites', []);

  // Load and decrypt the stored key on mount / when password changes
  useEffect(() => {
    async function loadKey() {
      const ciphertext = localStorage.getItem(AI_KEY_ENC_LS);
      if (!ciphertext) {
        setApiKey('');
        setDecryptError(false);
        return;
      }
      if (!password || !user) {
        setDecryptError(true);
        setApiKey('');
        return;
      }
      try {
        const plaintext = await decrypt(ciphertext, password, user.username);
        setApiKey(plaintext);
        setDecryptError(false);
      } catch {
        setApiKey('');
        setDecryptError(true);
      }
    }
    loadKey();
  }, [password, user]);

  const handleSave = async () => {
    if (apiKey.trim() && password && user) {
      const ciphertext = await encrypt(apiKey.trim(), password, user.username);
      localStorage.setItem(AI_KEY_ENC_LS, ciphertext);
      localStorage.removeItem('helios-gemini-key');
    } else {
      localStorage.removeItem(AI_KEY_ENC_LS);
      localStorage.removeItem('helios-gemini-key');
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTest = async () => {
    if (!apiKey.trim()) return;
    setTesting(true);
    setTestResult(null);
    try {
      const text = await callGemini(apiKey.trim(), 'Say "Connection successful!" in exactly those words.');
      setTestResult('ok');
      setTestMsg(text.trim());
    } catch (err) {
      setTestResult('error');
      setTestMsg(err.message);
    } finally {
      setTesting(false);
    }
  };

  const showExportFlash = (label) => {
    setExportFlash(label);
    setTimeout(() => setExportFlash(null), 2000);
  };

  const handleImportAllJSON = (data) => {
    const messages = [];

    if (data.trips) {
      setTrips((prev) => {
        const { merged, imported, skipped } = mergeById(prev, data.trips);
        messages.push(`${imported} trips (${skipped} skipped)`);
        return merged;
      });
    }
    if (data.finance?.accounts) {
      setAccounts((prev) => {
        const { merged, imported, skipped } = mergeById(prev, data.finance.accounts);
        messages.push(`${imported} accounts (${skipped} skipped)`);
        return merged;
      });
    }
    if (data.finance?.transactions) {
      setTransactions((prev) => {
        const { merged, imported, skipped } = mergeById(prev, data.finance.transactions);
        messages.push(`${imported} transactions (${skipped} skipped)`);
        return merged;
      });
    }
    if (data.finance?.budgets) {
      setBudgets((prev) => {
        const { merged, imported, skipped } = mergeById(prev, data.finance.budgets);
        messages.push(`${imported} budgets (${skipped} skipped)`);
        return merged;
      });
    }
    if (data.investments?.portfolio) {
      setPortfolio((prev) => {
        const { merged, imported, skipped } = mergeByTicker(prev, data.investments.portfolio);
        messages.push(`${imported} holdings (${skipped} skipped)`);
        return merged;
      });
    }
    if (data.investments?.watchlist) {
      setWatchlist((prev) => {
        const { merged, imported, skipped } = mergeById(prev, data.investments.watchlist);
        messages.push(`${imported} watchlist items (${skipped} skipped)`);
        return merged;
      });
    }

    setImportFlash(messages.length ? messages.join(', ') : 'Nothing to import');
    setTimeout(() => setImportFlash(null), 5000);
  };

  const handleExportJSON = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      trips,
      finance: { accounts, transactions, budgets },
      investments: { portfolio, watchlist, strategyNotes },
      sports: { favorites },
    };
    exportAllAsJSON(data);
    showExportFlash('json');
  };

  const handleExportTransactions = () => {
    const rows = transactions.map((t) => ({
      date: t.date ?? '',
      description: t.description ?? '',
      amount: t.amount ?? '',
      type: t.type ?? '',
      category: t.category ?? '',
      account: t.account ?? '',
    }));
    exportAsCSV(rows, `helios-transactions-${new Date().toISOString().split('T')[0]}.csv`);
    showExportFlash('transactions');
  };

  const handleExportPortfolio = () => {
    const rows = portfolio.map((h) => ({
      ticker: h.ticker ?? '',
      name: h.name ?? '',
      assetClass: h.assetClass ?? '',
      shares: h.shares ?? '',
      costBasis: h.costBasis ?? '',
      currentPrice: h.currentPrice ?? '',
      marketValue: h.marketValue ?? '',
      gainLoss: h.gainLoss ?? '',
    }));
    exportAsCSV(rows, `helios-portfolio-${new Date().toISOString().split('T')[0]}.csv`);
    showExportFlash('portfolio');
  };

  const handleExportTrips = () => {
    const rows = trips.map((t) => ({
      name: t.name ?? '',
      destination: t.destination ?? '',
      startDate: t.startDate ?? '',
      endDate: t.endDate ?? '',
      budget: t.budget ?? '',
      status: t.status ?? '',
    }));
    exportAsCSV(rows, `helios-trips-${new Date().toISOString().split('T')[0]}.csv`);
    showExportFlash('trips');
  };

  const inputCls = 'bg-[#0a0a0b] border border-[#27272a] rounded-lg px-3 py-2 text-[#e4e4e7] text-sm placeholder-[#52525b] focus:outline-none focus:border-[#f59e0b] w-full';

  // Developer settings
  const [githubUsername, setGithubUsername] = useState(() => localStorage.getItem('settings-github-username') || '');
  const [ghSaved, setGhSaved] = useState(false);

  const handleSaveGithub = () => {
    localStorage.setItem('settings-github-username', githubUsername.trim());
    setGhSaved(true);
    setTimeout(() => setGhSaved(false), 2000);
  };

  // Health settings
  const [waterGoal, setWaterGoal] = useState(() => localStorage.getItem('settings-water-goal') || '8');
  const [waterSaved, setWaterSaved] = useState(false);

  const handleSaveWater = () => {
    const val = parseInt(waterGoal, 10);
    if (!isNaN(val) && val > 0) {
      localStorage.setItem('settings-water-goal', String(val));
      setWaterSaved(true);
      setTimeout(() => setWaterSaved(false), 2000);
    }
  };

  const tabs = [
    { id: 'ai', label: '✨ AI Integration' },
    { id: 'export', label: '📦 Export Data' },
    { id: 'developer', label: '🛠️ Developer' },
    { id: 'health', label: '💚 Health' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#e4e4e7]">Settings</h1>
        <p className="text-[#71717a] text-sm mt-1">Configure your Helios preferences</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-[#27272a]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === tab.id
                ? 'text-amber-400 border-b-2 border-amber-400'
                : 'text-[#71717a] hover:text-[#e4e4e7]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* AI Integration Tab */}
      {activeTab === 'ai' && (
        <div className="bg-[#111113] border border-[#27272a] rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">✨</span>
            <h2 className="text-[#e4e4e7] font-semibold">AI Integration</h2>
          </div>
          <p className="text-[#71717a] text-sm">
            Add your Gemini API key to unlock AI-powered insights across the app.
            Your key is stored locally and only sent to Google's servers.
          </p>

          {decryptError && (
            <div className="text-xs px-3 py-2 rounded-lg border text-red-400 bg-red-400/10 border-red-400/20">
              Could not decrypt key — please re-enter
            </div>
          )}

          <div>
            <label className="block text-[#71717a] text-xs mb-1.5">Gemini API Key</label>
            <div className="relative">
              <input
                className={inputCls + ' pr-20'}
                type={showKey ? 'text' : 'password'}
                placeholder="AIza..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowKey((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717a] hover:text-[#e4e4e7] text-xs transition-colors"
              >
                {showKey ? '🙈 Hide' : '👁 Show'}
              </button>
            </div>
          </div>

          {testResult && (
            <div className={`text-xs px-3 py-2 rounded-lg border ${
              testResult === 'ok'
                ? 'text-green-400 bg-green-400/10 border-green-400/20'
                : 'text-red-400 bg-red-400/10 border-red-400/20'
            }`}>
              {testResult === 'ok' ? '✅ ' : '❌ '}{testMsg}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
            >
              {saved ? '✓ Saved' : 'Save Key'}
            </button>
            <button
              onClick={handleTest}
              disabled={testing || !apiKey.trim()}
              className="border border-[#27272a] text-[#71717a] hover:text-[#e4e4e7] disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-sm transition-colors"
            >
              {testing ? '⏳ Testing…' : 'Test Connection'}
            </button>
            {apiKey && (
              <button
                onClick={() => {
                  setApiKey('');
                  localStorage.removeItem(AI_KEY_ENC_LS);
                  localStorage.removeItem('helios-gemini-key');
                  setTestResult(null);
                }}
                className="border border-[#27272a] text-red-400/70 hover:text-red-400 px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Remove Key
              </button>
            )}
          </div>

          <div className="pt-2 border-t border-[#27272a]">
            <p className="text-[#52525b] text-xs">
              Get a free key at{' '}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400/70 hover:text-amber-400 underline"
              >
                aistudio.google.com
              </a>
              . Free tier is generous for personal use.
            </p>
          </div>
        </div>
      )}

      {/* Export Data Tab */}
      {activeTab === 'export' && (
        <div className="bg-[#111113] border border-[#27272a] rounded-xl p-6 space-y-6">
          <div>
            <h2 className="text-[#e4e4e7] font-semibold text-lg">Export Your Data</h2>
            <p className="text-[#71717a] text-sm mt-1">
              Download your Helios data as JSON or CSV. Your data never leaves your device.
            </p>
          </div>

          {/* Success flash */}
          {exportFlash && (
            <div className="text-xs px-3 py-2 rounded-lg border text-green-400 bg-green-400/10 border-green-400/20">
              ✅ Exported!
            </div>
          )}

          {/* Import flash */}
          {importFlash && (
            <div className="text-xs px-3 py-2 rounded-lg border text-green-400 bg-green-400/10 border-green-400/20">
              ✅ Imported: {importFlash}
            </div>
          )}

          {/* Full JSON export */}
          <div className="space-y-3">
            <h3 className="text-[#a1a1aa] text-sm font-medium">Full Export</h3>
            <button
              onClick={handleExportJSON}
              className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
            >
              ⬇️ Export All Data (JSON)
            </button>
            <p className="text-[#52525b] text-xs">
              Exports all trips, finance, investments, and sports data in a single structured JSON file.
            </p>
          </div>

          <div className="border-t border-[#27272a]" />

          {/* Full JSON import */}
          <div className="space-y-3">
            <h3 className="text-[#a1a1aa] text-sm font-medium">Full Import</h3>
            <div className="px-3 py-2 rounded-lg border border-amber-400/30 bg-amber-400/5 text-amber-300 text-xs">
              ⚠️ Importing will merge with existing data. Duplicates (by id) are skipped.
            </div>
            <ImportButton
              mode="json"
              label="📥 Import All Data (JSON)"
              onImport={handleImportAllJSON}
            />
            <p className="text-[#52525b] text-xs">
              Accepts a full Helios export JSON. All modules are merged at once. No data is deleted.
            </p>
          </div>

          <div className="border-t border-[#27272a]" />

          {/* Per-module CSV exports */}
          <div className="space-y-3">
            <h3 className="text-[#a1a1aa] text-sm font-medium">Per-Module CSV</h3>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleExportTransactions}
                className="border border-[#27272a] text-[#e4e4e7] hover:border-amber-400/50 hover:text-amber-400 px-4 py-2 rounded-lg text-sm transition-colors text-left"
              >
                📋 Export Transactions (CSV)
              </button>
              <button
                onClick={handleExportPortfolio}
                className="border border-[#27272a] text-[#e4e4e7] hover:border-amber-400/50 hover:text-amber-400 px-4 py-2 rounded-lg text-sm transition-colors text-left"
              >
                📋 Export Portfolio (CSV)
              </button>
              <button
                onClick={handleExportTrips}
                className="border border-[#27272a] text-[#e4e4e7] hover:border-amber-400/50 hover:text-amber-400 px-4 py-2 rounded-lg text-sm transition-colors text-left"
              >
                📋 Export Trips (CSV)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Developer Tab */}
      {activeTab === 'developer' && (
        <div className="bg-[#111113] border border-[#27272a] rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🛠️</span>
            <h2 className="text-[#e4e4e7] font-semibold">Developer Settings</h2>
          </div>
          <p className="text-[#71717a] text-sm">Settings used by the Dev Tools widget on the dashboard.</p>
          <div>
            <label className="block text-[#71717a] text-xs mb-1.5">GitHub Username</label>
            <input
              className={inputCls}
              type="text"
              placeholder="your-github-username"
              value={githubUsername}
              onChange={(e) => setGithubUsername(e.target.value)}
              data-testid="settings-github-username"
            />
            <p className="text-[#52525b] text-xs mt-1">Used to display your GitHub contribution graph on the Dev Tools tab.</p>
          </div>
          <button
            onClick={handleSaveGithub}
            className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
          >
            {ghSaved ? '✓ Saved' : 'Save'}
          </button>
        </div>
      )}

      {/* Health Tab */}
      {activeTab === 'health' && (
        <div className="bg-[#111113] border border-[#27272a] rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">💚</span>
            <h2 className="text-[#e4e4e7] font-semibold">Health Settings</h2>
          </div>
          <p className="text-[#71717a] text-sm">Configure your health & wellness goals.</p>
          <div>
            <label className="block text-[#71717a] text-xs mb-1.5">Daily Water Goal (glasses)</label>
            <input
              className={inputCls}
              type="number"
              min="1"
              max="20"
              value={waterGoal}
              onChange={(e) => setWaterGoal(e.target.value)}
              data-testid="settings-water-goal"
            />
            <p className="text-[#52525b] text-xs mt-1">Default is 8 glasses per day.</p>
          </div>
          <button
            onClick={handleSaveWater}
            className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
          >
            {waterSaved ? '✓ Saved' : 'Save'}
          </button>
        </div>
      )}

      {/* App info */}
      <div className="bg-[#111113] border border-[#27272a] rounded-xl p-6">
        <h2 className="text-[#e4e4e7] font-semibold mb-3">About</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[#71717a]">App</span>
            <span className="text-[#e4e4e7]">Helios ☀️</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#71717a]">Storage</span>
            <span className="text-[#e4e4e7]">Local device (IndexedDB + localStorage)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#71717a]">Auth</span>
            <span className="text-[#e4e4e7]">Local-only, bcrypt hashed</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#71717a]">API Key Storage</span>
            <span className="text-[#e4e4e7]">AES-256-GCM encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
}
