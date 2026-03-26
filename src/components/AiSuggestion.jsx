function humanizeError(error) {
  if (!error) return error;
  const lower = error.toLowerCase();
  if (lower.includes('429') || lower.includes('rate') || lower.includes('quota')) {
    return 'AI is rate-limited. Try again in a moment.';
  }
  if (lower.includes('401') || lower.includes('403') || lower.includes('unauthorized') || lower.includes('forbidden')) {
    return 'API key is invalid or expired. Check your key in Settings.';
  }
  if (lower.includes('network') || lower.includes('fetch') || lower.includes('failed to fetch') || lower.includes('timeout') || lower.includes('econnrefused')) {
    return "Couldn't connect to AI. Check your connection and API key in Settings.";
  }
  if (lower.includes('api key') || lower.includes('apikey') || lower.includes('no key')) {
    return 'No API key configured. Add your Gemini key in Settings.';
  }
  return error;
}

export function AiSuggestion({ loading, result, error, onDismiss, title = 'AI Suggestion' }) {
  if (!loading && !result && !error) return null;
  return (
    <div className="mt-3 border border-border bg-secondary/30 p-4 animate-fadeIn" data-testid="ai-suggestion">
      {loading && (
        <div className="space-y-2" data-testid="ai-suggestion-skeleton">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <div className="w-3.5 h-3.5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
            <span>Thinking...</span>
          </div>
          <div className="h-3 w-3/4 bg-secondary animate-pulse" />
          <div className="h-3 w-1/2 bg-secondary animate-pulse" />
        </div>
      )}
      {error && !loading && (
        <p className="text-red-400 text-sm" data-testid="ai-suggestion-error">{humanizeError(error)}</p>
      )}
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

export { humanizeError };
