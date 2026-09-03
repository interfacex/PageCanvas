import { DEFAULT_SELECTION, buildSelection } from './selection.js';
import { aiProgressText, completePreparedPreview, createAiProgressController, restoreControlsAfterTask, setControlsBusy, shouldStartAiProgress } from './ai-progress.js';
const status = document.querySelector('#status');
const confirmButton = document.querySelector('#confirmExport');
const selectionSummary = document.querySelector('#selectionSummary');
const selection = { ...DEFAULT_SELECTION };
const selectableButtons = [...document.querySelectorAll('[data-range], [data-processing]')];
const setStatus = (text, error = false) => { status.textContent = text; status.className = `status${error ? ' error' : ''}`; };
const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
document.querySelector('#pageTitle').textContent = tab?.title || '当前页面';
const { 'pagecanvas.modelConfig': config } = await chrome.storage.local.get('pagecanvas.modelConfig');
if (config?.model) document.querySelector('#modelState').textContent = config.model;
document.querySelector('#settings').addEventListener('click', () => chrome.runtime.openOptionsPage());

function setAiControlsLocked(locked) {
  setControlsBusy(confirmButton, selectableButtons, locked);
  document.body.classList.toggle('progressing', locked);
  document.body.setAttribute('aria-busy', String(locked));
}

function updateAiProgress(stage, percent) {
  selectionSummary.textContent = aiProgressText(stage, percent);
}

const aiProgress = createAiProgressController({
  now: () => Date.now(),
  schedule: (callback, delay) => window.setInterval(callback, delay),
  cancel: timer => window.clearInterval(timer),
  onProgress: updateAiProgress,
});

const wait = ms => new Promise(resolve => window.setTimeout(resolve, ms));

function refreshSelection() {
  document.querySelectorAll('[data-range]').forEach(button => {
    const selected = button.dataset.range === selection.range;
    button.classList.toggle('selected', selected);button.setAttribute('aria-checked', String(selected));
  });
  document.querySelectorAll('[data-processing]').forEach(button => {
    const selected = button.dataset.processing === selection.processing;
    button.classList.toggle('selected', selected);button.setAttribute('aria-checked', String(selected));
  });
  const plan = buildSelection(selection.range, selection.processing);
  selectionSummary.textContent = plan.summary;confirmButton.textContent = plan.confirm;setStatus('');
}

document.addEventListener('click', event => {
  const range = event.target.closest('[data-range]')?.dataset.range;
  const processing = event.target.closest('[data-processing]')?.dataset.processing;
  if (range) selection.range = range;
  if (processing) selection.processing = processing;
  if (range || processing) refreshSelection();
});

confirmButton.addEventListener('click', async () => {
  const plan = buildSelection(selection.range, selection.processing);
  const isAiProcessing = selection.processing === 'ai';
  const canStartAiProgress = shouldStartAiProgress(selection.processing, plan.route, config?.apiKey);
  let succeeded = false;
  try {
    if (isAiProcessing && !config?.apiKey) { chrome.runtime.openOptionsPage();return; }
    if (canStartAiProgress) {
      setAiControlsLocked(true);
      setStatus('');
      aiProgress.start();
    } else {
      confirmButton.disabled = true;
      setStatus('正在处理…');
    }
    let response;
    if (plan.route === 'START_REGION_CAPTURE') response = await chrome.runtime.sendMessage({ type: plan.route, tabId: tab.id, title: tab.title, processing: selection.processing });
    else if (plan.route === 'START_FULL_CAPTURE') response = await chrome.runtime.sendMessage({ type: plan.route, tabId: tab.id, title: tab.title });
    else response = await chrome.runtime.sendMessage({ type: plan.route, tabId: tab.id, mode: selection.processing });
    if (!response?.ok) throw new Error(response?.error || '处理失败');
    if (plan.route === 'PROCESS_PAGE') {
      const previewOpeningRequested = await completePreparedPreview({
        response,
        showAiProgress: canStartAiProgress,
        completeAi: () => aiProgress.complete(),
        waitAfterAiComplete: () => wait(150),
        openPreparedPreview: taskId => chrome.runtime.sendMessage({ type: 'OPEN_PREPARED_PREVIEW', taskId }),
      });
      if (!previewOpeningRequested) throw new Error('预览任务未准备完成');
    }
    succeeded = true;
  } catch (error) {
    aiProgress.stop();
    refreshSelection();
    setStatus(error instanceof Error ? error.message : String(error || '处理失败'), true);
  } finally {
    aiProgress.stop();
    restoreControlsAfterTask(succeeded, () => {
      if (canStartAiProgress) setAiControlsLocked(false);
      else confirmButton.disabled = false;
    });
  }
  if (succeeded) window.close();
});

refreshSelection();
