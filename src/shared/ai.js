export const SYSTEM_PROMPT = `你是网页内容编辑。删除广告、导航和重复信息，保留事实、重要细节与原意。只返回 JSON：{"title":"","summary":"","sections":[{"heading":"","paragraphs":[""],"bullets":[""]}],"source":{"title":"","url":""}}。不要返回 HTML。`;

export function buildChatUrl(baseUrl) { return `${baseUrl.replace(/\/$/, '')}/chat/completions`; }

export function planTextChunks(text, limit) {
  const chunks = [];
  for (let i = 0; i < text.length; i += limit) chunks.push(text.slice(i, i + limit));
  return chunks.length ? chunks : [''];
}

export function parseAiResponse(raw) {
  const clean = String(raw).trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const value = JSON.parse(clean);
  if (!value.title?.trim() || !Array.isArray(value.sections)) throw new Error('模型返回的数据结构不完整');
  value.summary = String(value.summary || '');
  value.source ||= { title: '', url: '' };
  return value;
}

export function requestBody(model, content) {
  return { model, temperature: 0.2, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content }] };
}

export function explainHttpError(status) {
  if ([401, 403].includes(status)) return '鉴权失败，请检查 API Key、模型和服务权限';
  if (status === 429) return '请求过于频繁或额度不足，请稍后重试';
  return `模型服务请求失败（HTTP ${status}）`;
}
