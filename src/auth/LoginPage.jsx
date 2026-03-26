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
      if (mode === 'register') await register(username.trim(), password);
      else await login(username.trim(), password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full bg-background border border-border px-3 py-2 text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <Link to="/" className="text-sm font-semibold tracking-tight text-foreground">Helios</Link>
          <p className="text-foreground text-sm font-medium mt-2">
            {mode === 'login' ? 'Unlock your data' : 'Set up your local profile'}
          </p>
        </div>

        <div className="border border-border bg-secondary/30 px-4 py-3 mb-4 text-center">
          <p className="text-sm text-muted-foreground">
            Local-only — no cloud, no tracking. Your password encrypts your API keys on this device.
          </p>
        </div>

        <div className="border border-border p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Username</label>
              <input className={inputCls} type="text" placeholder="Enter username" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoFocus required />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                {mode === 'register' ? 'Choose a password' : 'Password'}
              </label>
              <input className={inputCls} type="password" placeholder={mode === 'register' ? 'Used to encrypt your local data' : 'Enter password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} required />
            </div>
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Confirm Password</label>
                <input className={inputCls} type="password" placeholder="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" required />
              </div>
            )}
            {error && <p className="text-destructive text-sm">{error}</p>}
            <button type="submit" disabled={loading} className="w-full bg-foreground text-background py-2 text-sm font-medium hover:bg-foreground/90 disabled:opacity-50 transition-colors min-h-[44px]">
              {loading ? 'Please wait...' : mode === 'login' ? 'Unlock' : 'Get started'}
            </button>
          </form>
          <div className="mt-4 pt-4 border-t border-border text-center text-sm">
            <span className="text-muted-foreground">
              {mode === 'login' ? "First time? " : 'Already set up? '}
            </span>
            <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }} className="text-foreground hover:underline">
              {mode === 'login' ? 'Set up profile' : 'Unlock'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
