'use client';

import { useRef, useEffect, useState } from 'react';
import { useChatStore } from '@/store/chatStore';

export default function ChatInput() {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { sendMessage, isLoading, llmProvider, setLlmProvider } = useChatStore();

  const handleSubmit = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = '48px';
    await sendMessage(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = '48px';
      ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
    }
  }, [input]);

  return (
    <div className="p-3 border-t border-[var(--color-border-subtle)]">
      <div className="flex items-end gap-2 glass-panel rounded-xl p-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isLoading
              ? 'Generating composition...'
              : 'Describe a video or edit the current one...'
          }
          disabled={isLoading}
          rows={1}
          className="flex-1 bg-transparent resize-none outline-none text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] text-sm px-2 py-2 min-h-[48px] max-h-[160px] font-[var(--font-sans)] disabled:opacity-50"
          id="chat-input"
        />
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || isLoading}
          className="shrink-0 w-9 h-9 rounded-lg bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
          id="send-button"
          aria-label="Send message"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
        </button>
      </div>
      <div className="flex items-center justify-between gap-3 mt-2 px-2">
        <span className="text-[10px] text-[var(--color-text-muted)]">
          Shift+Enter for new line
        </span>
        <label className="flex items-center gap-1.5 text-[10px] text-[var(--color-text-muted)]">
          Model
          <select
            value={llmProvider}
            onChange={(e) => setLlmProvider(e.target.value === 'gemini' ? 'gemini' : 'groq')}
            disabled={isLoading}
            className="h-7 rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-bg-tertiary)] px-2 text-[11px] text-[var(--color-text-secondary)] outline-none disabled:opacity-50"
            aria-label="Model provider"
          >
            <option value="gemini">Gemini</option>
            <option value="groq">Groq</option>
          </select>
        </label>
      </div>
    </div>
  );
}
