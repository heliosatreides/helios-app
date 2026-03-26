import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useGemini } from '../../hooks/useGemini';
import { useIDB } from '../../hooks/useIDB';
import { buildToolSystemPrompt, executeActions } from '../../hooks/useHeliosTools';
import { ConfirmDialog } from '../../components/ConfirmDialog';

const SUGGESTED_ACTIONS = [
  { label: 'Add a task', prompt: 'Add a task: buy groceries by Friday' },
  { label: 'Log an expense', prompt: 'Log an expense: $45 dinner last night' },
  { label: 'Set a goal', prompt: 'Set a goal: run a marathon by December' },
  { label: 'Track subscription', prompt: 'Track a subscription: Netflix $15.99/month' },
  { label: 'Plan a trip', prompt: 'Plan a trip to Tokyo in April' },
  { label: 'Show my tasks', prompt: 'Show me my tasks for this week' },
  { label: 'Spending summary', prompt: 'What does my spending look like this month?' },
  { label: 'Add a contact', prompt: 'Add a contact: John from Acme Corp' },
];

function ActionConfirmation({ text }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] px-3 py-1.5 text-xs text-muted-foreground bg-secondary/30 border-l-2 border-foreground/20" data-testid="action-confirmation">
        {text}
      </div>
    </div>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  const isAction = message.role === 'action';

  if (isAction) {
    return <ActionConfirmation text={message.content} />;
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} ${message.animate ? 'animate-fadeIn' : ''}`}>
      <div className={`max-w-[80%] px-4 py-2.5 text-sm leading-relaxed ${
        isUser
          ? 'bg-foreground text-background'
          : 'border border-border text-foreground'
      }`}>
        <div className="whitespace-pre-wrap break-words">{message.content}</div>
        <div className={`text-[10px] mt-1.5 ${isUser ? 'text-background/50' : 'text-muted-foreground/40'}`}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="border border-border px-4 py-3 text-muted-foreground text-sm flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-pulse" />
        <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-pulse" style={{ animationDelay: '0.15s' }} />
        <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
      </div>
    </div>
  );
}

function ConversationDrawer({ open, onClose, conversations, activeConvId, onSelect, onDelete, onCreate }) {
  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
          data-testid="drawer-backdrop"
        />
      )}
      {/* Slide-in panel */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[80vw] bg-background border-r border-border flex flex-col transform transition-transform duration-200 ease-in-out md:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
        data-testid="conversation-drawer"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <span className="text-sm font-semibold text-foreground">Conversations</span>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close conversations"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="px-3 py-2 shrink-0">
          <button
            onClick={() => { onCreate(); onClose(); }}
            className="w-full px-3 py-2 text-sm text-left border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            style={{ minHeight: '44px' }}
          >
            + New conversation
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
          {conversations.map(conv => (
            <div key={conv.id} className="flex items-center">
              <button
                onClick={() => { onSelect(conv.id); onClose(); }}
                className={`flex-1 text-left px-3 py-3 text-sm transition-colors ${
                  activeConvId === conv.id
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}
                style={{ minHeight: '44px' }}
              >
                <div className="truncate">{conv.title}</div>
                <div className="text-[10px] text-muted-foreground/40 mt-0.5">
                  {new Date(conv.createdAt).toLocaleDateString()}
                </div>
              </button>
              <button
                onClick={() => onDelete(conv.id)}
                className="shrink-0 px-3 py-3 text-muted-foreground hover:text-red-400 text-sm"
                style={{ minHeight: '44px' }}
                aria-label={`Delete ${conv.title}`}
              >
                ×
              </button>
            </div>
          ))}
          {conversations.length === 0 && (
            <p className="text-muted-foreground/40 text-xs px-3 py-4">No conversations yet</p>
          )}
        </div>
      </div>
    </>
  );
}

