export function ChatMessage({ message, prevMessage }) {
  const isYou = message.from === 'you';
  const prevIsYou = prevMessage?.from === 'you';
  // Show sender label only at the start of a streak
  const showLabel = !prevMessage || prevIsYou !== isYou;
  const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div
      className={`flex ${isYou ? 'justify-end' : 'justify-start'} ${showLabel ? 'mt-4' : 'mt-1'} animate-fadeIn`}
    >
      <div className={`max-w-[75%] flex flex-col ${isYou ? 'items-end' : 'items-start'}`}>
        {showLabel && (
          <span className={`text-[10px] mb-1 px-1 ${isYou ? 'text-amber-400/60' : 'text-zinc-600'}`}>
            {isYou ? 'You' : 'Them'}
          </span>
        )}
        <div
          className={`px-4 py-2.5 text-sm break-words leading-relaxed ${
            isYou
              ? 'bg-amber-500 text-[#0a0a0b] rounded-2xl rounded-br-sm font-medium'
              : 'bg-zinc-800/90 text-zinc-100 rounded-2xl rounded-bl-sm border border-zinc-700/50'
          }`}
        >
          {message.text}
        </div>
        <span className="text-[10px] text-zinc-700 mt-1 px-1">{time}</span>
      </div>
    </div>
  );
}
