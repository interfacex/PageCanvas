export function normalizeSelection(start, end, minimum = 40) {
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);
  return width < minimum || height < minimum ? null : { x, y, width, height };
}

export function toImageCrop(rect, viewport, image) {
  const scaleX = image.width / viewport.width;
  const scaleY = image.height / viewport.height;
  return {
    x: Math.round(rect.x * scaleX),
    y: Math.round(rect.y * scaleY),
    width: Math.round(rect.width * scaleX),
    height: Math.round(rect.height * scaleY)
  };
}
