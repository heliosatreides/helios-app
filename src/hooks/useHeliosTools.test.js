import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SCHEMAS, formatStoreData, writeStore, updateStore, deleteFromStore, executeActions, buildToolSystemPrompt } from './useHeliosTools';

// Mock idb functions
vi.mock('./useIDB', () => {
  const store = {};
  return {
    idbGet: vi.fn(async (key) => store[key] ?? null),
    idbSet: vi.fn(async (key, val) => { store[key] = val; }),
    useIDB: vi.fn(),
    __store: store,
  };
});

const { idbGet, idbSet, __store } = await import('./useIDB');

describe('useHeliosTools', () => {
  beforeEach(() => {
    // Clear mock store
    Object.keys(__store).forEach(k => delete __store[k]);
    vi.clearAllMocks();
  });

  describe('subscriptions schema alignment', () => {
    it('schema uses cost/cycle/nextDate fields matching SubscriptionsPage', () => {
      expect(SCHEMAS.subscriptions).toContain('cost');
      expect(SCHEMAS.subscriptions).toContain('cycle');
      expect(SCHEMAS.subscriptions).toContain('nextDate');
      expect(SCHEMAS.subscriptions).not.toContain('amount');
      expect(SCHEMAS.subscriptions).not.toContain('period');
      expect(SCHEMAS.subscriptions).not.toContain('nextBilling');
    });

    it('formatter correctly reads cost and cycle from subscription data', () => {
      const subs = [
        { id: '1', name: 'Netflix', cost: 15.99, cycle: 'monthly', nextDate: '2026-04-01', category: 'streaming' },
        { id: '2', name: 'Spotify', cost: 9.99, cycle: 'monthly', nextDate: '2026-04-15', category: 'streaming' },
        { id: '3', name: 'iCloud', cost: 99.99, cycle: 'annual', nextDate: '2026-12-01', category: 'cloud' },
      ];

      const result = formatStoreData('subscriptions', subs);
      expect(result).toContain('Netflix: $15.99/monthly');
      expect(result).toContain('Spotify: $9.99/monthly');
      expect(result).toContain('iCloud: $99.99/annual');
    });

    it('formatter handles missing cost gracefully', () => {
      const subs = [{ id: '1', name: 'Test', cycle: 'monthly' }];
      const result = formatStoreData('subscriptions', subs);
      expect(result).toContain('Test: $0.00/monthly');
    });

    it('formatter handles missing cycle gracefully', () => {
      const subs = [{ id: '1', name: 'Test', cost: 5.00 }];
      const result = formatStoreData('subscriptions', subs);
      expect(result).toContain('Test: $5.00/mo');
    });
  });

  describe('formatStoreData', () => {
    it('returns empty message for empty arrays', () => {
      expect(formatStoreData('subscriptions', [])).toBe('No subscriptions found yet.');
    });

    it('returns no data message for null', () => {
      expect(formatStoreData('subscriptions', null)).toBe('No subscriptions data found.');
    });
  });

  describe('writeStore', () => {
    it('adds item with generated id to empty store', async () => {
      __store['planner-tasks'] = [];
      const result = await writeStore('tasks', { title: 'Buy groceries', priority: 'High' });
      expect(result.id).toBeTruthy();
      expect(result.title).toBe('Buy groceries');
      expect(result.priority).toBe('High');
      expect(idbSet).toHaveBeenCalledWith('planner-tasks', [result]);
    });

    it('appends to existing items', async () => {
      __store['planner-tasks'] = [{ id: 'existing', title: 'Old task' }];
      const result = await writeStore('tasks', { title: 'New task' });
      expect(idbSet).toHaveBeenCalledWith('planner-tasks', [
        { id: 'existing', title: 'Old task' },
        result,
      ]);
    });

    it('preserves provided id', async () => {
      __store['planner-tasks'] = [];
      const result = await writeStore('tasks', { id: 'my-id', title: 'Test' });
      expect(result.id).toBe('my-id');
    });

    it('creates array from null store', async () => {
      __store['planner-tasks'] = null;
      const result = await writeStore('tasks', { title: 'First task' });
      expect(idbSet).toHaveBeenCalledWith('planner-tasks', [result]);
    });

    it('throws for unknown store', async () => {
      await expect(writeStore('nonexistent', {})).rejects.toThrow('Unknown store');
    });
  });

  describe('updateStore', () => {
    it('finds and updates by partial match', async () => {
      __store['planner-tasks'] = [
        { id: '1', title: 'Buy groceries', completed: false },
        { id: '2', title: 'Call dentist', completed: false },
      ];
      await updateStore('tasks', { title: 'groceries' }, { completed: true });
      const updated = idbSet.mock.calls[0][1];
      expect(updated[0].completed).toBe(true);
      expect(updated[1].completed).toBe(false);
    });

    it('match is case-insensitive', async () => {
      __store['planner-tasks'] = [{ id: '1', title: 'Buy Groceries', completed: false }];
      await updateStore('tasks', { title: 'buy groceries' }, { completed: true });
      const updated = idbSet.mock.calls[0][1];
      expect(updated[0].completed).toBe(true);
    });

    it('throws when no match found', async () => {
      __store['planner-tasks'] = [{ id: '1', title: 'Something else' }];
      await expect(updateStore('tasks', { title: 'nonexistent' }, { completed: true }))
        .rejects.toThrow('No matching');
    });

    it('throws for unknown store', async () => {
      await expect(updateStore('fake', {}, {})).rejects.toThrow('Unknown store');
    });
  });

  describe('deleteFromStore', () => {
    it('removes matching items', async () => {
      __store['planner-tasks'] = [
        { id: '1', title: 'Buy groceries' },
        { id: '2', title: 'Call dentist' },
      ];
      await deleteFromStore('tasks', { title: 'groceries' });
      const remaining = idbSet.mock.calls[0][1];
      expect(remaining).toHaveLength(1);
      expect(remaining[0].title).toBe('Call dentist');
    });

    it('match is case-insensitive', async () => {
      __store['planner-tasks'] = [{ id: '1', title: 'URGENT TASK' }];
      await deleteFromStore('tasks', { title: 'urgent' });
      const remaining = idbSet.mock.calls[0][1];
      expect(remaining).toHaveLength(0);
    });

    it('throws for unknown store', async () => {
      await expect(deleteFromStore('fake', {})).rejects.toThrow('Unknown store');
    });
  });

  describe('executeActions', () => {
    it('parses ACTION:write blocks correctly', async () => {
      __store['planner-tasks'] = [];
      const text = `Sure, I'll add that task for you.
ACTION: write:tasks
DATA: {"title": "Buy groceries", "priority": "High", "completed": false}
Done!`;
      const result = await executeActions(text);
      expect(result.dataContext).toContain('Created item in tasks');
      expect(result.response).toContain("Sure, I'll add that task for you.");
      expect(result.response).toContain('Done!');
    });

    it('parses ACTION:update with MATCH + DATA', async () => {
      __store['planner-tasks'] = [{ id: '1', title: 'Buy groceries', completed: false }];
      const text = `Marking that as done.
ACTION: update:tasks
MATCH: {"title": "groceries"}
DATA: {"completed": true}`;
      const result = await executeActions(text);
      expect(result.dataContext).toContain('Updated item in tasks');
    });

    it('parses ACTION:delete with MATCH', async () => {
      __store['planner-tasks'] = [{ id: '1', title: 'Buy groceries' }];
      const text = `Removed.
ACTION: delete:tasks
MATCH: {"title": "groceries"}`;
      const result = await executeActions(text);
      expect(result.dataContext).toContain('Deleted item from tasks');
    });

    it('handles multiple actions in one response', async () => {
      __store['planner-tasks'] = [];
      __store['finance-transactions'] = [];
      const text = `Adding both.
ACTION: write:tasks
DATA: {"title": "Task one"}
ACTION: write:transactions
DATA: {"amount": 45, "description": "Dinner", "category": "Food", "type": "expense"}
All done!`;
      const result = await executeActions(text);
      expect(result.dataContext).toContain('Created item in tasks');
      expect(result.dataContext).toContain('Created item in transactions');
    });

    it('handles malformed DATA gracefully', async () => {
      const text = `Adding task.
ACTION: write:tasks
DATA: {not valid json}`;
      const result = await executeActions(text);
      expect(result.dataContext).toContain('Error');
    });

    it('passes through plain text with no actions', async () => {
      const text = 'Hello! How can I help you today?';
      const result = await executeActions(text);
      expect(result.response).toBe(text);
      expect(result.dataContext).toBe('');
    });

    it('reads store data', async () => {
      __store['planner-tasks'] = [{ id: '1', title: 'Test task', completed: false, priority: 'High' }];
      const text = `Let me check.
ACTION: read:tasks`;
      const result = await executeActions(text);
      expect(result.dataContext).toContain('tasks data');
      expect(result.dataContext).toContain('Test task');
    });
  });

  describe('buildToolSystemPrompt', () => {
    it('includes all store names', () => {
      const prompt = buildToolSystemPrompt();
      expect(prompt).toContain('trips');
      expect(prompt).toContain('tasks');
      expect(prompt).toContain('accounts');
      expect(prompt).toContain('subscriptions');
    });

    it('includes ACTION instruction format', () => {
      const prompt = buildToolSystemPrompt();
      expect(prompt).toContain('ACTION: read:');
      expect(prompt).toContain('ACTION: write:');
      expect(prompt).toContain('ACTION: update:');
      expect(prompt).toContain('ACTION: delete:');
    });
  });
});
