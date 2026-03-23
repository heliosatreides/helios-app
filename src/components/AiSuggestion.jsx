/**
 * Reusable AI suggestion card.
 * Shows a loading spinner while generating, then renders the text result
 * in an amber-bordered card.
 */
export function AiSuggestion({ loading, result, error }) {
  if (!loading && !result && !error) return null;

  return (
    <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-1">
      {loading && (
        <div className="flex items-center gap-2 text-amber-400 text-sm">
          <span className="animate-spin inline-block">⏳</span>
          <span>Generating suggestions…</span>
        </div>
      )}
      {error && !loading && (
        <p className="text-red-400 text-sm">❌ {error}</p>
      )}
      {result && !loading && (
        <div className="text-[#e4e4e7] text-sm whitespace-pre-wrap leading-relaxed">
          <span className="text-amber-400 mr-1">✨</span>
          {result}
        </div>
      )}
    </div>
  );
}
