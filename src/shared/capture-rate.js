export const CAPTURE_MIN_INTERVAL_MS = 550;
const CAPTURE_QUOTA_ERROR = 'MAX_CAPTURE_VISIBLE_TAB_CALLS_PER_SECOND';

const defaultSleep = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

export function createCaptureScheduler({
  now = Date.now,
  sleep = defaultSleep,
  minInterval = CAPTURE_MIN_INTERVAL_MS
} = {}) {
  let tail = Promise.resolve();
  let lastStartedAt = null;

  const start = async task => {
    if (lastStartedAt !== null) {
      const remaining = minInterval - (now() - lastStartedAt);
      if (remaining > 0) await sleep(remaining);
    }
    lastStartedAt = now();
    try {
      return await task();
    } catch (error) {
      if (!String(error?.message || error).includes(CAPTURE_QUOTA_ERROR)) throw error;
      await sleep(minInterval);
      lastStartedAt = now();
      return task();
    }
  };

  return {
    run(task) {
      const result = tail.then(() => start(task), () => start(task));
      tail = result.catch(() => {});
      return result;
    }
  };
}
