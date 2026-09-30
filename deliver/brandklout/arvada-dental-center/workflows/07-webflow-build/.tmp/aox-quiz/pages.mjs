#!/usr/bin/env node
/** pages.mjs — list every page on the site into pages.json and print the ads-landing set. Read-only. */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { wf, must, SITE } from './wfq.mjs';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const all = [];
for (let offset = 0; ; offset += 100) {
  const [r] = must(await wf('data_pages_tool', [{ label: 'list', list_pages: { site_id: SITE, limit: 100, offset } }]), 'list_pages');
  const pages = r.result?.pages ?? [];
  all.push(...pages);
  if (pages.length < 100) break;
}
writeFileSync(join(HERE, 'pages.json'), JSON.stringify(all, null, 1));
console.log(`${all.length} pages; keys: ${Object.keys(all[0] ?? {}).join(', ')}`);
for (const p of all.filter((p) => /all-on-x|ads-landing|quiz/i.test(JSON.stringify([p.slug, p.title, p.publishedPath]))))
  console.log([p.id, p.slug, p.title, 'parent ' + p.parentId, 'draft ' + p.draft, p.publishedPath ?? ''].join(' | '));
