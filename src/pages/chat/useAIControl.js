import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { decrypt } from '../../auth/crypto';
import { useAuth } from '../../auth/AuthContext';
import { idbGet } from '../../hooks/useIDB';

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

// Map of query store names to IDB keys
const STORE_IDB_KEYS = {
  trips: 'helios-trips',
  accounts: 'finance-accounts',
  transactions: 'finance-transactions',
  budgets: 'finance-budgets',
  portfolio: 'investments-portfolio',
  tasks: 'planner-tasks',
  goals: 'goals-objectives',
  contacts: 'contacts',
  flashcards: 'flashcard-decks',
  wiki: 'wiki-pages',
  subscriptions: 'subscriptions',
  meals: 'meal-plan',
};

function formatStoreData(store, data) {
  if (data === undefined || data === null) return `No ${store} data found.`;
  if (Array.isArray(data) && data.length === 0) return `No ${store} found yet.`;

  switch (store) {
    case 'trips': {
      const items = Array.isArray(data) ? data : [];
      if (!items.length) return 'No trips found.';
      return items.map(t =>
        `• ${t.name || t.destination || 'Trip'}${t.destination && t.name ? ` → ${t.destination}` : ''}${t.startDate ? ` (${t.startDate}${t.endDate ? ` – ${t.endDate}` : ''})` : ''}${t.status ? ` [${t.status}]` : ''}`
      ).join('\n');
    }
    case 'accounts': {
      const items = Array.isArray(data) ? data : [];
      if (!items.length) return 'No accounts found.';
      return items.map(a =>
        `• ${a.name}${a.type ? ` (${a.type})` : ''}: ${a.balance !== undefined ? `$${Number(a.balance).toLocaleString()}` : 'N/A'}`
      ).join('\n');
    }
    case 'transactions': {
      const items = Array.isArray(data) ? data : [];
      if (!items.length) return 'No transactions found.';
      return items.slice(-10).reverse().map(t =>
        `• ${t.date ? `[${t.date}] ` : ''}${t.description || t.name || 'Transaction'}${t.amount !== undefined ? `: $${Number(Math.abs(t.amount)).toLocaleString()}${t.amount < 0 ? ' out' : ' in'}` : ''}`
      ).join('\n');
    }
    case 'budgets': {
      const items = Array.isArray(data) ? data : [];
      if (!items.length) return 'No budgets found.';
      return items.map(b =>
        `• ${b.category || b.name}: $${Number(b.allocated ?? b.amount ?? 0).toLocaleString()} budget${b.spent !== undefined ? `, $${Number(b.spent).toLocaleString()} spent` : ''}`
      ).join('\n');
    }
    case 'portfolio': {
      const items = Array.isArray(data) ? data : (data?.holdings ?? []);
      if (!items.length) return 'No portfolio holdings found.';
      return items.map(h =>
        `• ${h.ticker || h.symbol || h.name}${h.shares !== undefined ? `: ${h.shares} shares` : ''}${h.currentPrice !== undefined ? ` @ $${Number(h.currentPrice).toLocaleString()}` : ''}${h.value !== undefined ? ` (value: $${Number(h.value).toLocaleString()})` : ''}`
      ).join('\n');
    }
    case 'tasks': {
      const items = Array.isArray(data) ? data : [];
      if (!items.length) return 'No tasks found.';
      return items.slice(0, 20).map(t =>
        `• [${t.completed ? '✓' : ' '}] ${t.title || t.text || t.name}${t.dueDate ? ` (due ${t.dueDate})` : ''}`
      ).join('\n');
    }
    case 'goals': {
      const items = Array.isArray(data) ? data : (data?.objectives ?? []);
      if (!items.length) return 'No goals found.';
      return items.map(g =>
        `• ${g.title || g.name || g.text}${g.progress !== undefined ? ` — ${g.progress}%` : ''}${g.status ? ` [${g.status}]` : ''}`
      ).join('\n');
    }
    case 'contacts': {
      const items = Array.isArray(data) ? data : [];
      if (!items.length) return 'No contacts found.';
      return items.slice(0, 20).map(c =>
        `• ${c.name}${c.company ? ` @ ${c.company}` : ''}${c.relationship ? ` (${c.relationship})` : ''}`
      ).join('\n');
    }
    case 'flashcards': {
      const items = Array.isArray(data) ? data : [];
      if (!items.length) return 'No flashcard decks found.';
      return items.map(d =>
        `• ${d.name || d.title}: ${d.cards?.length ?? 0} cards`
      ).join('\n');
    }
    case 'wiki': {
      const items = Array.isArray(data) ? data : [];
      if (!items.length) return 'No wiki pages found.';
      return items.map(p => `• ${p.title || p.name}`).join('\n');
    }
    case 'subscriptions': {
      const items = Array.isArray(data) ? data : [];
      if (!items.length) return 'No subscriptions found.';
      return items.map(s =>
        `• ${s.name}: $${Number(s.amount ?? s.price ?? 0).toFixed(2)}/${s.period || s.billing || 'mo'}`
      ).join('\n');
    }
    case 'meals': {
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        const entries = Object.entries(data).slice(0, 7);
        if (!entries.length) return 'No meal plan found.';
        return entries.map(([day, meal]) =>
          `• ${day}: ${typeof meal === 'string' ? meal : (meal?.name || meal?.title || JSON.stringify(meal))}`
        ).join('\n');
      }
      const items = Array.isArray(data) ? data : [];
      if (!items.length) return 'No meals found.';
      return items.slice(0, 10).map(m => `• ${m.name || m.title || String(m)}`).join('\n');
    }
    default:
      return String(data).slice(0, 400);
  }
}

