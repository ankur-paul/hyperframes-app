'use client';

import { useState } from 'react';
import { useCompositionStore } from '@/store/compositionStore';
import { useRenderStore } from '@/store/renderStore';
import type { RenderFormat } from '@/types';

export default function DownloadButton() {
  const { currentHtml } = useCompositionStore();
  const { isRendering, progress, downloadUrl, error, startRender, reset } = useRenderStore();
  const [format, setFormat] = useState<RenderFormat>('webm');

  const handleRender = () => {
    if (!currentHtml) return;
    startRender(currentHtml, format);
  };

  const handleDownload = () => {
    if (!downloadUrl) return;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `hyperframes-composition.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!currentHtml) return null;

  return (
    <div className="flex items-center gap-2">
      {/* Format selector */}
      <select
        value={format}
        onChange={(e) => setFormat(e.target.value as RenderFormat)}
        disabled={isRendering}
        className="text-xs bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)] rounded-lg px-2 py-1.5 outline-none disabled:opacity-50"
        id="format-selector"
      >
        <option value="mp4">MP4</option>
        <option value="webm">WebM</option>
      </select>

      {/* Render/Download button */}
      {downloadUrl ? (
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--color-success)] text-white hover:opacity-90 transition-opacity"
            id="download-button"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download
          </button>
          <button
            onClick={reset}
            className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors px-1"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          onClick={handleRender}
          disabled={isRendering}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          id="render-button"
        >
          {isRendering ? (
            <>
              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {progress?.message || 'Rendering...'}
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
              Render Video
            </>
          )}
        </button>
      )}

      {/* Error display */}
      {error && (
        <span className="text-xs text-[var(--color-error)] max-w-[200px] truncate" title={error}>
          {error}
        </span>
      )}
    </div>
  );
}
