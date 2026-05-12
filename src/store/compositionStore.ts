import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { AspectRatio } from '@/types';

interface CompositionStore {
  currentHtml: string | null;
  sessionId: string;
  history: string[]; // HTML snapshots for undo/redo
  historyIndex: number;
  aspectRatio: AspectRatio;
  previewKey: number; // Increment to force player reload

  setHtml: (html: string) => void;
  setAspectRatio: (ratio: AspectRatio) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  reset: () => void;
}

export const useCompositionStore = create<CompositionStore>((set, get) => ({
  currentHtml: null,
  sessionId: uuidv4(),
  history: [],
  historyIndex: -1,
  aspectRatio: '16:9',
  previewKey: 0,

  setHtml: (html: string) => {
    const { history, historyIndex } = get();
    // Truncate any redo history
    const newHistory = [...history.slice(0, historyIndex + 1), html];
    set({
      currentHtml: html,
      history: newHistory,
      historyIndex: newHistory.length - 1,
      previewKey: get().previewKey + 1,
    });
  },

  setAspectRatio: (ratio: AspectRatio) => {
    set({ aspectRatio: ratio });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      set({
        currentHtml: history[newIndex],
        historyIndex: newIndex,
        previewKey: get().previewKey + 1,
      });
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      set({
        currentHtml: history[newIndex],
        historyIndex: newIndex,
        previewKey: get().previewKey + 1,
      });
    }
  },

  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,

  reset: () =>
    set({
      currentHtml: null,
      sessionId: uuidv4(),
      history: [],
      historyIndex: -1,
      previewKey: 0,
    }),
}));
