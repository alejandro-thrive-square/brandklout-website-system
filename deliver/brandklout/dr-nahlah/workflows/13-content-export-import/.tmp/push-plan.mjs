#!/usr/bin/env node
/**
 * push-plan.mjs — apply a planned em-dash edit list to Instatic.
 *
 * Usage: node push-plan.mjs plan-emdash.json [--dry]
 *
 * Plan entries are { slug, uid, index, to }: replace the `index`-th em dash
 * (document order, 0-based) inside that node with `to`. Entries are grouped per
 * node and applied in one write, highest index first so earlier indices stay
 * valid while the string shortens.
 *
 * WHAT THIS GUARDS AGAINST
 *
 *  - Position, not pattern. Almost every replacement is " —" -> one punctuation
 *    mark, and one node can hold four of them wanting four different marks.
 *    Matching on the string rewrites the first every time.
 *  - `site_get_node_html` returns OUTER html, `site_replace_node_html` replaces
 *    CHILDREN. Pushing back what was read nests a <p> inside the <p>.
 *  - uid= attributes are the editor's own ids. They are stripped before the
 *    write so nothing leaks into the published markup.
 *  - The editor bridge flaps: a call returns "This tool runs in the Instatic
 *    Site editor" while the editor is open and `get_context` says connected,
 *    and the identical next call succeeds. callJson retries.
 *  - Verification asserts THIS node now holds the expected number of dashes,
 *    not that it holds none: neighbouring sentences may legitimately still be
 *    queued for a later pass.
 */
import fs from 'node:fs';
import path from 'node:path';
import { callJson } from './instatic-mcp.mjs';

const planFile = process.argv[2];
const DRY = process.argv.includes('--dry');
if (!planFile) { console.error('usage: push-plan.mjs <plan.json> [--dry]'); process.exit(2); }

const plan = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, planFile), 'utf8'));

function outerToInner(html) {
  const open = /^\s*<([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>/.exec(html);
  if (!open) return html;
  const close = new RegExp(`</${open[1]}\\s*>\\s*$`);
  if (!close.test(html)) return html;
  return html.slice(open[0].length).replace(close, '');
}
const stripUids = (html) => html.replace(/\s+uid="[^"]*"/g, '');

/** Positions of every em dash in the html, literal or entity, in order. */
function dashPositions(html) {
  const out = [];
  const re = /—|&mdash;/g;
  let m;
  while ((m = re.exec(html))) out.push({ at: m.index, len: m[0].length });
  return out;
}

const byNode = new Map();
for (const p of plan) {
  const k = `${p.slug}|${p.uid}`;
  if (!byNode.has(k)) byNode.set(k, { slug: p.slug, uid: p.uid, edits: [] });
  byNode.get(k).edits.push(p);
}
console.log(`${plan.length} replacements -> ${byNode.size} node writes`);

let ok = 0, failed = 0;
const problems = [];

for (const { slug, uid, edits } of byNode.values()) {
  let outer;
  try {
    outer = (await callJson('site_get_node_html', { nodeId: uid })).html ?? '';
  } catch (e) {
    problems.push(`${slug} ${uid}: read failed — ${e.message.slice(0, 120)}`); failed++; continue;
  }
  const before = stripUids(outerToInner(outer));
  const pos = dashPositions(before);

  const wanted = [...edits].sort((a, b) => b.index - a.index);   // right to left
  if (wanted.some((e) => e.index >= pos.length)) {
    problems.push(`${slug} ${uid}: plan wants dash #${Math.max(...wanted.map((e) => e.index))} but node has ${pos.length}`);
    failed++; continue;
  }

  let after = before;
  for (const e of wanted) {
    const p = pos[e.index];
    // the space before the dash is part of what goes; " —" becomes ","
    const lead = after[p.at - 1] === ' ' ? 1 : 0;
    after = after.slice(0, p.at - lead) + e.to + after.slice(p.at + p.len);
  }
  if (after === before) { problems.push(`${slug} ${uid}: no change computed`); failed++; continue; }
  if (DRY) {
    console.log(`DRY ${slug} ${uid} (${edits.length})\n   - ${before.slice(0, 150)}\n   + ${after.slice(0, 150)}`);
    ok++; continue;
  }

  // Two node kinds, two tools.
  //
  // Instatic distinguishes container nodes from TEXT nodes. A <p> that holds
  // only a string is a text node, and site_replace_node_html refuses it with
  // "Node does not accept children" — as a RESULT STRING, not an error, so a
  // naive client records a successful write and the read-back quietly shows the
  // old copy. Text nodes take site_update_node_props with a { text } patch,
  // which answers { ok: true }.
  //
  // Hence the rule below: any write whose response is a bare { text } message
  // is a failure, whatever it says.
  try {
    const r = await callJson('site_replace_node_html', { nodeId: uid, html: after });
    if (r && typeof r.text === 'string') {
      if (/does not accept children/i.test(r.text)) {
        const r2 = await callJson('site_update_node_props', { nodeId: uid, patch: { text: after } });
        if (!r2 || r2.ok !== true) throw new Error(`props patch rejected: ${JSON.stringify(r2).slice(0, 120)}`);
      } else {
        throw new Error(r.text.slice(0, 140));
      }
    }
  } catch (e) {
    problems.push(`${slug} ${uid}: write failed — ${e.message.slice(0, 160)}`); failed++; continue;
  }
  const back = (await callJson('site_get_node_html', { nodeId: uid })).html ?? '';
  const left = dashPositions(back).length;
  const expected = pos.length - edits.length;
  if (left !== expected) {
    problems.push(`${slug} ${uid}: expected ${expected} dashes left, found ${left}`); failed++; continue;
  }
  ok++;
  process.stdout.write(`  ${slug} ${uid} -${edits.length}\n`);
}

console.log(`\n${ok} nodes written, ${failed} failed`);
if (problems.length) { console.log('\nproblems:'); for (const p of problems) console.log('  ' + p); }
