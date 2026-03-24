import { useState, useMemo } from 'react';
import { useIDB } from '../../hooks/useIDB';
import { useGemini } from '../../hooks/useGemini';
import { extractMatches, getHighlightSegments, COMMON_PATTERNS } from './regexUtils';

const ALL_FLAGS = ['g', 'i', 'm', 's'];

export function RegexPage() {
  const [saved, setSaved] = useIDB('regex-patterns', []);
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState(['g']);
  const [testStr, setTestStr] = useState('');
  const [saveName, setSaveName] = useState('');
  const [showSave, setShowSave] = useState(false);
  const [aiExplanation, setAiExplanation] = useState('');
  const [aiDesc, setAiDesc] = useState('');
  const [tab, setTab] = useState('tester'); // 'tester' | 'library' | 'saved'
  const { generate, loading, error } = useGemini();

  const flagStr = flags.join('');
  const { matches, error: regexError } = useMemo(() => extractMatches(pattern, flagStr, testStr), [pattern, flagStr, testStr]);
  const segments = useMemo(() => getHighlightSegments(pattern, flagStr, testStr), [pattern, flagStr, testStr]);

  function toggleFlag(f) {
    setFlags(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  }

  function loadPattern(p) {
    setPattern(p.pattern);
    setFlags(p.flags.split(''));
    setTab('tester');
  }

  function savePattern() {
    if (!saveName.trim() || !pattern) return;
    setSaved(prev => [...prev, { id: Date.now().toString(), name: saveName.trim(), pattern, flags: flagStr }]);
    setSaveName('');
    setShowSave(false);
  }

  async function explainRegex() {
    if (!pattern) return;
    const resp = await generate(`Explain this regex pattern in plain English for a developer:\n\nPattern: /${pattern}/${flagStr}\n\nBreak down each part: what it matches and why. Be concise but thorough.`);
    setAiExplanation(resp);
  }

  async function generateRegex() {
    if (!aiDesc.trim()) return;
    const resp = await generate(`Write a regex pattern that matches: "${aiDesc}"\n\nProvide:\n1. The pattern (just the pattern, no delimiters)\n2. Recommended flags\n3. Brief explanation\n\nFormat:\nPattern: [pattern here]\nFlags: [flags]\nExplanation: [brief explanation]`);
    setAiExplanation(resp);
    // Try to extract pattern from response
    const patternMatch = resp.match(/Pattern:\s*(.+)/);
    const flagsMatch = resp.match(/Flags:\s*([gimsuy]*)/);
    if (patternMatch) {
      setPattern(patternMatch[1].trim().replace(/^\/|\/[gimsuy]*$/g, ''));
      setTab('tester');
    }
    if (flagsMatch && flagsMatch[1]) {
      setFlags(flagsMatch[1].split('').filter(f => ALL_FLAGS.includes(f)));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#e4e4e7]">🔤 Regex Tester</h1>
        <div className="flex gap-2">
          {['tester', 'library', 'saved'].map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-lg text-sm ${tab === t ? 'bg-amber-500 text-black font-semibold' : 'bg-[#27272a] text-[#a1a1aa]'}`}>
              {t === 'tester' ? '🔧 Tester' : t === 'library' ? '📚 Library' : '💾 Saved'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'tester' && (
        <div className="space-y-5">
          {/* Pattern input */}
          <div className="bg-[#111113] border border-[#27272a] rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[#71717a] font-mono">/</span>
              <input value={pattern} onChange={e => setPattern(e.target.value)} placeholder="your regex pattern" className="flex-1 bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-[#e4e4e7] text-sm font-mono outline-none focus:border-amber-500" />
              <span className="text-[#71717a] font-mono">/{flagStr}</span>
            </div>
            {regexError && <p className="text-red-400 text-xs">{regexError}</p>}

            {/* Flags */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#71717a]">Flags:</span>
              {ALL_FLAGS.map(f => (
                <button key={f} onClick={() => toggleFlag(f)} className={`px-2 py-0.5 rounded text-xs font-mono border ${flags.includes(f) ? 'bg-amber-500/10 border-amber-500 text-amber-400' : 'border-[#27272a] text-[#71717a]'}`}>{f}</button>
              ))}
            </div>
          </div>

          {/* Test string */}
          <div className="bg-[#111113] border border-[#27272a] rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-[#a1a1aa]">Test String</h3>
            <textarea value={testStr} onChange={e => setTestStr(e.target.value)} placeholder="Paste your test text here..." rows={5} className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-[#e4e4e7] text-sm font-mono outline-none focus:border-amber-500 resize-none" />

            {/* Highlighted result */}
            {testStr && pattern && !regexError && (
              <div className="bg-[#18181b] rounded-lg px-3 py-2 text-sm font-mono leading-relaxed whitespace-pre-wrap break-all">
                {segments.map((seg, i) => (
                  seg.highlight
                    ? <mark key={i} className="bg-amber-500/30 text-amber-300 rounded">{seg.text}</mark>
                    : <span key={i} className="text-[#a1a1aa]">{seg.text}</span>
                ))}
              </div>
            )}
          </div>

          {/* Matches */}
          {matches.length > 0 && (
            <div className="bg-[#111113] border border-[#27272a] rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-[#a1a1aa]">{matches.length} Match{matches.length !== 1 ? 'es' : ''}</h3>
              <div className="space-y-2">
                {matches.map((m, i) => (
                  <div key={i} className="bg-[#18181b] rounded-lg p-2 text-xs font-mono">
                    <div className="flex gap-4">
                      <span className="text-[#52525b]">#{i + 1}</span>
                      <span className="text-amber-400">"{m.match}"</span>
                      <span className="text-[#71717a]">at {m.index}</span>
                    </div>
                    {m.groups.filter(Boolean).length > 0 && (
                      <div className="mt-1 ml-6 text-[#71717a]">
                        Groups: {m.groups.map((g, gi) => <span key={gi} className="text-blue-400 mr-2">${gi + 1}="{g}"</span>)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {pattern && testStr && matches.length === 0 && !regexError && (
            <div className="text-center py-4 text-[#71717a] text-sm">No matches found</div>
          )}

          {/* Save */}
          <div className="flex gap-2">
            <button onClick={() => setShowSave(!showSave)} className="px-3 py-1.5 bg-[#27272a] text-[#a1a1aa] rounded-lg text-sm hover:bg-[#3f3f46]">💾 Save</button>
            {showSave && (
              <>
                <input value={saveName} onChange={e => setSaveName(e.target.value)} placeholder="Pattern name" className="flex-1 bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-1.5 text-[#e4e4e7] text-sm outline-none focus:border-amber-500" />
                <button onClick={savePattern} className="px-3 py-1.5 bg-amber-500 text-black rounded-lg text-sm font-semibold">Save</button>
              </>
            )}
          </div>

          {/* AI panel */}
          <div className="bg-[#111113] border border-[#27272a] rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-[#a1a1aa]">✨ AI Tools</h3>
            <div className="flex gap-2 flex-wrap">
              <button onClick={explainRegex} disabled={!pattern || loading} className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-500 disabled:opacity-50">Explain this regex</button>
            </div>
            <div className="flex gap-2">
              <input value={aiDesc} onChange={e => setAiDesc(e.target.value)} placeholder="Describe what you want to match..." className="flex-1 bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-[#e4e4e7] text-sm outline-none focus:border-amber-500" />
              <button onClick={generateRegex} disabled={!aiDesc.trim() || loading} className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-500 disabled:opacity-50">Write regex</button>
            </div>
            {loading && <p className="text-sm text-[#71717a]">Thinking...</p>}
            {error && <p className="text-red-400 text-sm">{error}</p>}
            {aiExplanation && <pre className="text-sm text-[#a1a1aa] bg-[#18181b] rounded-lg p-3 whitespace-pre-wrap">{aiExplanation}</pre>}
          </div>
        </div>
      )}

      {tab === 'library' && (
        <div className="space-y-3">
          <p className="text-sm text-[#71717a]">Click a pattern to load it in the tester.</p>
          {COMMON_PATTERNS.map(p => (
            <div key={p.name} className="bg-[#111113] border border-[#27272a] rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:border-[#3f3f46]" onClick={() => loadPattern(p)}>
              <div className="flex-1">
                <div className="font-semibold text-[#e4e4e7] text-sm">{p.name}</div>
                <div className="text-xs text-[#71717a] font-mono mt-1">/{p.pattern}/{p.flags}</div>
              </div>
              <span className="text-xs text-amber-400">Load →</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'saved' && (
        <div className="space-y-3">
          {saved.length === 0 ? (
            <div className="text-center py-16 text-[#52525b]">No saved patterns yet.</div>
          ) : (
            saved.map(p => (
              <div key={p.id} className="bg-[#111113] border border-[#27272a] rounded-xl p-4 flex items-center gap-4">
                <div className="flex-1 cursor-pointer" onClick={() => loadPattern(p)}>
                  <div className="font-semibold text-[#e4e4e7] text-sm">{p.name}</div>
                  <div className="text-xs text-[#71717a] font-mono mt-1">/{p.pattern}/{p.flags}</div>
                </div>
                <button onClick={() => setSaved(prev => prev.filter(x => x.id !== p.id))} className="text-[#52525b] hover:text-red-400">✕</button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
