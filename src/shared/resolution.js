export const RESOLUTION_OPTIONS = Object.freeze([
  { width: 720, label: '720 px · 轻量' },
  { width: 1080, label: '1080 px · 高清' },
  { width: 1440, label: '1440 px · 超清' },
  { width: 2160, label: '2160 px · 2K 长图' },
  { width: 2880, label: '2880 px · 高精细' },
  { width: 3840, label: '3840 px · 4K' }
]);

export function scaledDimensions(sourceWidth, sourceHeight, targetWidth) {
  const width = Math.max(1, Math.round(Number(targetWidth) || sourceWidth));
  return { width, height: Math.max(1, Math.round(sourceHeight * width / sourceWidth)) };
}

export function planResolutionSlices(height, maxHeight = 16000) {
  const slices = [];
  for (let y = 0; y < height; y += maxHeight) slices.push({ y, height: Math.min(maxHeight, height - y) });
  return slices;
}

export function exportFilename(width, index = 1, total = 1, timestamp = Date.now()) {
  const part = total > 1 ? `-${String(index).padStart(2, '0')}-of-${String(total).padStart(2, '0')}` : '';
  return `PageCanvas-${width}px${part}-${timestamp}.png`;
}
