import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { usePeer } from './usePeer';
import { ChatMessage } from './ChatMessage';
import { useAIControl } from './useAIControl';
import { useAuth } from '../../auth/AuthContext';

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
      className="px-3 py-1.5 bg-foreground text-background text-xs font-semibold hover:bg-foreground/90 active:scale-95 transition-all"
    >
      {copied ? '✓ Copied' : label}
    </button>
  );
}

function Spinner({ size = 8 }) {
  return (
    <div className={`w-${size} h-${size} border-2 border-foreground border-t-transparent rounded-full animate-spin`} />
  );
}

function DebugPanel({ log }) {
  if (!log?.length) return null;
  return (
    <div className="w-full max-w-sm mx-auto mt-4 bg-background border border-border p-3 max-h-48 overflow-y-auto">
      <p className="text-muted-foreground/60 text-[10px] uppercase tracking-wider mb-1">Debug Log</p>
      {log.map((line, i) => (
        <p key={i} className="text-muted-foreground text-[11px] font-mono leading-snug">{line}</p>
      ))}
    </div>
  );
}

function LoginModal({ onSuccess, onCancel }) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, pw);
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [login, username, pw, onSuccess]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm bg-background border border-border p-6 shadow-2xl">
        <h2 className="text-foreground font-semibold text-base mb-1">Log in to use AI Control</h2>
        <p className="text-muted-foreground text-sm mb-5">Enter your credentials to enable AI-powered commands.</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoFocus
            className="w-full bg-background border border-border px-4 py-2.5 text-sm text-foreground placeholder-zinc-600 focus:outline-none focus:border-border transition-colors"
          />
          <input
            type="password"
            placeholder="Password"
            value={pw}
            onChange={e => setPw(e.target.value)}
            className="w-full bg-background border border-border px-4 py-2.5 text-sm text-foreground placeholder-zinc-600 focus:outline-none focus:border-border transition-colors"
          />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 border border-border text-muted-foreground text-sm hover:text-foreground hover:border-border transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !username || !pw}
              className="flex-1 py-2.5 bg-foreground text-background text-sm font-semibold hover:bg-foreground/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Logging in…' : 'Log in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Chat Lobby ─────────────────────────────────────────────────── */

function ChatLobby({ onCreateRoom, onJoinRoom }) {
  const [roomCode, setRoomCode] = useState('');
  const [joinError, setJoinError] = useState('');

  const handleJoin = (e) => {
    e.preventDefault();
    const code = roomCode.trim().toLowerCase();
    if (!code) {
      setJoinError('Please enter a room code');
      return;
    }
    if (code.length < 4) {
      setJoinError('Room code is too short');
      return;
    }
    setJoinError('');
    onJoinRoom(code);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-lg font-semibold text-foreground mb-1">P2P Ephemeral Chat</h1>
          <p className="text-muted-foreground text-sm">End-to-end encrypted. No servers. Messages disappear when you leave.</p>
        </div>

        <button onClick={onCreateRoom}
          className="w-full px-6 py-3 bg-foreground text-background font-medium text-sm hover:bg-foreground/90 transition-colors">
          Create New Room
        </button>

        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-border" />
          <span className="text-muted-foreground/60 text-xs uppercase tracking-wider">or join</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={handleJoin} className="space-y-3">
          <input type="text" value={roomCode}
            onChange={(e) => { setRoomCode(e.target.value); setJoinError(''); }}
            placeholder="Room code or invite link"
            className="w-full bg-background border border-border px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
            autoFocus />
          {joinError && <p className="text-red-400 text-xs">{joinError}</p>}
          <button type="submit" disabled={!roomCode.trim()}
            className="w-full px-6 py-3 border border-border text-muted-foreground font-medium text-sm hover:text-foreground hover:bg-secondary/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            Join Room
          </button>
        </form>

        <p className="text-muted-foreground/40 text-xs text-center leading-relaxed">
          Messages are sent directly between browsers via WebRTC. Nothing is stored on any server.
        </p>
      </div>
    </div>
  );
}

/* ─── Waiting screens ────────────────────────────────────────────── */

