export function planCapturePositions(pageHeight, viewportHeight) {
  if (pageHeight <= viewportHeight) return [0];
  const positions = [];
  for (let y = 0; y < pageHeight - viewportHeight; y += viewportHeight) positions.push(y);
  const last = pageHeight - viewportHeight;
  if (positions.at(-1) !== last) positions.push(last);
  return positions;
}

export function resolveCaptureY(plannedY, response) {
  return Number.isFinite(response?.y) ? response.y : plannedY;
}

export function planCanvasSlices(height, maxHeight = 16000) {
  const slices = [];
  for (let y = 0; y < height; y += maxHeight) slices.push({ y, height: Math.min(maxHeight, height - y) });
  return slices;
}
