#!/usr/bin/env node
/**
 * fill.mjs — capture the pages `get_all_elements` cannot return.
 *
 * Implant Cost, Contact and Style Guide 429 every single time, at any spacing,
 * while every other page succeeds — so it is per-page response cost, not the
 * rate-limit window. (The MCP server enriches element responses via
 * `GET /v2/assets`, and that is the endpoint returning 429.)
 *
 * `query_elements` with an `element_filter.style` returns only matching
 * elements, which is small enough to succeed. `style` is a case-insensitive
 * SUBSTRING match against applied style names, so filtering on a family stem
 * ("pk-more") returns every variant ("pk-more 7") along with its real
 * styleNames — which is exactly what the rewrite needs.
 *
 * Merges results into elements.json under a `partial: true` marker so plan.mjs
 * knows the page was captured by filter rather than exhaustively.
 *
 *   node fill.mjs
 */
import fs from 'node:fs';
import { call, collectElements } from './api.mjs';

const SITE = '6a6b84cc7fe55ddeabc0b314';
const CTX = 'Capturing elements that use consolidation-target classes on pages whose full element tree exceeds the API response budget.';
const PER_CALL = Number(process.env.WF_STEMS_PER_CALL ?? 8);

// Family stems worth searching. Derived from plan.json when present, plus the
// known component vocabulary, so a class used ONLY on a missing page is still
// found (plan.json's fork list is restricted to classes seen on captured pages).
function stems() {
  const s = new Set([
    'pk-more', 'pk-head', 'pk-crumb', 'pk-quote', 'pk-ba-cap', 'ph-bg-after',
    'ph-lead', 'ph-meta', 'chapter-tag', 'eyebrow', 'btn-after', 'ba-line-before',
    'nx-k', 'nx-d', 'lc-head', 'lc-body', 'dr-grid', 'dr-foot', 'sp-copy',
    'sp-list', 'summary-after', 'fa-body', 'pg-hero', 'actions', 'facts', 'base',
    'grid', 'menu', 'nav-right', 'of-grid', 'cr-list', 'more', 'bg',
  ]);
  try {
    const plan = JSON.parse(fs.readFileSync('plan.json', 'utf8'));
    for (const f of plan.families) s.add(String(f.canonical).replace(/-\d+$/, ''));
  } catch { /* plan.json optional */ }
  return [...s].sort();
}

async function main() {
  const pages = JSON.parse(fs.readFileSync('pages.json', 'utf8'));
  const elements = JSON.parse(fs.readFileSync('elements.json', 'utf8'));
  const list = stems();
  // A page is done when it was captured exhaustively (get_all_elements) or when
  // every stem filter has succeeded at least once. The 429s here are
  // intermittent, so runs ACCUMULATE: results union into what is already
  // stored and only outstanding stems are retried. Re-run until clean.
  const todo = pages.filter((p) => {
    const e = elements[p.id];
    if (e?.elements?.length && !e.partial) return false;
    const done = new Set(e?.stemsDone ?? []);
    return list.some((s) => !done.has(s));
  });
  if (!todo.length) { console.log('nothing to fill — every page fully covered'); return; }
  console.log(`filling ${todo.length} page(s); ${list.length} stem filters`);

  for (const p of todo) {
    const prev = elements[p.id] ?? {};
    const found = new Map((prev.elements ?? []).map((e) => [`${e.id.component}/${e.id.element}`, e]));
    const done = new Set(prev.stemsDone ?? []);
    const outstanding = list.filter((s) => !done.has(s));
    let failed = 0;
    for (let i = 0; i < outstanding.length; i += PER_CALL) {
      const chunk = outstanding.slice(i, i + PER_CALL);
      try {
        const [r] = await call('data_element_tool', {
          siteId: SITE, pageId: p.id, context: CTX,
          actions: [{ label: 'q', query_elements: {
            queries: chunk.map((st) => ({ label: st, element_filter: { style: st }, limit: 200 })),
          } }],
        }, `${p.title} [${chunk[0]}…]`);
        for (const e of collectElements(r)) found.set(`${e.id.component}/${e.id.element}`, e);
        for (const s of chunk) done.add(s);
      } catch (e) {
        failed++;
        console.error(`  ${p.title}: chunk [${chunk.join(', ')}] failed — will retry next run`);
      }
      elements[p.id] = {
        slug: p.slug, title: p.title, draft: p.draft,
        partial: true, stemsDone: [...done].sort(),
        elements: [...found.values()],
      };
      fs.writeFileSync('elements.json', JSON.stringify(elements, null, 2));
    }
    const left = list.filter((s) => !done.has(s));
    console.log(`  ${p.title}: ${found.size} elements, ${done.size}/${list.length} stems done${left.length ? ` — outstanding: ${left.join(', ')}` : ' ✓'}`);
  }
  const incomplete = pages.filter((p) => {
    const e = elements[p.id];
    if (e?.elements?.length && !e.partial) return false;
    return list.some((s) => !(e?.stemsDone ?? []).includes(s));
  });
  console.log(incomplete.length
    ? `!! re-run: ${incomplete.map((m) => m.title).join(', ')} still have outstanding stems`
    : 'all pages fully covered');
}

main().catch((e) => { console.error(e); process.exit(1); });
