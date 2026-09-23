#!/usr/bin/env node
/**
 * dump-nodes.mjs <slug> <needle> [...needles] — print the deepest node holding
 * each needle, with its uid, tag and inner HTML, straight from the snapshot.
 *
 * Written to a file rather than stdout: piping MCP/HTML content through the
 * Windows console re-encodes it as cp1252 and turns every em dash, curly quote
 * and middot into mojibake on the way to the screen. That is a display bug, not
 * a data bug, but it looks exactly like corruption and cost a full round of
 * "did I just break the site?" to rule out.
 */
import fs from 'node:fs';
import path from 'node:path';
import { parseNodes, inner, textOf, findDeepest } from './lib-nodes.mjs';

const [slug, ...needles] = process.argv.slice(2);
const HERE = import.meta.dirname;
const d = JSON.parse(fs.readFileSync(path.join(HERE, '.instatic', `${slug}.json`), 'utf8'));
const nodes = parseNodes(d.html);

const out = [];
for (const n of needles) {
  const hit = findDeepest(d.html, nodes, n);
  if (!hit) { out.push({ needle: n, error: 'not found' }); continue; }
  const parent = nodes
    .filter((x) => x.uid && x.start < hit.start && x.end >= hit.end)
    .sort((a, b) => (a.end - a.start) - (b.end - b.start))[0];
  out.push({
    needle: n, uid: hit.uid, tag: hit.tag,
    parentUid: parent?.uid, parentTag: parent?.tag,
    innerHtml: inner(d.html, hit),
    parentInnerHtml: parent ? inner(d.html, parent).slice(0, 2500) : null,
  });
}
fs.writeFileSync(path.join(HERE, `dump-${slug}.json`), JSON.stringify(out, null, 1));
console.log(`wrote dump-${slug}.json (${out.length} entries)`);
