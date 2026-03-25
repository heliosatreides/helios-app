import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const source = readFileSync(resolve(__dirname, 'FinancePage.jsx'), 'utf-8');

describe('Finance filter selects mobile tap targets', () => {
  it('account filter select has min-h-[44px]', () => {
    // Find the <select> block with filterAccountId (multiline)
    const selectPattern = /<select[\s\S]*?value=\{filterAccountId\}[\s\S]*?className="([^"]+)"/;
    const match = source.match(selectPattern);
    expect(match).not.toBeNull();
    expect(match[1]).toContain('min-h-[44px]');
  });

  it('category filter select has min-h-[44px]', () => {
    const selectPattern = /<select[\s\S]*?value=\{filterCategory\}[\s\S]*?className="([^"]+)"/;
    const match = source.match(selectPattern);
    expect(match).not.toBeNull();
    expect(match[1]).toContain('min-h-[44px]');
  });
});
