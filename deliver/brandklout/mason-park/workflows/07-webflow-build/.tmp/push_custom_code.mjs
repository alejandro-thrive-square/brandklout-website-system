#!/usr/bin/env node
/**
 * push_custom_code.mjs — install the re-themed site head, the three page heads
 * and the three page footers, then read each block straight back and compare.
 *
 * Source Asana task GID: 1217040406855582
 *
 * The site FOOTER block is deliberately absent: it holds `mpd-flush.js`, which
 * the re-theme did not touch (the shared runtime carries no colour values).
 *
 *   node push_custom_code.mjs <blockDir>
 */
import fs from 'node:fs';
import path from 'node:path';
import { callTool } from './wfmcp.mjs';

const SITE = '6a60bdc0340e5f1784b4d553'; // Mason Park Dental — the boundary.
const PAGES = {
  invisalign: '6a75f467c7c9e1a0c133edd1',
  'new-patient-special': '6a75f468bfddad669aaf8321',
  'thank-you': '6a75f468c490cc1bb6fa6a8c',
};

const dir = process.argv[2];
if (!dir) {
  console.error('usage: push_custom_code.mjs <blockDir>');
  process.exit(2);
}

const jobs = [
  { what: 'site head', file: 'site.head.html', action: 'set_site_freeform_code',
    args: { site_id: SITE, location: 'head' },
    read: { action: 'get_site_freeform_code', args: { site_id: SITE, location: 'head' } } },
];
for (const [page, id] of Object.entries(PAGES)) {
  for (const loc of ['head', 'footer']) {
    jobs.push({
      what: `${page} ${loc}`,
      file: `${page}.${loc}.html`,
      action: 'set_page_freeform_code',
      args: { page_id: id, location: loc },
      read: { action: 'get_page_freeform_code', args: { page_id: id, location: loc } },
    });
  }
}

let bad = 0;
for (const job of jobs) {
  const content = fs.readFileSync(path.join(dir, job.file), 'utf8');
  await callTool('data_scripts_tool', {
    context: 'Installs one re-themed freeform custom code block on the site or a landing page.',
    actions: [{ label: job.what, [job.action]: { ...job.args, content } }],
  });

  const { text } = await callTool('data_scripts_tool', {
    context: 'Reads one freeform custom code block straight back to confirm it stored verbatim.',
    actions: [{ label: `verify ${job.what}`, [job.read.action]: job.read.args }],
  });
  // The getters return an ARRAY of blocks when `location` is omitted and a
  // single OBJECT when it is given. Reading `result[0].content` off the object
  // yields undefined and reports every block as empty — which looks exactly
  // like a write that silently failed.
  const res = JSON.parse(text).result;
  const back = (Array.isArray(res) ? res[0]?.content : res?.content) ?? '';
  const ok = back.trim() === content.trim();
  if (!ok) bad += 1;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${job.what}: sent ${content.length}B, stored ${back.length}B`);
}
process.exitCode = bad ? 1 : 0;
