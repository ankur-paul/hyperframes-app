import { NextRequest, NextResponse } from 'next/server';
import { wrapCompositionHtml } from '@/lib/hyperframes/validator';
import { logger } from '@/lib/logger';

/**
 * Serves composition HTML for the hyperframes-player.
 * The player loads compositions via src attribute pointing to an HTML file.
 * This route dynamically generates that HTML from the stored composition state.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { html } = await request.json();
    logger.info('API/Composition', 'Serving composition HTML', { length: html?.length });

    if (!html) {
      return new NextResponse('No composition HTML provided', { status: 400 });
    }

    const fullHtml = wrapCompositionHtml(html);

    return new NextResponse(fullHtml, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    logger.error('API/Composition', 'Composition serve error', error);
    return new NextResponse('Error serving composition', { status: 500 });
  }
}
