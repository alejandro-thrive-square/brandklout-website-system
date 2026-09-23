#!/usr/bin/env node
/**
 * fix-escaped.mjs — repair nodes whose replacement went in as literal text.
 *
 * THE BUG THIS FIXES
 * Instatic has container nodes and TEXT nodes. `site_replace_node_html` refuses
 * a text node ("Node does not accept children"), and the fallback is a
 * `site_update_node_props` patch of `{ text }`. But `text` is a PLAIN-TEXT prop:
 * anything markup-ish in it is escaped on the way in. So a replacement carrying
 * `<strong>…</strong>` or `&rsquo;` is stored as the literal characters and the
 * page renders "A digital lab inside <strong>each of the two practices</strong>".
 * It reads as a successful write and only shows up when you diff the rendered
 * prose against the source.
 *
 * THE REPAIR
 * A text node cannot gain a child, so the fix is applied one level up: read the
 * PARENT's html from Instatic, swap the offending element for the local build's
 * version of it, and rewrite the parent. The parent is a container, so the
 * element is re-created properly and the <strong> becomes a real child node.
 * The parent's other children are carried across untouched.
 */
import fs from 'node:fs';
import path from 'node:path';
import { callJson } from './instatic-mcp.mjs';
import { parseNodes, inner, textOf, findDeepest } from './lib-nodes.mjs';

const HERE = import.meta.dirname;
const SNAP = path.join(HERE, '.instatic');
const LOCAL = path.resolve(HERE, '..', '..', '04-design', '.tmp', 'final-site');

const TARGETS = [
  { slug: 'about', uid: '2LI9E2x7q14YkUgrqmw2a',
    local: 'The technology exists to serve the same end. An intraoral scanner replaces' },
  { slug: 'veneers', uid: 'fQSI553x6fjCTUaUelLl-',
    local: 'The prepared teeth are scanned, and each veneer is hand-designed in the' },
  { slug: 'our-facility', uid: 'LKMNUPUooYdcXGQNgfWIU',
    local: 'Any one of these machines can be rented time on. What is unusual is holding' },
];

const fixLinks = (html) => html
  .replace(/href="index\.html"/g, 'href="/"')
  .replace(/href="([a-z0-9-]+)\.html(#[a-z0-9-]+)?"/gi, (m, p, h) => `href="/${p}${h || ''}"`);

let ok = 0;
const problems = [];

for (const t of TARGETS) {
  const d = JSON.parse(fs.readFileSync(path.join(SNAP, `${t.slug}.json`), 'utf8'));
  const nodes = parseNodes(d.html);
  const child = nodes.find((n) => n.uid === t.uid);
  if (!child) { problems.push(`${t.slug}: ${t.uid} not in snapshot`); continue; }

  // smallest node that strictly contains the child
  const parent = nodes
    .filter((n) => n.uid && n.start < child.start && n.end >= child.end)
    .sort((a, b) => (a.end - a.start) - (b.end - b.start))[0];
  if (!parent) { problems.push(`${t.slug}: no parent for ${t.uid}`); continue; }

  const lhtml = fs.readFileSync(path.join(LOCAL, `${t.slug}.html`), 'utf8');
  const lnodes = parseNodes(lhtml);
  const src = findDeepest(lhtml, lnodes, t.local, { requireUid: false });
  if (!src) { problems.push(`${t.slug}: local source not found`); continue; }
  const replacementOuter = fixLinks(lhtml.slice(src.start, src.end)).replace(/\s+/g, ' ').trim();

  // read the parent live, so the swap happens against current content
  let parentHtml;
  try {
    parentHtml = (await callJson('site_get_node_html', { nodeId: parent.uid })).html ?? '';
  } catch (e) { problems.push(`${t.slug}: parent read failed — ${e.message.slice(0, 100)}`); continue; }

  // locate the child inside the parent's html by its uid and take its full element
  const m = new RegExp(`<([a-zA-Z][\\w-]*)([^>]*\\buid="${t.uid}"[^>]*)>`).exec(parentHtml);
  if (!m) { problems.push(`${t.slug}: ${t.uid} not inside parent html`); continue; }
  const closeTag = `</${m[1]}>`;
  const endIdx = parentHtml.indexOf(closeTag, m.index);
  if (endIdx < 0) { problems.push(`${t.slug}: no close tag for ${t.uid}`); continue; }
  const childOuter = parentHtml.slice(m.index, endIdx + closeTag.length);

  const newParentOuter = parentHtml.replace(childOuter, replacementOuter);
  // strip the parent's own wrapper and all editor ids before writing back
  const open = /^\s*<([a-zA-Z][\w-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>/.exec(newParentOuter);
  const innerNew = newParentOuter
    .slice(open[0].length)
    .replace(new RegExp(`</${open[1]}\\s*>\\s*$`), '')
    .replace(/\s+uid="[^"]*"/g, '');

  try {
    const r = await callJson('site_replace_node_html', { nodeId: parent.uid, html: innerNew });
    if (r && typeof r.text === 'string') throw new Error(r.text.slice(0, 140));
    const back = (await callJson('site_get_node_html', { nodeId: parent.uid })).html ?? '';
    if (back.includes('&lt;strong&gt;') || back.includes('&amp;rsquo;') || back.includes('&amp;#x27;')) {
      throw new Error('still double-escaped after write');
    }
    ok++;
    console.log(`  ${t.slug.padEnd(16)} parent ${parent.uid} <${parent.tag}> ok`);
  } catch (e) {
    problems.push(`${t.slug} parent ${parent.uid}: ${e.message.slice(0, 170)}`);
  }
}

console.log(`\n${ok}/${TARGETS.length} repaired`);
if (problems.length) { console.log('\nproblems:'); for (const p of problems) console.log('  ' + p); }
