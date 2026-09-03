import { CONFIG_KEY, TASK_KEY } from '../shared/constants.js';
import { extractWithModel, testModel } from './model-client.js';
import { ensurePageAccess } from './page-access.js';
import { createCaptureScheduler } from '../shared/capture-rate.js';
import { openPreparedPreview, preparePreview, schedulePreparedPreviewFallback } from './preview-task.js';

const safeName = value => String(value||'pagecanvas').replace(/[\\/:*?"<>|]+/g,'-').slice(0,80);
const captureScheduler=createCaptureScheduler();const captureVisibleTab=(windowId,options={format:'png'})=>captureScheduler.run(()=>chrome.tabs.captureVisibleTab(windowId,options));
async function openPreview(document){const taskId=await preparePreview(chrome.storage.session,TASK_KEY,{kind:'document',document});await openPreparedPreview(chrome.tabs,chrome.runtime,taskId,chrome.storage.session,TASK_KEY);}
chrome.runtime.onMessage.addListener((message,sender,send)=>{(async()=>{
  if(message.type==='OPEN_PREVIEW'){await openPreview(message.document);return{ok:true};}
  if(message.type==='OPEN_PREPARED_PREVIEW'){await openPreparedPreview(chrome.tabs,chrome.runtime,message.taskId,chrome.storage.session,TASK_KEY);return{ok:true};}
  if(message.type==='AI_EXTRACT'){const config=(await chrome.storage.local.get(CONFIG_KEY))[CONFIG_KEY];if(!config)throw new Error('请先配置模型');const document=await extractWithModel(fetch,config,message.document);await openPreview(document);return{ok:true};}
  if(message.type==='PROCESS_PAGE'){
    await ensurePageAccess(message.tabId,chrome.tabs,chrome.scripting);
    const extracted=await chrome.tabs.sendMessage(message.tabId,{type:'EXTRACT_DOCUMENT'});if(!extracted?.ok)throw new Error(extracted?.error||'无法提取页面内容');
    let document=extracted.document;
    if(message.mode==='ai'){const config=(await chrome.storage.local.get(CONFIG_KEY))[CONFIG_KEY];if(!config)throw new Error('请先配置模型');document=await extractWithModel(fetch,config,extracted.document);}
    const taskId=await preparePreview(chrome.storage.session,TASK_KEY,{kind:'document',document});
    // MV3 keeps this short fallback within the worker idle window when a popup is closed before it can open the prepared task.
    schedulePreparedPreviewFallback(taskId,id=>openPreparedPreview(chrome.tabs,chrome.runtime,id,chrome.storage.session,TASK_KEY));
    return{ok:true,previewPrepared:true,taskId};
  }
  if(message.type==='TEST_MODEL'){const config=(await chrome.storage.local.get(CONFIG_KEY))[CONFIG_KEY];await testModel(fetch,config);return{ok:true};}
  if(message.type==='START_REGION_CAPTURE'){await ensurePageAccess(message.tabId,chrome.tabs,chrome.scripting);const response=await chrome.tabs.sendMessage(message.tabId,{type:'BEGIN_REGION_SELECTION',processing:message.processing||'direct'});if(!response?.ok)throw new Error(response?.error||'无法启动框选工具');return{ok:true};}
  if(message.type==='REGION_SELECTED'){
    if(message.processing!=='direct'){
      if(!message.document?.sections?.length)throw new Error('圈选范围内没有可提取内容');
      if(message.processing==='ai'){const config=(await chrome.storage.local.get(CONFIG_KEY))[CONFIG_KEY];if(!config)throw new Error('请先配置模型');const document=await extractWithModel(fetch,config,message.document);const taskId=await preparePreview(chrome.storage.session,TASK_KEY,{kind:'document',document});schedulePreparedPreviewFallback(taskId,id=>openPreparedPreview(chrome.tabs,chrome.runtime,id,chrome.storage.session,TASK_KEY));return{ok:true,previewPrepared:true,taskId};}else await openPreview(message.document);
      return{ok:true};
    }
    const dataUrl=await captureVisibleTab(sender.tab?.windowId,{format:'png'});
    const taskId=await preparePreview(chrome.storage.session,TASK_KEY,{kind:'regionCapture',dataUrl,rect:message.rect,viewport:message.viewport,title:sender.tab?.title||'框选区域'});
    await openPreparedPreview(chrome.tabs,chrome.runtime,taskId,chrome.storage.session,TASK_KEY);return{ok:true};
  }
  if(message.type==='CAPTURE_VIEWPORT'){const dataUrl=await captureVisibleTab(sender.tab?.windowId,{format:'png'});await chrome.downloads.download({url:dataUrl,filename:`PageCanvas-${safeName(message.title)}.png`,saveAs:true});return{ok:true};}
  if(message.type==='START_FULL_CAPTURE'){
    await ensurePageAccess(message.tabId,chrome.tabs,chrome.scripting);
    const metrics=await chrome.tabs.sendMessage(message.tabId,{type:'PAGE_METRICS'});if(!metrics?.ok)throw new Error('无法测量页面');
    const taskId=await preparePreview(chrome.storage.session,TASK_KEY,{kind:'fullCapture',tabId:message.tabId,title:message.title,metrics});await openPreparedPreview(chrome.tabs,chrome.runtime,taskId,chrome.storage.session,TASK_KEY);return{ok:true};
  }
  if(message.type==='CAPTURE_TAB_FRAME'){const tab=await chrome.tabs.get(message.tabId);await chrome.tabs.update(message.tabId,{active:true});await new Promise(resolve=>setTimeout(resolve,120));return{ok:true,dataUrl:await captureVisibleTab(tab.windowId,{format:'png'})};}
  if(message.type==='ACTIVATE_CAPTURE_TAB'){await chrome.tabs.update(message.tabId,{active:true});return{ok:true};}
  if(message.type==='ACTIVATE_SENDER'){if(sender.tab?.id)await chrome.tabs.update(sender.tab.id,{active:true});return{ok:true};}
  return{ok:false,error:'未知请求'};
})().then(send).catch(error=>send({ok:false,error:error.message}));return true;});
