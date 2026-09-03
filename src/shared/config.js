const forbidden = new Set(['authorization', 'content-type']);

export function parseHeaders(value = '{}') {
  const headers = typeof value === 'string' ? JSON.parse(value || '{}') : value;
  if (!headers || Array.isArray(headers) || typeof headers !== 'object') throw new Error('自定义请求头必须是 JSON 对象');
  for (const [key, val] of Object.entries(headers)) {
    if (forbidden.has(key.toLowerCase())) throw new Error(`不能覆盖请求头 ${key}`);
    if (typeof val !== 'string') throw new Error('请求头的值必须是字符串');
  }
  return headers;
}

export function validateConfig(config) {
  try {
    const url = new URL(config.baseUrl);
    const local = ['localhost', '127.0.0.1'].includes(url.hostname);
    if (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) throw new Error('接口地址必须使用 HTTPS');
    if (!String(config.apiKey || '').trim()) throw new Error('请输入 API Key');
    if (!String(config.model || '').trim()) throw new Error('请输入模型名称');
    parseHeaders(config.headers);
    return { ok: true, value: { ...config, baseUrl: url.href.replace(/\/$/, '') } };
  } catch (error) { return { ok: false, error: error.message }; }
}

export function originPattern(baseUrl) {
  const url = new URL(baseUrl);
  return `${url.protocol}//${url.host}/*`;
}
