/**
 * Reusable AI suggestion card.
 * Shows a loading spinner while generating, then renders the text result
 * in a styled card with dismiss option.
 */
export function AiSuggestion({ loading, result, error, onDismiss, title = 'AI Suggestion' }) {
  if (!loading && !result && !error) return null;

  return (
    <div className="mt-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 animate-fadeIn">
      {loading && (
        <div className="flex items-center gap-2.5 text-amber-400 text-sm">
          <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <span>Thinking…</span>
        </div>
      )}
      {error && !loading && (
        <div className="flex items-center gap-2 text-red-400 text-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          {error}
        </div>
      )}
      {result && !loading && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-amber-400 text-xs font-semibold">✨ {title}</span>
            {onDismiss && (
              <button onClick={onDismiss} className="text-[#3f3f46] hover:text-[#71717a] text-xs transition-colors">
                Dismiss
              </button>
            )}
          </div>
          <div className="text-[#a1a1aa] text-sm whitespace-pre-wrap leading-relaxed">
            {result}
          </div>
        </div>
      )}
    </div>
  );
}
