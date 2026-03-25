import { describe, it, expect } from 'vitest';

// Import the SCHEMAS constant from useAIControl.
// Since it's not directly exported, we test via module internals.
// We'll re-read the source to validate schema fields.
import { readFileSync } from 'fs';
import { resolve } from 'path';

const source = readFileSync(resolve(__dirname, 'useAIControl.js'), 'utf-8');

describe('useAIControl subscriptions schema', () => {
  it('uses cost instead of amount in subscriptions schema', () => {
    // Find the subscriptions schema line
    const schemaMatch = source.match(/subscriptions:\s*`([^`]+)`/);
    expect(schemaMatch).not.toBeNull();
    const schema = schemaMatch[1];
    expect(schema).toContain('cost');
    expect(schema).not.toMatch(/\bamount\b/);
  });

  it('uses cycle instead of period in subscriptions schema', () => {
    const schemaMatch = source.match(/subscriptions:\s*`([^`]+)`/);
    const schema = schemaMatch[1];
    expect(schema).toContain('cycle');
    expect(schema).not.toMatch(/\bperiod\b/);
  });

  it('uses nextDate instead of nextBilling in subscriptions schema', () => {
    const schemaMatch = source.match(/subscriptions:\s*`([^`]+)`/);
    const schema = schemaMatch[1];
    expect(schema).toContain('nextDate');
    expect(schema).not.toContain('nextBilling');
  });

  it('subscription formatter uses cost field', () => {
    // The formatter for subscriptions should reference s.cost
    const formatterMatch = source.match(/case 'subscriptions'[\s\S]*?break;|subscriptions.*?=>\s*[^;]+/);
    // Alternatively just check that the format line references s.cost
    expect(source).toContain('s.cost');
  });
});
