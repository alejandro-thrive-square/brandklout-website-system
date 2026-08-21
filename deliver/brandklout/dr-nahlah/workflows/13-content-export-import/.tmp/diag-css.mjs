import fs from 'node:fs';
import { callJson } from './instatic-mcp.mjs';
const PATH='src/styles/site.css';
let out='',part=1,parts=0;
for(;;){ const r=await callJson('site_read_code_asset',{path:PATH,part});
  out+=r.content??''; parts++;
  const n=r.pageInfo?.nextPart; if(!n) break; part=n; }
fs.writeFileSync('remote-site.css',out);
const local=fs.readFileSync('../../04-design/.tmp/final-site/assets/site.css','utf8');
console.log('remote chars',out.length,'in',parts,'parts | local',local.length);
console.log('sentinel count', (out.match(/\/\*__wz_end__\*\//g)||[]).length);
console.log('banner count', (out.match(/Dr\. Nahlah design system/g)||[]).length);
const probe=local.slice(0,120);
console.log('first-120-of-local occurrences in remote:', out.split(probe).length-1);
const tail=local.slice(-120);
console.log('last-120-of-local occurrences in remote:', out.split(tail).length-1);
