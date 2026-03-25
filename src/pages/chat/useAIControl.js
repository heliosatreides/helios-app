import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { decrypt } from '../../auth/crypto';
import { useAuth } from '../../auth/AuthContext';
import { idbGet, idbSet } from '../../hooks/useIDB';

const AI_KEY_ENC_LS = 'helios-gemini-key-enc';
const AI_KEY_LS = 'helios-gemini-key';

// Map of store names to IDB keys
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

const SCHEMAS = {
  trips: `{ id, name, destination, startDate (YYYY-MM-DD), endDate (YYYY-MM-DD), budget (number), status ("Planning"|"Upcoming"|"Ongoing"|"Completed"), notes, itinerary: [], expenses: [] }`,
  accounts: `{ id, name, type ("Checking"|"Savings"|"Credit Card"|"Investment"), balance (number), currency ("USD") }`,
  transactions: `{ id, amount (number), description, category ("Food"|"Transport"|"Housing"|"Entertainment"|"Health"|"Shopping"|"Salary"|"Other"), date (YYYY-MM-DD), accountId, type ("expense"|"income") }`,
  budgets: `{ category ("Food"|"Transport"|"Housing"|"Entertainment"|"Health"|"Shopping"|"Other"), limit (number) }`,
  portfolio: `{ id, ticker (UPPERCASE), name, shares (number), costBasis (number), currentPrice (number), assetClass ("Stocks"|"ETF"|"Crypto"|"Bonds"|"Real Estate"|"Cash"), addedAt (ISO datetime) }`,
  tasks: `{ id, title, priority ("High"|"Medium"|"Low"), dueDate (YYYY-MM-DD or null), notes, completed (false), recurring ("None"|"Daily"|"Weekly"), createdAt (ISO datetime) }`,
  goals: `{ id, title, description, progress (0-100), status ("active"|"completed"|"paused"), targetDate (YYYY-MM-DD) }`,
  subscriptions: `{ id, name, cost (number), cycle ("monthly"|"annual"|"weekly"), category, nextDate (YYYY-MM-DD) }`,
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
        `• ${b.category || b.name}: $${Number(b.allocated ?? b.amount ?? b.limit ?? 0).toLocaleString()} budget${b.spent !== undefined ? `, $${Number(b.spent).toLocaleString()} spent` : ''}`
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
        `• ${s.name}: $${Number(s.cost ?? s.amount ?? 0).toFixed(2)}/${s.cycle || s.period || 'mo'}`
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

function generateId() {
  try { return crypto.randomUUID(); } catch { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
}

async function writeStoreData(store, data) {
  const key = STORE_IDB_KEYS[store];
  if (!key) throw new Error(`Unknown store: ${store}`);
  const current = (await idbGet(key)) ?? [];
  const newItem = { ...data, id: data.id || generateId() };
  const updated = Array.isArray(current) ? [...current, newItem] : [newItem];
  await idbSet(key, updated);
  return newItem;
}

async function updateStoreData(store, match, updates) {
  const key = STORE_IDB_KEYS[store];
  if (!key) throw new Error(`Unknown store: ${store}`);
  const current = (await idbGet(key)) ?? [];
  if (!Array.isArray(current)) throw new Error(`${store} is not an array store`);
  const matchEntries = Object.entries(match);
  let found = false;
  const updated = current.map(item => {
    const isMatch = matchEntries.every(([k, v]) =>
      String(item[k] ?? '').toLowerCase().includes(String(v).toLowerCase())
    );
    if (isMatch) { found = true; return { ...item, ...updates }; }
    return item;
  });
  if (!found) throw new Error(`No matching ${store} item found`);
  await idbSet(key, updated);
}

async function deleteStoreData(store, match) {
  const key = STORE_IDB_KEYS[store];
  if (!key) throw new Error(`Unknown store: ${store}`);
  const current = (await idbGet(key)) ?? [];
  if (!Array.isArray(current)) throw new Error(`${store} is not an array store`);
  const matchEntries = Object.entries(match);
  const updated = current.filter(item =>
    !matchEntries.every(([k, v]) =>
      String(item[k] ?? '').toLowerCase().includes(String(v).toLowerCase())
    )
  );
  await idbSet(key, updated);
}

function buildPrompt(userMessage) {
  const storeLines = Object.keys(STORE_IDB_KEYS).map(s => `- ${s}`).join('\n');
  const schemaLines = Object.entries(SCHEMAS).map(([s, schema]) => `${s}: ${schema}`).join('\n');
  const now = new Date().toISOString();

  return `You are an AI assistant embedded in the Helios app. The user sends commands via P2P chat. Execute them in-place — NEVER navigate away from the chat. All actions happen via data reads/writes.

Current date/time: ${now}

Available actions:
- read:<store> — read and summarize data from a store
- write:<store> — create a new item in a store (include DATA field with full object)
- update:<store> — modify an existing item (include MATCH and DATA fields)
- delete:<store> — remove an item (include MATCH field)
- respond — just reply in chat, no data operation

Available stores:
${storeLines}

Data schemas (use these field names exactly when writing):
${schemaLines}

Response format (use exactly these labels, one per line):
ACTION: <action>
DATA: <JSON object> (for write/update — valid JSON only, no trailing commas)
MATCH: <JSON object> (for update/delete — fields to find the item)
RESPONSE: <friendly confirmation message>

Examples:

User: add a trip to Tokyo from April 1-10 2026
ACTION: write:trips
DATA: {"name": "Tokyo Trip", "destination": "Tokyo, Japan", "startDate": "2026-04-01", "endDate": "2026-04-10", "status": "Planning", "budget": 0, "notes": "", "itinerary": [], "expenses": []}
RESPONSE: Added your Tokyo trip (Apr 1–10, 2026)!

User: show my trips
ACTION: read:trips
RESPONSE: Here are your trips!

User: add a task to buy groceries by Friday
ACTION: write:tasks
DATA: {"title": "Buy groceries", "priority": "Medium", "dueDate": "2026-03-27", "notes": "", "completed": false, "recurring": "None", "createdAt": "${now}"}
RESPONSE: Added 'Buy groceries' to your task list!

User: mark the Tokyo trip as completed
ACTION: update:trips
MATCH: {"name": "Tokyo"}
DATA: {"status": "Completed"}
RESPONSE: Marked the Tokyo trip as Completed!

User: delete the Tokyo trip
ACTION: delete:trips
MATCH: {"name": "Tokyo"}
RESPONSE: Deleted the Tokyo trip!

User: add a transaction for $45 at the grocery store
ACTION: write:transactions
DATA: {"amount": -45, "description": "Grocery Store", "category": "Food", "date": "2026-03-24", "type": "expense", "accountId": ""}
RESPONSE: Recorded a $45 grocery expense!

User: what's my account balance?
ACTION: read:accounts
RESPONSE: Here are your accounts!

User: hey what's up
ACTION: respond
RESPONSE: Hey! I can help you manage your data — try asking me to add a trip, task, or transaction, or ask to show your current data!

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
        const dataMatch = text.match(/^DATA:\s*(.+)$/m);
        const matchMatch = text.match(/^MATCH:\s*(.+)$/m);
        const responseMatch = text.match(/^RESPONSE:\s*(.+)$/m);

        const action = actionMatch?.[1]?.trim() || 'respond';
        const dataStr = dataMatch?.[1]?.trim() || null;
        const matchStr = matchMatch?.[1]?.trim() || null;
        const response = responseMatch?.[1]?.trim() || text.trim();

        setLastAction(action);

        if (action.startsWith('read:')) {
          const store = action.replace('read:', '');
          const summary = await readStoreData(store);
          sendMessage(`🤖 ${response}\n\n${summary}`);

        } else if (action.startsWith('write:')) {
          const store = action.replace('write:', '');
          if (!dataStr) throw new Error('write action missing DATA field');
          let parsed;
          try { parsed = JSON.parse(dataStr); } catch { throw new Error(`Invalid JSON in DATA: ${dataStr}`); }
          await writeStoreData(store, parsed);
          sendMessage(`🤖 ${response}`);

        } else if (action.startsWith('update:')) {
          const store = action.replace('update:', '');
          if (!matchStr) throw new Error('update action missing MATCH field');
          if (!dataStr) throw new Error('update action missing DATA field');
          let matchObj, updateObj;
          try { matchObj = JSON.parse(matchStr); } catch { throw new Error(`Invalid JSON in MATCH: ${matchStr}`); }
          try { updateObj = JSON.parse(dataStr); } catch { throw new Error(`Invalid JSON in DATA: ${dataStr}`); }
          await updateStoreData(store, matchObj, updateObj);
          sendMessage(`🤖 ${response}`);

        } else if (action.startsWith('delete:')) {
          const store = action.replace('delete:', '');
          if (!matchStr) throw new Error('delete action missing MATCH field');
          let matchObj;
          try { matchObj = JSON.parse(matchStr); } catch { throw new Error(`Invalid JSON in MATCH: ${matchStr}`); }
          await deleteStoreData(store, matchObj);
          sendMessage(`🤖 ${response}`);

        } else {
          // respond or unknown — just send the message
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
  }, [messages, aiEnabled, getKey, sendMessage]);

  return { aiEnabled, setAiEnabled, aiProcessing, lastAction, hasKey };
}
