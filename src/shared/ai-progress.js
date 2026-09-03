(() => {
  const MIN_PROGRESS = 30;
  const MAX_PROGRESS = 90;
  const TIME_CONSTANT_MS = 10000;

  function estimateAiProgress(elapsedMs) {
    const elapsed = Math.max(0, Number(elapsedMs) || 0);
    const progress = MIN_PROGRESS + (MAX_PROGRESS - MIN_PROGRESS) * (1 - Math.exp(-elapsed / TIME_CONSTANT_MS));
    return Math.min(MAX_PROGRESS, Math.round(progress));
  }

  function aiProgressText(stage, percent) {
    const estimate = Math.max(0, Math.min(100, Math.round(Number(percent) || 0)));
    if (stage === 'reading') return `正在读取页面 · 估算 ${estimate}%`;
    if (stage === 'region-reading') return `正在整理框选内容 · 估算 ${estimate}%`;
    if (stage === 'extracting') return `AI 正在提取 · 估算 ${estimate}%`;
    if (stage === 'preview') return `正在生成预览 · 估算 ${estimate}%`;
    return `正在处理 · 估算 ${estimate}%`;
  }

  globalThis.PageCanvasAiProgress = Object.freeze({ estimateAiProgress, aiProgressText });
})();
