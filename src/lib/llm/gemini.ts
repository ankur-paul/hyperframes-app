import { GoogleGenAI } from '@google/genai';
import { parseJsonResponse, sanitiseHtml } from './response';
import type { LLMMessage, LLMResponse } from './types';

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set. Add it to .env.local');
    }
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

const MOCK_LLM = false;
const MOCK_COMPOSITION_ID = 'mock-video';

function buildMockHtml(userMessage: string): string {
  const preview = userMessage.slice(0, 30).replace(/"/g, "'");
  return `
<div id="root" data-composition-id="${MOCK_COMPOSITION_ID}" data-width="1920" data-height="1080" data-start="0" style="position:relative; overflow:hidden; width:1920px; height:1080px; background:linear-gradient(135deg, #1e3a8a 0%, #312e81 100%);">
  <h1 id="title" class="clip" data-start="0" data-duration="5" data-track-index="3" style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); font-size:80px; color:white; font-family:sans-serif; font-weight:bold; text-shadow:0 4px 20px rgba(0,0,0,0.5); margin:0;">
    Mock Video: ${preview}
  </h1>
  <script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
  <script>
    const tl = gsap.timeline({ paused: true });
    tl.from("#title", { opacity: 0, y: 50, duration: 1, ease: "power3.out" }, 0);
    tl.to("#title", { opacity: 0, scale: 1.1, duration: 0.5 }, 4.5);
    window.__timelines = window.__timelines || {};
    window.__timelines["${MOCK_COMPOSITION_ID}"] = tl;
  </script>
</div>
  `.trim();
}

export async function callGemini(
  systemPrompt: string,
  userMessage: string,
  history: LLMMessage[]
): Promise<LLMResponse> {
  if (MOCK_LLM) {
    console.log('[MOCK] Returning mock Gemini composition.');
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const html = buildMockHtml(userMessage);
    return {
      explanation: `Mock composition generated for: "${userMessage.slice(0, 40)}...".`,
      html,
      raw: JSON.stringify({ explanation: 'mock', html }),
    };
  }

  const ai = getClient();

  const contents = [
    ...history.map((msg) => ({
      role: msg.role === 'assistant' ? ('model' as const) : ('user' as const),
      parts: [{ text: msg.content }],
    })),
    {
      role: 'user' as const,
      parts: [{ text: userMessage }],
    },
  ];

  let raw = '';

  try {
    const response = await ai.models.generateContent({
      model: 'gemma-4-31b-it',
      contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
      },
    });

    raw = response.text ?? '';
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Gemini] API error:', message);
    return {
      explanation: '',
      html: null,
      raw: '',
      error: `Gemini API error: ${message}`,
    };
  }

  const parsed = parseJsonResponse(raw);

  if (!parsed) {
    console.error('[Gemini] Failed to parse response:', raw.slice(0, 400));
    return {
      explanation: '',
      html: null,
      raw,
      error:
        'The model returned a response that could not be parsed. ' +
        'Try rephrasing your prompt.',
    };
  }

  const html = sanitiseHtml(parsed.html);

  if (!html.includes('data-composition-id')) {
    return {
      explanation: parsed.explanation,
      html: null,
      raw,
      error:
        'The model returned HTML that is missing data-composition-id. ' +
        'This composition cannot be rendered. Try again.',
    };
  }

  return {
    explanation: parsed.explanation,
    html,
    raw,
  };
}
