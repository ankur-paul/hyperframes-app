'use client';

import CompositionPlayer from './CompositionPlayer';
import CodePreview from './CodePreview';
import DownloadButton from './DownloadButton';
import AspectRatioSelector from './AspectRatioSelector';
import { useCompositionStore } from '@/store/compositionStore';

export default function PreviewPanel() {
  const { currentHtml, canUndo, canRedo, undo, redo, aspectRatio } = useCompositionStore();

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg-primary)]">
      {/* Header / Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)]/15 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </div>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Preview</h2>
            <p className="text-[10px] text-[var(--color-text-muted)]">
              {currentHtml ? `${aspectRatio} composition` : 'Waiting for composition'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Undo/Redo */}
          {currentHtml && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => undo()}
                disabled={!canUndo()}
                className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Undo (previous version)"
                id="undo-button"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                </svg>
              </button>
              <button
                onClick={() => redo()}
                disabled={!canRedo()}
                className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Redo (next version)"
                id="redo-button"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
              </button>
            </div>
          )}

          <AspectRatioSelector />
          <DownloadButton />
        </div>
      </div>

      {/* Player area */}
      <div className="flex-1 relative overflow-hidden">
        <div className={`absolute inset-4 rounded-xl overflow-hidden ${currentHtml ? 'preview-glow' : ''} transition-shadow duration-500`}>
          <CompositionPlayer />
        </div>
      </div>

      {/* Code preview */}
      <CodePreview />
    </div>
  );
}
