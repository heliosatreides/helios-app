import { describe, it, expect } from 'vitest';
import { SCHEMAS, formatStoreData } from './useHeliosTools';

describe('useHeliosTools', () => {
  describe('subscriptions schema alignment', () => {
    it('schema uses cost/cycle/nextDate fields matching SubscriptionsPage', () => {
      // SubscriptionsPage stores: { id, name, cost, cycle, nextDate, category }
      // Schema must match these field names exactly
      expect(SCHEMAS.subscriptions).toContain('cost');
      expect(SCHEMAS.subscriptions).toContain('cycle');
      expect(SCHEMAS.subscriptions).toContain('nextDate');
      // Should NOT use the old mismatched field names
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
});
