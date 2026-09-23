#!/usr/bin/env node
/**
 * extract-content.mjs — split the built template into STRUCTURE and CONTENT.
 *
 * The 18 pages share one layout and differ only in copy, links and images.
 * So the template becomes `page-template.tokens.html` with `{{slot}}` markers,
 * and each topic gets a JSON of slot -> text. `render-page.mjs` puts them back
 * together. That is what makes the other 17 pages a content pass instead of 17
 * authoring passes.
 *
 * Slots are named from the enclosing section and the element's own class, so
 * they read as `hero.h1` / `proof.item3.title` rather than `t47` — the JSON has
 * to be writable by a person.
 *
 *   node extract-content.mjs
 *
 * Writes: _shared/page-template.tokens.html, content/emergency.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SHARED = path.resolve(HERE, '../../../04-design/.tmp/v2/_shared');
const CONTENT = path.resolve(HERE, '../../../04-design/.tmp/v2/content');
const src = fs.readFileSync(path.join(SHARED, 'page-template.html'), 'utf8');

const VOID = new Set(['img', 'br', 'hr', 'input', 'meta', 'link', 'source']);

/** Section name for a slot prefix, from the section's own class. */
function sectionName(classAttr, index) {
  const cls = (classAttr || '').split(/\s+/);
  const base = cls.find((c) => c.startsWith('camp_')) || 'section';
  const mod = cls.find((c) => c.startsWith('is-'));
  return base.replace(/^camp_/, '') + (mod ? '-' + mod.replace(/^is-/, '') : '') + (index ? index : '');
}

const stack = [];
const seen = new Map();
let section = 'page';
let sectionSeq = 0;

const out = [];
const slots = {};
let last = 0;

/** Give a slot a readable, unique name. */
function nameFor(ownClass, tag) {
  const base = (ownClass || '').split(/\s+/).find((c) => c.startsWith('camp_'));
  const leaf = base ? base.replace(/^camp_/, '').replace(/_/g, '-') : tag;
  const key = `${section}.${leaf}`;
  const n = (seen.get(key) || 0) + 1;
  seen.set(key, n);
  return n === 1 ? key : `${key}${n}`;
}

for (const m of src.matchAll(/<(\/?)([a-zA-Z][\w-]*)\b([^>]*)>/g)) {
  const [full, slash, tagRaw, attrs] = m;
  const tag = tagRaw.toLowerCase();

  // text between the previous tag and this one
  const text = src.slice(last, m.index);
  last = m.index + full.length;

  if (text.trim() && stack.length) {
    const top = stack[stack.length - 1];
    const slot = nameFor(top.cls, top.tag);
    slots[slot] = text.trim();
    out.push(text.replace(text.trim(), `{{${slot}}}`));
  } else {
    out.push(text);
  }

  if (tag === 'section') {
    if (!slash) { sectionSeq++; section = sectionName((attrs.match(/class="([^"]*)"/) || [])[1], sectionSeq); }
  }

  if (!slash && !VOID.has(tag)) stack.push({ tag, cls: (attrs.match(/class="([^"]*)"/) || [])[1] || '' });
  else if (slash) stack.pop();

  // attributes that are content, not structure
  let tagOut = full;
  if (tag === 'a') {
    const href = (attrs.match(/\bhref="([^"]*)"/) || [])[1];
    if (href && !href.startsWith('#')) {
      const slot = nameFor((attrs.match(/class="([^"]*)"/) || [])[1], 'a') + '.href';
      slots[slot] = href;
      tagOut = full.replace(`href="${href}"`, `href="{{${slot}}}"`);
    }
  }
  if (tag === 'img') {
    const s = (attrs.match(/\bsrc="([^"]*)"/) || [])[1];
    const alt = (attrs.match(/\balt="([^"]*)"/) || [])[1];
    const base = nameFor((attrs.match(/class="([^"]*)"/) || [])[1], 'img');
    if (s) { slots[`${base}.src`] = s; tagOut = tagOut.replace(`src="${s}"`, `src="{{${base}.src}}"`); }
    if (alt !== undefined) { slots[`${base}.alt`] = alt; tagOut = tagOut.replace(`alt="${alt}"`, `alt="{{${base}.alt}}"`); }
  }
  if (tag === 'div' && /data-youtube="/.test(attrs)) {
    const v = (attrs.match(/data-youtube="([^"]*)"/) || [])[1];
    slots['video.youtube'] = v;
    tagOut = tagOut.replace(`data-youtube="${v}"`, 'data-youtube="{{video.youtube}}"');
  }
  out.push(tagOut);
}
out.push(src.slice(last));

fs.mkdirSync(CONTENT, { recursive: true });
fs.writeFileSync(path.join(SHARED, 'page-template.tokens.html'), out.join(''));
fs.writeFileSync(path.join(CONTENT, 'emergency.json'), JSON.stringify(slots, null, 1));

console.log(`page-template.tokens.html written`);
console.log(`${Object.keys(slots).length} content slots -> content/emergency.json`);

// A round trip has to reproduce the original exactly, or the split is lossy.
let round = out.join('');
for (const [k, v] of Object.entries(slots)) round = round.split(`{{${k}}}`).join(v);
console.log(round === src ? 'round-trip OK — tokens restore the original byte for byte'
  : `ROUND-TRIP MISMATCH — ${round.length} vs ${src.length} bytes`);
