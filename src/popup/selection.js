export const DEFAULT_SELECTION = Object.freeze({ range: 'full', processing: 'direct' });

const ranges = { region: '自由框选区域', full: '整个页面' };
const processingLabels = { direct: '默认直接导出', traditional: '传统提取', ai: 'AI 智能提取' };

export function buildSelection(range, processing) {
  if (!ranges[range] || !processingLabels[processing]) return null;
  const route = range === 'region' ? 'START_REGION_CAPTURE' : processing === 'direct' ? 'START_FULL_CAPTURE' : 'PROCESS_PAGE';
  return { range, processing, summary: `${ranges[range]} · ${processingLabels[processing]}`, confirm: range === 'region' ? '开始框选' : '开始导出', route };
}
