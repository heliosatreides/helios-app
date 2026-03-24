export function ChatMessage({ message }) {
  const isYou = message.from === 'you';
  const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`flex ${isYou ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-[75%] ${isYou ? 'items-end' : 'items-start'} flex flex-col`}>
        <span className={`text-[10px] mb-1 ${isYou ? 'text-amber-400/70' : 'text-zinc-500'}`}>
          {isYou ? 'You' : 'Them'}
        </span>
        <div
          className={`px-4 py-2.5 rounded-2xl text-sm break-words ${
            isYou
              ? 'bg-amber-500 text-[#0a0a0b] rounded-br-sm'
              : 'bg-zinc-800 text-zinc-100 rounded-bl-sm'
          }`}
        >
          {message.text}
        </div>
        <span className="text-[10px] text-zinc-600 mt-1">{time}</span>
      </div>
    </div>
  );
}
