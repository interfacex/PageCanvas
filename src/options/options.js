import { validateConfig, originPattern } from '../shared/config.js';
import { CONFIG_KEY } from '../shared/constants.js';
const form = document.querySelector('#form'); const status = document.querySelector('#status');
const saved = (await chrome.storage.local.get(CONFIG_KEY))[CONFIG_KEY] || {};
for (const name of ['baseUrl','apiKey','model','headers','maxChars']) if (saved[name] != null) form.elements[name].value = saved[name];
function read() { return Object.fromEntries(new FormData(form)); }
function show(text, error=false){status.textContent=text;status.className=`status${error?' error':''}`;}
async function save() {
  const result = validateConfig(read()); if (!result.ok) throw new Error(result.error);
  const origin = originPattern(result.value.baseUrl);
  const granted = await chrome.permissions.request({ origins: [origin] });
  if (!granted) throw new Error('需要授权访问模型服务域名');
  await chrome.storage.local.set({ [CONFIG_KEY]: { ...result.value, maxChars: Number(result.value.maxChars || 60000) } });
  return result.value;
}
form.addEventListener('submit', async e => { e.preventDefault(); try { await save(); show('配置已保存在本机'); } catch(error){show(error.message,true);} });
document.querySelector('#testConnection').addEventListener('click', async () => { try { await save(); show('正在测试…'); const r=await chrome.runtime.sendMessage({type:'TEST_MODEL'}); if(!r?.ok) throw new Error(r?.error); show('连接成功'); } catch(error){show(error.message,true);} });
