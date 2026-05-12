import { create } from 'zustand';
import type { RenderFormat, RenderProgress } from '@/types';

interface RenderStore {
  isRendering: boolean;
  progress: RenderProgress | null;
  downloadUrl: string | null;
  error: string | null;

  startRender: (html: string, format: RenderFormat) => Promise<void>;
  reset: () => void;
}

export const useRenderStore = create<RenderStore>((set) => ({
  isRendering: false,
  progress: null,
  downloadUrl: null,
  error: null,

  startRender: async (html: string, format: RenderFormat) => {
    set({ isRendering: true, progress: { status: 'queued' }, downloadUrl: null, error: null });

    try {
      const response = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, format }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Render failed' }));
        throw new Error(err.error || `Render failed: ${response.status}`);
      }

      // Handle SSE streaming for progress
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response stream');
      }

      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              set({ progress: data });

              if (data.status === 'complete' && data.downloadUrl) {
                set({ downloadUrl: data.downloadUrl, isRendering: false });
              } else if (data.status === 'failed') {
                set({ error: data.message || 'Render failed', isRendering: false });
              }
            } catch {
              // Skip malformed SSE data
            }
          }
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Render failed';
      set({ error: message, isRendering: false, progress: { status: 'failed', message } });
    }
  },

  reset: () => set({ isRendering: false, progress: null, downloadUrl: null, error: null }),
}));
