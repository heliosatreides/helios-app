import { useState, useRef } from 'react';
import {
  generatePassword,
  scorePasswordStrength,
  STRENGTH_COLORS,
  STRENGTH_BAR_COLORS,
  STRENGTH_BAR_WIDTH,
} from './passwordUtils';

export function PasswordGenerator() {
  const [length, setLength] = useState(16);
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(false);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);
  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState([]); // session only

  const strength = password ? scorePasswordStrength(password) : null;

  const handleGenerate = () => {
    const pw = generatePassword({ length, uppercase, lowercase, numbers, symbols, excludeAmbiguous });
    if (!pw) return;
    setPassword(pw);
    setCopied(false);
    setHistory((prev) => [pw, ...prev].slice(0, 5));
  };

  const handleCopy = async (pw) => {
    try {
      await navigator.clipboard.writeText(pw || password);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const toggleCls = (active) =>
    `px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
      active
        ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
        : 'bg-[#0a0a0b] border border-[#27272a] text-[#71717a] hover:text-[#e4e4e7]'
    }`;

  return (
    <div className="space-y-4">
      {/* Length slider */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-[#71717a] text-xs">Length</label>
          <span className="text-amber-400 text-xs font-semibold">{length}</span>
        </div>
        <input
          type="range"
          min={8}
          max={64}
          value={length}
          onChange={(e) => setLength(Number(e.target.value))}
          className="w-full accent-amber-500"
        />
        <div className="flex justify-between text-[#3f3f46] text-xs mt-0.5">
          <span>8</span>
          <span>64</span>
        </div>
      </div>

      {/* Character set toggles */}
      <div className="flex gap-2 flex-wrap">
        <button type="button" onClick={() => setUppercase((v) => !v)} className={toggleCls(uppercase)}>ABC</button>
        <button type="button" onClick={() => setLowercase((v) => !v)} className={toggleCls(lowercase)}>abc</button>
        <button type="button" onClick={() => setNumbers((v) => !v)} className={toggleCls(numbers)}>123</button>
        <button type="button" onClick={() => setSymbols((v) => !v)} className={toggleCls(symbols)}>!@#</button>
        <button type="button" onClick={() => setExcludeAmbiguous((v) => !v)} className={toggleCls(excludeAmbiguous)}>
          No 0/O/1/l
        </button>
      </div>

      {/* Generate button */}
      <button
        type="button"
        onClick={handleGenerate}
        className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold py-2.5 rounded-xl text-sm transition-colors"
      >
        Generate Password
      </button>

      {/* Password display */}
      {password && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 bg-[#0a0a0b] border border-[#27272a] rounded-xl px-4 py-3">
            <code className="flex-1 text-amber-400 font-mono text-sm break-all">{password}</code>
            <button
              type="button"
              onClick={() => handleCopy()}
              className="text-[#52525b] hover:text-amber-400 text-sm transition-colors shrink-0"
              title="Copy"
            >
              {copied ? '✓' : '📋'}
            </button>
          </div>

          {/* Strength meter */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[#52525b] text-xs">Strength</span>
              <span className={`text-xs font-semibold capitalize ${STRENGTH_COLORS[strength]}`}>{strength}</span>
            </div>
            <div className="h-1.5 bg-[#27272a] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${STRENGTH_BAR_COLORS[strength]}`}
                style={{ width: STRENGTH_BAR_WIDTH[strength] }}
              />
            </div>
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div>
          <p className="text-[#52525b] text-xs uppercase tracking-widest mb-2">Recent (session only)</p>
          <div className="space-y-1.5">
            {history.map((pw, i) => (
              <div key={i} className="flex items-center gap-2 bg-[#0a0a0b] rounded-lg px-3 py-1.5">
                <code className="flex-1 text-[#71717a] font-mono text-xs break-all">{pw}</code>
                <button
                  type="button"
                  onClick={() => handleCopy(pw)}
                  className="text-[#3f3f46] hover:text-amber-400 text-xs transition-colors shrink-0"
                >
                  📋
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