function WaitingHost({ chatLink, debugLog, onBack }) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background px-6 overflow-y-auto py-8">
      <div className="w-full max-w-sm space-y-4">
        <div className="flex justify-center mb-2">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-foreground/10 border border-foreground/30 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-foreground" />
            </div>
            <div className="absolute inset-0 rounded-full border border-foreground/20 animate-ping" />
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-lg font-semibold text-foreground mb-1">Waiting for someone to join</h2>
          <p className="text-muted-foreground text-sm">Share the link or room code below</p>
        </div>

        <div className="bg-background border border-border p-4 space-y-3">
          <div>
            <p className="text-muted-foreground text-xs mb-2 uppercase tracking-widest">Invite Link</p>
            <div className="flex items-center gap-2">
              <span className="flex-1 text-muted-foreground text-xs font-mono break-all truncate">{chatLink}</span>
              <CopyButton text={chatLink} />
            </div>
          </div>
          {chatLink && (
            <div>
              <p className="text-muted-foreground text-xs mb-2 uppercase tracking-widest">Room Code</p>
              <div className="flex items-center gap-2">
                <span className="text-foreground text-sm font-mono tracking-wider">
                  {new URL(chatLink).searchParams.get('room') || ''}
                </span>
                <CopyButton
                  text={new URL(chatLink).searchParams.get('room') || ''}
                  label="Copy Code"
                />
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onBack}
          className="w-full py-2.5 border border-border text-muted-foreground text-sm hover:text-muted-foreground hover:border-border transition-colors"
        >
          ← Back to Lobby
        </button>

        <DebugPanel log={debugLog} />
      </div>
    </div>
  );
}

function WaitingGuest({ debugLog, onBack }) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background px-6">
      <Spinner size={8} />
      <p className="mt-5 text-foreground font-semibold">Connecting…</p>
      <p className="mt-1 text-muted-foreground/60 text-sm">Waiting for the host to be present</p>
      <button
        onClick={onBack}
        className="mt-6 py-2 px-4 border border-border text-muted-foreground text-sm hover:text-muted-foreground hover:border-border transition-colors"
      >
        ← Back
      </button>
      <DebugPanel log={debugLog} />
    </div>
  );
}

/* ─── Chat Input ─────────────────────────────────────────────────── */

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
    <div className="border-t border-border/80 px-3 py-3 flex gap-2 items-end bg-background">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message…"
        rows={1}
        autoFocus
        className="flex-1 bg-background border border-border px-4 py-2.5 text-sm text-foreground placeholder-zinc-600 resize-none focus:outline-none focus:border-border transition-colors"
        style={{ minHeight: '44px', maxHeight: '120px' }}
      />
      <button
        onClick={handleSend}
        disabled={!text.trim()}
        className="shrink-0 w-10 h-10 bg-foreground text-background flex items-center justify-center hover:bg-foreground/90 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all"
        aria-label="Send"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
        </svg>
      </button>
    </div>
  );
}

/* ─── AI Control Toggle ──────────────────────────────────────────── */

