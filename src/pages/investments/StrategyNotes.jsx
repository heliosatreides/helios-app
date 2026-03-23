import { useIDB } from '../../hooks/useIDB';

export function StrategyNotes() {
  const [notes, setNotes] = useIDB('investments-strategy-notes', '');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[#e4e4e7] font-semibold">Strategy Notes</h3>
          <p className="text-[#71717a] text-xs mt-0.5">Auto-saved to your browser</p>
        </div>
        {notes.length > 0 && (
          <span className="text-[#52525b] text-xs">{notes.length} chars</span>
        )}
      </div>
      <textarea
        className="w-full bg-[#111113] border border-[#27272a] rounded-xl p-5 text-[#e4e4e7] text-sm leading-relaxed placeholder-[#3f3f46] focus:outline-none focus:border-[#f59e0b] resize-none transition-colors"
        style={{ minHeight: '420px' }}
        placeholder="Document your investment thesis, rules, and strategy here..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        spellCheck={false}
      />
      <p className="text-[#3f3f46] text-xs">
        Tip: Use plain text, dashes for lists, and ALL CAPS for headers. Changes save instantly.
      </p>
    </div>
  );
}
