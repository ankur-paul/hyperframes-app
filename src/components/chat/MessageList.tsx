'use client';

import { useRef, useEffect } from 'react';
import { useChatStore } from '@/store/chatStore';
import MessageBubble from './MessageBubble';

export default function MessageList() {
  const { messages, isLoading } = useChatStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center px-6">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-accent)]/10 flex items-center justify-center mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
            HyperFrames Studio
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6 max-w-xs">
            Describe a video and I&apos;ll create it as a motion graphics composition. Try:
          </p>
          <div className="space-y-2 w-full max-w-xs">
            {[
              'A 10-second product intro with a fade-in title',
              'A countdown timer from 5 to 1 with bouncy numbers',
              'A dark mode social media post with animated text',
            ].map((prompt, i) => (
              <button
                key={i}
                onClick={() => useChatStore.getState().sendMessage(prompt)}
                className="w-full text-left text-xs text-[var(--color-text-secondary)] glass-panel rounded-lg px-3 py-2.5 hover:bg-[var(--color-surface-hover)] transition-colors duration-200 cursor-pointer"
              >
                &ldquo;{prompt}&rdquo;
              </button>
            ))}
          </div>
        </div>
      )}

      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}

      {/* Typing indicator */}
      {isLoading && (
        <div className="flex justify-start animate-slide-in">
          <div className="glass-panel rounded-2xl rounded-bl-md px-4 py-3">
            <div className="flex items-center gap-1.5">
              <div className="typing-dot w-2 h-2 rounded-full bg-[var(--color-accent)]" />
              <div className="typing-dot w-2 h-2 rounded-full bg-[var(--color-accent)]" />
              <div className="typing-dot w-2 h-2 rounded-full bg-[var(--color-accent)]" />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
