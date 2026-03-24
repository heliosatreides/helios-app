import { calcEqualSplit, calcItemizedSplit, calcSettleUp } from './splitterUtils';

describe('calcEqualSplit', () => {
  test('splits equally among participants', () => {
    const shares = calcEqualSplit(120, ['Alice', 'Bob', 'Carol']);
    expect(shares['Alice']).toBeCloseTo(40);
    expect(shares['Bob']).toBeCloseTo(40);
    expect(shares['Carol']).toBeCloseTo(40);
  });

  test('handles 2 participants', () => {
    const shares = calcEqualSplit(100, ['Alice', 'Bob']);
    expect(shares['Alice']).toBeCloseTo(50);
    expect(shares['Bob']).toBeCloseTo(50);
  });

  test('returns empty object for no participants', () => {
    expect(calcEqualSplit(100, [])).toEqual({});
  });

  test('single participant pays all', () => {
    const shares = calcEqualSplit(75, ['Alice']);
    expect(shares['Alice']).toBeCloseTo(75);
  });
});

describe('calcItemizedSplit', () => {
  test('assigns items to specific people', () => {
    const items = [
      { name: 'Steak', cost: 50, assignedTo: 'Alice' },
      { name: 'Salad', cost: 20, assignedTo: 'Bob' },
    ];
    const shares = calcItemizedSplit(items, ['Alice', 'Bob']);
    expect(shares['Alice']).toBeCloseTo(50);
    expect(shares['Bob']).toBeCloseTo(20);
  });

  test('splits shared items equally', () => {
    const items = [
      { name: 'Appetizer', cost: 30, assignedTo: null },
    ];
    const shares = calcItemizedSplit(items, ['Alice', 'Bob', 'Carol']);
    expect(shares['Alice']).toBeCloseTo(10);
    expect(shares['Bob']).toBeCloseTo(10);
    expect(shares['Carol']).toBeCloseTo(10);
  });

  test('mixes assigned and shared items', () => {
    const items = [
      { name: 'Wine', cost: 60, assignedTo: null }, // shared: 20 each
      { name: 'Steak', cost: 40, assignedTo: 'Alice' },
      { name: 'Pasta', cost: 20, assignedTo: 'Bob' },
    ];
    const shares = calcItemizedSplit(items, ['Alice', 'Bob', 'Carol']);
    expect(shares['Alice']).toBeCloseTo(60); // 20 + 40
    expect(shares['Bob']).toBeCloseTo(40);   // 20 + 20
    expect(shares['Carol']).toBeCloseTo(20); // 20 shared only
  });

  test('returns zero shares for empty items', () => {
    const shares = calcItemizedSplit([], ['Alice', 'Bob']);
    expect(shares['Alice']).toBe(0);
    expect(shares['Bob']).toBe(0);
  });
});

describe('calcSettleUp', () => {
  test('generates correct transactions when one person paid', () => {
    // Alice paid $120 for 3 people ($40 each)
    const shares = { Alice: 40, Bob: 40, Carol: 40 };
    const txns = calcSettleUp(shares, 120, 'Alice');
    // Bob and Carol each owe Alice $40
    expect(txns).toHaveLength(2);
    const toAlice = txns.filter(t => t.to === 'Alice');
    expect(toAlice).toHaveLength(2);
    const amounts = toAlice.map(t => t.amount).sort();
    expect(amounts[0]).toBeCloseTo(40);
    expect(amounts[1]).toBeCloseTo(40);
  });

  test('minimizes transactions', () => {
    // 4 people, equal split of $100
    const shares = { Alice: 25, Bob: 25, Carol: 25, Dave: 25 };
    const txns = calcSettleUp(shares, 100, 'Alice');
    expect(txns.length).toBeLessThanOrEqual(3);
    const total = txns.reduce((s, t) => s + t.amount, 0);
    expect(total).toBeCloseTo(75);
  });

  test('returns empty transactions when only one participant', () => {
    const shares = { Alice: 50 };
    const txns = calcSettleUp(shares, 50, 'Alice');
    expect(txns).toHaveLength(0);
  });

  test('from field is payer, to field is receiver', () => {
    const shares = { Alice: 0, Bob: 100 };
    const txns = calcSettleUp(shares, 100, 'Alice');
    expect(txns[0].from).toBe('Bob');
    expect(txns[0].to).toBe('Alice');
    expect(txns[0].amount).toBeCloseTo(100);
  });
});
