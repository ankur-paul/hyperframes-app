# Soundverse AI - Chat-Based Hyperframes App

A web application where users describe videos in natural language, and an LLM generates and iterates on [Hyperframes](https://github.com/heygen-com/hyperframes) HTML compositions. Users see motion graphics rendered live and can download the final result as a video.

## Features

- **Chat Interface** – Conversational composition editing with full context awareness
- **Live Preview** – Real-time composition rendering with motion overlays
- **Multi-LLM Support** – Dual LLM configuration (Gemini & Groq) with different performance characteristics
- **Video Export** – Download compositions as `.webm` video
- **Iterative Editing** – Follow-up prompts modify existing compositions instead of starting from scratch
- **Track Management** – Support for multiple overlapping clips on different data-track-index tracks
- **GSAP Animations** – First-class animation adapter integration

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript
- **Backend**: Next.js API routes (Node.js)
- **LLMs**:
  - Gemini (gemma-4-31b-it via Google AI)
  - Groq (Llama-3.3-70b-versatile)
- **Rendering**: Hyperframes (CPU-based via Puppeteer + FFmpeg)
- **State Management**: Zustand
- **Styling**: Tailwind CSS

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── chat/route.ts           # LLM chat endpoint
│   │   ├── composition/route.ts    # Composition validation & storage
│   │   ├── render/route.ts         # Video rendering pipeline
│   │   └── download/route.ts       # Video download endpoint
│   ├── layout.tsx                  # Root layout
│   ├── page.tsx                    # Main UI
│   └── globals.css
├── components/
│   ├── chat/
│   │   ├── ChatInput.tsx
│   │   ├── ChatPanel.tsx
│   │   ├── MessageBubble.tsx
│   │   └── MessageList.tsx
│   └── preview/
│       ├── AspectRatioSelector.tsx
│       ├── CodePreview.tsx
│       ├── CompositionPlayer.tsx
│       ├── DownloadButton.tsx
│       └── PreviewPanel.tsx
├── lib/
│   ├── llm/
│   │   ├── gemini.ts               # Gemini integration
│   │   ├── groq.ts                 # Groq integration
│   │   ├── response.ts             # Response parsing
│   │   ├── systemPrompt.ts         # LLM system prompt
│   │   └── types.ts
│   ├── hyperframes/
│   │   └── validator.ts            # Composition validation
│   └── logger.ts
└── store/
    ├── chatStore.ts                # Chat state
    ├── compositionStore.ts         # Composition state
    └── renderStore.ts              # Render state
```

## Setup & Installation

### Prerequisites

- Node.js 18+
- Puppeteer & FFmpeg (required for Hyperframes rendering)
- API keys for LLM providers

### Environment Variables

Create a `.env.local` file:

```env
# LLM Configuration
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_GROQ_API_KEY=your_groq_api_key

# Default LLM (gemini | groq)
NEXT_PUBLIC_DEFAULT_LLM=gemini

# Rendering
RENDER_TIMEOUT=300000  # 5 minutes in ms
```

### Installation

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How It Works

### 1. Chat Flow

1. User enters a prompt describing the desired video composition
2. Prompt is sent to the selected LLM with:
   - Current composition state (or empty if first message)
   - System prompt teaching Hyperframes HTML conventions
   - Full conversation history for context
3. LLM generates/modifies Hyperframes HTML composition
4. Response is parsed and validated

### 2. Composition Validation

All LLM-generated compositions are validated against:

- Valid HTML structure
- Hyperframes-specific attributes (data-start, data-duration, data-track-index)
- GSAP adapter configuration where applicable
- Basic runtime checks

### 3. Live Preview

The composition is rendered in real-time using the Hyperframes player component, showing:

- Motion graphics overlays
- Animations (GSAP, CSS, WAAPI)
- Multiple tracks on different indices
- Live updates as composition changes

### 4. Rendering & Download

1. User clicks Download
2. Composition is sent to `/api/render`
3. Hyperframes CLI renders the composition to `.webm`
4. File is streamed to the browser for download

## LLM Comparison & Trade-offs

### Gemini (gemma-4-31b-it)

**Pros:**

- ✅ High-quality composition generation
- ✅ Excellent understanding of Hyperframes conventions
- ✅ Very high rate limits (generous quota)
- ✅ Reliable iterative edits

**Cons:**

- ❌ Slower response times (5–10 seconds typical)
- ❌ Higher latency impacts UX

### Groq (Llama-3.3-70b-versatile)

**Pros:**

- ✅ Very fast inference (1–3 seconds typical)
- ✅ Quick iterative feedback
- ✅ Good for rapid prototyping

**Cons:**

- ❌ Lower composition quality
- ❌ More prone to syntax errors in generated HTML
- ❌ Rate limits can be exhausted quickly with repeated requests
- ❌ Less reliable at complex animation requirements

## Known Limitations & Honest Assessment

### 1. **Video Export: .webm Only** ⚠️

- ✅ `.webm` rendering works reliably
- ❌ `.mp4` export is not currently implemented
  - Hyperframes render pipeline defaults to WebM
  - MP4 conversion requires additional FFmpeg configuration
  - Not tested due to time constraints

**Workaround:** Users can convert `.webm` to `.mp4` locally using FFmpeg:

```bash
ffmpeg -i output.webm output.mp4
```

### 2. **CPU-Only Rendering & Large Video Limits** ⚠️

- Current implementation uses CPU-based rendering via Puppeteer + FFmpeg
- No GPU acceleration (CUDA/Vulkan) implemented
- **Cannot handle large videos**: Due to CPU rendering, attempting to render long or highly complex videos will take an impractically long time and may time out.
- Rendering is significantly slower than GPU-accelerated pipelines (~30 seconds per 10-second video, scaling linearly or worse with duration)
- **Reason:** GPU testing could not be performed on the development hardware (no dedicated graphics card)

**To Add GPU Support:**

1. Modify `/src/app/api/render/route.ts` to accept GPU flags
2. Use `puppeteer-extra` with GPU device context
3. Configure FFmpeg to use GPU encoders (NVIDIA NVENC, AMD VCE, etc.)
4. Add environment variables for GPU selection

### 3. **Composition Complexity Limits**

- Complex animations with many overlapping tracks may slow preview
- Very long compositions (>5 minutes) are not recommended
- Asset uploads are not supported; use external URLs only

### 4. **Error Handling**

- If LLM generates invalid HTML, an error message appears in the chat
- Composition validation is basic; some edge cases may not be caught
- Render failures do not always provide detailed error context

### 5. **Rate Limiting**

- Groq is prone to rate limit exhaustion on rapid requests
- No built-in rate limit handling or retry logic with exponential backoff

## API Routes

### POST `/api/chat`

Generate or modify a composition via LLM.

**Request:**

```json
{
  "message": "Add a title with a fade-in animation",
  "compositionHtml": "<div>...</div>",
  "llm": "gemini"
}
```

**Response:**

```json
{
  "compositionHtml": "<div>...</div>",
  "explanation": "Added a title element with GSAP fade-in",
  "llm": "gemini"
}
```

### POST `/api/render`

Render composition to `.webm` video.

**Request:**

```json
{
  "compositionHtml": "<div>...</div>",
  "width": 1080,
  "height": 1920,
  "duration": 10
}
```

**Response:** Streams `.webm` file

### POST `/api/download`

Get download link for rendered video.

**Request:**

```json
{
  "compositionHtml": "<div>...</div>"
}
```

**Response:**

```json
{
  "downloadUrl": "/renders/output-12345.webm"
}
```

## Development

### Run Development Server

```bash
npm run dev
```

### Run Linting & Type Checking

```bash
npm run lint
npm run type-check
```

## Deployment

This project is deployed on Render at: `<I'll add later>`

**⚠️ Render Free Tier Limitations:**
Please note that due to the resource constraints of Render's free tier (RAM/CPU limits), rendering is heavily restricted. Currently, **only a couple of seconds of video can be successfully rendered** into `.webm` on the live deployment. Attempting to render longer videos is likely to result in memory limits being exceeded or process timeouts.

## Testing

Current project does not include automated tests. To add:

1. Unit tests for composition validation
2. Integration tests for LLM chat flow
3. E2E tests for full workflow (chat → preview → render → download)

## Troubleshooting

### LLM Returns Invalid HTML

- Check the error message in the chat
- Try a simpler prompt
- Switch to Gemini if using Groq for better quality

### Render Fails or Takes Too Long

- Ensure FFmpeg is installed: `ffmpeg -version`
- Check available disk space for temporary render files
- Reduce composition complexity or duration
- Consider switching to GPU rendering if available

### Preview Not Updating

- Refresh the page
- Check browser console for errors
- Verify composition HTML is valid (check validation in chat)

### Rate Limit Errors

- Switch to Gemini (higher limits)
- Wait a few minutes before retrying
- Implement caching for frequently requested compositions

## Assignment Notes

This project was built as a Soundverse AI Software Engineer assignment. Key decisions and assessments:

1. **Framework Choice**: Next.js chosen for ease of integrating Hyperframes with a Node backend
2. **LLM Selection**: Dual LLM approach allows trading off speed vs. quality
3. **Rendering Pipeline**: CPU-based chosen for simplicity; GPU support deferred due to hardware constraints
4. **Known Gaps**:
   - MP4 export not implemented (.webm works reliably)
   - GPU acceleration not tested
   - No extensive error recovery
5. **Time Spent**: ~40–50 hours (est.)
