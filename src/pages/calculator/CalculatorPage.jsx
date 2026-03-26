import { useState } from 'react';
import { useIDB } from '../../hooks/useIDB';
import { useGemini } from '../../hooks/useGemini';
import { PageHeader } from '../../components/ui';
import {
  calcMonthlyPayment, calcAmortization, calcCompoundInterest,
  calcRetirement, calcSavingsGoal, calcFederalTax
} from './calcUtils';

const TABS = ['Loan', 'Compound', 'Retirement', 'Savings Goal', 'Tax'];

function fmt(n, decimals = 2) { return `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`; }
function pct(n) { return `${Number(n).toFixed(2)}%`; }

export function CalculatorPage({ embedded } = {}) {
  const [history, setHistory] = useIDB('calculator-history', []);
  const [tab, setTab] = useState('Loan');
  const [result, setResult] = useState(null);
  const [aiInterpretation, setAiInterpretation] = useState('');
  const { generate, loading, error } = useGemini();

  // Loan
  const [loan, setLoan] = useState({ principal: '250000', rate: '6.5', term: '360' });
  // Compound
  const [compound, setCompound] = useState({ principal: '10000', rate: '8', years: '10', n: '12' });
  // Retirement
  const [retire, setRetire] = useState({ currentAge: '30', retirementAge: '65', currentSavings: '50000', monthlyContrib: '500', rate: '7' });
  // Savings Goal
  const [savings, setSavings] = useState({ target: '20000', currentSavings: '0', months: '24', rate: '4' });
  // Tax
  const [tax, setTax] = useState({ income: '85000', filing: 'single' });

  function calculate() {
    let res = null;
    let historyEntry = { tab, timestamp: new Date().toISOString(), id: Date.now().toString() };

    if (tab === 'Loan') {
      const p = parseFloat(loan.principal), r = parseFloat(loan.rate), t = parseInt(loan.term);
      const payment = calcMonthlyPayment(p, r, t);
      const schedule = calcAmortization(p, r, t, 12);
      const totalCost = payment * t;
      res = { type: 'loan', payment, schedule, totalCost, totalInterest: totalCost - p, principal: p, rate: r, term: t };
      historyEntry = { ...historyEntry, label: `Loan ${fmt(p)} @ ${r}%`, summary: `${fmt(payment)}/mo` };
    } else if (tab === 'Compound') {
      const p = parseFloat(compound.principal), r = parseFloat(compound.rate), y = parseFloat(compound.years), n = parseInt(compound.n);
      const final = calcCompoundInterest(p, r, y, n);
      const gain = final - p;
      res = { type: 'compound', final, gain, principal: p, rate: r, years: y, n };
      historyEntry = { ...historyEntry, label: `Compound ${fmt(p)} @ ${r}%`, summary: fmt(final) };
    } else if (tab === 'Retirement') {
      const balance = calcRetirement(
        parseInt(retire.currentAge), parseInt(retire.retirementAge),
        parseFloat(retire.currentSavings), parseFloat(retire.monthlyContrib), parseFloat(retire.rate)
      );
      res = { type: 'retirement', balance, ...Object.fromEntries(Object.entries(retire).map(([k, v]) => [k, parseFloat(v)])) };
      historyEntry = { ...historyEntry, label: `Retirement at ${retire.retirementAge}`, summary: fmt(balance) };
    } else if (tab === 'Savings Goal') {
      const monthly = calcSavingsGoal(
        parseFloat(savings.target), parseFloat(savings.currentSavings),
        parseInt(savings.months), parseFloat(savings.rate)
      );
      res = { type: 'savings', monthly, ...Object.fromEntries(Object.entries(savings).map(([k, v]) => [k, parseFloat(v)])) };
      historyEntry = { ...historyEntry, label: `Save ${fmt(savings.target)}`, summary: `${fmt(monthly)}/mo` };
    } else if (tab === 'Tax') {
      const { tax: taxAmt, effectiveRate } = calcFederalTax(parseFloat(tax.income), tax.filing);
      res = { type: 'tax', tax: taxAmt, effectiveRate, income: parseFloat(tax.income), filing: tax.filing };
      historyEntry = { ...historyEntry, label: `Tax ${fmt(tax.income)}`, summary: fmt(taxAmt) };
    }

    setResult(res);
    setAiInterpretation('');
    if (res) setHistory(prev => [historyEntry, ...prev].slice(0, 20));
  }

  async function interpret() {
    if (!result) return;
    let desc = '';
    if (result.type === 'loan') {
      desc = `Loan: $${result.principal} principal, ${result.rate}% annual rate, ${result.term} months. Monthly payment: ${fmt(result.payment)}. Total cost: ${fmt(result.totalCost)}. Total interest: ${fmt(result.totalInterest)}.`;
    } else if (result.type === 'compound') {
      desc = `Compound interest: $${result.principal} initial, ${result.rate}% annual rate, ${result.years} years, compounded ${result.n}x/year. Final: ${fmt(result.final)}. Gain: ${fmt(result.gain)}.`;
    } else if (result.type === 'retirement') {
      desc = `Retirement: Starting age ${result.currentAge}, retire at ${result.retirementAge}, $${result.currentSavings} saved, $${result.monthlyContrib}/mo contributions, ${result.rate}% rate. Projected balance: ${fmt(result.balance)}.`;
    } else if (result.type === 'savings') {
      desc = `Savings goal: Target $${result.target} in ${result.months} months, starting with $${result.currentSavings}, ${result.rate}% rate. Required monthly: ${fmt(result.monthly)}.`;
    } else if (result.type === 'tax') {
      desc = `Tax: ${fmt(result.income)} gross income, ${result.filing} filing status. Federal tax: ${fmt(result.tax)}. Effective rate: ${pct(result.effectiveRate)}.`;
    }
    const resp = await generate(`Explain these financial calculation results in plain English. What do the numbers mean practically? Any advice or context? Keep it to 3-4 sentences:\n\n${desc}`);
    setAiInterpretation(resp);
  }

  const inputCls = "w-full bg-secondary border border-border px-3 py-2 text-foreground text-sm outline-none focus:border-amber-500";

  return (
    <div className="space-y-6">
      {!embedded && <PageHeader title="Financial Calculator" />}

      {/* Tab bar */}
      <div className="flex gap-1 flex-wrap">
        {TABS.map(t => (
          <button key={t} onClick={() => { setTab(t); setResult(null); setAiInterpretation(''); }} className={`px-3 py-1.5 text-sm ${tab === t ? 'bg-amber-500 text-background font-semibold' : 'bg-secondary text-muted-foreground'}`}>{t}</button>
        ))}
      </div>

      {/* Inputs per tab */}
      <div className="bg-background border border-border p-5 space-y-4">
        {tab === 'Loan' && (
          <>
            <h2 className="text-sm font-semibold text-muted-foreground">Loan Calculator</h2>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-xs text-muted-foreground block mb-1">Principal ($)</label><input value={loan.principal} onChange={e => setLoan(l => ({ ...l, principal: e.target.value }))} className={inputCls} /></div>
              <div><label className="text-xs text-muted-foreground block mb-1">Annual Rate (%)</label><input value={loan.rate} onChange={e => setLoan(l => ({ ...l, rate: e.target.value }))} className={inputCls} /></div>
              <div><label className="text-xs text-muted-foreground block mb-1">Term (months)</label><input value={loan.term} onChange={e => setLoan(l => ({ ...l, term: e.target.value }))} className={inputCls} /></div>
            </div>
          </>
        )}
        {tab === 'Compound' && (
          <>
            <h2 className="text-sm font-semibold text-muted-foreground">Compound Interest</h2>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-muted-foreground block mb-1">Principal ($)</label><input value={compound.principal} onChange={e => setCompound(c => ({ ...c, principal: e.target.value }))} className={inputCls} /></div>
              <div><label className="text-xs text-muted-foreground block mb-1">Annual Rate (%)</label><input value={compound.rate} onChange={e => setCompound(c => ({ ...c, rate: e.target.value }))} className={inputCls} /></div>
              <div><label className="text-xs text-muted-foreground block mb-1">Time (years)</label><input value={compound.years} onChange={e => setCompound(c => ({ ...c, years: e.target.value }))} className={inputCls} /></div>
              <div><label className="text-xs text-muted-foreground block mb-1">Compounds/Year</label>
                <select value={compound.n} onChange={e => setCompound(c => ({ ...c, n: e.target.value }))} className={inputCls}>
                  <option value="1">Annually (1)</option>
                  <option value="4">Quarterly (4)</option>
                  <option value="12">Monthly (12)</option>
                  <option value="365">Daily (365)</option>
                </select>
              </div>
            </div>
          </>
        )}
        {tab === 'Retirement' && (
          <>
            <h2 className="text-sm font-semibold text-muted-foreground">Retirement Calculator</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Current Age', key: 'currentAge' },
                { label: 'Retirement Age', key: 'retirementAge' },
                { label: 'Current Savings ($)', key: 'currentSavings' },
                { label: 'Monthly Contribution ($)', key: 'monthlyContrib' },
                { label: 'Expected Annual Return (%)', key: 'rate' },
              ].map(({ label, key }) => (
                <div key={key} className={key === 'rate' ? 'col-span-2' : ''}>
                  <label className="text-xs text-muted-foreground block mb-1">{label}</label>
                  <input value={retire[key]} onChange={e => setRetire(r => ({ ...r, [key]: e.target.value }))} className={inputCls} />
                </div>
              ))}
            </div>
          </>
        )}
        {tab === 'Savings Goal' && (
          <>
            <h2 className="text-sm font-semibold text-muted-foreground">Savings Goal</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Target Amount ($)', key: 'target' },
                { label: 'Current Savings ($)', key: 'currentSavings' },
                { label: 'Timeframe (months)', key: 'months' },
                { label: 'Annual Rate (%)', key: 'rate' },
              ].map(({ label, key }) => (
                <div key={key}><label className="text-xs text-muted-foreground block mb-1">{label}</label><input value={savings[key]} onChange={e => setSavings(s => ({ ...s, [key]: e.target.value }))} className={inputCls} /></div>
              ))}
            </div>
          </>
        )}
        {tab === 'Tax' && (
          <>
            <h2 className="text-sm font-semibold text-muted-foreground">Tax Estimator (Federal, 2024)</h2>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-muted-foreground block mb-1">Gross Income ($)</label><input value={tax.income} onChange={e => setTax(t => ({ ...t, income: e.target.value }))} className={inputCls} /></div>
              <div><label className="text-xs text-muted-foreground block mb-1">Filing Status</label>
                <select value={tax.filing} onChange={e => setTax(t => ({ ...t, filing: e.target.value }))} className={inputCls}>
                  <option value="single">Single</option>
                  <option value="married">Married Filing Jointly</option>
                </select>
              </div>
            </div>
          </>
        )}
        <button onClick={calculate} className="w-full py-2.5 bg-amber-500 text-background font-semibold hover:bg-amber-400">Calculate</button>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-background border border-border p-5 space-y-4">
          {result.type === 'loan' && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div><div className="text-xs text-muted-foreground">Monthly Payment</div><div className="text-xl font-bold text-amber-400">{fmt(result.payment)}</div></div>
                <div><div className="text-xs text-muted-foreground">Total Cost</div><div className="text-xl font-bold text-foreground">{fmt(result.totalCost)}</div></div>
                <div><div className="text-xs text-muted-foreground">Total Interest</div><div className="text-xl font-bold text-red-400">{fmt(result.totalInterest)}</div></div>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground mb-2">Amortization (First 12 Months)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><tr className="text-muted-foreground/80"><th className="text-left py-1">Mo</th><th className="text-right py-1">Payment</th><th className="text-right py-1">Principal</th><th className="text-right py-1">Interest</th><th className="text-right py-1">Balance</th></tr></thead>
                    <tbody>
                      {result.schedule.map(row => (
                        <tr key={row.month} className="text-muted-foreground border-t border-border/50">
                          <td className="py-1">{row.month}</td>
                          <td className="text-right">{fmt(row.payment)}</td>
                          <td className="text-right text-green-400">{fmt(row.principal)}</td>
                          <td className="text-right text-red-400">{fmt(row.interest)}</td>
                          <td className="text-right">{fmt(row.balance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
          {result.type === 'compound' && (
            <div className="grid grid-cols-3 gap-4">
              <div><div className="text-xs text-muted-foreground">Final Balance</div><div className="text-xl font-bold text-amber-400">{fmt(result.final)}</div></div>
              <div><div className="text-xs text-muted-foreground">Total Gain</div><div className="text-xl font-bold text-green-400">{fmt(result.gain)}</div></div>
              <div><div className="text-xs text-muted-foreground">Return</div><div className="text-xl font-bold text-foreground">{pct(result.gain / result.principal * 100)}</div></div>
            </div>
          )}
          {result.type === 'retirement' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><div className="text-xs text-muted-foreground">Projected Balance at Retirement</div><div className="text-3xl font-bold text-amber-400">{fmt(result.balance)}</div></div>
              <div><div className="text-xs text-muted-foreground">Years to retirement</div><div className="text-lg font-bold text-foreground">{result.retirementAge - result.currentAge}</div></div>
            </div>
          )}
          {result.type === 'savings' && (
            <div className="grid grid-cols-2 gap-4">
              <div><div className="text-xs text-muted-foreground">Required Monthly Savings</div><div className="text-2xl font-bold text-amber-400">{fmt(result.monthly)}</div></div>
              <div><div className="text-xs text-muted-foreground">Goal</div><div className="text-lg font-semibold text-foreground">{fmt(result.target)}</div></div>
            </div>
          )}
          {result.type === 'tax' && (
            <div className="grid grid-cols-3 gap-4">
              <div><div className="text-xs text-muted-foreground">Estimated Federal Tax</div><div className="text-xl font-bold text-red-400">{fmt(result.tax)}</div></div>
              <div><div className="text-xs text-muted-foreground">Effective Rate</div><div className="text-xl font-bold text-foreground">{pct(result.effectiveRate)}</div></div>
              <div><div className="text-xs text-muted-foreground">After-Tax Income</div><div className="text-xl font-bold text-green-400">{fmt(result.income - result.tax)}</div></div>
            </div>
          )}

          {/* AI interpret */}
          <div className="border-t border-border pt-4 space-y-3">
            <button onClick={interpret} disabled={loading} className="px-4 py-2 bg-purple-600 text-white text-sm font-semibold hover:bg-purple-500 disabled:opacity-50">
              {loading ? 'Thinking...' : '✨ Interpret My Results'}
            </button>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            {aiInterpretation && <p className="text-sm text-muted-foreground leading-relaxed">{aiInterpretation}</p>}
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-widest">Recent Calculations</h2>
          {history.slice(0, 5).map(h => (
            <div key={h.id} className="bg-background border border-border px-3 py-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{h.label}</span>
              <span className="text-amber-400 font-semibold">{h.summary}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
