export const PREVIEW_TASK_TTL_MS = 10 * 60 * 1000;
export const PREVIEW_OPEN_FALLBACK_MS = 1200;
const inFlightPreviewOpens = new Map();

export function previewTaskKey(taskKey, taskId) {
  if (!taskId) throw new Error('预览任务不存在');
  return `${taskKey}.${taskId}`;
}

export async function preparePreview(sessionStorage, taskKey, task, idFactory = () => crypto.randomUUID(), now = () => Date.now()) {
  // A popup can be closed after PROCESS_PAGE prepares a task; this TTL is the cleanup fallback.
  const createdAt = now();
  const prefix = `${taskKey}.`;
  const stored = await sessionStorage.get(null);
  const expiredKeys = Object.entries(stored)
    .filter(([key, value]) => key.startsWith(prefix) && Number.isFinite(value?.createdAt) && createdAt - value.createdAt > PREVIEW_TASK_TTL_MS)
    .map(([key]) => key);
  if (expiredKeys.length) await sessionStorage.remove(expiredKeys);
  const taskId = idFactory();
  await sessionStorage.set({ [previewTaskKey(taskKey, taskId)]: { ...task, createdAt } });
  return taskId;
}

export function openPreparedPreview(tabsApi, runtimeApi, taskId, sessionStorage, taskKey, now = () => Date.now()) {
  if (!taskId) return Promise.reject(new Error('预览任务不存在'));
  const key = previewTaskKey(taskKey, taskId);
  const inFlight = inFlightPreviewOpens.get(key);
  if (inFlight) return inFlight;
  let opening;
  opening = (async () => {
    try {
      const task = (await sessionStorage.get(key))[key];
      if (!task || task.openingAt || task.openedAt) return { ok: true, alreadyOpening: true };
      await sessionStorage.set({ [key]: { ...task, openingAt: now() } });
      await tabsApi.create({ url: `${runtimeApi.getURL('src/preview/preview.html')}?taskId=${encodeURIComponent(taskId)}` });
      return { ok: true };
    } catch (error) {
      const task = (await sessionStorage.get(key))[key];
      if (task?.openingAt) {
        const { openingAt, openedAt, ...readyTask } = task;
        await sessionStorage.set({ [key]: readyTask }).catch(() => {});
      }
      throw error;
    } finally {
      if (inFlightPreviewOpens.get(key) === opening) inFlightPreviewOpens.delete(key);
    }
  })();
  inFlightPreviewOpens.set(key, opening);
  return opening;
}

export function schedulePreparedPreviewFallback(taskId, open, schedule = (callback, delay) => setTimeout(callback, delay)) {
  return schedule(async () => {
    try { await open(taskId); } catch {}
  }, PREVIEW_OPEN_FALLBACK_MS);
}

export async function consumePreviewTask(sessionStorage, taskKey, taskId, initialize) {
  const key = previewTaskKey(taskKey, taskId);
  const task = (await sessionStorage.get(key))[key];
  if (!task) throw new Error('预览任务已过期');
  await initialize(task);
  await sessionStorage.remove(key);
  return task;
}
