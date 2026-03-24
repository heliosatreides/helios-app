import {
  calcMonthlyPayment,
  calcAmortization,
  calcCompoundInterest,
  calcRetirement,
  calcSavingsGoal,
  calcFederalTax,
} from './calcUtils';

describe('calcMonthlyPayment (Loan)', () => {
  test('calculates monthly payment correctly', () => {
    // $250,000 loan, 6.5% annual, 30 years (360 months)
    const payment = calcMonthlyPayment(250000, 6.5, 360);
    expect(payment).toBeCloseTo(1580.17, 1);
  });

  test('handles 0% interest rate', () => {
    const payment = calcMonthlyPayment(12000, 0, 12);
    expect(payment).toBeCloseTo(1000, 1);
  });

  test('smaller loan shorter term', () => {
    const payment = calcMonthlyPayment(10000, 5, 24);
    expect(payment).toBeCloseTo(438.71, 1);
  });
});

describe('calcAmortization', () => {
  test('first payment breaks into principal and interest', () => {
    const schedule = calcAmortization(250000, 6.5, 360, 1);
    expect(schedule).toHaveLength(1);
    const first = schedule[0];
    // First month interest: 250000 * (6.5/100/12) ≈ 1354.17
    expect(first.interest).toBeCloseTo(1354.17, 1);
    expect(first.principal).toBeGreaterThan(0);
    expect(first.payment).toBeCloseTo(first.principal + first.interest, 0);
  });

  test('returns correct number of months', () => {
    const schedule = calcAmortization(100000, 5, 60, 12);
    expect(schedule).toHaveLength(12);
  });

  test('balance decreases each month', () => {
    const schedule = calcAmortization(100000, 5, 60, 12);
    for (let i = 1; i < schedule.length; i++) {
      expect(schedule[i].balance).toBeLessThan(schedule[i - 1].balance);
    }
  });

  test('later payments have more principal, less interest', () => {
    const schedule = calcAmortization(100000, 5, 60, 12);
    expect(schedule[11].principal).toBeGreaterThan(schedule[0].principal);
    expect(schedule[11].interest).toBeLessThan(schedule[0].interest);
  });
});

describe('calcCompoundInterest', () => {
  test('$1000 at 10% for 1 year monthly compounding', () => {
    const final = calcCompoundInterest(1000, 10, 1, 12);
    expect(final).toBeCloseTo(1104.71, 1);
  });

  test('matches rule of 72 (doubles in ~9 years at 8%)', () => {
    const final = calcCompoundInterest(1000, 8, 9, 12);
    expect(final).toBeGreaterThan(1900);
    expect(final).toBeLessThan(2100);
  });

  test('annual compounding is lower than monthly', () => {
    const annual = calcCompoundInterest(1000, 10, 5, 1);
    const monthly = calcCompoundInterest(1000, 10, 5, 12);
    expect(monthly).toBeGreaterThan(annual);
  });

  test('0% rate returns principal', () => {
    const final = calcCompoundInterest(5000, 0, 10, 12);
    expect(final).toBeCloseTo(5000, 0);
  });
});

describe('calcRetirement', () => {
  test('returns positive balance', () => {
    const balance = calcRetirement(30, 65, 10000, 500, 7);
    expect(balance).toBeGreaterThan(0);
  });

  test('more contributions = higher balance', () => {
    const low = calcRetirement(30, 65, 10000, 300, 7);
    const high = calcRetirement(30, 65, 10000, 1000, 7);
    expect(high).toBeGreaterThan(low);
  });
});

describe('calcSavingsGoal', () => {
  test('calculates required monthly savings', () => {
    // Need $20,000 in 24 months, no current savings, 4% rate
    const monthly = calcSavingsGoal(20000, 0, 24, 4);
    expect(monthly).toBeGreaterThan(0);
    expect(monthly).toBeLessThan(1000);
  });

  test('returns 0 if already have enough', () => {
    const monthly = calcSavingsGoal(1000, 2000, 12, 0);
    expect(monthly).toBe(0);
  });
});

describe('calcFederalTax', () => {
  test('simple single filer', () => {
    const { tax, effectiveRate } = calcFederalTax(50000, 'single');
    expect(tax).toBeGreaterThan(0);
    expect(effectiveRate).toBeGreaterThan(0);
    expect(effectiveRate).toBeLessThan(25);
  });

  test('zero income = zero tax', () => {
    const { tax } = calcFederalTax(0, 'single');
    expect(tax).toBe(0);
  });

  test('married filer pays less than single at same income', () => {
    const { tax: single } = calcFederalTax(150000, 'single');
    const { tax: married } = calcFederalTax(150000, 'married');
    expect(married).toBeLessThan(single);
  });

  test('higher income = higher effective rate', () => {
    const { effectiveRate: low } = calcFederalTax(30000, 'single');
    const { effectiveRate: high } = calcFederalTax(200000, 'single');
    expect(high).toBeGreaterThan(low);
  });
});
