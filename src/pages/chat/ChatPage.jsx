import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { usePeer } from './usePeer';
import { ChatMessage } from './ChatMessage';

function CopyLinkBox({ link }) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select the text
    }
  }, [link]);

  return (
    <div className="w-full max-w-lg mx-auto mt-6">
      <p className="text-zinc-400 text-sm mb-2 text-center">Share this link to invite someone:</p>
      <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3">
        <span className="flex-1 text-zinc-200 text-sm font-mono break-all select-all">{link}</span>
        <button
          onClick={copy}
          className="shrink-0 px-3 py-1.5 rounded-lg bg-amber-500 text-[#0a0a0b] text-xs font-semibold hover:bg-amber-400 transition-colors"
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
}

function RelayPanel({ relayStatus, collapsed = false }) {
  const [open, setOpen] = useState(!collapsed);
  if (!relayStatus?.length) return null;
  const connectedCount = relayStatus.filter(r => r.connected).length;

  return (
    <div className="w-full max-w-lg mx-auto mt-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between text-xs text-zinc-500 hover:text-zinc-400 transition-colors px-1"
      >
        <span className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${connectedCount > 0 ? 'bg-emerald-400' : 'bg-red-500'}`} />
          {connectedCount}/{relayStatus.length} relays connected
        </span>
        <span>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="mt-2 bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 space-y-1.5">
          {relayStatus.map(r => (
            <div key={r.url} className="flex items-center gap-2 text-xs">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${r.connected ? 'bg-emerald-400' : r.state === 0 ? 'bg-amber-400 animate-pulse' : 'bg-zinc-600'}`} />
              <span className={`font-mono truncate ${r.connected ? 'text-zinc-300' : 'text-zinc-600'}`}>
                {r.url.replace('wss://', '')}
              </span>
              <span className={`ml-auto shrink-0 ${r.connected ? 'text-emerald-400' : r.state === 0 ? 'text-amber-400' : 'text-zinc-600'}`}>
                {r.connected ? 'connected' : r.state === 0 ? 'connecting…' : 'offline'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ChatInput({ onSend }) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  const handleSend = useCallback(() => {
    if (!text.trim()) return;
    onSend(text);
    setText('');
    textareaRef.current?.focus();
  }, [text, onSend]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  return (
    <div className="border-t border-zinc-800 p-3 flex gap-2 items-end bg-[#0a0a0b]">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message… (Enter to send)"
        rows={1}
        className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 resize-none focus:outline-none focus:border-amber-500/50 transition-colors"
        style={{ minHeight: '44px', maxHeight: '120px' }}
      />
      <button
        onClick={handleSend}
        disabled={!text.trim()}
        className="shrink-0 px-4 py-2.5 rounded-xl bg-amber-500 text-[#0a0a0b] text-sm font-semibold hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Send
      </button>
    </div>
  );
}

export function ChatPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const roomId = searchParams.get('room');
  const isGuest = Boolean(roomId);

  const { peerId, messages, sendMessage, status, peerCount, relayStatus } = usePeer({ isGuest, roomId });

  const messagesEndRef = useRef(null);
  useEffect(() => {
    if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const chatLink = peerId ? `${window.location.origin}/chat?room=${peerId}` : null;

  const handleNewChat = useCallback(() => {
    navigate('/chat');
  }, [navigate]);

  // ---- render states ----

  if (status === 'initializing') {
    return (
      <FullScreenDark>
        <Spinner />
        <p className="mt-4 text-zinc-400 text-sm">Setting up secure connection…</p>
        <p className="mt-2 text-zinc-600 text-xs">This usually takes 2-3 seconds</p>
      </FullScreenDark>
    );
  }

  if (status === 'error' && isGuest) {
    return (
      <FullScreenDark>
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 max-w-sm w-full text-center">
          <p className="text-red-400 text-lg font-semibold mb-2">Room is full or host has left</p>
          <p className="text-zinc-500 text-sm mb-6">The chat room you tried to join is unavailable.</p>
          <button
            onClick={handleNewChat}
            className="px-6 py-2.5 rounded-xl bg-amber-500 text-[#0a0a0b] font-semibold hover:bg-amber-400 transition-colors"
          >
            Start New Chat
          </button>
        </div>
      </FullScreenDark>
    );
  }

  if (status === 'error') {
    return (
      <FullScreenDark>
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 max-w-sm w-full text-center">
          <p className="text-red-400 text-lg font-semibold mb-2">Could not connect</p>
          <p className="text-zinc-400 text-sm mb-6">
            {isGuest
              ? 'The room is unavailable or the host has left.'
              : 'Could not reach the signaling server. Check your connection and try again.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 rounded-xl bg-amber-500 text-[#0a0a0b] font-semibold hover:bg-amber-400 transition-colors"
          >
            Try Again
          </button>
        </div>
      </FullScreenDark>
    );
  }

  // If waiting but we already have messages, show the chat UI with a reconnecting banner
  // This handles the case where one side refreshes — room stays open, banner shows until they rejoin
  if (status === 'waiting' && messages.length === 0) {
    return (
      <FullScreenDark>
        <Spinner />
        {isGuest ? (
          <>
            <p className="mt-4 text-zinc-300 text-lg font-semibold">Joining chat room…</p>
            <p className="mt-2 text-zinc-500 text-sm">Waiting for the host to be present</p>
          </>
        ) : (
          <>
            <p className="mt-4 text-zinc-300 text-lg font-semibold">Waiting for someone to join…</p>
            {chatLink && <CopyLinkBox link={chatLink} />}
            <RelayPanel relayStatus={relayStatus} />
          </>
        )}
      </FullScreenDark>
    );
  }

  // connected, or waiting-with-history (reconnecting) — show chat UI
  return (
    <div className="fixed inset-0 flex flex-col bg-[#0a0a0b] z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-[#111113] shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" aria-label="Connected" />
          <span className="text-zinc-200 text-sm font-semibold">P2P Chat</span>
          {relayStatus.length > 0 && (
            <span className="text-xs text-zinc-500 ml-1">
              {relayStatus.filter(r => r.connected).length}/{relayStatus.length} relays
            </span>
          )}
        </div>
        <button
          onClick={handleNewChat}
          className="text-zinc-500 hover:text-red-400 text-xs transition-colors"
        >
          Leave
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-zinc-600 text-sm">Send the first message!</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <ChatMessage key={i} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Reconnecting banner — non-blocking, preserves message history */}
      {status === 'waiting' && messages.length > 0 && (
        <div className="absolute top-[53px] inset-x-0 z-10 flex items-center justify-center px-4 py-2 bg-zinc-900/95 border-b border-zinc-800">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse mr-2 shrink-0" />
          <span className="text-zinc-400 text-xs">Other person disconnected — waiting for them to rejoin…</span>
        </div>
      )}

      {/* Input */}
      <div className="shrink-0">
        <ChatInput onSend={sendMessage} />
      </div>
    </div>
  );
}

function FullScreenDark({ children }) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#0a0a0b] px-6 z-50">
      {children}
    </div>
  );
}
