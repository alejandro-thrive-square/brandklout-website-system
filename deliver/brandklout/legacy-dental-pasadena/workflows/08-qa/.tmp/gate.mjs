#!/usr/bin/env node
/**
 * gate.mjs — the checks that must pass before anything reaches Webflow.
 *
 *   node gate.mjs
 *
 * These are the failures that have actually shipped on Brandklout builds before:
 * another client's name left in an aria-label, an em dash in client copy, a
 * `{{token}}` that survived every structural check, a placeholder form id, and a
 * CDN image URL that will silently produce an unmanaged Webflow image.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const V1 = resolve(HERE, '../../04-design/.tmp/v1');
const PAGES = ['emergency', 'emergency-consult', 'emergency-ty'];
const fail = [];
const warn = [];

for (const page of PAGES) {
  const p = join(V1, page, 'body.html');
  if (!existsSync(p)) { fail.push(`${page}: body.html missing, run render-page.mjs`); continue; }
  const html = readFileSync(p, 'utf8');

  const foreign = html.match(/arvada|bennett|colorado|wadsworth|mason park|grand mission/gi);
  if (foreign) fail.push(`${page}: another client's copy survives (${[...new Set(foreign.map((s) => s.toLowerCase()))].join(', ')})`);

  if (/[—–]/.test(html)) fail.push(`${page}: em or en dash in copy (house rule: never in client copy)`);
  if (html.includes('{{')) fail.push(`${page}: unfilled {{token}}`);

  const cdn = html.match(/cdn\.prod\.website-files\.com/g);
  if (cdn) fail.push(`${page}: ${cdn.length} image(s) on the CDN mirror. Webflow binds assets only from the s3 hostedUrl`);

  if (html.includes('REPLACE_WITH_MARVEL_FORM_ID')) warn.push(`${page}: the GHL form id is still a placeholder`);

  // every phone link is the campaign line, never the main practice line
  const wrongPhone = html.match(/tel:\+?1?9732955443|\(973\) 295[ -]5443/g);
  if (wrongPhone) fail.push(`${page}: ${wrongPhone.length} reference(s) to the MAIN line, campaign must use (973) 264-0928`);

  const imgs = (html.match(/<img /g) || []).length;
  const alts = (html.match(/alt="[^"]+"/g) || []).length;
  if (alts < imgs) fail.push(`${page}: ${imgs - alts} image(s) with no alt text`);

  console.log(`${page}: ${imgs} images, ${(html.match(/<section/g) || []).length} sections, ${html.length} bytes`);
}

// the class layer must not carry Arvada's palette or faces
for (const css of ['camp.css', 'camp-convert.css', 'camp-sections.css']) {
  const s = readFileSync(join(V1, '_shared', css), 'utf8');
  const body = s.replace(/\/\*[\s\S]*?\*\//g, '');   // provenance notes are allowed to name Arvada
  for (const bad of ['#403830', '#c8b282', '#d3aa5a', '#fdf8ef', '#0b2c41', 'area extended', 'Centurygothic']) {
    if (body.includes(bad)) fail.push(`${css}: Arvada value ${bad} still present`);
  }
}

for (const w of warn) console.log('WARN  ' + w);
if (fail.length) { console.log('\nFAIL\n  ' + fail.join('\n  ')); process.exit(1); }
console.log(`\nPASS${warn.length ? ' (with ' + warn.length + ' warning)' : ''}`);
