function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function distance(data, offset, color) {
  return Math.max(Math.abs(data[offset] - color[0]), Math.abs(data[offset + 1] - color[1]), Math.abs(data[offset + 2] - color[2]));
}

export function findHorizontalContentBounds(image, options = {}) {
  const { data, width, height } = image;
  if (!data || width < 4 || height < 4) return { left: 0, right: width, width };
  const tolerance = options.tolerance ?? 12;
  const requiredRatio = options.matchRatio ?? 0.96;
  const sampleRows = Array.from({ length: Math.min(height, 64) }, (_, index) => Math.min(height - 1, Math.round(index * (height - 1) / Math.max(1, Math.min(height, 64) - 1))));
  const edgeColor = x => [0, 1, 2].map(channel => median(sampleRows.map(y => data[(y * width + x) * 4 + channel])));
  const leftColor = edgeColor(0);const rightColor = edgeColor(width - 1);
  if (Math.max(...leftColor.map((value, index) => Math.abs(value - rightColor[index]))) > tolerance) return { left: 0, right: width, width };
  const columnMatches = x => sampleRows.filter(y => distance(data, (y * width + x) * 4, leftColor) <= tolerance).length / sampleRows.length >= requiredRatio;
  let left = 0;while (left < width && columnMatches(left)) left += 1;
  let right = width;while (right > left && columnMatches(right - 1)) right -= 1;
  if (left >= right || (left === 0 && right === width)) return { left: 0, right: width, width };
  return { left, right, width: right - left };
}
