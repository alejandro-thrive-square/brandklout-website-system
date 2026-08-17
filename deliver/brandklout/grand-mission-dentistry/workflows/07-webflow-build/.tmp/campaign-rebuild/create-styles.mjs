#!/usr/bin/env node
// create-styles.mjs — push styles-def.mjs to the Grand Mission site.
// Creates each class (with variable bindings), then breakpoint + pseudo passes.
// Idempotent: skips classes already recorded in styles-created.json; re-running
// after a partial failure resumes where it stopped.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { STYLES, V } from './styles-def.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WFMCP = path.join(HERE, '..', 'wfmcp.mjs');
const SITE = '698111847e9608eb30ee21c6';
const PAGE = '6a8299c9e8c592d788e327ca';
const DONE_FILE = path.join(HERE, 'styles-created.json');
const done = fs.existsSync(DONE_FILE) ? JSON.parse(fs.readFileSync(DONE_FILE, 'utf8')) : {};

const keyOf = (s) => (s.parents ? s.parents.join('.') + '>' : '') + s.n;
const propList = (obj) => Object.entries(obj).map(([k, v]) =>
  (v && typeof v === 'object' && v.v)
    ? { property_name: k, variable_as_value: V[v.v] }
    : { property_name: k, property_value: String(v) });

function call(actions, label) {
  const args = { context: 'Create campaign client-first classes for the Grand Mission landing page rebuild.', siteId: SITE, pageId: PAGE, actions };
  const f = path.join(HERE, '.args-styles.json');
  fs.writeFileSync(f, JSON.stringify(args));
  const out = execFileSync('node', [WFMCP, 'call', 'data_style_tool', '--file', f], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const failed = /"isError"\s*:\s*true|error|Error/.test(out) && !/"result"/.test(out);
  if (/\[Conflict\]|failed|invalid/i.test(out)) {
    console.error('WARN on', label, out.slice(0, 500));
  }
  return out;
}

let n = 0;
for (const s of STYLES) {
  const key = keyOf(s);
  if (done[key]) { continue; }
  const actions = [];
  const base = propList(s.p && Object.keys(s.p).length ? s.p : { opacity: '1' });
  actions.push({ label: 'create ' + key, create_style: { name: s.n, ...(s.parents ? { parent_style_names: s.parents } : {}), properties: base } });
  for (const [bp, props] of Object.entries(s.bp || {})) {
    actions.push({ label: key + '@' + bp, update_style: { style_name: s.n, ...(s.parents ? { parent_style_names: s.parents } : {}), breakpoint_id: bp, properties: propList(props) } });
  }
  if (s.hover) actions.push({ label: key + ':hover', update_style: { style_name: s.n, ...(s.parents ? { parent_style_names: s.parents } : {}), pseudo: 'hover', properties: propList(s.hover) } });
  if (s.focus) actions.push({ label: key + ':focus', update_style: { style_name: s.n, ...(s.parents ? { parent_style_names: s.parents } : {}), pseudo: 'focus', properties: propList(s.focus) } });
  try {
    const out = call(actions, key);
    if (!out.includes('"result"')) throw new Error(out.slice(0, 300));
    done[key] = true;
    fs.writeFileSync(DONE_FILE, JSON.stringify(done, null, 1));
    n++;
    console.log('ok', key);
  } catch (e) {
    console.error('FAIL', key, String(e.message || e).slice(0, 400));
    process.exitCode = 1;
  }
}
console.log('created this run:', n, 'total done:', Object.keys(done).length, '/', STYLES.length);
