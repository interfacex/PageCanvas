export function normalizeWhitespace(value = '') { return String(value).replace(/\s+/g, ' ').trim(); }

export function safeMediaUrl(value, baseUrl) {
  try {
    const url = new URL(value, baseUrl);
    return ['http:', 'https:', 'data:', 'blob:'].includes(url.protocol) ? url.href : '';
  } catch { return ''; }
}

export function scoreCandidate({ textLength = 0, linkTextLength = 0, paragraphs = 0 }) {
  const density = textLength ? 1 - Math.min(1, linkTextLength / textLength) : 0;
  return textLength * density + paragraphs * 80;
}
