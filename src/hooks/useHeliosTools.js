/**
 * Shared Helios data tools — read/write/update/delete across all app stores.
 * Used by both P2P Chat AI Control and the AI Chat page.
 */
import { idbGet, idbSet } from './useIDB';

export const STORE_IDB_KEYS = {
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

export const SCHEMAS = {
  trips: `{ id, name, destination, startDate (YYYY-MM-DD), endDate (YYYY-MM-DD), budget (number), status ("Planning"|"Upcoming"|"Ongoing"|"Completed"), notes, itinerary: [], expenses: [] }`,
  accounts: `{ id, name, type ("Checking"|"Savings"|"Credit Card"|"Investment"), balance (number), currency ("USD") }`,
  transactions: `{ id, amount (number), description, category ("Food"|"Transport"|"Housing"|"Entertainment"|"Health"|"Shopping"|"Salary"|"Other"), date (YYYY-MM-DD), accountId, type ("expense"|"income") }`,
  budgets: `{ category ("Food"|"Transport"|"Housing"|"Entertainment"|"Health"|"Shopping"|"Other"), limit (number) }`,
  portfolio: `{ id, ticker (UPPERCASE), name, shares (number), costBasis (number), currentPrice (number), assetClass ("Stocks"|"ETF"|"Crypto"|"Bonds"|"Real Estate"|"Cash"), addedAt (ISO datetime) }`,
  tasks: `{ id, title, priority ("High"|"Medium"|"Low"), dueDate (YYYY-MM-DD or null), notes, completed (false), recurring ("None"|"Daily"|"Weekly"), createdAt (ISO datetime) }`,
  goals: `{ id, title, timeframe ("Q1 YYYY"|"Q2 YYYY"|"Q3 YYYY"|"Q4 YYYY"|"This Year"|"Ongoing"), color ("amber"|"blue"|"green"|"purple"|"red"), keyResults: [{ id, title, metricType ("%"|"number"|"boolean"), currentValue, targetValue }] }`,
  subscriptions: `{ id, name, cost (number), cycle ("monthly"|"annual"|"weekly"), category, nextDate (YYYY-MM-DD) }`,
};

export function formatStoreData(store, data) {
  if (data === undefined || data === null) return `No ${store} data found.`;
  if (Array.isArray(data) && data.length === 0) return `No ${store} found yet.`;
  const items = Array.isArray(data) ? data : (typeof data === 'object' ? [data] : []);

  const formatters = {
    trips: (t) => `- ${t.name || t.destination || 'Trip'}${t.destination && t.name ? ` → ${t.destination}` : ''}${t.startDate ? ` (${t.startDate}${t.endDate ? ` – ${t.endDate}` : ''})` : ''}${t.status ? ` [${t.status}]` : ''}`,
    accounts: (a) => `- ${a.name}${a.type ? ` (${a.type})` : ''}: ${a.balance !== undefined ? `$${Number(a.balance).toLocaleString()}` : 'N/A'}`,
    transactions: (t) => `- ${t.date ? `[${t.date}] ` : ''}${t.description || 'Transaction'}: $${Math.abs(t.amount).toLocaleString()} ${t.type || (t.amount < 0 ? 'expense' : 'income')}`,
    budgets: (b) => `- ${b.category}: $${Number(b.limit ?? b.amount ?? 0).toLocaleString()} budget`,
    portfolio: (h) => `- ${h.ticker || h.name}${h.shares ? `: ${h.shares} shares` : ''}${h.currentPrice ? ` @ $${h.currentPrice}` : ''}`,
    tasks: (t) => `- [${t.completed ? 'x' : ' '}] ${t.title}${t.dueDate ? ` (due ${t.dueDate})` : ''}${t.priority ? ` [${t.priority}]` : ''}`,
    goals: (g) => {
      const krs = g.keyResults || [];
      const progress = krs.length > 0
        ? Math.round(krs.reduce((sum, kr) => {
            if (kr.metricType === 'boolean') return sum + (kr.currentValue ? 100 : 0);
            const target = parseFloat(kr.targetValue) || 0;
            return sum + (target > 0 ? Math.min(100, Math.round(((parseFloat(kr.currentValue) || 0) / target) * 100)) : 0);
          }, 0) / krs.length)
        : 0;
      return `- ${g.title}${g.timeframe ? ` [${g.timeframe}]` : ''} — ${progress}% (${krs.length} key results)`;
    },
    contacts: (c) => `- ${c.name}${c.company ? ` @ ${c.company}` : ''}`,
    flashcards: (d) => `- ${d.name || d.title}: ${d.cards?.length ?? 0} cards`,
    wiki: (p) => `- ${p.title || p.name}`,
    subscriptions: (s) => `- ${s.name}: $${Number(s.cost ?? 0).toFixed(2)}/${s.cycle || 'mo'}`,
    meals: (m) => `- ${typeof m === 'string' ? m : (m?.name || m?.title || JSON.stringify(m))}`,
  };

  const fmt = formatters[store];
  if (!fmt) return String(data).slice(0, 500);
  const subset = store === 'transactions' ? items.slice(-15).reverse() : items.slice(0, 20);
  return subset.map(fmt).join('\n');
}

function generateId() {
  try { return crypto.randomUUID(); } catch { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
}

export async function readStore(store) {
  const key = STORE_IDB_KEYS[store];
  if (!key) return `Unknown store: ${store}`;
  const data = await idbGet(key);
  return formatStoreData(store, data);
}

export async function writeStore(store, data) {
  const key = STORE_IDB_KEYS[store];
  if (!key) throw new Error(`Unknown store: ${store}`);
  const current = (await idbGet(key)) ?? [];
  const newItem = { ...data, id: data.id || generateId() };
  const updated = Array.isArray(current) ? [...current, newItem] : [newItem];
  await idbSet(key, updated);
  return newItem;
}

export async function updateStore(store, match, updates) {
  const key = STORE_IDB_KEYS[store];
  if (!key) throw new Error(`Unknown store: ${store}`);
  const current = (await idbGet(key)) ?? [];
  if (!Array.isArray(current)) throw new Error(`${store} is not an array store`);
  const matchEntries = Object.entries(match);
  let found = false;
  const updated = current.map(item => {
    if (matchEntries.every(([k, v]) => String(item[k] ?? '').toLowerCase().includes(String(v).toLowerCase()))) {
      found = true;
      return { ...item, ...updates };
    }
    return item;
  });
  if (!found) throw new Error(`No matching ${store} item found`);
  await idbSet(key, updated);
}

export async function deleteFromStore(store, match) {
  const key = STORE_IDB_KEYS[store];
  if (!key) throw new Error(`Unknown store: ${store}`);
  const current = (await idbGet(key)) ?? [];
  if (!Array.isArray(current)) throw new Error(`${store} is not an array store`);
  const matchEntries = Object.entries(match);
  const updated = current.filter(item =>
    !matchEntries.every(([k, v]) => String(item[k] ?? '').toLowerCase().includes(String(v).toLowerCase()))
  );
  await idbSet(key, updated);
}

/**
 * Build system prompt that gives the AI access to all data tools.
 */
export function buildToolSystemPrompt() {
  const storeLines = Object.keys(STORE_IDB_KEYS).map(s => `- ${s}`).join('\n');
  const schemaLines = Object.entries(SCHEMAS).map(([s, schema]) => `${s}: ${schema}`).join('\n');
  const now = new Date().toISOString();

  return `You are Helios, an AI assistant embedded in a personal life dashboard. You can read and modify the user's data.

Current date/time: ${now}

Available data stores:
${storeLines}

Data schemas:
${schemaLines}

When you need to interact with data, include an ACTION block in your response:
ACTION: read:<store>
ACTION: write:<store>
DATA: <JSON object>
ACTION: update:<store>
MATCH: <JSON object to find the item>
DATA: <JSON fields to update>
ACTION: delete:<store>
MATCH: <JSON object to find the item>

You can include multiple actions. Always include a natural language response too.
If the user just wants to chat, respond normally without any ACTION blocks.
When reading data, the results will be injected into the conversation automatically.`;
}

/**
 * Execute action blocks from AI response.
 * Returns { response: string, dataContext: string }
 */
export async function executeActions(text) {
  const lines = text.split('\n');
  let response = [];
  let dataContext = '';
  let currentAction = null;
  let currentData = null;
  let currentMatch = null;

  for (const line of lines) {
    const actionLine = line.match(/^ACTION:\s*(.+)$/);
    const dataLine = line.match(/^DATA:\s*(.+)$/);
    const matchLine = line.match(/^MATCH:\s*(.+)$/);

    if (actionLine) {
      // Execute previous action if any
      if (currentAction) {
        dataContext += await runAction(currentAction, currentData, currentMatch);
        currentData = null;
        currentMatch = null;
      }
      currentAction = actionLine[1].trim();
    } else if (dataLine) {
      try { currentData = JSON.parse(dataLine[1].trim()); } catch { currentData = null; }
    } else if (matchLine) {
      try { currentMatch = JSON.parse(matchLine[1].trim()); } catch { currentMatch = null; }
    } else {
      response.push(line);
    }
  }

  // Execute last action
  if (currentAction) {
    dataContext += await runAction(currentAction, currentData, currentMatch);
  }

  return {
    response: response.join('\n').trim(),
    dataContext,
  };
}

async function runAction(action, data, match) {
  try {
    if (action.startsWith('read:')) {
      const store = action.replace('read:', '');
      const result = await readStore(store);
      return `\n[${store} data]\n${result}\n`;
    }
    if (action.startsWith('write:')) {
      const store = action.replace('write:', '');
      if (!data) return `\n[Error: write to ${store} missing DATA]\n`;
      await writeStore(store, data);
      return `\n[Created item in ${store}]\n`;
    }
    if (action.startsWith('update:')) {
      const store = action.replace('update:', '');
      if (!match || !data) return `\n[Error: update ${store} missing MATCH or DATA]\n`;
      await updateStore(store, match, data);
      return `\n[Updated item in ${store}]\n`;
    }
    if (action.startsWith('delete:')) {
      const store = action.replace('delete:', '');
      if (!match) return `\n[Error: delete from ${store} missing MATCH]\n`;
      await deleteFromStore(store, match);
      return `\n[Deleted item from ${store}]\n`;
    }
    return '';
  } catch (err) {
    return `\n[Error: ${err.message}]\n`;
  }
}
