const PNG_TOO_LARGE_MESSAGE = '图片尺寸过大，请降低输出分辨率后重试';

export function errorMessage(error, fallback = '操作失败，请重试') {
  const safeFallback = typeof fallback === 'string' && fallback.trim()
    ? fallback
    : '操作失败，请重试';
  if (typeof error === 'string' && error.trim()) return error;
  if (error && typeof error.message === 'string' && error.message.trim()) return error.message;
  return safeFallback;
}

export function canvasToPngBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) {
        reject(new Error(PNG_TOO_LARGE_MESSAGE));
        return;
      }
      resolve(blob);
    }, 'image/png');
  });
}

export async function downloadCanvas(canvas, filename, deps = {}) {
  const urlApi = deps.urlApi || URL;
  const createAnchor = deps.createAnchor || (() => document.createElement('a'));
  const schedule = deps.schedule || ((callback, delay) => setTimeout(callback, delay));
  const blob = await canvasToPngBlob(canvas);
  const objectUrl = urlApi.createObjectURL(blob);
  let revoked = false;
  const revoke = () => {
    if (revoked) return;
    revoked = true;
    urlApi.revokeObjectURL(objectUrl);
  };
  try {
    const anchor = createAnchor();
    anchor.download = filename;
    anchor.href = objectUrl;
    anchor.click();
    anchor.remove?.();
    schedule(revoke, 1000);
  } catch (error) {
    try {
      revoke();
    } catch {}
    throw error;
  }
}

export async function copyCanvas(canvas, deps = {}) {
  const clipboard = deps.clipboard ?? globalThis.navigator?.clipboard;
  const ClipboardItemCtor = deps.ClipboardItemCtor ?? globalThis.ClipboardItem;
  if (typeof clipboard?.write !== 'function' || typeof ClipboardItemCtor !== 'function') {
    throw new Error('当前环境不支持复制图片，请使用“下载 PNG”');
  }
  const blob = await canvasToPngBlob(canvas);
  await clipboard.write([new ClipboardItemCtor({ 'image/png': blob })]);
}
