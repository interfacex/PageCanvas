(() => {
  if (globalThis.PageCanvasRegionAiProgress) return;
  let active = false;

  const errorText = error => {
    if (typeof error === 'string' && error.trim()) return error.trim();
    if (typeof error?.message === 'string' && error.message.trim()) return error.message.trim();
    return 'AI 框选处理失败，请重新开始';
  };

  function createController({ now, schedule, cancel, wait, render, fail, close }) {
    let timer;
    const clearTimer = () => {
      if (timer !== undefined) cancel(timer);
      timer = undefined;
    };
    return {
      start() {
        clearTimer();
        const startedAt = now();
        render('region-reading', 10);
        render('extracting', 30);
        timer = schedule(() => render('extracting', PageCanvasAiProgress.estimateAiProgress(now() - startedAt)), 500);
      },
      stop: clearTimer,
      async complete() {
        clearTimer();
        render('preview', 95);
        await wait(250);
        render('preview', 100);
      },
      reject(message) {
        clearTimer();
        fail(message);
      },
      close() {
        clearTimer();
        close?.();
      },
    };
  }

  async function run({ processing, send, openPrepared, controller }) {
    if (processing !== 'ai') return send();
    if (active) throw new Error('AI 框选任务正在处理，请稍候');
    active = true;
    controller.start();
    try {
      const response = await send();
      if (!response?.ok) throw new Error(response?.error || 'AI 框选处理失败，请重新开始');
      await controller.complete();
      if (response.previewPrepared) {
        const opened = await openPrepared(response.taskId);
        if (!opened?.ok) throw new Error(opened?.error || '无法打开预览标签');
      }
      controller.close();
      return response;
    } catch (error) {
      const message = errorText(error);
      controller.reject(message);
      throw new Error(message);
    } finally {
      active = false;
    }
  }

  globalThis.PageCanvasRegionAiProgress = Object.freeze({
    shouldTrack: processing => processing === 'ai',
    isActive: () => active,
    createController,
    run,
  });
})();
