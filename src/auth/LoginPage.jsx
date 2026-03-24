import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'register' && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'register') {
        await register(username.trim(), password);
      } else {
        await login(username.trim(), password);
      }
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full bg-[#0a0a0b] border border-[#1c1c20] rounded-xl px-4 py-3 text-[#e4e4e7] text-sm placeholder-[#3f3f46] focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all';

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center p-4">
      {/* Background glow */}
      <div aria-hidden="true" className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none" style={{
        background: 'radial-gradient(ellipse at center, rgba(245,158,11,0.04) 0%, transparent 70%)',
      }} />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-base font-bold text-black">H</div>
          </Link>
          <h1 className="text-2xl font-bold text-[#e4e4e7]">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-[#52525b] text-sm mt-2">
            {mode === 'login' ? 'Sign in to access your dashboard' : 'Get started with your personal dashboard'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#0c0c0e] border border-[#1c1c20] rounded-2xl p-6 shadow-2xl shadow-black/20">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[#71717a] text-xs font-medium mb-2">Username</label>
              <input
                className={inputCls}
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
                required
              />
            </div>

            <div>
              <label className="block text-[#71717a] text-xs font-medium mb-2">Password</label>
              <input
                className={inputCls}
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                required
              />
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-[#71717a] text-xs font-medium mb-2">Confirm Password</label>
                <input
                  className={inputCls}
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-xs bg-red-400/5 border border-red-400/20 rounded-xl px-4 py-3">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold py-3 rounded-xl text-sm transition-all shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Please wait…
                </span>
              ) : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#1c1c20] text-center">
            <span className="text-[#52525b] text-sm">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            </span>
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
              className="text-amber-400 hover:text-amber-300 text-sm font-medium transition-colors"
            >
              {mode === 'login' ? 'Create one' : 'Sign in'}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-6">
          <span className="text-[#27272a]">🔒</span>
          <p className="text-[#3f3f46] text-xs">All data stored locally on your device</p>
        </div>
      </div>
    </div>
  );
}