function AIControlToggle({ enabled, onToggle, processing, hasKey, onLoginRequired }) {
  const [showTooltip, setShowTooltip] = useState(false);

  const blocked = hasKey !== true;
  const tooltipMsg = hasKey === false ? 'Set Gemini key in Settings' : null;

  const handleClick = () => {
    if (hasKey === 'login-required') {
      onLoginRequired?.();
      return;
    }
    if (blocked) {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 3000);
      return;
    }
    onToggle(!enabled);
  };

  return (
    <div className="relative flex items-center gap-1.5">
      {processing && (
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
      )}
      <button
        onClick={handleClick}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
          enabled
            ? 'bg-violet-600/30 border border-violet-500/50 text-violet-300'
            : 'bg-secondary border border-border text-muted-foreground hover:text-muted-foreground'
        }`}
        title={tooltipMsg ?? 'Toggle AI Control Mode'}
      >
        <span>🤖</span>
        <span>{enabled ? 'AI On' : 'AI'}</span>
        <span className={`w-6 h-3 rounded-full relative transition-colors ${enabled ? 'bg-violet-500' : 'bg-zinc-600'}`}>
          <span className={`absolute top-0.5 w-2 h-2 rounded-full bg-white transition-all ${enabled ? 'left-3.5' : 'left-0.5'}`} />
        </span>
      </button>
      {showTooltip && tooltipMsg && (
        <div className="absolute right-0 top-full mt-1.5 w-48 bg-secondary border border-border px-3 py-2 text-xs text-muted-foreground shadow-xl z-50 pointer-events-none">
          {tooltipMsg}
        </div>
      )}
    </div>
  );
}

/* ─── Main ChatPage ──────────────────────────────────────────────── */

export function ChatPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const roomParam = searchParams.get('room');

  // State machine: 'lobby' | 'hosting' | 'joining'
  const [mode, setMode] = useState(() => roomParam ? 'joining' : 'lobby');
  const [joinRoomId, setJoinRoomId] = useState(roomParam || null);

  const isGuest = mode === 'joining';
  const activeRoomId = isGuest ? joinRoomId : null;

  const { peerId, messages, sendMessage, status, reconnecting, peerCount, leave, debugLog } =
    usePeer({ isGuest, roomId: activeRoomId, active: mode !== 'lobby' });

  const { aiEnabled, setAiEnabled, aiProcessing, hasKey } = useAIControl({
    messages,
    sendMessage,
    enabled: false,
  });

  const [showLoginModal, setShowLoginModal] = useState(false);

  const messagesEndRef = useRef(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const chatLink = peerId ? `${window.location.origin}/chat?room=${peerId}` : null;

  const handleCreateRoom = useCallback(() => {
    setMode('hosting');
  }, []);

  const handleJoinRoom = useCallback((code) => {
    // Support pasting full URLs
    let roomId = code;
    try {
      const url = new URL(code);
      const r = url.searchParams.get('room');
      if (r) roomId = r;
    } catch {
      // not a URL, use as-is
    }
    setJoinRoomId(roomId);
    setMode('joining');
    setSearchParams({ room: roomId });
  }, [setSearchParams]);

  const handleBack = useCallback(() => {
    leave();
    setMode('lobby');
    setJoinRoomId(null);
    setSearchParams({});
  }, [leave, setSearchParams]);

  const handleLeave = useCallback(() => {
    leave();
    setMode('lobby');
    setJoinRoomId(null);
    setSearchParams({});
  }, [leave, setSearchParams]);

  // Lobby screen
  if (mode === 'lobby') {
    return <ChatLobby onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} />;
  }

  if (status === 'initializing') {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background">
        <Spinner size={8} />
        <p className="mt-4 text-muted-foreground text-sm">Setting up secure connection…</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background px-6">
        <div className="bg-background border border-border p-8 max-w-sm w-full text-center">
          <p className="text-2xl mb-3">⚠️</p>
          <p className="text-foreground font-semibold mb-2">
            {isGuest ? 'Room unavailable' : 'Could not connect'}
          </p>
          <p className="text-muted-foreground text-sm mb-6">
            {isGuest ? 'The host may have left or the link is invalid.' : 'Check your connection and try again.'}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-foreground text-background font-semibold hover:bg-foreground/90 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={handleBack}
              className="px-5 py-2.5 border border-border text-muted-foreground hover:text-foreground transition-colors"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Guest waiting for host
  if (isGuest && status === 'waiting' && peerCount === 0 && !reconnecting && messages.length === 0) {
    return <WaitingGuest debugLog={debugLog} onBack={handleBack} />;
  }

  // Host waiting for guest
  if (!isGuest && status === 'waiting' && messages.length === 0 && !reconnecting) {
    return <WaitingHost chatLink={chatLink} debugLog={debugLog} onBack={handleBack} />;
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-background" style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}>
      {/* Reconnecting banner */}
      {reconnecting && (
        <div className="absolute top-[53px] inset-x-0 z-20 flex items-center justify-center gap-2 px-4 py-2 bg-secondary/80 border-b border-border/50 backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-foreground text-xs">Waiting for them to reconnect…</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/80 bg-background shrink-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <span className={`block w-2.5 h-2.5 rounded-full ${peerCount > 0 ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
            {peerCount > 0 && (
              <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-40" />
            )}
          </div>
          <div>
            <span className="text-foreground text-sm font-semibold">P2P Chat</span>
            <span className="text-muted-foreground/60 text-xs ml-2">
              {peerCount > 0 ? (aiEnabled ? '🤖 AI Control On' : '🔒 End-to-end encrypted') : 'waiting…'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isGuest && (
            <AIControlToggle
              enabled={aiEnabled}
              onToggle={setAiEnabled}
              processing={aiProcessing}
              hasKey={hasKey}
              onLoginRequired={() => setShowLoginModal(true)}
            />
          )}
          <button
            onClick={handleLeave}
            className="text-muted-foreground hover:text-red-400 text-xs font-medium transition-colors px-2 py-1 hover:bg-red-950/30"
          >
            Leave
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground/40 text-sm">Connected — say hi!</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <ChatMessage key={i} message={msg} prevMessage={i > 0 ? messages[i - 1] : null} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0">
        <ChatInput onSend={sendMessage} />
      </div>

      {showLoginModal && (
        <LoginModal
          onSuccess={() => {
            setShowLoginModal(false);
            setAiEnabled(true);
          }}
          onCancel={() => setShowLoginModal(false)}
        />
      )}
    </div>
  );
}
