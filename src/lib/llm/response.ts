export function parseJsonResponse(
  raw: string
): { explanation: string; html: string } | null {
  try {
    const parsed = JSON.parse(raw.trim());
    if (
      typeof parsed.html === 'string' &&
      typeof parsed.explanation === 'string'
    ) {
      return parsed as { explanation: string; html: string };
    }
  } catch {
    // fall through
  }

  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try {
      const parsed = JSON.parse(fenceMatch[1].trim());
      if (
        typeof parsed.html === 'string' &&
        typeof parsed.explanation === 'string'
      ) {
        return parsed as { explanation: string; html: string };
      }
    } catch {
      // fall through
    }
  }

  const htmlMatch = raw.match(/<div[^>]+id=["']root["'][^>]*>[\s\S]*<\/div>/);
  if (htmlMatch) {
    return {
      explanation: 'Composition generated.',
      html: htmlMatch[0],
    };
  }

  return null;
}

export function sanitiseHtml(html: string): string {
  return html
    .replace(/<!DOCTYPE[^>]*>/gi, '')
    .replace(/<\/?html[^>]*>/gi, '')
    .replace(/<\/?head[^>]*>/gi, '')
    .replace(/<\/?body[^>]*>/gi, '')
    .trim();
}

