import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { readFile } from 'fs/promises';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const file = searchParams.get('file');
    logger.info('API/Download', 'File download requested', { file });

    if (!file || file.includes('..') || file.includes('/')) {
      return new NextResponse('Invalid file', { status: 400 });
    }

    const ext = file.split('.').pop() || 'webm';
    const filePath = join(process.cwd(), 'public', 'renders', file);
    
    const fileBuffer = await readFile(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': `video/${ext}`,
        'Content-Disposition': `attachment; filename="hyperframes-composition.${ext}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    logger.error('API/Download', 'Download error', error);
    return new NextResponse('File not found', { status: 404 });
  }
}
