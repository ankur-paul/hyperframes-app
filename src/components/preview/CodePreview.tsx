'use client';

import { useState } from 'react';
import { useCompositionStore } from '@/store/compositionStore';

export default function CodePreview() {
  const { currentHtml } = useCompositionStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!currentHtml) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(currentHtml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border-t border-[var(--color-border-subtle)]">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-2 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors"
        id="code-preview-toggle"
      >
        <div className="flex items-center gap-2">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
          HTML Source
        </div>
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isExpanded && (
        <div className="relative">
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 z-10 px-2 py-1 text-[10px] rounded bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
          <pre className="overflow-auto max-h-[200px] px-4 py-3 text-[11px] leading-relaxed text-[var(--color-text-secondary)] bg-[var(--color-bg-primary)] font-[var(--font-mono)]">
            <code>{currentHtml}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
