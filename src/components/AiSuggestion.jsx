export function AiSuggestion({ loading, result, error, onDismiss, title = 'AI Suggestion' }) {
  if (!loading && !result && !error) return null;
  return (
    <div className="mt-3 border border-border bg-secondary/30 p-4 animate-fadeIn">
      {loading && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <div className="w-3.5 h-3.5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
          <span>Thinking...</span>
        </div>
      )}
      {error && !loading && <p className="text-red-400 text-sm">{error}</p>}
      {result && !loading && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-foreground">{title}</span>
            {onDismiss && <button onClick={onDismiss} className="text-muted-foreground hover:text-foreground text-xs transition-colors">Dismiss</button>}
          </div>
          <div className="text-muted-foreground text-sm whitespace-pre-wrap leading-relaxed">{result}</div>
        </div>
      )}
    </div>
  );
}
