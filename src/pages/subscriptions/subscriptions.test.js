// Subscription tracker utility tests

function monthlyCost(subs) {
  return subs.reduce((acc, s) => acc + (s.cycle === 'annual' ? s.cost / 12 : s.cost), 0);
}

function annualCost(subs) {
  return subs.reduce((acc, s) => acc + (s.cycle === 'annual' ? s.cost : s.cost * 12), 0);
}

function daysUntil(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return Math.round((d - today) / (1000 * 60 * 60 * 24));
}

function getRenewalSoon(subs) {
  return subs.filter(s => {
    const days = daysUntil(s.nextDate);
    return days >= 0 && days <= 7;
  });
}

describe('Subscription monthly total', () => {
  test('calculates monthly cost for monthly subs', () => {
    const subs = [
      { name: 'Netflix', cost: 15.99, cycle: 'monthly' },
      { name: 'Spotify', cost: 9.99, cycle: 'monthly' },
    ];
    expect(monthlyCost(subs)).toBeCloseTo(25.98);
  });

  test('converts annual to monthly', () => {
    const subs = [
      { name: 'iCloud', cost: 36, cycle: 'annual' },
    ];
    expect(monthlyCost(subs)).toBeCloseTo(3);
  });

  test('mixes monthly and annual', () => {
    const subs = [
      { name: 'Netflix', cost: 15, cycle: 'monthly' },
      { name: 'iCloud', cost: 120, cycle: 'annual' },
    ];
    expect(monthlyCost(subs)).toBeCloseTo(25); // 15 + 10
  });

  test('returns 0 for empty list', () => {
    expect(monthlyCost([])).toBe(0);
  });
});

describe('Subscription annual total', () => {
  test('annualizes monthly subscriptions', () => {
    const subs = [
      { name: 'Netflix', cost: 15, cycle: 'monthly' },
    ];
    expect(annualCost(subs)).toBeCloseTo(180);
  });

  test('keeps annual subscriptions as-is', () => {
    const subs = [
      { name: 'iCloud', cost: 99, cycle: 'annual' },
    ];
    expect(annualCost(subs)).toBeCloseTo(99);
  });

  test('totals mixed subs correctly', () => {
    const subs = [
      { name: 'Netflix', cost: 15, cycle: 'monthly' }, // 180/yr
      { name: 'iCloud', cost: 100, cycle: 'annual' },  // 100/yr
    ];
    expect(annualCost(subs)).toBeCloseTo(280);
  });
});

describe('Renewal alerts', () => {
  test('flags subscriptions renewing within 7 days', () => {
    const today = new Date();
    const in3Days = new Date(today);
    in3Days.setDate(today.getDate() + 3);
    const in10Days = new Date(today);
    in10Days.setDate(today.getDate() + 10);

    const subs = [
      { name: 'Soon', nextDate: in3Days.toISOString().split('T')[0], cost: 10, cycle: 'monthly' },
      { name: 'Later', nextDate: in10Days.toISOString().split('T')[0], cost: 10, cycle: 'monthly' },
    ];
    const soon = getRenewalSoon(subs);
    expect(soon).toHaveLength(1);
    expect(soon[0].name).toBe('Soon');
  });

  test('does not flag past renewals', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const subs = [
      { name: 'Past', nextDate: yesterday.toISOString().split('T')[0], cost: 10, cycle: 'monthly' },
    ];
    expect(getRenewalSoon(subs)).toHaveLength(0);
  });

  test('flags subscription renewing today', () => {
    const today = new Date().toISOString().split('T')[0];
    const subs = [{ name: 'Today', nextDate: today, cost: 10, cycle: 'monthly' }];
    expect(getRenewalSoon(subs)).toHaveLength(1);
  });
});
