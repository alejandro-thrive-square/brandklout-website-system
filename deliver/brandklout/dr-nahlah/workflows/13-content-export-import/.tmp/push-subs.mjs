#!/usr/bin/env node
/**
 * push-subs.mjs — apply plain text substitutions across every Instatic page.
 *
 * Built for the phone-number change, which touches the drawer and the footer on
 * all 26 pages plus the contact page body, so a per-node hand list would be
 * hundreds of entries.
 *
 * For each substitution it finds every node whose OWN text holds the old string
 * (deepest first, so a rewrite is as small as possible), then rewrites that node
 * with the string swapped inside its existing HTML. `href="tel:..."` is handled
 * too, which a text-only pass would miss entirely: the visible number would
 * change and the link would still dial the old one.
 *
 * Same two-tool rule as the rest: container nodes take replace_node_html, text
 * nodes take a { text } props patch, and a write whose response is a bare
 * { text } message is a failure whatever it says. The { text } prop is plain
 * text, so a node carrying markup is rewritten through its parent instead.
 */
import fs from 'node:fs';
import path from 'node:path';
import { callJson } from './instatic-mcp.mjs';
import { parseNodes, inner, textOf } from './lib-nodes.mjs';

const SUBS = [
  ['(571) 619-9442', '(571) 702-9900'],
  ['(571)619-9442', '(571)702-9900'],
  ['+15716199442', '+15717029900'],
  ['15716199442', '15717029900'],
  ['(571) 410-3430', '(571) 253-7790'],
  ['(571)410-3430', '(571)253-7790'],
  ['+15714103430', '+15712537790'],
  ['15714103430', '15712537790'],
];

const HERE = import.meta.dirname;
const SNAP = path.join(HERE, '.instatic');
const DRY = process.argv.includes('--dry');

/** Nodes whose own inner html holds the needle and whose children do not. */
function holders(html, nodes, needle) {
  const hit = nodes.filter((n) => n.uid && inner(html, n).includes(needle));
  return hit.filter((n) => !hit.some((m) =>
    m !== n && m.start > n.start && m.end <= n.end));
}

let writes = 0, hits = 0;
const problems = [];

for (const f of fs.readdirSync(SNAP).filter((x) => x.endsWith('.json'))) {
  const d = JSON.parse(fs.readFileSync(path.join(SNAP, f), 'utf8'));
  if (!SUBS.some(([a]) => d.html.includes(a))) continue;
  const nodes = parseNodes(d.html);

  // one write per node, applying every substitution that lands in it
  const targets = new Map();
  for (const [a] of SUBS) {
    for (const n of holders(d.html, nodes, a)) {
      if (!targets.has(n.uid)) targets.set(n.uid, n);
    }
  }

  for (const n of targets.values()) {
    let cur;
    try {
      cur = (await callJson('site_get_node_html', { nodeId: n.uid })).html ?? '';
    } catch (e) { problems.push(`${d.slug} ${n.uid}: read failed`); continue; }

    // strip the wrapper and the editor ids, then substitute
    const open = /^\s*<([a-zA-Z][\w-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>/.exec(cur);
    if (!open) { problems.push(`${d.slug} ${n.uid}: cannot parse node html`); continue; }
    const innerHtml = cur.slice(open[0].length)
      .replace(new RegExp(`</${open[1]}\\s*>\\s*$`), '')
      .replace(/\s+uid="[^"]*"/g, '');

    let next = innerHtml;
    let n_applied = 0;
    for (const [a, b] of SUBS) {
      if (!next.includes(a)) continue;
      next = next.split(a).join(b);
      n_applied++;
    }
    if (!n_applied) continue;
    hits += n_applied;

    if (DRY) {
      console.log(`DRY ${d.slug} ${n.uid} <${open[1]}> x${n_applied}`);
      writes++;
      continue;
    }

    try {
      const r = await callJson('site_replace_node_html', { nodeId: n.uid, html: next });
      if (r && typeof r.text === 'string') {
        if (!/does not accept children/i.test(r.text)) throw new Error(r.text.slice(0, 130));
        if (/<[a-z]/i.test(next)) throw new Error('text node carrying markup — needs a parent rewrite');
        const r2 = await callJson('site_update_node_props', { nodeId: n.uid, patch: { text: next } });
        if (!r2 || r2.ok !== true) throw new Error(`props patch rejected`);
      }
      const back = (await callJson('site_get_node_html', { nodeId: n.uid })).html ?? '';
      if (SUBS.some(([a]) => back.includes(a))) throw new Error('old value still present');
      writes++;
      process.stdout.write(`  ${d.slug.padEnd(26)} ${n.uid} x${n_applied}\n`);
    } catch (e) {
      problems.push(`${d.slug} ${n.uid}: ${e.message.slice(0, 150)}`);
    }
  }
}

console.log(`\n${writes} node writes, ${hits} substitutions`);
if (problems.length) { console.log('\nproblems:'); for (const p of problems) console.log('  ' + p); }
