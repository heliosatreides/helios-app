export function ChatMessage({ message, prevMessage }) {
  const isYou = message.from === 'you';
  const isAI = message.from === 'them' && message.text?.startsWith('🤖');
  const prevIsYou = prevMessage?.from === 'you';
  const showLabel = !prevMessage || prevIsYou !== isYou;
  const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div
      className={`flex ${isYou ? 'justify-end' : 'justify-start'} ${showLabel ? 'mt-4' : 'mt-1'} animate-fadeIn`}
    >
      <div className={`max-w-[75%] flex flex-col ${isYou ? 'items-end' : 'items-start'}`}>
        {showLabel && (
          <span className={`text-[10px] mb-1 px-1 font-medium ${
            isYou ? 'text-foreground/50' : isAI ? 'text-violet-400/50' : 'text-muted-foreground/60'
          }`}>
            {isYou ? 'You' : isAI ? 'AI' : 'Them'}
          </span>
        )}
        <div
          className={`px-4 py-2.5 text-sm break-words leading-relaxed ${
            isYou
              ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-[#0a0a0b] rounded-br-md font-medium shadow-lg shadow-amber-500/10'
              : isAI
                ? 'bg-violet-500/10 text-foreground rounded-bl-md border border-violet-500/20'
                : 'bg-secondary/80 text-foreground rounded-bl-md border border-border/30'
          }`}
        >
          {message.text}
        </div>
        <span className="text-[10px] text-muted-foreground/40 mt-1 px-1">{time}</span>
      </div>
    </div>
  );
}
