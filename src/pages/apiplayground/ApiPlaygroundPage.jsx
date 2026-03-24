import { useState } from 'react';
import { useIDB } from '../../hooks/useIDB';
import { useGemini } from '../../hooks/useGemini';

const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
const METHOD_COLORS = { GET: 'text-green-400', POST: 'text-blue-400', PUT: 'text-yellow-400', DELETE: 'text-red-400', PATCH: 'text-orange-400' };

function tryFormatJSON(str) {
  try { return JSON.stringify(JSON.parse(str), null, 2); } catch { return str; }
}

export function ApiPlaygroundPage() {
  const [history, setHistory] = useIDB('api-requests', []);
  const [favorites, setFavorites] = useIDB('api-favorites', []);
  const { generate, loading: aiLoading, error: aiError } = useGemini();

  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('');
  const [headers, setHeaders] = useState([{ key: '', value: '' }]);
  const [body, setBody] = useState('');
  const [response, setResponse] = useState(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [tab, setTab] = useState('request'); // 'request' | 'history' | 'favorites'
  const [aiExplanation, setAiExplanation] = useState('');
  const [aiBody, setAiBody] = useState('');
  const [aiBodyDesc, setAiBodyDesc] = useState('');
  const [favName, setFavName] = useState('');
  const [showSaveFav, setShowSaveFav] = useState(false);

  async function sendRequest() {
    if (!url.trim()) return;
    setSending(true);
    setSendError('');
    setResponse(null);
    setAiExplanation('');

    const start = Date.now();
    const hdrs = {};
    for (const h of headers) {
      if (h.key.trim()) hdrs[h.key.trim()] = h.value;
    }

    try {
      const opts = { method, headers: hdrs };
      if (['POST', 'PUT', 'PATCH'].includes(method) && body.trim()) {
        opts.body = body;
        if (!hdrs['Content-Type']) hdrs['Content-Type'] = 'application/json';
      }
      const res = await fetch(url.trim(), opts);
      const elapsed = Date.now() - start;
      const text = await res.text();
      const resHeaders = {};
      res.headers.forEach((v, k) => { resHeaders[k] = v; });

      const entry = {
        id: Date.now().toString(),
        method, url: url.trim(), headers: hdrs, body,
        status: res.status, responseTime: elapsed,
        responseHeaders: resHeaders, responseBody: text,
        timestamp: new Date().toISOString(),
      };
      setResponse(entry);
      setHistory(prev => [entry, ...prev].slice(0, 10));
    } catch (err) {
      setSendError(err.message);
    } finally {
      setSending(false);
    }
  }

  function loadFromHistory(entry) {
    setMethod(entry.method);
    setUrl(entry.url);
    const hArr = Object.entries(entry.headers || {}).map(([key, value]) => ({ key, value }));
    setHeaders(hArr.length ? hArr : [{ key: '', value: '' }]);
    setBody(entry.body || '');
    setTab('request');
  }

  function saveFavorite() {
    if (!favName.trim() || !url.trim()) return;
    setFavorites(prev => [...prev, {
      id: Date.now().toString(), name: favName.trim(), method, url, headers: Object.fromEntries(headers.filter(h => h.key).map(h => [h.key, h.value])), body,
    }]);
    setFavName(''); setShowSaveFav(false);
  }

  async function explainResponse() {
    if (!response) return;
    const resp = await generate(`Explain this API response in plain English. Be concise (3-5 sentences):\n\nStatus: ${response.status}\nURL: ${response.url}\nBody: ${response.responseBody?.slice(0, 2000)}`);
    setAiExplanation(resp);
  }

  async function generateBody() {
    if (!url.trim()) return;
    const resp = await generate(`Generate a sample JSON request body for this API endpoint:\nURL: ${url}\nMethod: ${method}\nDescription: ${aiBodyDesc || 'standard REST API endpoint'}\n\nReturn only the JSON body, no explanation.`);
    setAiBody(resp);
    setBody(tryFormatJSON(resp));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#e4e4e7]">🔌 API Playground</h1>
        <div className="flex gap-2">
          {['request', 'history', 'favorites'].map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-lg text-sm ${tab === t ? 'bg-amber-500 text-black font-semibold' : 'bg-[#27272a] text-[#a1a1aa]'}`}>
              {t === 'request' ? '🔧 Request' : t === 'history' ? '🕐 History' : '⭐ Saved'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'request' && (
        <div className="space-y-4">
          {/* URL bar */}
          <div className="flex gap-2">
            <select value={method} onChange={e => setMethod(e.target.value)} className={`bg-[#18181b] border border-[#1c1c20] rounded-lg px-3 py-2 text-sm font-bold outline-none focus:border-amber-500 ${METHOD_COLORS[method]}`}>
              {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <input value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendRequest()} placeholder="https://api.example.com/endpoint" className="flex-1 bg-[#18181b] border border-[#1c1c20] rounded-lg px-3 py-2 text-[#e4e4e7] text-sm outline-none focus:border-amber-500" />
            <button onClick={sendRequest} disabled={sending || !url} className="px-4 py-2 bg-amber-500 text-black rounded-lg font-semibold text-sm hover:bg-amber-400 disabled:opacity-50">
              {sending ? '⏳' : 'Send'}
            </button>
          </div>

          {/* Headers */}
          <div className="bg-[#0c0c0e] border border-[#1c1c20] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#a1a1aa]">Headers</h3>
              <button onClick={() => setHeaders(h => [...h, { key: '', value: '' }])} className="text-xs text-amber-400 hover:text-amber-300">+ Add</button>
            </div>
            {headers.map((h, i) => (
              <div key={i} className="flex gap-2">
                <input value={h.key} onChange={e => setHeaders(hs => hs.map((x, j) => j === i ? { ...x, key: e.target.value } : x))} placeholder="Header name" className="flex-1 bg-[#18181b] border border-[#1c1c20] rounded-lg px-3 py-1.5 text-[#e4e4e7] text-sm outline-none focus:border-amber-500" />
                <input value={h.value} onChange={e => setHeaders(hs => hs.map((x, j) => j === i ? { ...x, value: e.target.value } : x))} placeholder="Value" className="flex-1 bg-[#18181b] border border-[#1c1c20] rounded-lg px-3 py-1.5 text-[#e4e4e7] text-sm outline-none focus:border-amber-500" />
                <button onClick={() => setHeaders(hs => hs.filter((_, j) => j !== i))} className="text-[#52525b] hover:text-red-400 px-2">✕</button>
              </div>
            ))}
          </div>

          {/* Body */}
          {['POST', 'PUT', 'PATCH'].includes(method) && (
            <div className="bg-[#0c0c0e] border border-[#1c1c20] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#a1a1aa]">Request Body (JSON)</h3>
                <div className="flex gap-2 items-center">
                  <input value={aiBodyDesc} onChange={e => setAiBodyDesc(e.target.value)} placeholder="Describe the endpoint..." className="bg-[#18181b] border border-[#1c1c20] rounded-lg px-2 py-1 text-[#e4e4e7] text-xs outline-none focus:border-amber-500 w-48" />
                  <button onClick={generateBody} disabled={aiLoading} className="text-xs text-purple-400 hover:text-purple-300 disabled:opacity-50">✨ Generate</button>
                </div>
              </div>
              <textarea value={body} onChange={e => setBody(e.target.value)} rows={6} placeholder='{"key": "value"}' className="w-full bg-[#18181b] border border-[#1c1c20] rounded-lg px-3 py-2 text-[#e4e4e7] text-sm outline-none focus:border-amber-500 font-mono resize-none" />
            </div>
          )}

          {/* Save as favorite */}
          <div className="flex gap-2">
            <button onClick={() => setShowSaveFav(!showSaveFav)} className="px-3 py-1.5 bg-[#27272a] text-[#a1a1aa] rounded-lg text-sm hover:bg-[#3f3f46]">⭐ Save</button>
            {showSaveFav && (
              <>
                <input value={favName} onChange={e => setFavName(e.target.value)} placeholder="Request name" className="flex-1 bg-[#18181b] border border-[#1c1c20] rounded-lg px-3 py-1.5 text-[#e4e4e7] text-sm outline-none focus:border-amber-500" />
                <button onClick={saveFavorite} className="px-3 py-1.5 bg-amber-500 text-black rounded-lg text-sm font-semibold">Save</button>
              </>
            )}
          </div>

          {sendError && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">{sendError}</div>}

          {/* Response */}
          {response && (
            <div className="bg-[#0c0c0e] border border-[#1c1c20] rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-4">
                <span className={`font-bold text-sm ${response.status < 300 ? 'text-green-400' : response.status < 400 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {response.status}
                </span>
                <span className="text-xs text-[#71717a]">{response.responseTime}ms</span>
                <button onClick={explainResponse} disabled={aiLoading} className="ml-auto text-xs text-purple-400 hover:text-purple-300 disabled:opacity-50">✨ Explain</button>
              </div>
              {aiExplanation && <p className="text-sm text-[#a1a1aa] bg-[#18181b] rounded-lg p-3 leading-relaxed">{aiExplanation}</p>}
              <div className="text-xs text-[#52525b] space-y-1">
                {Object.entries(response.responseHeaders || {}).slice(0, 5).map(([k, v]) => (
                  <div key={k}><span className="text-[#71717a]">{k}:</span> {v}</div>
                ))}
              </div>
              <pre className="bg-[#18181b] rounded-lg p-3 text-xs text-[#a1a1aa] overflow-auto max-h-80 font-mono">
                {tryFormatJSON(response.responseBody)}
              </pre>
            </div>
          )}

          {aiError && <p className="text-red-400 text-sm">{aiError}</p>}
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-3">
          {history.length === 0 ? (
            <div className="text-center py-16 text-[#52525b]">No requests yet. Send one to see history.</div>
          ) : (
            history.map(entry => (
              <div key={entry.id} className="bg-[#0c0c0e] border border-[#1c1c20] rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:border-[#3f3f46]" onClick={() => loadFromHistory(entry)}>
                <span className={`font-bold text-sm w-16 ${METHOD_COLORS[entry.method]}`}>{entry.method}</span>
                <span className="text-sm text-[#e4e4e7] flex-1 truncate">{entry.url}</span>
                <span className={`text-sm font-semibold ${entry.status < 300 ? 'text-green-400' : 'text-red-400'}`}>{entry.status}</span>
                <span className="text-xs text-[#52525b]">{entry.responseTime}ms</span>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'favorites' && (
        <div className="space-y-3">
          {favorites.length === 0 ? (
            <div className="text-center py-16 text-[#52525b]">No saved requests. Save a request to reuse it.</div>
          ) : (
            favorites.map(fav => (
              <div key={fav.id} className="bg-[#0c0c0e] border border-[#1c1c20] rounded-xl p-4 flex items-center gap-4">
                <span className={`font-bold text-sm w-16 ${METHOD_COLORS[fav.method]}`}>{fav.method}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[#e4e4e7] text-sm">{fav.name}</div>
                  <div className="text-xs text-[#71717a] truncate">{fav.url}</div>
                </div>
                <button onClick={() => loadFromHistory(fav)} className="px-3 py-1.5 bg-[#27272a] text-[#a1a1aa] rounded-lg text-sm hover:bg-[#3f3f46]">Load</button>
                <button onClick={() => setFavorites(f => f.filter(x => x.id !== fav.id))} className="text-[#52525b] hover:text-red-400">✕</button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
