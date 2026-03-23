import { useState, useCallback } from 'react';

const AI_KEY_LS = 'helios-gemini-key';

export function useGemini() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const apiKey = localStorage.getItem(AI_KEY_LS) || '';
  const hasKey = Boolean(apiKey);

  const generate = useCallback(async (prompt) => {
    const key = localStorage.getItem(AI_KEY_LS) || '';
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
  }, []);

  return { generate, loading, error, hasKey };
}
