'use client';

import MessageList from './MessageList';
import ChatInput from './ChatInput';

export default function ChatPanel() {
  return (
    <div className="flex flex-col h-full bg-[var(--color-bg-secondary)] border-r border-[var(--color-border-subtle)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border-subtle)]">
        <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)]/15 flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Chat
          </h2>
          <p className="text-[10px] text-[var(--color-text-muted)]">
            Describe your video composition
          </p>
        </div>
      </div>

      {/* Messages */}
      <MessageList />

      {/* Input */}
      <ChatInput />
    </div>
  );
}
