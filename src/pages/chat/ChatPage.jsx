import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { usePeer } from './usePeer';
import { ChatMessage } from './ChatMessage';

// ── helpers ──────────────────────────────────────────────────────────────────

function CopyButton({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async () => {
    try { await navigator.clipboard.writeText(text); } catch { /* ignore */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);
  return (
    <button
      onClick={copy}
      className="px-3 py-1.5 rounded-lg bg-amber-500 text-[#0a0a0b] text-xs font-semibold hover:bg-amber-400 active:scale-95 transition-all"
    >
      {copied ? '✓ Copied' : label}
    </button>
  );
}

function Spinner({ size = 8 }) {
  return (
    <div
      className={`w-${size} h-${size} border-2 border-amber-500 border-t-transparent rounded-full animate-spin`}
    />
  );
}

// ── PIN entry (guest) ─────────────────────────────────────────────────────────

function PinEntry({ onSubmit, rejected, submitting }) {
  const [digits, setDigits] = useState(['', '', '', '']);
  const refs = [useRef(), useRef(), useRef(), useRef()];

  // Reset digits when rejection arrives so user can re-enter
  useEffect(() => {
    if (rejected) {
      setDigits(['', '', '', '']);
      setTimeout(() => refs[0].current?.focus(), 50);
    }
  }, [rejected]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (i, val) => {
    const d = val.replace(/\D/, '').slice(-1);
    const next = [...digits];
    next[i] = d;
    setDigits(next);
    if (d && i < 3) refs[i + 1].current?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      refs[i - 1].current?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pasted.length === 4) {
      setDigits(pasted.split(''));
      refs[3].current?.focus();
    }
  };

  const submit = () => {
    const pin = digits.join('');
    if (pin.length === 4) onSubmit(pin);
  };

  const full = digits.every(Boolean);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#0a0a0b] px-6">
      <div className="w-full max-w-sm">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-3xl">
            🔐
          </div>
        </div>

        <h1 className="text-xl font-semibold text-zinc-100 text-center mb-1">Enter Access Code</h1>
        <p className="text-zinc-500 text-sm text-center mb-8">
          Ask the person who shared this link for their 4-digit code
        </p>

        {/* 4 digit boxes */}
        <div className="flex gap-3 justify-center mb-4" onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={refs[i]}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              autoFocus={i === 0}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              className={`w-14 h-16 text-center text-2xl font-bold rounded-xl border bg-zinc-900 text-zinc-100 focus:outline-none transition-colors
                ${rejected
                  ? 'border-red-500 text-red-400'
                  : d
                    ? 'border-amber-500 text-amber-400'
                    : 'border-zinc-700 focus:border-amber-500/70'
                }`}
            />
          ))}
        </div>

        {rejected && (
          <p className="text-red-400 text-sm text-center mb-4 animate-pulse">
            Incorrect code — try again
          </p>
        )}

        <button
          onClick={submit}
          disabled={!full || submitting}
          className="w-full py-3 rounded-xl bg-amber-500 text-[#0a0a0b] font-semibold text-sm hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all mt-2 flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-[#0a0a0b] border-t-transparent rounded-full animate-spin" />
              Verifying…
            </>
          ) : 'Join Chat'}
        </button>
      </div>
    </div>
  );
}

// ── waiting screen (host) ─────────────────────────────────────────────────────

function WaitingHost({ chatLink, pin, relayStatus }) {
  const connectedRelays = relayStatus.filter(r => r.connected).length;

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#0a0a0b] px-6">
      <div className="w-full max-w-sm space-y-4">
        {/* Pulse ring */}
        <div className="flex justify-center mb-2">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
            </div>
            <div className="absolute inset-0 rounded-full border border-amber-500/20 animate-ping" />
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-lg font-semibold text-zinc-100 mb-1">Waiting for someone to join</h2>
          <p className="text-zinc-500 text-sm">Share the link and code below</p>
        </div>

        {/* PIN card */}
        <div className="bg-zinc-900 border border-amber-500/30 rounded-2xl p-5">
          <p className="text-zinc-500 text-xs mb-2 uppercase tracking-widest">Your Access Code</p>
          <p className="text-5xl font-bold tracking-[0.2em] text-amber-400 mb-3">{pin}</p>
          <p className="text-zinc-600 text-xs">Share this verbally or in a separate message — not in this chat</p>
        </div>

        {/* Link */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <p className="text-zinc-500 text-xs mb-2 uppercase tracking-widest">Invite Link</p>
          <div className="flex items-center gap-2">
            <span className="flex-1 text-zinc-300 text-xs font-mono break-all truncate">{chatLink}</span>
            <CopyButton text={chatLink} />
          </div>
        </div>

        {/* Relay status pill */}
        <div className="flex justify-center">
          <div className="flex items-center gap-1.5 text-xs text-zinc-600 bg-zinc-900 border border-zinc-800 rounded-full px-3 py-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${connectedRelays > 0 ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
            {connectedRelays}/{relayStatus.length} relays connected
          </div>
        </div>
      </div>
    </div>
  );
}

