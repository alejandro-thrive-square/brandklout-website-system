import { callJson } from './instatic-mcp.mjs';
const P='veneers.html-inline-script-1.js';
const before = await callJson('site_read_code_asset',{path:P});
console.log('before enabled=', before.runtime.enabled);
const w = await callJson('site_write_code_asset',{ path:P, type:'script',
  content:'/* retired */\n', runtime:{ enabled:false, scope:{type:'pages',pageIds:[]} } });
console.log('write ->', JSON.stringify(w).slice(0,240));
const after = await callJson('site_read_code_asset',{path:P});
console.log('after  enabled=', after.runtime.enabled, 'scope=', JSON.stringify(after.runtime.scope), 'chars=', after.content.length);
