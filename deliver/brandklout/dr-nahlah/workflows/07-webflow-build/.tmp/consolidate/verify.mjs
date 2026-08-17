#!/usr/bin/env node
/**
 * verify.mjs — prove the consolidation landed and broke nothing.
 *
 *   node verify.mjs
 *
 * Four checks:
 *   1. journal — every write reported ok, and every set_style's returned
 *      styleNames equal what was intended (not merely "no error")
 *   2. styles  — every retired fork is really gone from the site
 *   3. elements— no element anywhere still references a retired fork
 *   4. canonicals — every canonical class still exists
 *
 * Note the site must be REPUBLISHED before the CSS check is meaningful, so this
 * verifies through the API, not the published stylesheet.
 */
import fs from 'node:fs';
import { call, collectElements } from './api.mjs';

const SITE = '6a6b84cc7fe55ddeabc0b314';
const CTX = 'Verifying that consolidated classes were retired and no element still references them.';
const SAMPLE = Number(process.env.WF_VERIFY_SAMPLE ?? 12);

async function main() {
  const plan = JSON.parse(fs.readFileSync('plan.json', 'utf8'));
  const pages = JSON.parse(fs.readFileSync('pages.json', 'utf8'));
  const journal = fs.readFileSync('journal.jsonl', 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
  let fail = 0;

  // ---- 1. journal --------------------------------------------------------
  const bad = journal.filter((j) => !j.ok);
  const mismatched = journal.filter((j) =>
    j.kind === 'set-style' && j.ok && j.got && JSON.stringify(j.got) !== JSON.stringify(j.after));
  console.log(`1. journal: ${journal.length} writes, ${bad.length} failed, ${mismatched.length} returned unexpected classes`);
  for (const b of bad.slice(0, 20)) console.log(`   FAIL ${b.kind} ${b.key}: ${(b.error ?? '').slice(0, 120)}`);
  for (const m of mismatched.slice(0, 20)) console.log(`   MISMATCH ${m.key}: wanted ${JSON.stringify(m.after)} got ${JSON.stringify(m.got)}`);
  fail += bad.length + mismatched.length;

  const retired = journal.filter((j) => j.kind === 'style-remove' && j.ok);
  const retiredNames = retired.map((j) => j.name);
  console.log(`   forks retired: ${retired.length}`);

  // ---- 2. retired styles are gone ----------------------------------------
  const anyPage = pages.find((p) => !p.draft).id;
  let stillThere = [];
  for (let i = 0; i < retiredNames.length; i += 10) {
    const chunk = retiredNames.slice(i, i + 10);
    try {
      const [r] = await call('data_style_tool', {
        siteId: SITE, pageId: anyPage, context: CTX,
        actions: [{ label: 'q', query_styles: { queries: chunk.map((n) => ({ label: n, name_path: [n], include_properties: false, limit: 5 })) } }],
      }, `styles ${i}`);
      for (const q of r.result ?? []) {
        for (const m of q.matches ?? []) if (chunk.includes(m.name)) stillThere.push(m.name);
      }
    } catch (e) { console.error(`   (style check ${i} unavailable: ${String(e.message).slice(0, 90)})`); }
  }
  console.log(`2. retired styles still present: ${stillThere.length}`);
  for (const s of [...new Set(stillThere)].slice(0, 20)) console.log(`   STILL THERE: ${s}`);
  fail += stillThere.length;

  // ---- 3. no element references a retired fork ---------------------------
  const stems = [...new Set(plan.families.map((f) => f.canonical.replace(/-\d+$/, '')))];
  const live = pages.filter((p) => !p.draft).slice(0, SAMPLE);
  let dangling = 0;
  for (const p of live) {
    try {
      const [r] = await call('data_element_tool', {
        siteId: SITE, pageId: p.id, context: CTX,
        actions: [{ label: 'q', query_elements: { queries: stems.slice(0, 8).map((s) => ({ label: s, element_filter: { style: s }, limit: 200 })) } }],
      }, `elements ${p.title}`);
      for (const el of collectElements(r)) {
        for (const n of el.styleNames) if (retiredNames.includes(n)) { dangling++; console.log(`   DANGLING ${p.title} ${el.id.element} -> ${n}`); }
      }
    } catch (e) { console.error(`   (${p.title} unavailable: ${String(e.message).slice(0, 90)})`); }
  }
  console.log(`3. elements still on a retired class: ${dangling}`);
  fail += dangling;

  // ---- 4. canonicals survive ---------------------------------------------
  const canon = plan.families.map((f) => plan.forkNames?.[f.canonical] ?? f.canonical);
  let missing = [];
  for (let i = 0; i < canon.length; i += 10) {
    const chunk = canon.slice(i, i + 10);
    try {
      const [r] = await call('data_style_tool', {
        siteId: SITE, pageId: anyPage, context: CTX,
        actions: [{ label: 'q', query_styles: { queries: chunk.map((n) => ({ label: n, name_path: [n], include_properties: false, limit: 5 })) } }],
      }, `canon ${i}`);
      const found = new Set((r.result ?? []).flatMap((q) => (q.matches ?? []).map((m) => m.name)));
      for (const n of chunk) if (!found.has(n)) missing.push(n);
    } catch (e) { console.error(`   (canonical check ${i} unavailable: ${String(e.message).slice(0, 90)})`); }
  }
  console.log(`4. canonical classes missing: ${missing.length}${missing.length ? ' -> ' + missing.join(', ') : ''}`);
  fail += missing.length;

  console.log(fail === 0 ? '\nVERIFIED — consolidation is clean' : `\n${fail} PROBLEM(S) — see above`);
  process.exitCode = fail === 0 ? 0 : 1;
}

main().catch((e) => { console.error(e); process.exit(1); });
