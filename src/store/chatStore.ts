import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { ChatMessage, ChatApiResponse, LLMProvider } from '@/types';
import { useCompositionStore } from './compositionStore';

interface ChatStore {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  llmProvider: LLMProvider;
  setLlmProvider: (provider: LLMProvider) => void;
  sendMessage: (text: string) => Promise<void>;
  clearMessages: () => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,
  llmProvider: 'gemini', 
  setLlmProvider: (provider) => set({ llmProvider: provider }),

  sendMessage: async (text: string) => {
    const { messages, llmProvider } = get();
    const compositionStore = useCompositionStore.getState();

    // Add user message
    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    set({ messages: [...messages, userMessage], isLoading: true, error: null });

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          currentHtml: compositionStore.currentHtml,
          history: [...messages, userMessage].slice(-20), // Keep last 20 messages for context
          aspectRatio: compositionStore.aspectRatio,
          llmProvider,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data: ChatApiResponse = await response.json();

      const assistantMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: data.reply,
        html: data.html ?? undefined,
        timestamp: Date.now(),
        lintWarnings: data.lintWarnings,
        error: data.error ?? undefined,
      };

      set((state) => ({
        messages: [...state.messages, assistantMessage],
        isLoading: false,
      }));

      // Update composition if we got valid HTML
      if (data.html) {
        compositionStore.setHtml(data.html);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
      set((state) => ({
        messages: [
          ...state.messages,
          {
            id: uuidv4(),
            role: 'assistant' as const,
            content: `Sorry, I encountered an error: ${errorMessage}. Please try again.`,
            timestamp: Date.now(),
            error: errorMessage,
          },
        ],
        isLoading: false,
        error: errorMessage,
      }));
    }
  },

  clearMessages: () => set({ messages: [], error: null }),
}));
