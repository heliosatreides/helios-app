/**
 * Calculate monthly loan payment (PMT formula)
 * @param {number} principal
 * @param {number} annualRate - percent (e.g., 6.5)
 * @param {number} termMonths
 * @returns {number} monthly payment
 */
export function calcMonthlyPayment(principal, annualRate, termMonths) {
  if (annualRate === 0) return principal / termMonths;
  const r = annualRate / 100 / 12;
  return principal * (r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1);
}

/**
 * Generate amortization schedule for first N months
 * @param {number} principal
 * @param {number} annualRate
 * @param {number} termMonths
 * @param {number} showMonths - how many months to show
 */
export function calcAmortization(principal, annualRate, termMonths, showMonths = 12) {
  const payment = calcMonthlyPayment(principal, annualRate, termMonths);
  const r = annualRate / 100 / 12;
  const schedule = [];
  let balance = principal;

  for (let i = 1; i <= Math.min(showMonths, termMonths); i++) {
    const interest = balance * r;
    const principalPaid = payment - interest;
    balance -= principalPaid;
    schedule.push({
      month: i,
      payment: Math.round(payment * 100) / 100,
      principal: Math.round(principalPaid * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      balance: Math.max(0, Math.round(balance * 100) / 100),
    });
  }
  return schedule;
}

/**
 * Compound interest
 * @param {number} principal
 * @param {number} annualRate - percent
 * @param {number} years
 * @param {number} n - compounding frequency per year (12 = monthly, 1 = annually)
 * @returns {number} final balance
 */
export function calcCompoundInterest(principal, annualRate, years, n = 12) {
  const r = annualRate / 100;
  return principal * Math.pow(1 + r / n, n * years);
}

/**
 * Retirement savings projection
 */
export function calcRetirement(currentAge, retirementAge, currentSavings, monthlyContrib, annualRate) {
  const years = retirementAge - currentAge;
  const months = years * 12;
  const r = annualRate / 100 / 12;
  // Future value of current savings
  const fvCurrent = currentSavings * Math.pow(1 + r, months);
  // Future value of monthly contributions (annuity)
  const fvContribs = r === 0 ? monthlyContrib * months : monthlyContrib * (Math.pow(1 + r, months) - 1) / r;
  return fvCurrent + fvContribs;
}

/**
 * Savings goal: required monthly savings
 */
export function calcSavingsGoal(targetAmount, currentSavings, months, annualRate) {
  const r = annualRate / 100 / 12;
  const fvCurrent = currentSavings * Math.pow(1 + r, months);
  const remaining = targetAmount - fvCurrent;
  if (remaining <= 0) return 0;
  if (r === 0) return remaining / months;
  return remaining * r / (Math.pow(1 + r, months) - 1);
}

/**
 * Simple federal tax estimate (2024 brackets, single/married)
 */
const BRACKETS_SINGLE = [
  { limit: 11600, rate: 0.10 },
  { limit: 47150, rate: 0.12 },
  { limit: 100525, rate: 0.22 },
  { limit: 191950, rate: 0.24 },
  { limit: 243725, rate: 0.32 },
  { limit: 609350, rate: 0.35 },
  { limit: Infinity, rate: 0.37 },
];
const BRACKETS_MARRIED = [
  { limit: 23200, rate: 0.10 },
  { limit: 94300, rate: 0.12 },
  { limit: 201050, rate: 0.22 },
  { limit: 383900, rate: 0.24 },
  { limit: 487450, rate: 0.32 },
  { limit: 731200, rate: 0.35 },
  { limit: Infinity, rate: 0.37 },
];

export function calcFederalTax(grossIncome, filingStatus) {
  const brackets = filingStatus === 'married' ? BRACKETS_MARRIED : BRACKETS_SINGLE;
  let tax = 0;
  let prev = 0;
  for (const b of brackets) {
    if (grossIncome <= prev) break;
    const taxable = Math.min(grossIncome, b.limit) - prev;
    tax += taxable * b.rate;
    prev = b.limit;
  }
  return { tax: Math.round(tax * 100) / 100, effectiveRate: grossIncome > 0 ? (tax / grossIncome * 100) : 0 };
}
