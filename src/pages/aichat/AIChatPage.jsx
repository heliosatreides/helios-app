import { useState, useRef, useEffect, useCallback } from 'react';
import { useGemini } from '../../hooks/useGemini';
import { useIDB } from '../../hooks/useIDB';

const SYSTEM_PROMPT = `You are Helios, a helpful AI assistant embedded in a personal life dashboard app. You have access to the user's data context when they share it. Be concise, direct, and helpful. Use markdown formatting for code blocks and lists when appropriate.`;

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
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

export function AIChatPage() {
  const { generate, loading: geminiLoading, hasKey, error: geminiError } = useGemini();
  const [conversations, setConversations] = useIDB('helios-ai-conversations', []);
  const [activeConvId, setActiveConvId] = useState(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Get or create active conversation
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

  const deleteConversation = useCallback((id) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConvId === id) setActiveConvId(null);
  }, [setConversations, activeConvId]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;

    let convId = activeConvId;
    if (!convId) {
      convId = createConversation();
    }

    const userMsg = { role: 'user', content: text, timestamp: Date.now(), animate: true };

    // Update conversation with user message
    setConversations(prev => prev.map(c =>
      c.id === convId
        ? {
            ...c,
            messages: [...c.messages, userMsg],
            title: c.messages.length === 0 ? text.slice(0, 50) : c.title,
          }
        : c
    ));
    setInput('');
    setSending(true);

    try {
      // Build conversation history for context
      const conv = conversations.find(c => c.id === convId);
      const history = conv ? conv.messages : [];
      const allMessages = [...history, userMsg];

      // Build the full prompt with conversation history
      const contextParts = allMessages.map(m =>
        `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
      ).join('\n\n');

      const fullPrompt = `${SYSTEM_PROMPT}\n\nConversation:\n${contextParts}\n\nAssistant:`;

      const response = await generate(fullPrompt);

      const assistantMsg = { role: 'assistant', content: response, timestamp: Date.now(), animate: true };

      setConversations(prev => prev.map(c =>
        c.id === convId ? { ...c, messages: [...c.messages.filter(m => m !== userMsg), userMsg, assistantMsg] } : c
      ));
    } catch (err) {
      const errorMsg = { role: 'assistant', content: `Error: ${err.message}`, timestamp: Date.now(), animate: true };
      setConversations(prev => prev.map(c =>
        c.id === convId ? { ...c, messages: [...c.messages, errorMsg] } : c
      ));
    } finally {
      setSending(false);
    }
  }, [input, sending, activeConvId, createConversation, conversations, setConversations, generate]);

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
          <a href="/settings" className="text-sm text-foreground hover:underline">Go to Settings</a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-0 -m-6" style={{ height: 'calc(100vh - env(safe-area-inset-top, 0px))' }}>
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
                onClick={() => deleteConversation(conv.id)}
                className="hidden group-hover:block px-2 py-1 text-muted-foreground/40 hover:text-red-400 text-xs"
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
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between px-4 py-2 border-b border-border">
          <select
            value={activeConvId || ''}
            onChange={(e) => setActiveConvId(e.target.value || null)}
            className="bg-background border border-border text-foreground text-sm px-2 py-1 flex-1 mr-2"
          >
            <option value="">Select conversation</option>
            {conversations.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
          <button
            onClick={createConversation}
            className="shrink-0 px-3 py-1 text-sm border border-border text-muted-foreground hover:text-foreground"
          >
            New
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {!activeConvId && messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-sm">
                <h2 className="text-foreground font-medium mb-2">AI Chat</h2>
                <p className="text-muted-foreground text-sm mb-4">
                  Ask anything. Powered by your Gemini API key.
                </p>
                <div className="space-y-2 text-left">
                  {['Explain quantum computing simply', 'Help me plan a weekend trip', 'Review my code approach', 'What should I know about startup fundraising?'].map(q => (
                    <button
                      key={q}
                      onClick={() => { if (!activeConvId) createConversation(); setInput(q); }}
                      className="block w-full text-left px-3 py-2 text-sm border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                    >
                      {q}
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
    </div>
  );
}
