import { useState, useCallback, useContext } from 'react';
import { useAuth } from '../auth/AuthContext';
import { decrypt } from '../auth/crypto';

const AI_KEY_ENC_LS = 'helios-gemini-key-enc';
// Legacy plaintext key (for backwards compat check only)
const AI_KEY_LS = 'helios-gemini-key';

// Safe version that doesn't throw when used outside AuthProvider
function useAuthSafe() {
  try {
    return useAuth();
  } catch {
    return { user: null, password: null };
  }
}

export function useGemini() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user, password } = useAuthSafe();

  const hasKey = Boolean(
    localStorage.getItem(AI_KEY_ENC_LS) || localStorage.getItem(AI_KEY_LS)
  );

  const generate = useCallback(async (prompt) => {
    // Try encrypted key first
    const ciphertext = localStorage.getItem(AI_KEY_ENC_LS);
    let key = '';
    if (ciphertext && password && user) {
      try {
        key = await decrypt(ciphertext, password, user.username);
      } catch {
        key = '';
      }
    }
    // Fall back to legacy plaintext key (migration path)
    if (!key) {
      key = localStorage.getItem(AI_KEY_LS) || '';
    }
    if (!key) throw new Error('No Gemini API key configured');

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
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
      const text = data.candidates[0].content.parts[0].text;
      return text;
    } catch (err) {
      setError(err.message || 'AI generation failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, password]);

  return { generate, loading, error, hasKey };
}
