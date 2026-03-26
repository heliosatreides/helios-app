import { useState, useEffect } from 'react';
import { useGemini } from '../../hooks/useGemini';
import { PageHeader } from '../../components/ui';
import {
  convertCurrency,
  UNIT_CATEGORIES,
  POPULAR_PAIRS,
  getCachedRates,
  setCachedRates,
} from './converterUtils';

const FAVORITES_KEY = 'helios-currency-favorites';

function getCurrencyList(rates) {
  if (!rates) return ['USD'];
  return ['USD', ...Object.keys(rates).sort()];
}

// ── Currency Converter ─────────────────────────────────────────────────────

function CurrencyConverter() {
  const [rates, setRates] = useState(null);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [ratesError, setRatesError] = useState(null);
  const [amount, setAmount] = useState('100');
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('EUR');
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
    } catch { return []; }
  });
  const [aiResult, setAiResult] = useState(null);
  const [aiError, setAiError] = useState(null);
  const { generate, loading: aiLoading, hasKey } = useGemini();

  useEffect(() => {
    const cached = getCachedRates();
    if (cached) { setRates(cached); return; }
    setRatesLoading(true);
    fetch('https://api.exchangerate-api.com/v4/latest/USD')
      .then((r) => r.json())
      .then((data) => {
        setRates(data.rates);
        setCachedRates(data.rates);
        setRatesLoading(false);
      })
      .catch((err) => {
        setRatesError(err.message);
        setRatesLoading(false);
      });
  }, []);

  const currencies = getCurrencyList(rates);
  const amountNum = parseFloat(amount);
  const result = rates ? convertCurrency(amountNum, from, to, rates) : null;

  const addFavorite = () => {
    const pair = `${from}/${to}`;
    if (favorites.includes(pair)) return;
    const updated = [...favorites, pair];
    setFavorites(updated);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  };

  const removeFavorite = (pair) => {
    const updated = favorites.filter((f) => f !== pair);
    setFavorites(updated);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  };

  const applyPair = (fromCur, toCur) => {
    setFrom(fromCur);
    setTo(toCur);
  };

  const handleTrend = async () => {
    setAiResult(null);
    setAiError(null);
    try {
      const text = await generate(
        `Give a brief 2-3 sentence context on the ${from}/${to} exchange rate trend based on your training data. Focus on historical performance, key drivers, and any notable recent movements you know about. Be specific if you can.`
      );
      setAiResult(text);
    } catch (err) {
      setAiError(err.message);
    }
  };

  const selectCls = 'bg-background border border-border px-3 py-2 text-foreground text-sm focus:outline-none focus:border-[#f59e0b]';

  return (
    <div className="space-y-5">
      {ratesLoading && <p className="text-muted-foreground text-sm">Loading exchange rates…</p>}
      {ratesError && <p className="text-red-400 text-xs">❌ {ratesError}</p>}

      {/* Converter input */}
      <div className="bg-background border border-border p-4 space-y-3">
        <div className="grid grid-cols-3 gap-3 items-end">
          <div>
            <label className="text-muted-foreground text-xs block mb-1">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-background border border-border px-3 py-2 text-foreground text-sm focus:outline-none focus:border-[#f59e0b] w-full"
              placeholder="100"
              min="0"
            />
          </div>
          <div>
            <label className="text-muted-foreground text-xs block mb-1">From</label>
            <select value={from} onChange={(e) => setFrom(e.target.value)} className={selectCls + ' w-full'}>
              {currencies.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-muted-foreground text-xs block mb-1">To</label>
            <select value={to} onChange={(e) => setTo(e.target.value)} className={selectCls + ' w-full'}>
              {currencies.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {result !== null && !isNaN(result) && (
          <div className="text-center py-3 border-t border-border">
            <p className="text-muted-foreground text-xs">{amount} {from} =</p>
            <p className="text-3xl font-bold text-amber-400 mt-1">
              {result.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
              <span className="text-lg ml-2 text-muted-foreground">{to}</span>
            </p>
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          <button type="button" onClick={addFavorite} className="text-xs text-muted-foreground hover:text-amber-400 transition-colors">
            ⭐ Save pair
          </button>
          {hasKey && (
            <button
              type="button"
              onClick={handleTrend}
              disabled={aiLoading}
              className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-foreground text-xs font-medium px-3 py-1.5 transition-colors disabled:opacity-50"
            >
              {aiLoading ? '⏳ Thinking…' : '✨ What\'s the exchange trend?'}
            </button>
          )}
        </div>

        {aiError && <p className="text-red-400 text-xs">❌ {aiError}</p>}
        {aiResult && (
          <div className="border border-border bg-secondary/50 p-4">
            <p className="text-foreground text-xs font-medium mb-1">✨ Exchange Context</p>
            <p className="text-foreground text-sm whitespace-pre-wrap">{aiResult}</p>
          </div>
        )}
      </div>

      {/* Popular pairs */}
      <div>
        <p className="text-muted-foreground/80 text-xs uppercase tracking-widest mb-2">Popular pairs</p>
        <div className="flex gap-2 flex-wrap">
          {POPULAR_PAIRS.map((p) => (
            <button
              key={`${p.from}/${p.to}`}
              type="button"
              onClick={() => applyPair(p.from, p.to)}
              className="bg-secondary hover:bg-[#3f3f46] text-muted-foreground hover:text-foreground text-xs px-3 py-1.5 transition-colors"
            >
              {p.from}/{p.to}
            </button>
          ))}
        </div>
      </div>

      {/* Favorites */}
      {favorites.length > 0 && (
        <div>
          <p className="text-muted-foreground/80 text-xs uppercase tracking-widest mb-2">Favorites</p>
          <div className="flex gap-2 flex-wrap">
            {favorites.map((pair) => {
              const [f, t] = pair.split('/');
              return (
                <div key={pair} className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-2 py-1">
                  <button
                    type="button"
                    onClick={() => applyPair(f, t)}
                    className="text-amber-400 text-xs font-medium"
                  >
                    {pair}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFavorite(pair)}
                    className="text-muted-foreground/80 hover:text-red-400 text-xs ml-1"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Unit Converter ─────────────────────────────────────────────────────────

function UnitConverter() {
  const [activeCategory, setActiveCategory] = useState('Length');
  const [value, setValue] = useState('1');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const category = UNIT_CATEGORIES[activeCategory];
  const units = category.units;

  // Reset on category change
  useEffect(() => {
    setValue('1');
    setFrom(units[0]);
    setTo(units[1] || units[0]);
  }, [activeCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  const numericFrom = from || units[0];
  const numericTo = to || units[1] || units[0];

  const result = category.convert(value, numericFrom, numericTo);

  const getLabel = (unit) => {
    if (category.labels && category.labels[unit]) return category.labels[unit];
    return unit;
  };

  const selectCls = 'bg-background border border-border px-3 py-2 text-foreground text-sm focus:outline-none focus:border-[#f59e0b] w-full';

  return (
    <div className="space-y-4">
      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap">
        {Object.keys(UNIT_CATEGORIES).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeCategory === cat
                ? 'bg-amber-500 text-black'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="bg-background border border-border p-4 space-y-3">
        <div className="grid grid-cols-3 gap-3 items-end">
          <div>
            <label className="text-muted-foreground text-xs block mb-1">Value</label>
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="bg-background border border-border px-3 py-2 text-foreground text-sm focus:outline-none focus:border-[#f59e0b] w-full"
            />
          </div>
          <div>
            <label className="text-muted-foreground text-xs block mb-1">From</label>
            <select value={numericFrom} onChange={(e) => setFrom(e.target.value)} className={selectCls}>
              {units.map((u) => <option key={u} value={u}>{getLabel(u)}</option>)}
            </select>
          </div>
          <div>
            <label className="text-muted-foreground text-xs block mb-1">To</label>
            <select value={numericTo} onChange={(e) => setTo(e.target.value)} className={selectCls}>
              {units.map((u) => <option key={u} value={u}>{getLabel(u)}</option>)}
            </select>
          </div>
        </div>

        {result !== null && !isNaN(result) && (
          <div className="text-center py-3 border-t border-border">
            <p className="text-muted-foreground text-xs">{value} {getLabel(numericFrom)} =</p>
            <p className="text-3xl font-bold text-amber-400 mt-1">
              {result % 1 === 0 ? result.toLocaleString() : parseFloat(result.toPrecision(6)).toLocaleString()}
              <span className="text-lg ml-2 text-muted-foreground">{getLabel(numericTo)}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page wrapper ──────────────────────────────────────────────────────────

export function ConverterPage() {
  const [mode, setMode] = useState('currency');

  return (
    <div className="space-y-5">
      <PageHeader title="Converter" subtitle="Currency and unit conversion" />

      {/* Mode toggle */}
      <div className="flex gap-2">
        {[
          { id: 'currency', label: '💱 Currency' },
          { id: 'units', label: '📐 Units' },
        ].map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setMode(id)}
            className={`px-4 py-2 text-sm font-semibold transition-colors ${
              mode === id
                ? 'bg-amber-500 text-black'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === 'currency' ? <CurrencyConverter /> : <UnitConverter />}
    </div>
  );
}
