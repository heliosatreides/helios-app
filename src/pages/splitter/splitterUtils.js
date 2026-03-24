// Expense Splitter utility functions

/**
 * Calculate equal split: each participant pays total/n
 */
export function calcEqualSplit(total, participants) {
  const n = participants.length;
  if (n === 0) return {};
  const share = total / n;
  return Object.fromEntries(participants.map(p => [p, share]));
}

/**
 * Calculate itemized split:
 * - Each person pays for items assigned to them
 * - Shared items (assigned to null / 'shared') split equally
 * @param {Array} items - [{name, cost, assignedTo}] where assignedTo is participant name or null
 * @param {Array} participants
 */
export function calcItemizedSplit(items, participants) {
  const n = participants.length;
  if (n === 0) return {};

  const shares = Object.fromEntries(participants.map(p => [p, 0]));

  for (const item of items) {
    if (!item.assignedTo || item.assignedTo === 'shared') {
      // Split equally
      const each = item.cost / n;
      for (const p of participants) shares[p] += each;
    } else {
      shares[item.assignedTo] = (shares[item.assignedTo] || 0) + item.cost;
    }
  }

  return shares;
}

/**
 * Settle up: minimize transactions to resolve debts.
 * Input: { personName: amountOwed } (positive = owes, negative = is owed)
 * paidBy is the person who paid the bill.
 * @param {object} shares - { name: shareAmount }
 * @param {number} totalPaid - total amount paid
 * @param {string} paidBy - who paid
 * @returns {Array} transactions [{from, to, amount}]
 */
export function calcSettleUp(shares, totalPaid, paidBy) {
  // Net balance: negative = owed money, positive = owes money
  // paidBy is owed their full payment minus their share
  const balances = {};
  for (const [person, share] of Object.entries(shares)) {
    if (person === paidBy) {
      balances[person] = share - totalPaid; // negative means others owe them
    } else {
      balances[person] = share; // positive means they owe
    }
  }

  // Greedy settle: creditors (negative balance) receive from debtors (positive)
  const debtors = Object.entries(balances)
    .filter(([, b]) => b > 0.001)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);

  const creditors = Object.entries(balances)
    .filter(([, b]) => b < -0.001)
    .map(([name, amount]) => ({ name, amount: -amount }))
    .sort((a, b) => b.amount - a.amount);

  const transactions = [];
  let di = 0, ci = 0;

  while (di < debtors.length && ci < creditors.length) {
    const d = debtors[di];
    const c = creditors[ci];
    const amount = Math.min(d.amount, c.amount);
    transactions.push({ from: d.name, to: c.name, amount: Math.round(amount * 100) / 100 });
    d.amount -= amount;
    c.amount -= amount;
    if (d.amount < 0.001) di++;
    if (c.amount < 0.001) ci++;
  }

  return transactions;
}
