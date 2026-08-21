import fs from 'node:fs';
import { callJson, callWrite } from './instatic-mcp.mjs';
const p = JSON.parse(fs.readFileSync('posts.json','utf8'))[0];
console.log('creating:', p.slug, '|', p.words, 'words');
const r = await callWrite('content_create_document', { tableId:'posts', fields:{
  title:p.title, slug:p.slug, body:p.body, seoTitle:p.seoTitle, seoDescription:p.seoDescription }});
console.log('create ->', JSON.stringify(r).slice(0,200));
const id = r.documentId || r.id || r.document?.id;
const back = await callJson('content_get_document', { tableId:'posts', documentId:id });
const f = back.document?.fields || back.fields || back;
console.log('read back keys:', Object.keys(f).join(', '));
for (const k of ['title','slug','seoTitle','seoDescription']) console.log(`  ${k}: ${JSON.stringify(String(f[k]||'').slice(0,80))}`);
const body = String(f.body||'');
console.log(`  body: ${body.length} chars | local ${p.body.length} | identical: ${body===p.body}`);
console.log(`  body head: ${body.slice(0,110)}`);