export function AIChatPage({ onOpenSidebar, onOpenSearch }) {
  const { generate, loading: geminiLoading, hasKey, error: geminiError } = useGemini();
  const [conversations, setConversations] = useIDB('helios-ai-conversations', []);
  const [activeConvId, setActiveConvId] = useState(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Get or create active conversation
  // Auto-select most recent conversation on load
  useEffect(() => {
    if (!activeConvId && conversations.length > 0) {
      setActiveConvId(conversations[0].id);
    }
  }, [conversations, activeConvId]);

  const activeConv = conversations.find(c => c.id === activeConvId);
  const messages = activeConv?.messages || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  // Auto-focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, [activeConvId]);

  const createConversation = useCallback(() => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    const conv = { id, title: 'New conversation', messages: [], createdAt: new Date().toISOString() };
    setConversations(prev => [conv, ...prev]);
    setActiveConvId(id);
    return id;
  }, [setConversations]);

  const requestDeleteConversation = useCallback((id) => {
    setDeleteTarget(id);
  }, []);

  const deleteConversation = useCallback((id) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConvId === id) setActiveConvId(null);
  }, [setConversations, activeConvId]);

  const confirmDeleteConversation = useCallback(() => {
    deleteConversation(deleteTarget);
    setDeleteTarget(null);
  }, [deleteConversation, deleteTarget]);

  // Use a ref to always have current conversations without stale closures
  const conversationsRef = useRef(conversations);
  conversationsRef.current = conversations;

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;

    let convId = activeConvId;
    if (!convId) {
      convId = createConversation();
    }

    const userMsg = { role: 'user', content: text, timestamp: Date.now(), animate: true };

    // Add user message to conversation
    setConversations(prev => {
      const exists = prev.find(c => c.id === convId);
      if (!exists) {
        // Conversation was just created but state hasn't flushed yet
        const newConv = { id: convId, title: text.slice(0, 50), messages: [userMsg], createdAt: new Date().toISOString() };
        return [newConv, ...prev];
      }
      return prev.map(c =>
        c.id === convId
          ? { ...c, messages: [...c.messages, userMsg], title: c.messages.length === 0 ? text.slice(0, 50) : c.title }
          : c
      );
    });
    setInput('');
    setSending(true);

    try {
      const conv = conversationsRef.current.find(c => c.id === convId);
      const prevMessages = conv?.messages || [];
      const allMessages = [...prevMessages, userMsg];

      // Build conversation with tool-aware system prompt
      const systemPrompt = buildToolSystemPrompt();
      const contextParts = allMessages.map(m =>
        `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
      ).join('\n\n');

      const fullPrompt = `${systemPrompt}\n\nConversation:\n${contextParts}\n\nAssistant:`;

      const rawResponse = await generate(fullPrompt);

      // Execute any data actions in the response
      const { response: cleanResponse, dataContext } = await executeActions(rawResponse);

      let finalContent = cleanResponse || rawResponse;

      // Build action confirmation messages for write/update/delete operations
      const actionMessages = [];
      if (dataContext.trim()) {
        const actionLines = dataContext.split('\n').filter(l => l.trim());
        for (const line of actionLines) {
          const match = line.match(/\[(Created|Updated|Deleted)[^\]]*\]/);
          if (match) {
            actionMessages.push({ role: 'action', content: match[0].replace(/^\[|\]$/g, ''), timestamp: Date.now(), animate: true });
          }
        }
      }

      // If there was data read, make a follow-up call with the data context
      if (dataContext.trim()) {
        try {
          const followUp = await generate(
            `${systemPrompt}\n\nConversation:\n${contextParts}\n\nYou executed these data operations:\n${dataContext}\n\nNow respond to the user naturally, incorporating the data above. Be concise.`
          );
          const { response: followUpClean } = await executeActions(followUp);
          finalContent = followUpClean || followUp;
        } catch {
          // If follow-up fails, show the data directly
          finalContent = cleanResponse ? `${cleanResponse}\n\n${dataContext}` : dataContext;
        }
      }

      const assistantMsg = { role: 'assistant', content: finalContent, timestamp: Date.now(), animate: true };

      setConversations(prev => prev.map(c =>
        c.id === convId ? { ...c, messages: [...c.messages, ...actionMessages, assistantMsg] } : c
      ));
    } catch (err) {
      const errorMsg = { role: 'assistant', content: `Error: ${err.message}`, timestamp: Date.now(), animate: true };
      setConversations(prev => prev.map(c =>
        c.id === convId ? { ...c, messages: [...c.messages, errorMsg] } : c
      ));
    } finally {
      setSending(false);
    }
  }, [input, sending, activeConvId, createConversation, setConversations, generate]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  if (!hasKey) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-semibold text-foreground">AI Chat</h1>
          <p className="text-muted-foreground text-sm">Chat directly with Gemini</p>
        </div>
        <div className="border border-border p-8 text-center">
          <p className="text-muted-foreground text-sm mb-4">Add your Gemini API key in Settings to start chatting.</p>
          <Link to="/settings" className="text-sm text-foreground hover:underline">Go to Settings</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-0 h-full">
      {/* Conversation sidebar */}
      <div className="w-56 shrink-0 border-r border-border flex flex-col bg-background hidden md:flex">
        <div className="p-3 border-b border-border">
          <button
            onClick={createConversation}
            className="w-full px-3 py-2 text-sm text-muted-foreground border border-border hover:text-foreground hover:bg-secondary/50 transition-colors"
          >
            New conversation
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {conversations.map(conv => (
            <div key={conv.id} className="group flex items-center">
              <button
                onClick={() => setActiveConvId(conv.id)}
                className={`flex-1 text-left px-3 py-2 text-sm truncate transition-colors ${
                  activeConvId === conv.id
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}
              >
                {conv.title}
              </button>
              <button
                onClick={() => requestDeleteConversation(conv.id)}
                className="opacity-0 group-hover:opacity-100 focus:opacity-100 px-2 py-1 text-muted-foreground/40 hover:text-red-400 text-xs transition-opacity"
              >
                ×
              </button>
            </div>
          ))}
          {conversations.length === 0 && (
            <p className="text-muted-foreground/40 text-xs px-3 py-4">No conversations yet</p>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header — replaces global header on /ai to avoid double-header */}
        <div className="md:hidden flex items-center gap-1 px-2 py-2 border-b border-border">
          {onOpenSidebar && (
            <button
              onClick={onOpenSidebar}
              className="text-muted-foreground hover:text-foreground p-2 min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0"
              aria-label="Open menu"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          )}
          <button
            onClick={() => setDrawerOpen(true)}
            className="shrink-0 px-3 py-2 text-sm border border-border text-muted-foreground hover:text-foreground"
            style={{ minHeight: '44px' }}
          >
            Chats
          </button>
          <span className="flex-1 text-sm text-foreground truncate mx-1">
            {activeConv?.title || 'AI Chat'}
          </span>
          <button
            onClick={createConversation}
            className="shrink-0 px-3 py-2 text-sm border border-border text-muted-foreground hover:text-foreground"
            style={{ minHeight: '44px' }}
          >
            New
          </button>
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              className="text-muted-foreground hover:text-foreground p-2 min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0"
              aria-label="Search"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          )}
        </div>
        <ConversationDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          conversations={conversations}
          activeConvId={activeConvId}
          onSelect={setActiveConvId}
          onDelete={requestDeleteConversation}
          onCreate={createConversation}
        />

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {!activeConvId && messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="border border-dashed border-border p-10 text-center max-w-md">
                <h3 className="text-foreground font-medium mb-2">AI Chat</h3>
                <p className="text-muted-foreground text-sm max-w-md mx-auto mb-4">
                  Chat with Gemini. It can read and modify your Helios data — tasks, finance, trips, goals, and more.
                </p>
                <p className="text-muted-foreground/60 text-xs mb-3">Try asking Helios to do something</p>
                <div className="flex flex-wrap gap-2 justify-center" data-testid="suggested-actions">
                  {SUGGESTED_ACTIONS.map(a => (
                    <button
                      key={a.label}
                      onClick={() => { if (!activeConvId) createConversation(); setInput(a.prompt); }}
                      className="px-3 py-2 text-sm border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                      style={{ minHeight: '44px' }}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} />
          ))}
          {sending && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border px-4 py-3 flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Gemini..."
            rows={1}
            className="flex-1 bg-background border border-border px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
            style={{ minHeight: '42px', maxHeight: '120px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="shrink-0 px-4 py-2.5 bg-foreground text-background text-sm font-medium hover:bg-foreground/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteConversation}
        title="Delete conversation?"
        message="This will permanently delete this conversation and its messages."
      />
    </div>
  );
}
