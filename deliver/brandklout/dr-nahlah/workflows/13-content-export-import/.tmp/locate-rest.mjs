#!/usr/bin/env node
/**
 * locate-rest.mjs — find the nodes still holding an em dash and dump each one's
 * inner HTML, so the remaining hand edits can be written against real markup
 * instead of guessed at.
 *
 * These are the cases the mechanical planner cannot do: sentences that were
 * restructured rather than repunctuated (so there is no word-for-word local
 * match to align against), a dash inside a `placeholder` ATTRIBUTE (the planner
 * only ever looked at text), and two decorative card numerals that are a dash
 * standing in for a number.
 */
import fs from 'node:fs';
import path from 'node:path';
import { parseNodes, inner, textOf } from './lib-nodes.mjs';

const HERE = import.meta.dirname;
const SNAP = path.join(HERE, '.instatic');
const out = [];

for (const f of fs.readdirSync(SNAP).filter((x) => x.endsWith('.json'))) {
  const d = JSON.parse(fs.readFileSync(path.join(SNAP, f), 'utf8'));
  if (!d.html.includes('—')) continue;
  const nodes = parseNodes(d.html);

  // deepest uid-bearing node whose own inner html (not a descendant's) holds a dash
  const holders = nodes.filter((n) => n.uid && inner(d.html, n).includes('—'));
  const deepest = [];
  for (const n of holders) {
    const hasDeeperHolder = holders.some((m) =>
      m !== n && m.start > n.start && m.end <= n.end && inner(d.html, m).includes('—'));
    if (!hasDeeperHolder) deepest.push(n);
  }
  for (const n of deepest) {
    out.push({
      slug: d.slug, uid: n.uid, tag: n.tag,
      dashes: (inner(d.html, n).match(/—/g) || []).length,
      innerHtml: inner(d.html, n),
      text: textOf(d.html, n).slice(0, 200),
    });
  }
}

fs.writeFileSync(path.join(HERE, 'rest-nodes.json'), JSON.stringify(out, null, 1));
console.log(`${out.length} nodes still hold an em dash`);
for (const o of out) console.log(`  ${o.slug.padEnd(22)} ${o.uid} <${o.tag}> x${o.dashes}`);
