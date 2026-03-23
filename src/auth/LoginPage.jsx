import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
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

  const inputCls = 'w-full bg-[#0a0a0b] border border-[#27272a] rounded-lg px-4 py-2.5 text-[#e4e4e7] text-sm placeholder-[#52525b] focus:outline-none focus:border-[#f59e0b] transition-colors';

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#e4e4e7]">Helios <span className="text-amber-400">☀️</span></h1>
          <p className="text-[#71717a] text-sm mt-1">Your personal life dashboard</p>
        </div>

        {/* Card */}
        <div className="bg-[#111113] border border-[#27272a] rounded-2xl p-6 shadow-xl">
          <h2 className="text-[#e4e4e7] font-semibold text-lg mb-5">
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[#71717a] text-xs mb-1.5">Username</label>
              <input
                className={inputCls}
                type="text"
                placeholder="your_username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div>
              <label className="block text-[#71717a] text-xs mb-1.5">Password</label>
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
                <label className="block text-[#71717a] text-xs mb-1.5">Confirm Password</label>
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
              <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold py-2.5 rounded-lg text-sm transition-colors"
            >
              {loading ? '⏳ Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-[#27272a] text-center">
            <span className="text-[#71717a] text-sm">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            </span>
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
              className="text-amber-400 hover:text-amber-300 text-sm font-medium transition-colors"
            >
              {mode === 'login' ? 'Register' : 'Sign in'}
            </button>
          </div>
        </div>

        <p className="text-center text-[#3f3f46] text-xs mt-6">
          Data stored locally on your device
        </p>
      </div>
    </div>
  );
}
