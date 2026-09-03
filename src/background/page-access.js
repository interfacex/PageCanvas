export const CONTENT_SCRIPT_FILES = Object.freeze([
  'src/shared/ai-progress.js',
  'src/content/region-ai-progress.js',
  'src/content/content-script.js',
]);

export async function ensurePageAccess(tabId, tabsApi, scriptingApi) {
  try {
    const response = await tabsApi.sendMessage(tabId, { type: 'PAGECANVAS_PING' });
    if (response?.ok) return;
  } catch {}
  try {
    await scriptingApi.executeScript({ target: { tabId }, files: CONTENT_SCRIPT_FILES });
    const response = await tabsApi.sendMessage(tabId, { type: 'PAGECANVAS_PING' });
    if (!response?.ok) throw new Error('内容脚本启动失败');
  } catch (error) {
    const message = String(error?.message || error);
    if (/file:|Cannot access contents|permission/i.test(message)) {
      throw new Error('无法读取本地 HTML。请在 chrome://extensions 中打开页绘详情，开启“允许访问文件网址”，然后刷新页面重试。');
    }
    if (/chrome:|edge:|webstore|extensions gallery/i.test(message)) {
      throw new Error('Chrome 安全策略禁止插件处理此浏览器内部页面。');
    }
    throw new Error(`无法连接当前页面，请刷新页面后重试。${message}`);
  }
}
