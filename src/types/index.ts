export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  html?: string; // Hyperframes HTML if assistant message generated one
  timestamp: number;
  lintWarnings?: string[];
  error?: string;
}

export interface CompositionState {
  html: string | null;
  sessionId: string;
  history: string[]; // HTML snapshots for undo/redo
  historyIndex: number;
}

export type AspectRatio = '16:9' | '9:16' | '1:1';

export interface AspectRatioConfig {
  label: string;
  width: number;
  height: number;
  icon: string;
}

export const ASPECT_RATIOS: Record<AspectRatio, AspectRatioConfig> = {
  '16:9': { label: 'YouTube (16:9)', width: 1920, height: 1080, icon: '🖥️' },
  '9:16': { label: 'TikTok (9:16)', width: 1080, height: 1920, icon: '📱' },
  '1:1': { label: 'Instagram (1:1)', width: 1080, height: 1080, icon: '⬛' },
};

export type RenderFormat = 'mp4' | 'webm';
export type LLMProvider = 'groq' | 'gemini';

export interface RenderProgress {
  status: 'queued' | 'preprocessing' | 'rendering' | 'encoding' | 'complete' | 'failed';
  progress?: number; // 0-100
  message?: string;
  downloadUrl?: string;
}

export interface ChatApiRequest {
  message: string;
  currentHtml: string | null;
  history: ChatMessage[];
  aspectRatio: AspectRatio;
  llmProvider?: LLMProvider;
}

export interface ChatApiResponse {
  html: string | null;
  reply: string;
  lintWarnings?: string[];
  error?: string;
}

export interface RenderApiRequest {
  sessionId: string;
  format: RenderFormat;
}
