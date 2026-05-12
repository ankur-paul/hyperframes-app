export type LLMProvider = 'groq' | 'gemini';

export interface LLMMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  /** The friendly explanation the LLM wrote, shown in the chat bubble. */
  explanation: string;
  /** The HyperFrames HTML composition, or null if generation/parsing failed. */
  html: string | null;
  /** The raw text from the LLM, useful for debug logging. */
  raw: string;
  /** If generation or parsing failed, this describes what went wrong. */
  error?: string;
}

export function normaliseLlmProvider(provider: unknown): LLMProvider {
  return provider === 'gemini' ? 'gemini' : 'groq';
}

