#!/usr/bin/env node
/**
 * fix-form-button.mjs — set each consult form's submit label.
 *
 * A `FormButton` keeps its label in the `buttonText` SETTING, not as a child
 * text node, so `<button>Request my free consultation</button>` builds fine and
 * then renders as Webflow's default "Submit". Nothing errors; the page simply
 * ships the wrong call to action on the one element that converts.
 *
 * (`loadingText` is set too, for the same reason — it defaults to
 * "Please wait...".)
 *
 *   node fix-form-button.mjs [topic …]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { call, SITES } from './wf.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CONTENT = path.resolve(HERE, '../../../04-design/.tmp/v2/content');
const map = JSON.parse(fs.readFileSync(path.join(HERE, 'v2-pages.json'), 'utf8'));

const topics = process.argv.slice(2).length ? process.argv.slice(2)
  : ['implants', 'aox', 'veneers', 'emergency', 'dentist-near-me', 'next-door'];

for (const topic of topics) {
  const pageId = map[`${topic}.consult`];
  if (!pageId) { console.log(`${topic}: no consult page id`); continue; }
  const content = JSON.parse(fs.readFileSync(path.join(CONTENT, `${topic}.consult.json`), 'utf8'));
  const label = content['consult.submit'];
  const o = { site: SITES.arvada, page: pageId };

  const tree = call('data_element_tool', [{ label: 'e', get_all_elements: {} }], o);
  let btn = null;
  (function walk(n) { if (n.type === 'FormButton') btn = n; for (const c of n.children || []) walk(c); })(tree.result[0].data);
  if (!btn) { console.log(`${topic}: no FormButton found`); continue; }

  call('data_element_settings_tool', [{
    label: 's',
    set_settings: {
      operations: [{
        label: 'b',
        element_id: btn.id,
        settings: [
          { key: 'buttonText', static_text: { value: label } },
          { key: 'loadingText', static_text: { value: 'Sending…' } },
        ],
      }],
    },
  }], o);

  // Read it back — this whole file exists because a default silently stood in
  // for the real label, so a write that reports success proves nothing.
  const after = call('data_element_settings_tool',
    [{ label: 'g', get_settings: { type: 'all_raw_settings', element_id: btn.id } }], o);
  const kv = Object.fromEntries((after?.result?.[0]?.data?.matches || []).map((m) => [m.key, m.value]));
  console.log(`${kv.buttonText === label ? 'ok  ' : 'MISS'} ${topic}: "${kv.buttonText}"`);
}
