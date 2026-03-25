import { useState, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';
import { decrypt } from '../auth/crypto';

const AI_KEY_ENC_LS = 'helios-gemini-key-enc';
const AI_KEY_LS = 'helios-gemini-key';
const MODEL = 'gemini-2.5-flash';
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

function useAuthSafe() {
  try { return useAuth(); } catch { return { user: null, password: null }; }
}

async function resolveKey(user, password) {
  const ciphertext = localStorage.getItem(AI_KEY_ENC_LS);
  let key = '';
  if (ciphertext && password && user) {
    try { key = await decrypt(ciphertext, password, user.username); } catch {}
  }
  if (!key) key = localStorage.getItem(AI_KEY_LS) || '';
  if (!key) throw new Error('No Gemini API key configured');
  return key;
}

/**
 * Call Gemini API with full options.
 *
 * @param {string} apiKey
 * @param {object} opts
 * @param {string} opts.prompt - User message
 * @param {string} [opts.system] - System instruction
 * @param {object} [opts.schema] - JSON response schema (enables structured output)
 * @param {string} [opts.model] - Model override
 * @param {number} [opts.temperature] - 0-2
 * @returns {Promise<string|object>} - text or parsed JSON if schema provided
 */
export async function callGeminiAPI(apiKey, opts) {
  const { prompt, system, schema, model = MODEL, temperature } = opts;

  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  };

  if (system) {
    body.systemInstruction = { parts: [{ text: system }] };
  }

  const generationConfig = {};
  if (temperature !== undefined) generationConfig.temperature = temperature;

  if (schema) {
    generationConfig.responseMimeType = 'application/json';
    generationConfig.responseSchema = schema;
  }

  if (Object.keys(generationConfig).length > 0) {
    body.generationConfig = generationConfig;
  }

  const res = await fetch(`${API_BASE}/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gemini API error: HTTP ${res.status}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text && text !== '') {
    throw new Error('No response from Gemini');
  }

  if (schema) {
    try { return JSON.parse(text); } catch { return text; }
  }

  return text;
}

// Backward-compatible: plain text call
export async function callGemini(apiKey, prompt) {
  return callGeminiAPI(apiKey, { prompt });
}

/**
 * React hook for Gemini integration.
 *
 * Returns:
 *   generate(prompt) — simple text generation (backward compat)
 *   generateStructured({ prompt, system, schema, temperature }) — full options, returns parsed JSON if schema
 *   loading, error, hasKey
 */
export function useGemini() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user, password } = useAuthSafe();

  const hasKey = Boolean(
    localStorage.getItem(AI_KEY_ENC_LS) || localStorage.getItem(AI_KEY_LS)
  );

  // Simple text generation (backward compat)
  const generate = useCallback(async (prompt) => {
    const key = await resolveKey(user, password);
    setLoading(true);
    setError(null);
    try {
      return await callGeminiAPI(key, { prompt });
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, password]);

  // Full-featured generation with structured output
  const generateStructured = useCallback(async (opts) => {
    const key = await resolveKey(user, password);
    setLoading(true);
    setError(null);
    try {
      return await callGeminiAPI(key, opts);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, password]);

  return { generate, generateStructured, loading, error, hasKey };
}
