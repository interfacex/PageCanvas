import { planResolutionSlices, scaledDimensions } from '../shared/resolution.js';

const DEFAULT_MAX_HEIGHT = 16000;

export function planDocumentRenderSlices(sourceWidth, sourceHeight, targetWidth, maxHeight = DEFAULT_MAX_HEIGHT) {
  const safeSourceWidth = Number(sourceWidth);
  const safeSourceHeight = Number(sourceHeight);
  if (!(safeSourceWidth > 0) || !(safeSourceHeight > 0)) {
    throw new Error('内容尺寸无效，无法生成导出图片');
  }
  const size = scaledDimensions(safeSourceWidth, safeSourceHeight, targetWidth);
  const scale = size.width / safeSourceWidth;
  const safeOutputHeight = Math.max(1, Math.min(maxHeight, Math.floor(maxHeight * scale)));
  return planResolutionSlices(size.height, safeOutputHeight).map((slice, index) => ({
    index,
    outputY: slice.y,
    outputHeight: slice.height,
    sourceY: slice.y / scale,
    sourceHeight: slice.height / scale,
  }));
}

function withoutImages(html) {
  return String(html).replace(/<img\b[^>]*>/gi, '');
}

export function buildSliceSvg({ sourceWidth, slice, html, style }) {
  const height = Math.max(1, slice.sourceHeight);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${sourceWidth}" height="${height}"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml" style="height:${height}px;overflow:hidden">${style}<article style="transform:translateY(-${slice.sourceY}px)">${html}</article></div></foreignObject></svg>`;
}

export async function renderDocumentSlices(options) {
  const {
    sourceWidth,
    sourceHeight,
    targetWidth,
    html,
    style = '',
    loadImage,
    createCanvas,
    onSlice,
    maxHeight = DEFAULT_MAX_HEIGHT,
  } = options;
  const slices = planDocumentRenderSlices(sourceWidth, sourceHeight, targetWidth, maxHeight);
  const outputWidth = scaledDimensions(sourceWidth, sourceHeight, targetWidth).width;
  const outputs = [];

  for (const slice of slices) {
    onSlice?.(slice.index + 1, slices.length);
    const render = async includeImages => {
      const svg = buildSliceSvg({
        sourceWidth,
        slice,
        html: includeImages ? html : withoutImages(html),
        style,
      });
      const image = await loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
      const output = createCanvas(outputWidth, slice.outputHeight);
      const context = output.getContext('2d');
      if (!context) throw new Error('浏览器无法创建图片画布');
      context.drawImage(image, 0, 0, outputWidth, slice.outputHeight);
      context.getImageData(0, 0, 1, 1);
      return output;
    };

    try {
      outputs.push(await render(true));
    } catch {
      try {
        outputs.push(await render(false));
      } catch {
        throw new Error(`第 ${slice.index + 1}/${slices.length} 张内容渲染失败，请降低输出分辨率或关闭“保留图片”后重试`);
      }
    }
  }
  return outputs;
}

export async function downloadRenderedSlices(outputs, { download, onProgress }) {
  for (const [index, output] of outputs.entries()) {
    onProgress?.(index + 1, outputs.length);
    await download(output, index + 1, outputs.length);
  }
}
