import { buildChatUrl, requestBody, parseAiResponse, explainHttpError, planTextChunks } from '../shared/ai.js';
import { parseHeaders } from '../shared/config.js';
import { fromAiDocument } from '../shared/document.js';

export const AI_REQUEST_TIMEOUT_MS=240000;
const AI_TIMEOUT_MESSAGE='AI 服务响应超时，请稍后重试或减少提取内容';
const defaultSignalFactory=duration=>AbortSignal.timeout(duration);
function isAbortError(error){return['AbortError','TimeoutError'].includes(error?.name)||error?.code==='ABORT_ERR'||/user aborted|request aborted|operation was aborted|timed? out/i.test(String(error?.message||error));}
async function call(fetcher,config,content,signalFactory){
  let response;try{response=await fetcher(buildChatUrl(config.baseUrl),{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${config.apiKey}`,...parseHeaders(config.headers)},body:JSON.stringify(requestBody(config.model,content)),signal:signalFactory(AI_REQUEST_TIMEOUT_MS)});}catch(error){if(isAbortError(error))throw new Error(AI_TIMEOUT_MESSAGE);throw error;}
  if(!response.ok)throw new Error(explainHttpError(response.status));
  const json=await response.json();return parseAiResponse(json.choices?.[0]?.message?.content||'');
}
export async function extractWithModel(fetcher,config,document,{signalFactory=defaultSignalFactory}={}){
  const source=`来源标题：${document.source.title}\n来源网址：${document.source.url}\n标题：${document.title}\n${document.sections.flatMap(s=>[s.heading,...s.paragraphs,...s.bullets]).join('\n')}`;
  const chunks=planTextChunks(source,Math.max(4000,Number(config.maxChars)||60000));
  const results=[];for(const chunk of chunks)results.push(await call(fetcher,config,`整理以下网页内容：\n${chunk}`,signalFactory));
  const final=results.length===1?results[0]:await call(fetcher,config,`合并以下分段结果，去重并保留事实：\n${JSON.stringify(results)}`,signalFactory);
  return fromAiDocument(final);
}
export async function testModel(fetcher,config,{signalFactory=defaultSignalFactory}={}){return call(fetcher,config,'仅返回一个最小有效 JSON，标题为“连接成功”。',signalFactory);}
