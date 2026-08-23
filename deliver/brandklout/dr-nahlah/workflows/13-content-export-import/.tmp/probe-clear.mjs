import { callTool } from './instatic-mcp.mjs';
const PATH='src/styles/site.css';
const j = t => { try { return JSON.parse(t) } catch { return { RAW: t } } };
let out='',part=1,hash=null;
for(;;){ const r=j((await callTool('site_read_code_asset',{path:PATH,part})).text);
  out+=r.content??''; hash=r.hash??hash; const n=r.pageInfo?.nextPart; if(!n) break; part=n; }
console.log('chars', out.length, 'hash', (hash||'').slice(0,12));
const body = out.slice(out.indexOf('*/')+3);
const slice = body.slice(0, 4000);
console.log('slice occurrences in file:', out.split(slice).length-1);
const r = await callTool('site_patch_code_asset', {
  path: PATH, expectedHash: hash, replacements: [{ oldText: slice, newText: '' }] });
console.log('patch response:', (r.text||'').slice(0,300));
