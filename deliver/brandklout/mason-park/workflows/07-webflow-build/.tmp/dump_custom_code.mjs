#!/usr/bin/env node
/**
 * dump_custom_code.mjs — save the site's and each page's INSTALLED freeform
 * head/footer custom code to files, so it can be diffed offline.
 *
 * Source Asana task GID: 1217040406855582
 *
 * The `_js/` artifacts in this folder are what a build INTENDED to install and
 * have drifted from what is actually live (`site-head.html` still carries the
 * old font link and lacks both the body base size and the reading tier that
 * the build manifest says are installed). Patch against what the site really
 * holds, not against the artifact.
 *
 *   node dump_custom_code.mjs <outDir>
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

const out = process.argv[2];
if (!out) {
  console.error('usage: dump_custom_code.mjs <outDir>');
  process.exit(2);
}
fs.mkdirSync(out, { recursive: true });

const site = await callTool('data_scripts_tool', {
  context: 'Reads installed site-level freeform head and footer code before re-theming it.',
  actions: [{ label: 'site', get_site_freeform_code: { site_id: SITE } }],
});
fs.writeFileSync(path.join(out, 'site.json'), site.text, 'utf8');

for (const [name, id] of Object.entries(PAGES)) {
  const r = await callTool('data_scripts_tool', {
    context: 'Reads one landing page installed freeform head and footer code before re-theming it.',
    actions: [{ label: name, get_page_freeform_code: { page_id: id } }],
  });
  fs.writeFileSync(path.join(out, `${name}.json`), r.text, 'utf8');
}
console.log(`saved ${Object.keys(PAGES).length + 1} blocks to ${out}`);
