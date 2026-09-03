import '../shared/ai-progress.js';

export const { estimateAiProgress, aiProgressText } = globalThis.PageCanvasAiProgress;

export function shouldStartAiProgress(processing, route, apiKey) {
  return processing === 'ai' && route === 'PROCESS_PAGE' && Boolean(apiKey);
}

export function setControlsBusy(confirmButton, selectableButtons, busy) {
  confirmButton.disabled = busy;
  confirmButton.setAttribute('aria-busy', String(busy));
  selectableButtons.forEach(button => { button.disabled = busy; });
}

export function restoreControlsAfterTask(succeeded, unlock) {
  if (!succeeded) unlock();
}

export async function completePreparedPreview({ response, showAiProgress, completeAi, waitAfterAiComplete, openPreparedPreview }) {
  if (!response?.previewPrepared) return false;
  if (showAiProgress) {
    if (!await completeAi()) throw new Error('AI 处理已取消');
    await waitAfterAiComplete();
  }
  const opened = await openPreparedPreview(response.taskId);
  if (!opened?.ok) throw new Error(opened?.error || '无法打开预览');
  return true;
}

export function createAiProgressController({ now, schedule, cancel, onProgress }) {
  let extractionTimer;
  let completionTimer;
  let pendingCompletion;
  let generation = 0;

  function clearExtractionTimer() {
    if (extractionTimer !== undefined) cancel(extractionTimer);
    extractionTimer = undefined;
  }

  function clearCompletionTimer(result = false) {
    if (completionTimer !== undefined) cancel(completionTimer);
    completionTimer = undefined;
    if (pendingCompletion) pendingCompletion(result);
    pendingCompletion = undefined;
  }

  function stop() {
    generation += 1;
    clearExtractionTimer();
    clearCompletionTimer();
  }

  return {
    start() {
      stop();
      const activeGeneration = ++generation;
      const startedAt = now();
      onProgress('reading', 10);
      extractionTimer = schedule(() => {
        if (activeGeneration !== generation || extractionTimer === undefined) return;
        onProgress('extracting', estimateAiProgress(now() - startedAt));
      }, 500);
    },
    stop,
    complete() {
      generation += 1;
      clearExtractionTimer();
      clearCompletionTimer();
      const activeGeneration = generation;
      onProgress('preview', 95);
      return new Promise(resolve => {
        pendingCompletion = resolve;
        completionTimer = schedule(() => {
          if (activeGeneration !== generation || completionTimer === undefined) return;
          const completedTimer = completionTimer;
          completionTimer = undefined;
          cancel(completedTimer);
          onProgress('preview', 100);
          pendingCompletion = undefined;
          resolve(true);
        }, 250);
      });
    },
  };
}
