export function captureProgress(current, total) {
  const safeTotal = Math.max(1, Math.trunc(Number(total) || 0));
  const safeCurrent = Math.min(safeTotal, Math.max(0, Math.trunc(Number(current) || 0)));
  return {
    current: safeCurrent,
    total: safeTotal,
    percent: Math.round((safeCurrent / safeTotal) * 100),
    label: `${safeCurrent} / ${safeTotal}`
  };
}
