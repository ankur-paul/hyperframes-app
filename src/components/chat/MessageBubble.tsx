'use client';

import type { ChatMessage } from '@/types';

interface Props {
  message: ChatMessage;
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <div
      className={`animate-slide-in flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-[var(--color-accent)] text-white rounded-br-md'
            : 'glass-panel text-[var(--color-text-primary)] rounded-bl-md'
        }`}
      >
        {/* Message content */}
        <div className="whitespace-pre-wrap break-words">{message.content}</div>

        {/* HTML indicator */}
        {message.html && (
          <div className="mt-2 pt-2 border-t border-white/10 flex items-center gap-1.5 text-xs opacity-70">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
            Composition updated — check preview →
          </div>
        )}

        {/* Lint warnings */}
        {message.lintWarnings && message.lintWarnings.length > 0 && (
          <div className="mt-2 pt-2 border-t border-[var(--color-warning)]/20">
            {message.lintWarnings.map((w, i) => (
              <div key={i} className="flex items-start gap-1.5 text-xs text-[var(--color-warning)] mt-1">
                <span>⚠️</span>
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}

        {/* Error indicator */}
        {message.error && !message.html && (
          <div className="mt-2 pt-2 border-t border-[var(--color-error)]/20 text-xs text-[var(--color-error)] flex items-center gap-1.5">
            <span>⚠</span>
            <span>Error occurred</span>
          </div>
        )}

        {/* Timestamp */}
        <div className={`text-[10px] mt-1.5 ${isUser ? 'text-white/40' : 'text-[var(--color-text-muted)]'}`}>
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
}