async function readStoreData(store) {
  const key = STORE_IDB_KEYS[store];
  if (!key) return `Unknown data store: ${store}`;
  try {
    const data = await idbGet(key);
    return formatStoreData(store, data);
  } catch (err) {
    return `Error reading ${store}: ${err.message}`;
  }
}

function buildPrompt(userMessage) {
  const routeLines = AVAILABLE_ROUTES
    .map(r => `- navigate:${r} - Go to ${r.slice(1)}`)
    .join('\n');

  const queryLines = Object.keys(STORE_IDB_KEYS)
    .map(s => `- query:${s} - Read ${s} data from the app`)
    .join('\n');

  return `You are an AI assistant controlling the Helios app. The user sent a command via P2P chat. Interpret it and respond with an action, optional query, and a response.

Available actions:
${routeLines}
- respond - Just reply, no navigation

Available queries (to read live app data):
${queryLines}

Format your response as:
ACTION: <action>
QUERY: <store> (optional — include only when user asks about their data)
RESPONSE: <friendly message>

You can combine navigate and query:
ACTION: navigate:/trips
QUERY: trips
RESPONSE: Opening your trips!

Examples:
User: show me my trips
ACTION: navigate:/trips
QUERY: trips
RESPONSE: Opening trips and fetching your itinerary!

User: what trips do I have?
ACTION: respond
QUERY: trips
RESPONSE: Here are your trips!

User: what's my account balance?
ACTION: respond
QUERY: accounts
RESPONSE: Here are your accounts!

User: show me my portfolio
ACTION: navigate:/investments
QUERY: portfolio
RESPONSE: Heading to investments!

User: what tasks are due?
ACTION: respond
QUERY: tasks
RESPONSE: Here are your current tasks!

User: hey whats up
ACTION: respond
RESPONSE: Hey! I can help you navigate the app or look up your data. Try asking about trips, finances, tasks, or goals!

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

  // Returns: true (key available), 'login-required' (encrypted key but no credentials), false (no key)
  const hasKey = useMemo(() => {
    try {
      const hasEnc = Boolean(localStorage.getItem(AI_KEY_ENC_LS));
      const hasPlain = Boolean(localStorage.getItem(AI_KEY_LS));
      if (hasPlain) return true;
      if (hasEnc) return (user && password) ? true : 'login-required';
      return false;
    } catch {
      return false;
    }
  }, [user, password]);

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
        const queryMatch = text.match(/^QUERY:\s*(.+)$/m);
        const responseMatch = text.match(/^RESPONSE:\s*(.+)$/m);
        const action = actionMatch?.[1]?.trim() || 'respond';
        const queryStore = queryMatch?.[1]?.trim() || null;
        const response = responseMatch?.[1]?.trim() || text.trim();

        setLastAction(action);

        if (action.startsWith('navigate:')) {
          const path = action.replace('navigate:', '');
          navigate(path);
        }

        if (queryStore) {
          const summary = await readStoreData(queryStore);
          sendMessage(`🤖 ${response}\n\n${summary}`);
        } else {
          sendMessage(`🤖 ${response}`);
        }
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
