import { NextRequest, NextResponse } from 'next/server';
import { buildSystemPrompt } from '@/lib/llm/systemPrompt';
import { callGroq } from '@/lib/llm/groq';
import { callGemini } from '@/lib/llm/gemini';
import { normaliseLlmProvider } from '@/lib/llm/types';
import { validateCompositionHtml } from '@/lib/hyperframes/validator';
import { logger } from '@/lib/logger';
import type { LLMMessage } from '@/lib/llm/types';
import type { ChatApiRequest, ChatApiResponse } from '@/types';

export async function POST(request: NextRequest): Promise<NextResponse<ChatApiResponse>> {
  try {
    const body: ChatApiRequest = await request.json();
    const { message, currentHtml, history, aspectRatio } = body;
    const llmProvider = normaliseLlmProvider(body.llmProvider);
    logger.info('API/Chat', 'Request received', { messageLength: message?.length, llmProvider });

    if (!message?.trim()) {
      return NextResponse.json(
        { html: null, reply: 'Please enter a message.', error: 'Empty message' },
        { status: 400 }
      );
    }

    const requiredApiKey = llmProvider === 'gemini' ? process.env.GEMINI_API_KEY : process.env.GROQ_API_KEY;
    const requiredApiKeyName = llmProvider === 'gemini' ? 'GEMINI_API_KEY' : 'GROQ_API_KEY';

    if (!requiredApiKey) {
      return NextResponse.json(
        {
          html: null,
          reply: `The API key is not configured. Please add ${requiredApiKeyName} to your .env.local file.`,
          error: 'Missing API key',
        },
        { status: 500 }
      );
    }

    // Build system prompt with current composition context
    const systemPrompt = buildSystemPrompt(currentHtml, aspectRatio || '16:9');

    // Build conversation history for Groq. System context is passed separately.
    const conversationHistory: LLMMessage[] =
      (history || []).reduce((messages, msg) => {
        if (msg.role !== 'user' && msg.role !== 'assistant') {
          return messages;
        }

        messages.push({
          role: msg.role,
          content: msg.content,
        });
        return messages;
      }, [] as LLMMessage[]);

    logger.info('API/Chat', 'Calling LLM with conversation history', {
      historyLength: conversationHistory.length,
      llmProvider,
    });

    const { explanation, html, raw, error } =
      llmProvider === 'gemini'
        ? await callGemini(systemPrompt, message, conversationHistory)
        : await callGroq(systemPrompt, message, conversationHistory);

    logger.info('API/Chat', 'LLM response received', {
      hasHtml: !!html,
      responseLength: raw?.length,
      llmProvider,
    });

    // If HTML was generated, validate it
    let lintWarnings: string[] | undefined;
    const finalHtml = html;

    if (html) {
      const lintResult = validateCompositionHtml(html);

      if (!lintResult.valid) {
        // HTML has critical errors — try asking LLM to fix, or return errors
        return NextResponse.json({
          html: null,
          reply: `I generated a composition but it has some issues:\n\n${lintResult.errors.map((e) => `❌ ${e}`).join('\n')}\n\nLet me try again — could you rephrase your request?`,
          lintWarnings: [...lintResult.errors, ...lintResult.warnings],
          error: 'Validation failed',
        });
      }

      lintWarnings = lintResult.warnings.length > 0 ? lintResult.warnings : undefined;
    }

    let reply = explanation || error || '';
    // Remove code fences from reply text just in case
    reply = reply.replace(/```html[\s\S]*?```/g, '').trim();
    reply = reply.replace(/```[\s\S]*?```/g, '').trim();

    // If the reply is empty after stripping, provide a default
    if (!reply) {
      reply = finalHtml
        ? '✨ Here\'s your composition! Check the preview on the right.'
        : 'I wasn\'t able to generate a composition from that. Could you try describing what you\'d like in more detail?';
    }

    return NextResponse.json({
      html: finalHtml,
      reply,
      lintWarnings,
    });
  } catch (error) {
    logger.error('API/Chat', 'Error processing request', error);

    const message =
      error instanceof Error ? error.message : 'An unexpected error occurred';

    return NextResponse.json(
      {
        html: null,
        reply: `Sorry, something went wrong: ${message}`,
        error: message,
      },
      { status: 500 }
    );
  }
}
