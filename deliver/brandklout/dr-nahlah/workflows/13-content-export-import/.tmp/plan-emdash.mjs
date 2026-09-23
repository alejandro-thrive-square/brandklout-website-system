#!/usr/bin/env node
/**
 * plan-emdash.mjs — plan the em-dash removal on Instatic.
 *
 * For every sentence still carrying an em dash, the local build's version of
 * the same sentence supplies the replacement punctuation, and the plan records
 * one entry PER DASH OCCURRENCE, in document order, as
 * { slug, uid, index, to }.
 *
 * WHY PER OCCURRENCE, NOT PER STRING MATCH: the minimal edit between the two
 * sentences is almost always the two characters " —", and a single node can
 * hold four of them wanting four different replacements (a comma, a colon, a
 * semicolon, a full stop). A find-and-replace of " —" rewrites the first and
 * the verify step then sees the second still there and reports a failure on a
 * write that worked. Position is the only unambiguous key.
 *
 * The replacements are applied to the node's inner HTML rather than its text,
 * which is what preserves the <strong>, <a> and <span> markup inside it.
 *
 * Writes plan-emdash.json. Applies nothing — run push-plan.mjs for that.
 */
import fs from 'node:fs';
import path from 'node:path';
import { parseNodes, inner, textOf, findDeepest } from './lib-nodes.mjs';

const HERE = import.meta.dirname;
const SNAP = path.join(HERE, '.instatic');
const LOCAL = path.resolve(HERE, '..', '..', '04-design', '.tmp', 'final-site');

const BLOCK = /<\/?(p|div|section|main|ul|ol|li|h[1-6]|br|table|td|th|tr|dl|dt|dd|figure|figcaption|summary|details|button|label|option|blockquote|nav|header|footer|aside|form|article)\b[^>]*>/gi;
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', mdash: '—',
  ndash: '–', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', middot: '·', copy: '©',
  hellip: '…', rarr: '→', times: '×', deg: '°' };
const decode = (s) => s.replace(/&(#\d+|#x[0-9a-f]+|\w+);/gi, (m, e) =>
  e[0] === '#' ? String.fromCodePoint(parseInt(e[1] === 'x' || e[1] === 'X' ? e.slice(2) : e.slice(1), e[1] === 'x' || e[1] === 'X' ? 16 : 10))
               : (e.toLowerCase() in ENT ? ENT[e.toLowerCase()] : m));

function lines(html) {
  let h = html.replace(/<!--[\s\S]*?-->/g, '\x00');
  h = h.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, '\x00');
  h = h.replace(/<title\b[\s\S]*?<\/title>/gi, '\x00');
  h = h.replace(BLOCK, '\x00').replace(/<[^>]+>/g, '');
  return decode(h).split('\x00').map((s) => s.replace(/\s+/g, ' ').trim()).filter((s) => s.length > 3);
}
const key = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * Align the old sentence against the new one and return, in order, what each
 * " —" became. Returns null if the two do not line up, which is the signal that
 * the sentence was restructured rather than repunctuated and needs a hand edit.
 */
function mapDashes(was, now) {
  const reps = [];
  let t = was, g = now;
  for (let guard = 0; guard < 20; guard++) {
    const i = t.indexOf(' —');
    if (i < 0) return reps;
    if (t.slice(0, i) !== g.slice(0, i)) return null;
    const tail = t.slice(i + 2);
    const nextDash = tail.indexOf(' —');
    const anchor = nextDash < 0 ? tail : tail.slice(0, nextDash);
    if (!anchor) return null;
    const j = g.indexOf(anchor, i);
    if (j < 0) return null;
    reps.push(g.slice(i, j));
    t = tail;
    g = g.slice(j);
  }
  return null;
}

const plan = [];
const skipped = [];

for (const f of fs.readdirSync(SNAP).filter((x) => x.endsWith('.json'))) {
  const d = JSON.parse(fs.readFileSync(path.join(SNAP, f), 'utf8'));
  if (!d.html.includes('—')) continue;
  const localFile = path.join(LOCAL, `${d.slug}.html`);
  if (!fs.existsSync(localFile)) { skipped.push(`${d.slug}: no local build`); continue; }

  const lmap = new Map();
  for (const l of lines(fs.readFileSync(localFile, 'utf8'))) if (!lmap.has(key(l))) lmap.set(key(l), l);

  const nodes = parseNodes(d.html);
  for (const was of lines(d.html)) {
    if (!was.includes('—')) continue;
    const now = lmap.get(key(was));
    if (!now) { skipped.push(`${d.slug}: no local match for "${was.slice(0, 68)}"`); continue; }
    const reps = mapDashes(was, now);
    if (!reps || !reps.length) { skipped.push(`${d.slug}: cannot align "${was.slice(0, 68)}"`); continue; }

    const node = findDeepest(d.html, nodes, was);
    if (!node) { skipped.push(`${d.slug}: no node holds "${was.slice(0, 68)}"`); continue; }

    // Where does this sentence start among the node's dashes? A node can hold
    // several sentences; only this one's dashes are ours to touch.
    const nodeText = textOf(d.html, node);
    const at = nodeText.indexOf(was);
    const before = at < 0 ? 0 : (nodeText.slice(0, at).match(/—/g) || []).length;
    reps.forEach((to, k) => {
      plan.push({ slug: d.slug, uid: node.uid, tag: node.tag, index: before + k, to,
        context: was.slice(0, 90) });
    });
  }
}

fs.writeFileSync(path.join(HERE, 'plan-emdash.json'), JSON.stringify(plan, null, 1));
console.log(`planned ${plan.length} dash replacements across ${new Set(plan.map((p) => p.slug)).size} pages`);
if (skipped.length) {
  console.log(`\n${skipped.length} need a hand edit:`);
  for (const s of skipped) console.log('  ' + s);
}
