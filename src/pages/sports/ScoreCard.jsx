import { useState } from 'react';
import { useGemini } from '../../hooks/useGemini';

/**
 * ScoreCard — renders a single game matchup card.
 */
export function ScoreCard({ game }) {
  const { awayTeam, homeTeam, status, date } = game;
  const isLive = status === 'In Progress';
  const isFinal = status === 'Final';
  const isScheduled = !isLive && !isFinal;
  const { generate, loading: aiLoading, hasKey } = useGemini();
  const [preview, setPreview] = useState(null);
  const [previewError, setPreviewError] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleGamePreview = async () => {
    setPreviewError(null);
    setShowPreview(true);
    if (preview) return; // already fetched
    const sport = game.sport || game.league || 'sports';
    const dateStr = date ? new Date(date).toLocaleDateString() : 'today';
    try {
      const text = await generate(
        `Give me a brief 2-3 sentence preview for the ${sport} game: ${awayTeam.displayName} at ${homeTeam.displayName} on ${dateStr}. Include current season context and a prediction.`
      );
      setPreview(text);
    } catch (err) {
      setPreviewError(err.message);
    }
  };

  const formatTime = (iso) => {
    try {
      return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="bg-background border border-border p-4 flex flex-col gap-2">
      {/* Game name */}
      {game.name && (
        <p className="text-xs text-muted-foreground truncate">{game.name}</p>
      )}
      {/* Status row */}
      <div className="flex items-center justify-between mb-1">
        {isLive ? (
          <span className="flex items-center gap-1.5 text-xs font-bold text-[#22c55e]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22c55e]" />
            </span>
            LIVE
          </span>
        ) : isFinal ? (
          <span className="text-xs font-medium text-muted-foreground">Final</span>
        ) : (
          <span className="text-xs font-medium text-muted-foreground">{formatTime(date)}</span>
        )}
      </div>

      {/* Away team */}
      <div className="flex items-center gap-3">
        {awayTeam.logo ? (
          <img src={awayTeam.logo} alt={awayTeam.displayName} className="w-8 h-8 object-contain" />
        ) : (
          <div className="w-8 h-8 bg-secondary rounded-full" />
        )}
        <span className="flex-1 text-sm text-foreground font-medium">{awayTeam.displayName}</span>
        {!isScheduled && (
          <span className="text-lg font-bold text-foreground">{awayTeam.score}</span>
        )}
      </div>

      {/* Home team */}
      <div className="flex items-center gap-3">
        {homeTeam.logo ? (
          <img src={homeTeam.logo} alt={homeTeam.displayName} className="w-8 h-8 object-contain" />
        ) : (
          <div className="w-8 h-8 bg-secondary rounded-full" />
        )}
        <span className="flex-1 text-sm text-foreground font-medium">{homeTeam.displayName}</span>
        {!isScheduled && (
          <span className="text-lg font-bold text-foreground">{homeTeam.score}</span>
        )}
      </div>

      {/* AI Game Preview — only for scheduled games when key is set */}
      {hasKey && isScheduled && (
        <div className="mt-2 pt-2 border-t border-border">
          <button
            type="button"
            onClick={handleGamePreview}
            disabled={aiLoading}
            className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
            data-testid="game-preview-btn"
          >
            {aiLoading && showPreview ? '⏳ Loading…' : '✨ Game Preview'}
          </button>
          {showPreview && (
            <div className="mt-2 border border-border bg-secondary/50 p-4" data-testid="game-preview-card">
              {aiLoading && <p className="text-amber-400 text-xs">Generating preview…</p>}
              {previewError && <p className="text-red-400 text-xs">❌ {previewError}</p>}
              {preview && !aiLoading && (
                <div>
                  <p className="text-foreground text-xs leading-relaxed">{preview}</p>
                  <button
                    type="button"
                    onClick={() => { setShowPreview(false); setPreview(null); }}
                    className="text-muted-foreground/80 hover:text-foreground text-xs mt-2"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
