import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { decrypt } from '../../auth/crypto';
import { useAuth } from '../../auth/AuthContext';

const AI_KEY_ENC_LS = 'helios-gemini-key-enc';
const AI_KEY_LS = 'helios-gemini-key';

const AVAILABLE_ROUTES = [
  '/dashboard',
  '/trips',
  '/finance',
  '/investments',
  '/sports',
  '/resume',
  '/planner',
  '/settings',
  '/goals',
  '/networking',
  '/health',
  '/knowledge',
  '/devtools',
  '/focus',
  '/news',
  '/converter',
  '/worldclock',
  '/flashcards',
  '/splitter',
  '/meals',
  '/subscriptions',
  '/apiplayground',
  '/colors',
  '/wiki',
  '/music',
  '/packing',
  '/regex',
  '/calculator',
];

function buildPrompt(userMessage) {
  const routeLines = AVAILABLE_ROUTES
    .map(r => `- navigate:${r} - Go to ${r.slice(1)}`)
    .join('\n');

  return `You are an AI assistant controlling the Helios app. The user sent a command via P2P chat. Interpret it and respond with EXACTLY ONE action line followed by an optional response.

Available actions:
${routeLines}
- respond - Just reply, no navigation

Format your response as:
ACTION: <action>
RESPONSE: <friendly confirmation message>

Examples:
User: show me my trips
ACTION: navigate:/trips
RESPONSE: Opening your trips page!

User: hey whats up
ACTION: respond
RESPONSE: Hey! I can help you navigate the app. Try asking me to open any page!

User: ${userMessage}`;
}

function useAuthSafe() {
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useAuth();
  } catch {
    return { user: null, password: null };
  }
}

export function useAIControl({ messages, sendMessage, enabled = false }) {
  const [aiEnabled, setAiEnabled] = useState(enabled);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [lastAction, setLastAction] = useState(null);
  const navigate = useNavigate();
  const { user, password } = useAuthSafe();
  const processedRef = useRef(new Set());

  const hasKey = (() => {
    try {
      return Boolean(localStorage.getItem(AI_KEY_ENC_LS) || localStorage.getItem(AI_KEY_LS));
    } catch {
      return false;
    }
  })();

  const getKey = useCallback(async () => {
    let ciphertext = '';
    let plainKey = '';
    try {
      ciphertext = localStorage.getItem(AI_KEY_ENC_LS) || '';
      plainKey = localStorage.getItem(AI_KEY_LS) || '';
    } catch { /* non-fatal */ }

    let key = '';
    if (ciphertext && password && user) {
      try {
        key = await decrypt(ciphertext, password, user.username);
      } catch {
        key = '';
      }
    }
    return key || plainKey;
  }, [user, password]);

  useEffect(() => {
    if (!aiEnabled || !messages.length) return;

    const lastMsg = messages[messages.length - 1];
    if (lastMsg.from !== 'them') return;

    const msgKey = `${lastMsg.timestamp}-${lastMsg.text}`;
    if (processedRef.current.has(msgKey)) return;
    processedRef.current.add(msgKey);

    async function process() {
      setAiProcessing(true);
      try {
        const key = await getKey();
        if (!key) {
          sendMessage('🤖 AI Control: No Gemini key configured. Please set it in Settings.');
          return;
        }

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: buildPrompt(lastMsg.text) }] }],
            }),
          }
        );

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.error?.message || `HTTP ${res.status}`);
        }

        const data = await res.json();
        const text = data.candidates[0].content.parts[0].text;

        const actionMatch = text.match(/^ACTION:\s*(.+)$/m);
        const responseMatch = text.match(/^RESPONSE:\s*(.+)$/m);
        const action = actionMatch?.[1]?.trim() || 'respond';
        const response = responseMatch?.[1]?.trim() || text.trim();

        setLastAction(action);

        if (action.startsWith('navigate:')) {
          const path = action.replace('navigate:', '');
          navigate(path);
        }
        sendMessage(`🤖 ${response}`);
      } catch (err) {
        console.error('[AIControl]', err);
        sendMessage(`🤖 AI error: ${err.message}`);
      } finally {
        setAiProcessing(false);
      }
    }

    process();
  }, [messages, aiEnabled, getKey, navigate, sendMessage]);

  return { aiEnabled, setAiEnabled, aiProcessing, lastAction, hasKey };
}
