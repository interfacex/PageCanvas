import { normalizeWhitespace } from './sanitize.js';

export function fromAiDocument(value) {
  if (!value?.title?.trim() || !Array.isArray(value.sections)) throw new Error('AI 文档缺少标题或章节');
  return {
    id: crypto.randomUUID(), mode: 'ai', title: normalizeWhitespace(value.title), summary: normalizeWhitespace(value.summary),
    sections: value.sections.map(section => ({ heading: normalizeWhitespace(section.heading), paragraphs: (section.paragraphs || []).map(normalizeWhitespace).filter(Boolean), bullets: (section.bullets || []).map(normalizeWhitespace).filter(Boolean), images: [] })),
    source: { title: normalizeWhitespace(value.source?.title), url: String(value.source?.url || ''), capturedAt: new Date().toISOString() }
  };
}
