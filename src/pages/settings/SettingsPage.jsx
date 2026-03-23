import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { encrypt, decrypt } from '../../auth/crypto';

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
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
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
  const [apiKey, setApiKey] = useState('');
  const [decryptError, setDecryptError] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // null | 'ok' | 'error'
  const [testMsg, setTestMsg] = useState('');
  const [saved, setSaved] = useState(false);

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

  const inputCls = 'bg-[#0a0a0b] border border-[#27272a] rounded-lg px-3 py-2 text-[#e4e4e7] text-sm placeholder-[#52525b] focus:outline-none focus:border-[#f59e0b] w-full';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#e4e4e7]">Settings</h1>
        <p className="text-[#71717a] text-sm mt-1">Configure your Helios preferences</p>
      </div>

      {/* AI Integration */}
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