// ── waiting screen (guest) ────────────────────────────────────────────────────

function WaitingGuest() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#0a0a0b] px-6">
      <Spinner size={8} />
      <p className="mt-5 text-zinc-200 font-semibold">Connecting…</p>
      <p className="mt-1 text-zinc-600 text-sm">Waiting for the host to be present</p>
    </div>
  );
}

// ── chat input ────────────────────────────────────────────────────────────────

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
    <div className="border-t border-zinc-800/80 px-3 py-3 flex gap-2 items-end bg-[#0c0c0e]">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Message…"
        rows={1}
        autoFocus
        className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 resize-none focus:outline-none focus:border-zinc-600 transition-colors"
        style={{ minHeight: '44px', maxHeight: '120px' }}
      />
      <button
        onClick={handleSend}
        disabled={!text.trim()}
        className="shrink-0 w-10 h-10 rounded-xl bg-amber-500 text-[#0a0a0b] flex items-center justify-center hover:bg-amber-400 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all"
        aria-label="Send"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
        </svg>
      </button>
    </div>
  );
}

// ── main ChatPage ─────────────────────────────────────────────────────────────

export function ChatPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const roomId = searchParams.get('room');
  const isGuest = Boolean(roomId);

  const {
    peerId,
    pin,
    messages,
    sendMessage,
    submitPin,
    pinStatus,
    status,
    reconnecting,
    peerCount,
    relayStatus,
    leave,
  } = usePeer({ isGuest, roomId });

  const messagesEndRef = useRef(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const chatLink = peerId ? `${window.location.origin}/chat?room=${peerId}` : null;

  const handleLeave = useCallback(() => {
    leave();
    navigate('/chat');
  }, [leave, navigate]);

  // ── states ────────────────────────────────────────────────────────────────

  if (status === 'initializing') {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#0a0a0b]">
        <Spinner size={8} />
        <p className="mt-4 text-zinc-400 text-sm">Setting up secure connection…</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#0a0a0b] px-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-sm w-full text-center">
          <p className="text-2xl mb-3">⚠️</p>
          <p className="text-zinc-100 font-semibold mb-2">
            {isGuest ? 'Room unavailable' : 'Could not connect'}
          </p>
          <p className="text-zinc-500 text-sm mb-6">
            {isGuest ? 'The host may have left or the link is invalid.' : 'Check your connection and try again.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 rounded-xl bg-amber-500 text-[#0a0a0b] font-semibold hover:bg-amber-400 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Guest: waiting for host to appear (no peer yet)
  if (isGuest && peerCount === 0 && pinStatus !== 'verified') {
    return <WaitingGuest />;
  }

  // Guest: host is present but PIN not verified — show entry (with error if rejected)
  if (isGuest && pinStatus !== 'verified') {
    return (
      <PinEntry
        onSubmit={submitPin}
        rejected={pinStatus === 'rejected'}
        submitting={pinStatus === 'submitting'}
      />
    );
  }

  // Host: waiting for guest, no messages yet
  if (!isGuest && status === 'waiting' && messages.length === 0) {
    return <WaitingHost chatLink={chatLink} pin={pin} relayStatus={relayStatus} />;
  }

  // ── chat UI (connected or reconnecting) ────────────────────────────────────

  const connectedRelays = relayStatus.filter(r => r.connected).length;

  return (
    <div className="fixed inset-0 flex flex-col bg-[#0a0a0b]">
      {/* Reconnecting banner */}
      {reconnecting && (
        <div className="absolute top-[53px] inset-x-0 z-20 flex items-center justify-center gap-2 px-4 py-2 bg-amber-950/80 border-b border-amber-800/50 backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-amber-300 text-xs">Waiting for them to reconnect…</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/80 bg-[#0c0c0e] shrink-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <span className={`block w-2.5 h-2.5 rounded-full ${peerCount > 0 ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
            {peerCount > 0 && (
              <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-40" />
            )}
          </div>
          <div>
            <span className="text-zinc-100 text-sm font-semibold">P2P Chat</span>
            <span className="text-zinc-600 text-xs ml-2">
              {peerCount > 0 ? '🔒 End-to-end encrypted' : 'waiting…'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-zinc-700 text-xs">{connectedRelays}/{relayStatus.length} relays</span>
          <button
            onClick={handleLeave}
            className="text-zinc-500 hover:text-red-400 text-xs font-medium transition-colors px-2 py-1 rounded-lg hover:bg-red-950/30"
          >
            Leave
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-zinc-700 text-sm">Connected — say hi!</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <ChatMessage
            key={i}
            message={msg}
            prevMessage={i > 0 ? messages[i - 1] : null}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0">
        <ChatInput onSend={sendMessage} />
      </div>
    </div>
  );
}
