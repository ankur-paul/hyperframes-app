import Groq from "groq-sdk";
import { parseJsonResponse, sanitiseHtml } from "./response";
import type { LLMMessage, LLMResponse } from "./types";

// ---------------------------------------------------------------------------
// Groq LLM client
//
// Works with the JSON-output system prompt from systemPrompt.ts.
// The LLM is instructed to return:
//   { "explanation": "...", "html": "..." }
//
// This file handles:
//   - JSON parsing with graceful fallback
//   - Sanitising the html field (removes any accidental DOCTYPE wrappers)
//   - A mock mode that mirrors the exact same output shape
// ---------------------------------------------------------------------------

let client: Groq | null = null;

function getClient(): Groq {
  if (!client) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is not set. Add it to .env.local");
    }
    client = new Groq({ apiKey });
  }
  return client;
}

// ---------------------------------------------------------------------------
// Mock flag — flip to false to hit the real Groq API
// ---------------------------------------------------------------------------

const MOCK_LLM = false;

// ---------------------------------------------------------------------------
// Minimal mock composition — matches the JSON output format exactly.
// ---------------------------------------------------------------------------

const MOCK_COMPOSITION_ID = "mock-video";

function buildMockHtml(userMessage: string): string {
  const preview = userMessage.slice(0, 30).replace(/"/g, "'");
  return [
    `<div id="root" data-composition-id="${MOCK_COMPOSITION_ID}"`,
    `  data-start="0" data-width="1920" data-height="1080"`,
    `  style="position:relative; overflow:hidden; width:1920px; height:1080px;`,
    `         background:linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #0f172a 100%);">`,
    ``,
    `  <h1 id="title" class="clip"`,
    `      data-start="0" data-duration="5" data-track-index="1"`,
    `      style="position:absolute; top:50%; left:50%;`,
    `             transform:translate(-50%,-55%);`,
    `             font-size:80px; font-weight:800; color:#ffffff;`,
    `             text-align:center; line-height:1.2; margin:0;`,
    `             font-family:'Inter',sans-serif;`,
    `             text-shadow:0 4px 32px rgba(99,102,241,0.6);">`,
    `    ${preview}…`,
    `  </h1>`,
    ``,
    `  <p id="subtitle" class="clip"`,
    `     data-start="0.6" data-duration="4.4" data-track-index="2"`,
    `     style="position:absolute; top:50%; left:50%;`,
    `            transform:translate(-50%, 60%);`,
    `            font-size:24px; color:rgba(255,255,255,0.6);`,
    `            text-align:center; margin:0;`,
    `            font-family:'Inter',sans-serif; letter-spacing:0.08em;">`,
    `    MOCK PREVIEW`,
    `  </p>`,
    ``,
    `  <script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>`,
    `  <script>`,
    `    const tl = gsap.timeline({ paused: true });`,
    `    tl.from("#title",    { opacity: 0, y: -40, duration: 0.9, ease: "power3.out" }, 0);`,
    `    tl.from("#subtitle", { opacity: 0, y:  20, duration: 0.7, ease: "power2.out" }, 0.6);`,
    `    tl.to(  "#title",    { opacity: 0, duration: 0.4 }, 4.6);`,
    `    tl.to(  "#subtitle", { opacity: 0, duration: 0.4 }, 4.6);`,
    `    window.__timelines = window.__timelines || {};`,
    `    window.__timelines["${MOCK_COMPOSITION_ID}"] = tl;`,
    `  </script>`,
    `</div>`,
  ].join("\n");
}

/**
 * Call Groq (or the mock) and return a structured LLMResponse.
 *
 * @param systemPrompt   Output of buildSystemPrompt() from systemPrompt.ts
 * @param userMessage    The latest user chat message
 * @param history        All previous turns (role + content), excluding the latest message
 */
export async function callGroq(
  systemPrompt: string,
  userMessage: string,
  history: LLMMessage[],
): Promise<LLMResponse> {
  // ── MOCK PATH ─────────────────────────────────────────────────────────────
  if (MOCK_LLM) {
    console.log("[MOCK] Returning mock Hyperframes composition.");
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const html = buildMockHtml(userMessage);
    return {
      explanation: `Mock composition generated for: "${userMessage.slice(0, 40)}…". Toggle MOCK_LLM to false in groq.ts to use the real API.`,
      html,
      raw: JSON.stringify({ explanation: "mock", html }),
    };
  }

  // ── REAL GROQ API PATH ────────────────────────────────────────────────────
  const ai = getClient();

  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...history.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
    { role: "user", content: userMessage },
  ];

  let raw = "";

  try {
    const response = await ai.chat.completions.create({
      // llama-3.3-70b-versatile — best current Groq model for structured output.
      // Replaces deprecated mixtral-8x7b-32768.
      model: "llama-3.3-70b-versatile",
      messages,
      temperature: 0.6, // Lower than before: reduces hallucinated attributes
      max_tokens: 8192,
      // Groq supports JSON mode — hints strongly that output should be valid JSON.
      response_format: { type: "json_object" },
    });

    raw = response.choices[0]?.message?.content ?? "";
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Groq] API error:", message);
    return {
      explanation: "",
      html: null,
      raw: "",
      error: `Groq API error: ${message}`,
    };
  }

  // ── Parse the JSON response ───────────────────────────────────────────────
  const parsed = parseJsonResponse(raw);

  if (!parsed) {
    console.error("[Groq] Failed to parse response:", raw.slice(0, 400));
    return {
      explanation: "",
      html: null,
      raw,
      error:
        "The model returned a response that could not be parsed. " +
        "Try rephrasing your prompt.",
    };
  }

  const html = sanitiseHtml(parsed.html);

  // Basic structural sanity check before returning.
  if (!html.includes("data-composition-id")) {
    return {
      explanation: parsed.explanation,
      html: null,
      raw,
      error:
        "The model returned HTML that is missing data-composition-id. " +
        "This composition cannot be rendered. Try again.",
    };
  }

  return {
    explanation: parsed.explanation,
    html,
    raw,
  };
}
