'use client';

/**
 * AI Chat Panel — Revamped UI
 * Editorial minimal aesthetic to match problem-page-revamp
 */

import { useEffect, useState, useRef } from 'react';
import { Loader2, Send, ArrowUp } from 'lucide-react';
import { ChatMessage, Step, StudyMode } from '@/lib/types';
import { trackAiInteraction } from '@/lib/logger';

interface ChatPanelProps {
  uid: string;
  problemId: number;
  currentStep: Step;
  mode: StudyMode;
}

interface LocalChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_QUESTIONS = [
  'Give me a hint',
  'Explain the concept',
  "What's the first step?",
  "Why isn't my approach working?",
];

export function ChatPanel({ uid, problemId, currentStep, mode }: ChatPanelProps) {
  const [messages, setMessages] = useState<LocalChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    trackAiInteraction(problemId, currentStep.id);

    const userMsg: LocalChatMessage = { id: Date.now().toString(), role: 'user', content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    if (inputRef.current) { inputRef.current.style.height = 'auto'; }
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid, problemId,
          stepId: currentStep.id,
          currentStep: currentStep.question,
          userMessage: trimmed,
          mode,
        }),
      });

      if (!res.ok) throw new Error('Failed');
      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', content: data.message },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', content: 'Something went wrong. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  if (mode !== 'ai-assisted') return null;

  const isEmpty = messages.length === 0;

  return (
    <>
      <style>{`
        .chat-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
          font-family: var(--sans, 'DM Sans', system-ui, sans-serif);
          background: #fff;
        }

        /* ── Message list ── */
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 20px 20px 8px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          scroll-behavior: smooth;
        }
        .chat-messages::-webkit-scrollbar { width: 4px; }
        .chat-messages::-webkit-scrollbar-track { background: transparent; }
        .chat-messages::-webkit-scrollbar-thumb { background: var(--border, #e5dfd8); border-radius: 99px; }

        /* Empty state */
        .chat-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex: 1;
          gap: 6px;
          text-align: center;
          padding: 32px 16px;
        }
        .chat-empty-title {
          font-family: var(--serif, 'DM Serif Display', Georgia, serif);
          font-size: 1rem;
          color: var(--ink, #1a1814);
        }
        .chat-empty-sub {
          font-size: 0.8125rem;
          color: var(--ink-muted, #a8a29e);
          line-height: 1.6;
          max-width: 220px;
        }

        /* Quick questions */
        .quick-questions {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 0 20px 16px;
          border-bottom: 1px solid var(--border, #e5dfd8);
        }
        .quick-label {
          font-family: var(--mono, 'DM Mono', monospace);
          font-size: 0.625rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--ink-muted, #a8a29e);
          margin-bottom: 2px;
        }
        .quick-btn {
          display: flex;
          align-items: center;
          text-align: left;
          background: none;
          border: 1px solid var(--border, #e5dfd8);
          border-radius: 3px;
          padding: 7px 12px;
          font-size: 0.8125rem;
          color: var(--ink-soft, #6b6660);
          cursor: pointer;
          transition: border-color 0.15s, color 0.15s, background 0.15s;
          font-family: var(--sans, system-ui, sans-serif);
          line-height: 1;
        }
        .quick-btn:hover {
          border-color: var(--ink, #1a1814);
          color: var(--ink, #1a1814);
          background: var(--surface, #faf9f7);
        }

        /* Bubbles */
        .message-row {
          display: flex;
          gap: 10px;
          animation: msgIn 0.2s ease both;
        }
        @keyframes msgIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .message-row.user { justify-content: flex-end; }
        .message-row.assistant { justify-content: flex-start; }

        .bubble {
          max-width: 82%;
          padding: 10px 14px;
          border-radius: 4px;
          font-size: 0.875rem;
          line-height: 1.65;
        }
        .bubble.user {
          background: var(--ink, #1a1814);
          color: #fff;
          border-radius: 4px 4px 2px 4px;
        }
        .bubble.assistant {
          background: var(--surface-alt, #f2ede8);
          color: var(--ink, #1a1814);
          border-radius: 4px 4px 4px 2px;
        }

        /* Avatar dot */
        .avatar {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          flex-shrink: 0;
          margin-top: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--mono, monospace);
          font-size: 0.5625rem;
          letter-spacing: 0.04em;
        }
        .avatar.ai {
          background: var(--accent-soft, #f5ece6);
          color: var(--accent, #c45a2a);
          border: 1px solid #e8c4b0;
        }

        /* Typing indicator */
        .typing {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 10px 14px;
          background: var(--surface-alt, #f2ede8);
          border-radius: 4px 4px 4px 2px;
        }
        .typing-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--ink-muted, #a8a29e);
          animation: blink 1.2s infinite;
        }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes blink {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40%            { opacity: 1;   transform: scale(1);   }
        }

        /* ── Input area ── */
        .chat-input-area {
          flex-shrink: 0;
          padding: 14px 16px;
          border-top: 1px solid var(--border, #e5dfd8);
          background: #fff;
        }
        .chat-input-row {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          border: 1px solid var(--border, #e5dfd8);
          border-radius: 5px;
          padding: 8px 10px 8px 14px;
          background: var(--surface, #faf9f7);
          transition: border-color 0.15s;
        }
        .chat-input-row:focus-within {
          border-color: var(--ink, #1a1814);
        }
        .chat-textarea {
          flex: 1;
          background: none;
          border: none;
          outline: none;
          resize: none;
          font-family: var(--sans, system-ui, sans-serif);
          font-size: 0.875rem;
          color: var(--ink, #1a1814);
          line-height: 1.5;
          min-height: 22px;
          max-height: 120px;
          padding: 0;
        }
        .chat-textarea::placeholder { color: var(--ink-muted, #a8a29e); }
        .send-btn {
          width: 30px;
          height: 30px;
          border-radius: 3px;
          border: none;
          background: var(--ink, #1a1814);
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: background 0.15s, opacity 0.15s;
        }
        .send-btn:disabled {
          background: var(--border, #e5dfd8);
          cursor: not-allowed;
        }
        .send-hint {
          font-family: var(--mono, monospace);
          font-size: 0.625rem;
          color: var(--ink-muted, #a8a29e);
          letter-spacing: 0.06em;
          margin-top: 6px;
          text-align: right;
        }
      `}</style>

      <div className="chat-panel">

        {/* ── Messages ── */}
        <div className="chat-messages">
          {isEmpty ? (
            <div className="chat-empty">
              <p className="chat-empty-title">Your calculus tutor</p>
              <p className="chat-empty-sub">
                Ask for hints, concept explanations, or step-by-step guidance.
                I won't just give you the answer.
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`message-row ${msg.role}`}>
                {msg.role === 'assistant' && (
                  <div className="avatar ai">AI</div>
                )}
                <div className={`bubble ${msg.role}`}>{msg.content}</div>
              </div>
            ))
          )}

          {isLoading && (
            <div className="message-row assistant">
              <div className="avatar ai">AI</div>
              <div className="typing">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* ── Quick questions (only when empty) ── */}
        {isEmpty && (
          <div className="quick-questions">
            <p className="quick-label">Quick prompts</p>
            {QUICK_QUESTIONS.map((q) => (
              <button
                key={q}
                className="quick-btn"
                onClick={() => sendMessage(q)}
                disabled={isLoading}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* ── Input ── */}
        <div className="chat-input-area">
          <div className="chat-input-row">
            <textarea
              ref={inputRef}
              className="chat-textarea"
              placeholder="Ask a question..."
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              rows={1}
            />
            <button
              className="send-btn"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
            >
              {isLoading
                ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                : <ArrowUp size={13} />
              }
            </button>
          </div>
          <p className="send-hint">Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </>
  );
}