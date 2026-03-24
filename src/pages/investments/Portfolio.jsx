import { useState } from 'react';
import { useGemini } from '../../hooks/useGemini';
import { useIDB } from '../../hooks/useIDB';
import { useStockQuote } from '../../hooks/useStockQuote';
import { useStockSearch } from '../../hooks/useStockSearch';
import {
  ASSET_CLASSES,
  calculateHolding,
  calculatePortfolioTotals,
  calculateAssetAllocation,
  createHolding,
} from './investments.utils';
import { ImportButton } from '../../components/ImportButton';
import { mergeById, mergeByTicker, csvRowToHolding } from '../../utils/importData';

const PIE_COLORS = {
  Stocks: '#f59e0b',
  ETF: '#3b82f6',
  Crypto: '#8b5cf6',
  Bonds: '#10b981',
  'Real Estate': '#ef4444',
  Cash: '#71717a',
};

function AssetPieChart({ allocations }) {
  if (!allocations.length) return null;

  let cumulative = 0;
  const size = 120;
  const cx = size / 2;
  const cy = size / 2;
  const r = 48;

  const slices = allocations.map((a) => {
    const startAngle = cumulative;
    const angle = (a.percent / 100) * 360;
    cumulative += angle;
    const endAngle = cumulative;

    const toRad = (deg) => (deg - 90) * (Math.PI / 180);
    const x1 = cx + r * Math.cos(toRad(startAngle));
    const y1 = cy + r * Math.sin(toRad(startAngle));
    const x2 = cx + r * Math.cos(toRad(endAngle));
    const y2 = cy + r * Math.sin(toRad(endAngle));
    const largeArc = angle > 180 ? 1 : 0;

    return {
      ...a,
      path: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`,
    };
  });

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices.map((s) => (
          <path key={s.assetClass} d={s.path} fill={PIE_COLORS[s.assetClass] || '#71717a'} opacity={0.85} />
        ))}
        <circle cx={cx} cy={cy} r={r * 0.52} fill="#0a0a0b" />
      </svg>
      <div className="space-y-1.5">
        {allocations.map((a) => (
          <div key={a.assetClass} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[a.assetClass] || '#71717a' }} />
            <span className="text-[#a1a1aa]">{a.assetClass}</span>
            <span className="text-[#e4e4e7] font-medium ml-auto">{a.percent.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HoldingRow({ h, onRemove, onPriceUpdate }) {
  const { fetchQuote, loading: quoteLoading } = useStockQuote();
  const [lastUpdated, setLastUpdated] = useState(h.lastUpdated || null);

  const handleRefresh = async () => {
    try {
      const result = await fetchQuote(h.ticker);
      onPriceUpdate(h.id, result.price);
      setLastUpdated(new Date().toISOString());
    } catch {}
  };

  const { marketValue, gainLoss, gainLossPercent } = calculateHolding(h);
  const pos = gainLoss >= 0;

  return (
    <tr className="border-b border-[#27272a] last:border-0 hover:bg-[#0a0a0b]">
      <td className="px-4 py-3 font-bold text-[#f59e0b]">{h.ticker}</td>
      <td className="px-4 py-3 text-[#a1a1aa]">{h.name || '—'}</td>
      <td className="px-4 py-3 text-[#71717a]">{h.assetClass}</td>
      <td className="px-4 py-3 text-[#e4e4e7]">{h.shares}</td>
      <td className="px-4 py-3 text-[#e4e4e7]">${h.costBasis.toFixed(2)}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="text-[#e4e4e7] text-sm">${Number(h.currentPrice).toFixed(2)}</span>
          <button
            onClick={handleRefresh}
            disabled={quoteLoading}
            title="Refresh live price"
            className="text-[#52525b] hover:text-amber-400 disabled:opacity-40 text-xs transition-colors"
          >
            {quoteLoading ? '⏳' : '🔄'}
          </button>
        </div>
        {lastUpdated && (
          <p className="text-[#3f3f46] text-[10px] mt-0.5">
            {new Date(lastUpdated).toLocaleTimeString()}
          </p>
        )}
      </td>
      <td className="px-4 py-3 text-[#e4e4e7] font-medium">${marketValue.toFixed(2)}</td>
      <td className={`px-4 py-3 font-medium ${pos ? 'text-green-400' : 'text-red-400'}`}>
        {pos ? '+' : ''}${gainLoss.toFixed(2)}
      </td>
      <td className={`px-4 py-3 font-medium ${pos ? 'text-green-400' : 'text-red-400'}`}>
        {pos ? '+' : ''}{gainLossPercent.toFixed(2)}%
      </td>
      <td className="px-4 py-3">
        <button
          onClick={() => onRemove(h.id)}
          className="text-[#52525b] hover:text-red-400 text-xs transition-colors"
          aria-label={`Remove ${h.ticker}`}
        >
          ✕
        </button>
      </td>
    </tr>
  );
}

function AddHoldingForm({ onAdd, onCancel }) {
  const { validate, loading: searchLoading } = useStockSearch();
  const [form, setForm] = useState({
    ticker: '', name: '', shares: '', costBasis: '', currentPrice: '', assetClass: 'Stocks',
  });
  const [tickerError, setTickerError] = useState('');
  const [lookingUp, setLookingUp] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleTickerLookup = async () => {
    if (!form.ticker.trim()) return;
    setLookingUp(true);
    setTickerError('');
    try {
      const result = await validate(form.ticker.trim());
      setForm((f) => ({
        ...f,
        ticker: f.ticker.toUpperCase(),
        name: result.name,
        currentPrice: String(result.price),
      }));
    } catch (err) {
      setTickerError(err.message || 'Could not find ticker');
    } finally {
      setLookingUp(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.ticker || !form.shares || !form.costBasis || !form.currentPrice) return;
    onAdd(createHolding({ ...form, lastUpdated: form.currentPrice ? new Date().toISOString() : null }));
    setForm({ ticker: '', name: '', shares: '', costBasis: '', currentPrice: '', assetClass: 'Stocks' });
  };

  const inputCls = 'bg-[#0a0a0b] border border-[#27272a] rounded-lg px-3 py-2 text-[#e4e4e7] text-sm placeholder-[#52525b] focus:outline-none focus:border-[#f59e0b] w-full';

  return (
    <form onSubmit={handleSubmit} className="bg-[#111113] border border-[#27272a] rounded-xl p-5 space-y-4">
      <h3 className="text-[#e4e4e7] font-semibold">Add Holding</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 sm:col-span-1">
          <label className="text-[#71717a] text-xs mb-1 block">Ticker *</label>
          <div className="flex gap-2">
            <input
              className={inputCls}
              placeholder="AAPL"
              value={form.ticker}
              onChange={(e) => { set('ticker')(e); setTickerError(''); }}
              required
            />
            <button
              type="button"
              onClick={handleTickerLookup}
              disabled={lookingUp || !form.ticker.trim()}
              className="bg-[#27272a] hover:bg-[#3f3f46] disabled:opacity-40 text-[#e4e4e7] px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0"
            >
              {lookingUp ? '⏳' : '🔍 Fetch'}
            </button>
          </div>
          {tickerError && <p className="text-red-400 text-xs mt-1">{tickerError}</p>}
        </div>
        <div>
          <label className="text-[#71717a] text-xs mb-1 block">Name</label>
          <input className={inputCls} placeholder="Apple Inc." value={form.name} onChange={set('name')} />
        </div>
        <div>
          <label className="text-[#71717a] text-xs mb-1 block">Shares *</label>
          <input className={inputCls} type="number" step="any" min="0" placeholder="10" value={form.shares} onChange={set('shares')} required />
        </div>
        <div>
          <label className="text-[#71717a] text-xs mb-1 block">Avg Cost Basis *</label>
          <input className={inputCls} type="number" step="any" min="0" placeholder="150.00" value={form.costBasis} onChange={set('costBasis')} required />
        </div>
        <div>
          <label className="text-[#71717a] text-xs mb-1 block">Current Price *</label>
          <input className={inputCls} type="number" step="any" min="0" placeholder="180.00" value={form.currentPrice} onChange={set('currentPrice')} required />
        </div>
        <div>
          <label className="text-[#71717a] text-xs mb-1 block">Asset Class</label>
          <select className={inputCls} value={form.assetClass} onChange={set('assetClass')}>
            {ASSET_CLASSES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div className="flex gap-3 pt-1">
        <button type="submit" className="bg-[#f59e0b] hover:bg-amber-400 text-black font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
          Add Holding
        </button>
        <button type="button" onClick={onCancel} className="border border-[#27272a] text-[#71717a] hover:text-[#e4e4e7] px-4 py-2 rounded-lg text-sm transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}

export function Portfolio() {
  const [holdings, setHoldings] = useIDB('investments-portfolio', []);
  const [showAdd, setShowAdd] = useState(false);
  const [importMsg, setImportMsg] = useState('');
  const { generate, loading: aiLoading, hasKey } = useGemini();
  const [riskResult, setRiskResult] = useState(null);
  const [riskError, setRiskError] = useState(null);

  const addHolding = (h) => {
    setHoldings((prev) => [...prev, h]);
    setShowAdd(false);
  };

  const removeHolding = (id) => setHoldings((prev) => prev.filter((h) => h.id !== id));

  const updatePrice = (id, price) => {
    setHoldings((prev) =>
      prev.map((h) => (h.id === id ? { ...h, currentPrice: Number(price), lastUpdated: new Date().toISOString() } : h))
    );
  };

  function showImportResult(imported, skipped) {
    setImportMsg(`Imported ${imported} holding${imported !== 1 ? 's' : ''} (${skipped} skipped as duplicates)`);
    setTimeout(() => setImportMsg(''), 4000);
  }

  function handleImportCSV(rows) {
    const incoming = rows.map(csvRowToHolding);
    setHoldings((prev) => {
      const { merged, imported, skipped } = mergeByTicker(prev, incoming);
      showImportResult(imported, skipped);
      return merged;
    });
  }

  function handleImportJSON(data) {
    const incoming = Array.isArray(data)
      ? data
      : (data.investments?.portfolio || data.portfolio || []);
    setHoldings((prev) => {
      const { merged, imported, skipped } = mergeByTicker(prev, incoming);
      showImportResult(imported, skipped);
      return merged;
    });
  }

  const totals = calculatePortfolioTotals(holdings);
  const allocations = calculateAssetAllocation(holdings);

  const handleAssessRisk = async () => {
    setRiskResult(null);
    setRiskError(null);
    const totalVal = holdings.reduce((s, h) => s + h.shares * h.currentPrice, 0);
    const holdingsSummary = holdings.map((h) => {
      const val = h.shares * h.currentPrice;
      const pct = totalVal > 0 ? ((val / totalVal) * 100).toFixed(1) : '0.0';
      return `${h.ticker} ${pct}%`;
    }).join(', ');
    try {
      const text = await generate(
        `My investment portfolio: ${holdingsSummary}. Identify concentration risks, suggest diversification improvements, and give an overall risk assessment (Conservative/Moderate/Aggressive).`
      );
      setRiskResult(text);
    } catch (err) {
      setRiskError(err.message);
    }
  };

  return (
    <div className="space-y-5">
      {/* Summary Bar */}
      <div className="bg-[#111113] border border-[#27272a] rounded-xl p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <p className="text-[#71717a] text-xs mb-1">Total Value</p>
          <p className="text-xl font-bold text-[#f59e0b]">
            ${totals.totalValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}
          </p>
        </div>
        <div>
          <p className="text-[#71717a] text-xs mb-1">Total Cost</p>
          <p className="text-xl font-bold text-[#e4e4e7]">
            ${totals.totalCost.toLocaleString('en-US', { maximumFractionDigits: 2 })}
          </p>
        </div>
        <div>
          <p className="text-[#71717a] text-xs mb-1">Total Gain/Loss</p>
          <p className={`text-xl font-bold ${totals.totalGainLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {totals.totalGainLoss >= 0 ? '+' : ''}${totals.totalGainLoss.toLocaleString('en-US', { maximumFractionDigits: 2 })}
          </p>
        </div>
        <div>
          <p className="text-[#71717a] text-xs mb-1">Return</p>
          <p className={`text-xl font-bold ${totals.totalGainLossPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {totals.totalGainLossPercent >= 0 ? '+' : ''}{totals.totalGainLossPercent.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* AI Risk Assessment */}
      {hasKey && holdings.length > 0 && (
        <div>
          <button
            type="button"
            onClick={handleAssessRisk}
            disabled={aiLoading}
            className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            data-testid="assess-risk-btn"
          >
            {aiLoading ? '⏳ Analyzing…' : '✨ Assess Risk'}
          </button>
          {riskError && <p className="text-red-400 text-xs mt-2">❌ {riskError}</p>}
          {riskResult && (
            <div className="mt-3 border border-amber-500/30 bg-amber-950/20 rounded-xl p-4" data-testid="risk-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-amber-400 text-sm font-semibold">✨ Risk Assessment</span>
                <button
                  type="button"
                  onClick={() => setRiskResult(null)}
                  className="text-[#52525b] hover:text-[#e4e4e7] text-xs"
                >
                  Dismiss
                </button>
              </div>
              <p className="text-[#e4e4e7] text-sm whitespace-pre-wrap">{riskResult}</p>
            </div>
          )}
        </div>
      )}

      {/* Asset Allocation */}
      {allocations.length > 0 && (
        <div className="bg-[#111113] border border-[#27272a] rounded-xl p-5">
          <h3 className="text-[#e4e4e7] font-semibold mb-4">Asset Allocation</h3>
          <AssetPieChart allocations={allocations} />
        </div>
      )}

      {/* Import buttons */}
      <div className="flex flex-wrap gap-2">
        <ImportButton
          mode="csv"
          label="📥 Import Portfolio (CSV)"
          onImport={handleImportCSV}
        />
        <ImportButton
          mode="json"
          label="📥 Import Portfolio (JSON)"
          onImport={handleImportJSON}
        />
      </div>

      {importMsg && (
        <div className="text-xs px-3 py-2 rounded-lg border text-green-400 bg-green-400/10 border-green-400/20">
          ✅ {importMsg}
        </div>
      )}

      {/* Add button or form */}
      {showAdd ? (
        <AddHoldingForm onAdd={addHolding} onCancel={() => setShowAdd(false)} />
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="bg-[#f59e0b] hover:bg-amber-400 text-black font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
        >
          + Add Holding
        </button>
      )}

      {/* Holdings Table */}
      {holdings.length === 0 ? (
        <div className="text-center py-10 text-[#71717a]">
          <div className="text-4xl mb-3">📈</div>
          <p className="text-[#e4e4e7] mb-1">Add your first holding to track your portfolio</p>
          <p className="text-sm">Monitor gains, losses, and asset allocation over time.</p>
        </div>
      ) : (
        <div className="bg-[#111113] border border-[#27272a] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#27272a]">
                  {['Ticker', 'Name', 'Class', 'Shares', 'Cost Basis', 'Live Price', 'Mkt Value', 'Gain/Loss', '%', ''].map((h) => (
                    <th key={h} className="text-left text-[#71717a] font-medium px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {holdings.map((h) => (
                  <HoldingRow key={h.id} h={h} onRemove={removeHolding} onPriceUpdate={updatePrice} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
