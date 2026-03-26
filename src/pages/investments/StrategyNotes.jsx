import { useIDB } from '../../hooks/useIDB';

export function StrategyNotes() {
  const [notes, setNotes] = useIDB('investments-strategy-notes', '');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-foreground font-semibold">Strategy Notes</h3>
          <p className="text-muted-foreground text-xs mt-0.5">Auto-saved to your browser</p>
        </div>
        {notes.length > 0 && (
          <span className="text-muted-foreground/80 text-xs">{notes.length} chars</span>
        )}
      </div>
      <textarea
        className="w-full bg-background border border-border p-5 text-foreground text-sm leading-relaxed placeholder-[#3f3f46] focus:outline-none focus:ring-1 focus:ring-ring resize-none transition-colors"
        style={{ minHeight: '420px' }}
        placeholder="Document your investment thesis, rules, and strategy here..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        spellCheck={false}
      />
      <p className="text-muted-foreground/60 text-xs">
        Tip: Use plain text, dashes for lists, and ALL CAPS for headers. Changes save instantly.
      </p>
    </div>
  );
}
