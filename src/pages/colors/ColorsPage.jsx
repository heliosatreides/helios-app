import { useState } from 'react';
import { useIDB } from '../../hooks/useIDB';
import { useGemini } from '../../hooks/useGemini';
import { generatePalette, generateCssVars, hexToRgb, rgbToHsl } from './colorUtils';

function ColorChip({ color, label }) {
  const [copied, setCopied] = useState('');
  function copy(text) {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(text);
    setTimeout(() => setCopied(''), 1500);
  }
  const [r, g, b] = color.rgb;
  const [h, s, l] = color.hsl;
  return (
    <div className="flex flex-col gap-1.5">
      {label && <div className="text-xs text-[#71717a] font-medium">{label}</div>}
      <div className="w-full h-16 rounded-lg cursor-pointer border border-[#1c1c20] hover:border-[#3f3f46]" style={{ backgroundColor: color.hex }} onClick={() => copy(color.hex)} title="Click to copy hex" />
      <div className="space-y-1">
        {[
          { label: 'HEX', val: color.hex },
          { label: 'RGB', val: `rgb(${r}, ${g}, ${b})` },
          { label: 'HSL', val: `hsl(${h}, ${s}%, ${l}%)` },
        ].map(({ label: lb, val }) => (
          <div key={lb} className="flex items-center justify-between">
            <span className="text-xs text-[#52525b]">{lb}</span>
            <button onClick={() => copy(val)} className="text-xs text-[#a1a1aa] hover:text-amber-400 font-mono">
              {copied === val ? '✓ Copied' : val}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ColorsPage() {
  const [palettes, setPalettes] = useIDB('color-palettes', []);
  const [hex, setHex] = useState('#3b82f6');
  const [palette, setPalette] = useState(null);
  const [tab, setTab] = useState('generator'); // 'generator' | 'saved'
  const [paletteName, setPaletteName] = useState('');
  const [aiName, setAiName] = useState('');
  const [mood, setMood] = useState('');
  const [moodColors, setMoodColors] = useState('');
  const { generate, loading, error } = useGemini();

  function generate_palette() {
    const p = generatePalette(hex);
    if (p) setPalette(p);
  }

  function savePalette() {
    if (!palette || !paletteName.trim()) return;
    setPalettes(prev => [...prev, { id: Date.now().toString(), name: paletteName.trim(), palette, hex }]);
    setPaletteName('');
  }

  async function namePalette() {
    if (!palette) return;
    const colors = [palette.base, ...palette.complementary, ...palette.analogous].map(c => c.hex).join(', ');
    const resp = await generate(`Suggest a creative, evocative name for a color palette with these colors: ${colors}. Return just the name (2-4 words), no explanation.`);
    setAiName(resp.trim());
  }

  async function paletteFromMood() {
    if (!mood.trim()) return;
    const resp = await generate(`Suggest 5 hex color codes for a color palette inspired by the mood/theme: "${mood}". Return only the hex codes separated by commas, nothing else. Example: #3b82f6, #8b5cf6, #10b981, #f59e0b, #ef4444`);
    setMoodColors(resp.trim());
  }

  const cssVars = palette ? generateCssVars(palette) : '';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#e4e4e7]">🎨 Color Palette Generator</h1>
        <div className="flex gap-2">
          {['generator', 'saved'].map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-lg text-sm ${tab === t ? 'bg-amber-500 text-black font-semibold' : 'bg-[#27272a] text-[#a1a1aa]'}`}>
              {t === 'generator' ? '🎨 Generator' : '💾 Saved'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'generator' && (
        <div className="space-y-6">
          {/* Input */}
          <div className="bg-[#0c0c0e] border border-[#1c1c20] rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-xs text-[#71717a] mb-1">Base Color</label>
                <div className="flex gap-3 items-center">
                  <input type="color" value={hex} onChange={e => setHex(e.target.value)} className="w-12 h-10 rounded cursor-pointer border-0 bg-transparent" />
                  <input value={hex} onChange={e => setHex(e.target.value)} placeholder="#3b82f6" className="w-32 bg-[#18181b] border border-[#1c1c20] rounded-lg px-3 py-2 text-[#e4e4e7] text-sm outline-none focus:border-amber-500 font-mono" />
                </div>
              </div>
              <button onClick={generate_palette} className="mt-5 px-4 py-2 bg-amber-500 text-black rounded-lg font-semibold text-sm hover:bg-amber-400">Generate</button>
            </div>

            {/* AI: palette from mood */}
            <div className="border-t border-[#1c1c20] pt-4 flex items-center gap-3 flex-wrap">
              <input value={mood} onChange={e => setMood(e.target.value)} placeholder="Enter a mood/theme (e.g., 'ocean', 'sunset', 'forest')" className="flex-1 bg-[#18181b] border border-[#1c1c20] rounded-lg px-3 py-2 text-[#e4e4e7] text-sm outline-none focus:border-amber-500 min-w-48" />
              <button onClick={paletteFromMood} disabled={loading || !mood.trim()} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-500 disabled:opacity-50">✨ From Mood</button>
            </div>
            {moodColors && (
              <div className="space-y-2">
                <div className="text-xs text-[#71717a]">AI Suggested Colors:</div>
                <div className="flex gap-2 flex-wrap">
                  {moodColors.split(',').map(c => c.trim()).filter(c => c.startsWith('#')).map(c => (
                    <div key={c} className="flex flex-col items-center gap-1">
                      <div className="w-12 h-12 rounded-lg border border-[#1c1c20] cursor-pointer hover:border-amber-500" style={{ backgroundColor: c }} onClick={() => { setHex(c); generate_palette(); }} />
                      <span className="text-xs text-[#71717a] font-mono">{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Palette display */}
          {palette && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ColorChip color={palette.base} label="Base" />
                {palette.complementary.map((c, i) => <ColorChip key={i} color={c} label="Complementary" />)}
                {palette.analogous.map((c, i) => <ColorChip key={i} color={c} label={`Analogous ${i + 1}`} />)}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {palette.triadic.map((c, i) => <ColorChip key={i} color={c} label={`Triadic ${i + 1}`} />)}
                {palette.splitComplementary.map((c, i) => <ColorChip key={i} color={c} label={`Split-Comp ${i + 1}`} />)}
              </div>

              {/* CSS vars */}
              <div className="bg-[#0c0c0e] border border-[#1c1c20] rounded-xl p-4 space-y-2">
                <h3 className="text-sm font-semibold text-[#a1a1aa]">CSS Custom Properties</h3>
                <pre className="text-xs text-[#71717a] font-mono overflow-auto">{cssVars}</pre>
              </div>

              {/* AI name + Save */}
              <div className="bg-[#0c0c0e] border border-[#1c1c20] rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-[#a1a1aa]">✨ Name & Save</h3>
                <div className="flex gap-2">
                  <button onClick={namePalette} disabled={loading} className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-500 disabled:opacity-50">✨ Suggest Name</button>
                  {aiName && <span className="text-sm text-amber-400 self-center">{aiName}</span>}
                </div>
                <div className="flex gap-2">
                  <input value={paletteName} onChange={e => setPaletteName(e.target.value)} placeholder={aiName || "Palette name..."} className="flex-1 bg-[#18181b] border border-[#1c1c20] rounded-lg px-3 py-2 text-[#e4e4e7] text-sm outline-none focus:border-amber-500" />
                  <button onClick={savePalette} disabled={!paletteName.trim()} className="px-4 py-2 bg-amber-500 text-black rounded-lg text-sm font-semibold hover:bg-amber-400 disabled:opacity-50">Save</button>
                </div>
              </div>
            </div>
          )}
          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>
      )}

      {tab === 'saved' && (
        <div className="space-y-4">
          {palettes.length === 0 ? (
            <div className="text-center py-16 text-[#52525b]">No saved palettes. Generate and save one!</div>
          ) : (
            palettes.map(p => (
              <div key={p.id} className="bg-[#0c0c0e] border border-[#1c1c20] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-[#e4e4e7]">{p.name}</h3>
                  <button onClick={() => setPalettes(prev => prev.filter(x => x.id !== p.id))} className="text-[#52525b] hover:text-red-400">✕</button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {[p.palette.base, ...p.palette.complementary, ...p.palette.analogous, ...p.palette.triadic].map((c, i) => (
                    <div key={i} className="w-10 h-10 rounded-lg border border-[#1c1c20]" style={{ backgroundColor: c.hex }} title={c.hex} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
