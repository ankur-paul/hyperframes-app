/**
 * Lightweight Hyperframes HTML validator.
 * Checks for the most critical composition requirements without
 * depending on @hyperframes/core (which is a heavy Node dependency).
 */

export interface LintResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateCompositionHtml(html: string): LintResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Must have data-composition-id
  if (!html.includes('data-composition-id')) {
    errors.push('Missing data-composition-id on root element');
  }

  // 2. Must have data-width and data-height
  if (!html.includes('data-width')) {
    errors.push('Missing data-width on composition root');
  }
  if (!html.includes('data-height')) {
    errors.push('Missing data-height on composition root');
  }

  // 3. Check for GSAP timeline registration
  if (html.includes('gsap.timeline') && !html.includes('window.__timelines')) {
    errors.push(
      'GSAP timeline created but not registered on window.__timelines. Add: window.__timelines = window.__timelines || {}; window.__timelines["<id>"] = tl;'
    );
  }

  // 4. Check that GSAP timeline is paused
  if (html.includes('gsap.timeline') && !html.includes('paused: true') && !html.includes('paused:true')) {
    errors.push('GSAP timeline must be created with { paused: true }');
  }

  // 5. Check for class="clip" on timed elements
  const timedElements = html.match(/data-start="[^"]*"[^>]*data-duration="[^"]*"/g) || [];
  const clipElements = html.match(/class="[^"]*clip[^"]*"/g) || [];

  // Rough check: we should have at least some clip classes if there are timed elements
  // (audio elements don't need class="clip")
  if (timedElements.length > 0 && clipElements.length === 0) {
    const hasOnlyAudio = !html.match(/<(?:div|h[1-6]|p|span|img|video)[^>]*data-start/);
    if (!hasOnlyAudio) {
      warnings.push(
        'Timed visible elements should have class="clip" for proper visibility timing'
      );
    }
  }

  // 6. Check video elements have muted
  const videoElements = html.match(/<video[^>]*>/g) || [];
  for (const video of videoElements) {
    if (!video.includes('muted')) {
      warnings.push('Video elements should have the "muted" attribute to prevent autoplay issues');
      break;
    }
  }

  // 7. Check for data-start on root
  if (html.includes('data-composition-id') && !html.match(/data-composition-id[^>]*data-start/)) {
    warnings.push('Composition root should have data-start="0"');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Wraps composition HTML in a full HTML document for rendering/preview.
 */
export function wrapCompositionHtml(compositionHtml: string): string {
  // Extract any <style> blocks from the composition
  const styleBlocks = compositionHtml.match(/<style[\s\S]*?<\/style>/g) || [];
  const scriptBlocks = compositionHtml.match(/<script[\s\S]*?<\/script>/g) || [];
  const linkBlocks = compositionHtml.match(/<link[^>]*>/g) || [];

  // Remove styles, scripts, and links from composition HTML for re-ordering
  let cleanedHtml = compositionHtml;
  for (const style of styleBlocks) cleanedHtml = cleanedHtml.replace(style, '');
  for (const script of scriptBlocks) cleanedHtml = cleanedHtml.replace(script, '');
  for (const link of linkBlocks) cleanedHtml = cleanedHtml.replace(link, '');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${linkBlocks.join('\n  ')}
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #000;
    }
  </style>
  ${styleBlocks.join('\n  ')}
</head>
<body>
  ${cleanedHtml.trim()}
  ${scriptBlocks.join('\n  ')}
</body>
</html>`;
}
