import { NextRequest } from 'next/server';
import { wrapCompositionHtml } from '@/lib/hyperframes/validator';
import { spawn } from 'child_process';
import { writeFile, mkdir, readFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir, cpus } from 'os';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

/**
 * Render API route.
 * Writes composition HTML to a temp directory, runs hyperframes render,
 * and streams progress via SSE.
 *
 * Falls back to a direct file download if rendering completes.
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const { html, format = 'mp4', useDocker = false } = await request.json();
    logger.info('API/Render', 'Render request received', { format, useDocker });

    if (!html) {
      return new Response(JSON.stringify({ error: 'No composition HTML' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (format !== 'mp4' && format !== 'webm') {
      return new Response(JSON.stringify({ error: 'Unsupported render format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = uuidv4();
    const renderDir = join(tmpdir(), `hf-render-${token}`);
    await mkdir(renderDir, { recursive: true });

    // Write the full HTML file
    const fullHtml = wrapCompositionHtml(html);
    const htmlPath = join(renderDir, 'index.html');
    await writeFile(htmlPath, fullHtml, 'utf-8');

    const outputFile = `output.${format}`;
    const outputPath = join(renderDir, outputFile);

    // Create SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (data: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        sendEvent({ status: 'preprocessing', message: 'Preparing composition...' });

        try {
          // Use the project-local Hyperframes CLI. This keeps render requests
          // from depending on a network npx install at runtime.
          logger.info('API/Render', 'Starting hyperframes render job', { renderDir, format });
          const hyperframesBin = join(process.cwd(), 'node_modules', '.bin', 'hyperframes');
          const renderArgs = [
            'render',
            '--output',
            outputPath,
            '--format',
            format,
            '--quality',
            'high',
            '--fps',
            '30',
            '--workers',
            String(cpus().length),
            renderDir,
          ];
          if (useDocker) {
            renderArgs.push('--docker');
          }

          sendEvent({ status: 'rendering', message: 'Rendering frames...' });

          await new Promise<void>((resolve, reject) => {
            const child = spawn(hyperframesBin, renderArgs, {
              cwd: renderDir,
              env: {
                ...process.env,
                CI: '1',
                HYPERFRAMES_NO_UPDATE_CHECK: '1',
              },
            });

            let stderr = '';
            const timeout = setTimeout(() => {
              child.kill('SIGTERM');
              reject(new Error('Render timed out after 320 seconds'));
            }, 320000);

            child.stderr?.on('data', (data) => {
              stderr += String(data);
              // Parse progress from stderr if available
              const frameMatch = String(data).match(/(\d+)\/(\d+)/);
              if (frameMatch) {
                const progress = Math.round(
                  (parseInt(frameMatch[1]) / parseInt(frameMatch[2])) * 100
                );
                sendEvent({
                  status: 'rendering',
                  progress,
                  message: `Rendering frame ${frameMatch[1]} of ${frameMatch[2]}`,
                });
              }
            });

            child.stdout?.on('data', (data) => {
              logger.info('API/Render', 'Hyperframes output', { output: String(data).trim() });
            });

            child.on('close', (code) => {
              clearTimeout(timeout);
              if (code === 0) resolve();
              else reject(new Error(`Render failed (exit code ${code}): ${stderr.slice(-500)}`));
            });

            child.on('error', (error) => {
              clearTimeout(timeout);
              reject(error);
            });
          });

          sendEvent({ status: 'encoding', message: 'Encoding video...' });

          // Instead of base64 which breaks for large videos, move to public directory
          const publicRendersDir = join(process.cwd(), 'public', 'renders');
          await mkdir(publicRendersDir, { recursive: true });

          const publicFileName = `${token}.${format}`;
          const publicFilePath = join(publicRendersDir, publicFileName);

          // Copy the rendered video to the public folder so the frontend can download it
          await writeFile(publicFilePath, await readFile(outputPath));

          sendEvent({
            status: 'complete',
            message: 'Render complete!',
            downloadUrl: `/api/download?file=${publicFileName}`,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Render failed';
          logger.error('API/Render', 'Render error', { message });
          sendEvent({
            status: 'failed',
            message: `Render failed: ${message}. Server-side rendering requires FFmpeg, FFprobe, and Chrome. Docker is only needed when Docker rendering is enabled.`,
          });
        } finally {
          // Clean up temp files but NOT the public file
          await rm(renderDir, { recursive: true, force: true }).catch(() => {});
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    logger.error('API/Render', 'Render API error', error);
    return new Response(
      JSON.stringify({ error: 'Failed to start render' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
