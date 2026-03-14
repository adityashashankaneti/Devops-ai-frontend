import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Sparkles, AlertCircle, RotateCcw } from 'lucide-react';
import { ChatMessage } from '../types';

const CHAT_URL = import.meta.env.VITE_CHAT_URL ?? 'http://localhost:8000/api/chat';

const SUGGESTIONS = [
  'Design a 3-tier web architecture on AWS',
  'How do I set up a VPC with public and private subnets?',
  'What are EKS deployment best practices?',
  'Explain NAT Gateway vs Internet Gateway',
  'How to set up a highly available RDS cluster?',
  'Design a serverless event-driven pipeline on AWS',
];

export default function ChatbotView() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState('');
  const [lastFailedMessages, setLastFailedMessages] = useState<{ role: string; content: string }[] | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = useCallback(
    async (content: string) => {
      const text = content.trim();
      if (!text || isTyping) return;

      const userMsg: ChatMessage = {
        id: `${Date.now()}-u`,
        role: 'user',
        content: text,
        timestamp: new Date(),
      };

      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setInput('');
      setError('');
      setLastFailedMessages(null);
      setIsTyping(true);

      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

      try {
        const res = await fetch(CHAT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: updatedMessages.map(({ role, content }) => ({ role, content })),
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? `HTTP ${res.status}`);
        }

        const data = await res.json();

        const aiMsg: ChatMessage = {
          id: `${Date.now()}-a`,
          role: 'assistant',
          content: data.reply,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to reach backend');
        setLastFailedMessages(updatedMessages.map(({ role, content }) => ({ role, content })));
      } finally {
        setIsTyping(false);
      }
    },
    [isTyping, messages],
  );

  const retry = useCallback(async () => {
    if (!lastFailedMessages) return;
    setError('');
    setIsTyping(true);
    try {
      const res = await fetch(CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: lastFailedMessages }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      const aiMsg: ChatMessage = {
        id: `${Date.now()}-a`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setLastFailedMessages(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reach backend');
    } finally {
      setIsTyping(false);
    }
  }, [lastFailedMessages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Empty state */}
      {isEmpty && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto">
          <div className="w-14 h-14 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center mb-5">
            <Sparkles size={22} className="text-indigo-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-100 mb-1.5">DevOps AI Assistant</h2>
          <p className="text-slate-500 text-sm mb-8 text-center max-w-md leading-relaxed">
            Ask about cloud architecture, AWS services, DevOps practices, or infrastructure
            design patterns.
          </p>
          <div className="grid grid-cols-2 gap-2.5 max-w-2xl w-full">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => sendMessage(s)}
                className="text-left p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 hover:border-indigo-500/40 hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 text-xs leading-relaxed transition-all duration-200"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      {!isEmpty && (
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-5">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl mx-auto ${
                msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${
                  msg.role === 'user'
                    ? 'bg-indigo-600'
                    : 'bg-slate-800 border border-slate-700'
                }`}
              >
                {msg.role === 'user' ? (
                  <User size={12} className="text-white" />
                ) : (
                  <Bot size={12} className="text-indigo-400" />
                )}
              </div>

              {/* Bubble */}
              <div
                className={`rounded-2xl px-4 py-3 max-w-[85%] ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-sm'
                    : 'bg-slate-800/80 text-slate-100 border border-slate-700/60 rounded-tl-sm'
                }`}
              >
                <pre className="text-xs leading-relaxed whitespace-pre-wrap font-sans">
                  {msg.content}
                </pre>
                <p
                  className={`text-[9px] mt-2 ${
                    msg.role === 'user' ? 'text-indigo-200/70' : 'text-slate-600'
                  }`}
                >
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex gap-3 max-w-3xl mx-auto">
              <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center bg-slate-800 border border-slate-700">
                <Bot size={12} className="text-indigo-400" />
              </div>
              <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl rounded-tl-sm px-4 py-3.5">
                <div className="flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-slate-800/80 flex-shrink-0">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-3 bg-slate-800/60 border border-slate-700/60 rounded-2xl px-4 py-3 focus-within:border-indigo-500/60 focus-within:bg-slate-800 transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Ask about AWS architecture, DevOps practices..."
              rows={1}
              className="flex-1 bg-transparent text-slate-100 text-sm outline-none resize-none placeholder:text-slate-600 leading-relaxed"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isTyping}
              className="w-8 h-8 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-all flex-shrink-0 shadow-sm"
            >
              <Send size={13} className="text-white" />
            </button>
          </div>
          {error && (
            <div className="flex items-center gap-2 mt-2 text-[10px] text-red-400">
              <AlertCircle size={11} className="flex-shrink-0" />
              <span className="flex-1 truncate">{error}</span>
              {lastFailedMessages && (
                <button
                  onClick={retry}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 border border-slate-700/60 text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-all flex-shrink-0"
                >
                  <RotateCcw size={10} />
                  Retry
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
