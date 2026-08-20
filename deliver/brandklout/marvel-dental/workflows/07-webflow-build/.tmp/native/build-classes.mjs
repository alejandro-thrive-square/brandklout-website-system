#!/usr/bin/env node
/**
 * build-classes.mjs — create the whole `camp_` class layer in Webflow, once.
 *
 * data_whtml_builder creates a Webflow style for EVERY rule in the css field,
 * not only the ones the inserted markup uses (measured — see PLAN.md). So the
 * entire shared stylesheet goes up attached to one throwaway element, which is
 * then removed. Every page built afterwards is markup-only: a class that
 * already exists on the site is applied by name with no CSS resent.
 *
 *   node build-classes.mjs [--dry]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { call, SITES } from './wf.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CSS_FILE = path.resolve(HERE, '../../../04-design/.tmp/v2/_shared/camp.css');
const PAGE = '6a83e962d17d0bfe618c49f7';                       // Dental Implants v2
const BODY = { component: PAGE, element: '6a83e962d17d0bfe618c49fd' };

// The dialect gate runs first — a rejected call costs a round trip and can
// leave a half-built element behind.
execFileSync(process.execPath, [path.join(HERE, 'lint-css.mjs'), CSS_FILE], { stdio: 'inherit' });

const css = fs.readFileSync(CSS_FILE, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\n\s*\n/g, '\n');
const wanted = [...new Set([...css.matchAll(/\.([a-z][\w-]*)/g)].map((m) => m[1]))];
console.log(`\ncamp.css: ${css.length} bytes, ${wanted.length} distinct class names`);

if (process.argv.includes('--dry')) process.exit(0);

const res = call('data_whtml_builder', [{
  build_label: 'camp-class-layer',
  parent_element_id: BODY,
  creation_position: 'append',
  html: '<div class="camp_classlayer-seed"></div>',
  css,
  return_element_info: true,
}], { site: SITES.arvada, page: PAGE });

const first = Array.isArray(res) ? res[0] : res?.[0] || res;
console.log('status:', JSON.stringify(first).slice(0, 900));

// Verify against the site, not against the response.
const q = call('data_style_tool', [{ label: 'q', query_styles: { queries: [{ label: 'camp', name_path: ['camp_'], limit: 200 }] } }],
  { site: SITES.arvada, page: PAGE });
const made = new Set((q.result?.[0]?.matches || []).map((m) => m.name));
const missing = wanted.filter((n) => n.startsWith('camp_') && !made.has(n));

console.log(`\ncreated ${made.size} camp_ classes; ${missing.length} of the wanted ones missing`);
if (missing.length) console.log('MISSING: ' + missing.join(', '));

fs.writeFileSync(path.join(HERE, 'class-layer-report.json'),
  JSON.stringify({ wanted, created: [...made].sort(), missing }, null, 1));
