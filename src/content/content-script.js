(() => {
  if (globalThis.__pagecanvasContentScriptLoaded) return;
  globalThis.__pagecanvasContentScriptLoaded = true;
  const noisy = 'script,style,noscript,template,nav,footer,form,button,input,select,textarea,[hidden],[aria-hidden="true"],.ad,.ads,.advertisement,.comment,.comments,.recommend,.related';
  const text = value => String(value || '').replace(/\s+/g, ' ').trim();
  let closeRegionSelection = null;
  let fullCaptureProgress = null;
  let regionAiProgressCard = null;
  let restoreScrollCaptureSession = null;
  function beginScrollCaptureSession() {
    restoreScrollCaptureSession?.();
    const properties=[['scroll-behavior','auto'],['scroll-snap-type','none']];const elements=[document.documentElement,document.body].filter(Boolean);const saved=[];
    for(const element of elements){for(const [property,value] of properties){saved.push({element,property,value:element.style.getPropertyValue(property),priority:element.style.getPropertyPriority(property)});element.style.setProperty(property,value,'important');}}
    const restore=()=>{for(const item of saved){if(item.value)item.element.style.setProperty(item.property,item.value,item.priority);else item.element.style.removeProperty(item.property);}if(restoreScrollCaptureSession===restore)restoreScrollCaptureSession=null;};
    restoreScrollCaptureSession=restore;
  }
  function scrollForCapture(message,send) {
    fullCaptureProgress?.render(message.current,message.total);if(fullCaptureProgress)fullCaptureProgress.host.style.visibility='visible';
    scrollTo({left:0,top:message.y,behavior:'instant'});let previous=null;let stableFrames=0;let attempts=0;let settled=false;let timeoutId;
    const finish=()=>{if(settled)return;settled=true;clearTimeout(timeoutId);if(fullCaptureProgress)fullCaptureProgress.host.style.visibility='hidden';send({ok:true,y:Math.round(scrollY)});};
    const inspect=()=>{if(settled)return;const actual=Math.round(scrollY);stableFrames=actual===previous?stableFrames+1:0;previous=actual;attempts+=1;if(stableFrames>=2||attempts>=30){finish();return;}requestAnimationFrame(inspect);};
    timeoutId=setTimeout(finish,800);requestAnimationFrame(inspect);
  }
  function restoreScrollPosition(y,send) {
    scrollTo({left:0,top:y,behavior:'instant'});let settled=false;let timeoutId;const finish=()=>{if(settled)return;settled=true;clearTimeout(timeoutId);restoreScrollCaptureSession?.();send({ok:true,y:Math.round(scrollY)});};timeoutId=setTimeout(finish,400);requestAnimationFrame(()=>requestAnimationFrame(finish));
  }
  function beginFullCaptureProgress(total) {
    fullCaptureProgress?.close();
    const host=document.createElement('div');host.id='pagecanvas-progress-host';host.style.cssText='position:fixed;top:16px;right:16px;z-index:2147483646;pointer-events:none;visibility:visible;';
    const shadow=host.attachShadow({mode:'closed'});const style=document.createElement('style');style.textContent=`*{box-sizing:border-box}.card{width:286px;padding:16px;border:1px solid #ffffff24;border-radius:14px;background:#17191ff2;color:#fff;box-shadow:0 14px 40px #0005;font:13px/1.45 system-ui,-apple-system,sans-serif;backdrop-filter:blur(14px)}.top{display:flex;align-items:center;justify-content:space-between;gap:12px}.title{font-size:14px;font-weight:650;letter-spacing:.01em}.percent{color:#aeb1ff;font-weight:700}.track{height:5px;margin:12px 0 10px;overflow:hidden;border-radius:999px;background:#ffffff24}.bar{height:100%;width:0;border-radius:inherit;background:linear-gradient(90deg,#7477ff,#9d7bff);transition:width .18s ease}.meta{display:flex;justify-content:space-between;color:#c9cad2;font-size:12px}.warning{margin-top:10px;padding-top:10px;border-top:1px solid #ffffff1c;color:#f0d89a;font-size:12px}.card.error .percent,.card.error .warning{color:#ffb4b4}.card.error .bar{background:#ef6a6a}`;
    const card=document.createElement('div');card.className='card';card.innerHTML='<div class="top"><span class="title">正在生成长图</span><span class="percent">0%</span></div><div class="track"><div class="bar"></div></div><div class="meta"><span class="phase">正在准备页面</span><span class="count">0 / 1</span></div><div class="warning">请勿切换标签页、最小化或关闭页面</div>';
    shadow.append(style,card);document.documentElement.append(host);const percent=card.querySelector('.percent');const bar=card.querySelector('.bar');const phase=card.querySelector('.phase');const count=card.querySelector('.count');
    const render=(current,nextTotal=total)=>{const safeTotal=Math.max(1,Math.trunc(Number(nextTotal)||0));const safeCurrent=Math.min(safeTotal,Math.max(0,Math.trunc(Number(current)||0)));const value=Math.round(safeCurrent/safeTotal*100);card.classList.remove('error');card.querySelector('.title').textContent='正在生成长图';card.querySelector('.warning').textContent='请勿切换标签页、最小化或关闭页面';percent.textContent=`${value}%`;bar.style.width=`${value}%`;phase.textContent=safeCurrent?'正在滚动并捕获页面':'正在准备页面';count.textContent=`${safeCurrent} / ${safeTotal}`;};
    const close=()=>{host.remove();if(fullCaptureProgress?.host===host)fullCaptureProgress=null;};
    const fail=message=>{host.style.visibility='visible';card.classList.add('error');card.querySelector('.title').textContent='长图导出失败';card.querySelector('.warning').textContent='请回到插件重新开始';phase.textContent=message||'页面捕获已中断';setTimeout(close,6000);};
    fullCaptureProgress={host,render,close,fail};render(0,total);return {ok:true};
  }
  function createRegionAiProgressCard() {
    regionAiProgressCard?.close();
    const host=document.createElement('div');host.id='pagecanvas-region-ai-progress-host';host.style.cssText='position:fixed;top:16px;right:16px;z-index:2147483646;pointer-events:none;visibility:visible;';
    const shadow=host.attachShadow({mode:'closed'});const style=document.createElement('style');style.textContent=`*{box-sizing:border-box}.card{width:300px;padding:16px;border:1px solid #ffffff24;border-radius:14px;background:#17191ff2;color:#fff;box-shadow:0 14px 40px #0005;font:13px/1.45 system-ui,-apple-system,sans-serif;backdrop-filter:blur(14px)}.top{display:flex;align-items:center;justify-content:space-between;gap:12px}.title{font-size:14px;font-weight:650}.percent{color:#aeb1ff;font-weight:700}.track{height:5px;margin:12px 0 10px;overflow:hidden;border-radius:999px;background:#ffffff24}.bar{height:100%;width:0;border-radius:inherit;background:linear-gradient(90deg,#7477ff,#9d7bff);transition:width .2s ease}.phase{color:#c9cad2;font-size:12px}.warning{margin-top:10px;padding-top:10px;border-top:1px solid #ffffff1c;color:#f0d89a;font-size:12px}.close{display:none;margin-top:12px;border:1px solid #ffffff2b;border-radius:7px;background:#ffffff12;color:#fff;padding:6px 10px;pointer-events:auto;cursor:pointer}.card.error .percent,.card.error .warning{color:#ffb4b4}.card.error .bar{background:#ef6a6a}.card.error .close{display:inline-block}`;
    const card=document.createElement('div');card.className='card';card.innerHTML='<div class="top"><span class="title">AI 智能提取</span><span class="percent">10%</span></div><div class="track"><div class="bar"></div></div><div class="phase">正在整理框选内容 · 估算 10%</div><div class="warning">任务正在后台运行，可继续浏览当前页面</div><button class="close" type="button">关闭提示</button>';
    shadow.append(style,card);document.documentElement.append(host);const percent=card.querySelector('.percent');const bar=card.querySelector('.bar');const phase=card.querySelector('.phase');const warning=card.querySelector('.warning');let closeTimer;
    const close=()=>{clearTimeout(closeTimer);host.remove();if(regionAiProgressCard?.host===host)regionAiProgressCard=null;};
    const render=(stage,value)=>{const safe=Math.max(0,Math.min(100,Math.round(Number(value)||0)));card.classList.remove('error');percent.textContent=`${safe}%`;bar.style.width=`${safe}%`;phase.textContent=PageCanvasAiProgress.aiProgressText(stage,safe);warning.textContent='任务正在后台运行，可继续浏览当前页面';};
    const fail=message=>{card.classList.add('error');card.querySelector('.title').textContent='AI 提取失败';percent.textContent='失败';warning.textContent='请重新开始框选';phase.textContent=message||'AI 框选处理失败，请重新开始';closeTimer=setTimeout(close,10000);};
    card.querySelector('.close').addEventListener('click',close);regionAiProgressCard={host,render,fail,close};return regionAiProgressCard;
  }
  function createRegionAiController(card) {
    return PageCanvasRegionAiProgress.createController({now:()=>Date.now(),schedule:(callback,delay)=>setInterval(callback,delay),cancel:handle=>clearInterval(handle),wait:delay=>new Promise(resolve=>setTimeout(resolve,delay)),render:card.render,fail:card.fail,close:card.close});
  }
  function beginRegionSelection(processing = 'direct') {
    if(processing==='ai'&&PageCanvasRegionAiProgress.isActive())return {ok:false,error:'AI 框选任务正在处理，请稍候'};
    closeRegionSelection?.();
    const host = document.createElement('div');host.id='pagecanvas-region-host';host.style.cssText='position:fixed;inset:0;z-index:2147483647;';
    const shadow=host.attachShadow({mode:'closed'});const style=document.createElement('style');style.textContent=`*{box-sizing:border-box}.overlay{position:absolute;inset:0;background:#0b10204d;cursor:crosshair;user-select:none;font:13px/1.4 system-ui,sans-serif}.hint{position:absolute;top:18px;left:50%;transform:translateX(-50%);background:#17191fee;color:#fff;padding:9px 14px;border-radius:9px;box-shadow:0 6px 24px #0004}.selection{display:none;position:absolute;border:2px solid #6366f1;background:#6366f11f;box-shadow:0 0 0 9999px #0b102066}.size{position:absolute;left:8px;top:8px;padding:4px 7px;border-radius:6px;background:#17191fe8;color:#fff;font-size:11px}.toolbar{display:none;position:absolute;gap:7px;padding:7px;background:#fff;border:1px solid #dfe2e8;border-radius:10px;box-shadow:0 8px 28px #0003;cursor:default}.toolbar button{border:1px solid #dfe2e8;background:#fff;color:#252832;padding:7px 10px;border-radius:7px;cursor:pointer}.toolbar .confirm{border-color:#6366f1;background:#6366f1;color:#fff}`;
    const overlay=document.createElement('div');overlay.className='overlay';overlay.innerHTML='<div class="hint">拖拽框选区域 · Enter 确认 · Esc 取消</div><div class="selection"><span class="size"></span></div><div class="toolbar"><button data-command="cancel">取消</button><button data-command="reset">重新选择</button><button class="confirm" data-command="confirm">确认截取</button></div>';
    shadow.append(style,overlay);document.documentElement.append(host);const selection=overlay.querySelector('.selection');const size=overlay.querySelector('.size');const toolbar=overlay.querySelector('.toolbar');let start=null;let rect=null;let dragging=false;
    const cleanup=()=>{host.remove();removeEventListener('resize',cancel);removeEventListener('scroll',cancel,true);removeEventListener('keydown',key,true);closeRegionSelection=null;};const cancel=()=>cleanup();closeRegionSelection=cleanup;
    const render=()=>{if(!rect)return;selection.style.cssText=`display:block;left:${rect.x}px;top:${rect.y}px;width:${rect.width}px;height:${rect.height}px`;size.textContent=`${Math.round(rect.width)} × ${Math.round(rect.height)}`;};
    const finish=()=>{if(!rect||rect.width<40||rect.height<40){rect=null;selection.style.display='none';toolbar.style.display='none';return;}const left=Math.min(innerWidth-245,Math.max(8,rect.x));const top=rect.y+rect.height+10<innerHeight-50?rect.y+rect.height+10:Math.max(8,rect.y-52);toolbar.style.cssText=`display:flex;left:${left}px;top:${top}px`;};
    const confirm=async()=>{if(!rect)return;const chosen={x:Math.round(rect.x),y:Math.round(rect.y),width:Math.round(rect.width),height:Math.round(rect.height)};const selectedDocument=processing==='direct'?undefined:extractRegion(chosen);cleanup();await new Promise(requestAnimationFrame);const message={type:'REGION_SELECTED',processing,document:selectedDocument,rect:chosen,viewport:{width:innerWidth,height:innerHeight}};const send=()=>chrome.runtime.sendMessage(message);try{if(processing==='ai'){const card=createRegionAiProgressCard();await PageCanvasRegionAiProgress.run({processing,send,openPrepared:taskId=>chrome.runtime.sendMessage({type:'OPEN_PREPARED_PREVIEW',taskId}),controller:createRegionAiController(card)});}else{const response=await send();if(!response?.ok)throw new Error(response?.error||'框选处理失败，请重新开始');}}catch(error){if(processing!=='ai'){const card=createRegionAiProgressCard();card.fail(typeof error==='string'?error:error?.message||'框选处理失败，请重新开始');}}};
    overlay.addEventListener('pointerdown',event=>{if(event.target.closest('button'))return;start={x:event.clientX,y:event.clientY};rect={x:start.x,y:start.y,width:0,height:0};dragging=true;toolbar.style.display='none';overlay.setPointerCapture(event.pointerId);});
    overlay.addEventListener('pointermove',event=>{if(!dragging)return;rect={x:Math.min(start.x,event.clientX),y:Math.min(start.y,event.clientY),width:Math.abs(event.clientX-start.x),height:Math.abs(event.clientY-start.y)};render();});
    overlay.addEventListener('pointerup',()=>{dragging=false;finish();});
    toolbar.addEventListener('click',event=>{const command=event.target.dataset.command;if(command==='cancel')cancel();if(command==='reset'){rect=null;selection.style.display='none';toolbar.style.display='none';}if(command==='confirm')confirm();});
    const key=event=>{if(event.key==='Escape'){event.preventDefault();cancel();}if(event.key==='Enter'&&rect){event.preventDefault();confirm();}};addEventListener('keydown',key,true);addEventListener('resize',cancel,{once:true});addEventListener('scroll',cancel,{once:true,capture:true});
    return {ok:true};
  }
  function extract() {
    const clone = document.body.cloneNode(true); clone.querySelectorAll(noisy).forEach(node => node.remove());
    const candidates = [...clone.querySelectorAll('article,main,[role="main"],section,div')];
    const root = candidates.sort((a,b) => score(b)-score(a))[0] || clone;
    const sections=[]; let current={heading:'',paragraphs:[],bullets:[],images:[]};
    const push=()=>{if(current.heading||current.paragraphs.length||current.bullets.length||current.images.length)sections.push(current);current={heading:'',paragraphs:[],bullets:[],images:[]};};
    root.querySelectorAll('h1,h2,h3,p,blockquote,li,img').forEach(node=>{
      if(/^H[1-3]$/.test(node.tagName)){if(current.paragraphs.length||current.bullets.length)push();current.heading=text(node.textContent);}
      else if(node.tagName==='LI'){const v=text(node.textContent);if(v)current.bullets.push(v);}
      else if(node.tagName==='IMG'){const src=node.currentSrc||node.src;if(src)current.images.push({src,alt:text(node.alt)});}
      else {const v=text(node.textContent);if(v.length>20)current.paragraphs.push(v);}
    }); push();
    if (!sections.length) {
      const fallback = text(root.textContent);
      if (fallback) sections.push({ heading: '', paragraphs: [fallback], bullets: [], images: [] });
    }
    return {id:crypto.randomUUID(),mode:'traditional',title:text(document.querySelector('h1')?.textContent||document.title),summary:'',sections,source:{title:document.title,url:location.href,capturedAt:new Date().toISOString()}};
  }
  function extractRegion(rect) {
    const intersects=node=>{const box=node.getBoundingClientRect();return box.width>0&&box.height>0&&box.right>rect.x&&box.left<rect.x+rect.width&&box.bottom>rect.y&&box.top<rect.y+rect.height;};
    const nodes=[...document.querySelectorAll('h1,h2,h3,p,blockquote,li,img')].filter(intersects);const sections=[];let current={heading:'',paragraphs:[],bullets:[],images:[]};
    const push=()=>{if(current.heading||current.paragraphs.length||current.bullets.length||current.images.length)sections.push(current);current={heading:'',paragraphs:[],bullets:[],images:[]};};
    for(const node of nodes){if(/^H[1-3]$/.test(node.tagName)){if(current.paragraphs.length||current.bullets.length)push();current.heading=text(node.textContent);}else if(node.tagName==='LI'){const value=text(node.textContent);if(value)current.bullets.push(value);}else if(node.tagName==='IMG'){const src=node.currentSrc||node.src;if(src)current.images.push({src,alt:text(node.alt)});}else{const value=text(node.textContent);if(value)current.paragraphs.push(value);}}push();
    return {id:crypto.randomUUID(),mode:'traditional',title:text(document.querySelector('h1')?.textContent||document.title),summary:'',sections,source:{title:document.title,url:location.href,capturedAt:new Date().toISOString()}};
  }
  function score(node){const t=text(node.textContent);const links=[...node.querySelectorAll('a')].reduce((n,a)=>n+text(a.textContent).length,0);return t.length-(links*1.6)+(node.querySelectorAll('p').length*80);}
  chrome.runtime.onMessage.addListener((message,_sender,send)=>{
    try {
      if(message.type==='PAGECANVAS_PING')send({ok:true});
      else if(message.type==='BEGIN_REGION_SELECTION')send(beginRegionSelection(message.processing));
      else if(message.type==='EXTRACT_DOCUMENT')send({ok:true,document:extract()});
      else if(message.type==='PAGE_METRICS')send({ok:true,height:Math.max(document.documentElement.scrollHeight,document.body.scrollHeight),viewportHeight:innerHeight,width:innerWidth,scrollY});
      else if(message.type==='BEGIN_FULL_CAPTURE_PROGRESS'){beginScrollCaptureSession();send(beginFullCaptureProgress(message.total));}
      else if(message.type==='SCROLL_TO'){scrollForCapture(message,send);return true;}
      else if(message.type==='CAPTURE_FRAME_DONE'){if(fullCaptureProgress){fullCaptureProgress.render(message.current,message.total);fullCaptureProgress.host.style.visibility='visible';}send({ok:true});}
      else if(message.type==='END_FULL_CAPTURE_PROGRESS'){fullCaptureProgress?.close();send({ok:true});}
      else if(message.type==='FAIL_FULL_CAPTURE_PROGRESS'){fullCaptureProgress?.fail(message.error);send({ok:true});}
      else if(message.type==='RESTORE_SCROLL'){restoreScrollPosition(message.y,send);return true;}
    } catch(error){send({ok:false,error:error.message});}
  });
})();
