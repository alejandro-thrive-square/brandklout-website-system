#!/usr/bin/env node
/**
 * merge-pkmore.mjs — collapse the nine pk-more variants into one class.
 *
 *   node merge-pkmore.mjs            # dry run
 *   node merge-pkmore.mjs --commit
 *
 * WHY THE SURVIVING CLASS IS `pk-more 7` AND NOT `pk-more`
 * The name `pk-more` resolves to three style objects — the global plus combos
 * `.contact-a-9.pk-more` and `.contact-a-10.pk-more` — so the API can neither
 * apply it (`set_style` -> "One or more styles not found: pk-more") nor edit it
 * (`update_style` -> "[Conflict] The operation could not be applied to the style
 * block store"). `pk-more 7` is unambiguous, so everything is consolidated onto
 * it; the cleanup phase then tries to free the name and rename it back.
 *
 * THE MERGED DEFINITION
 * Variants 1-6:  display:inline-flex + transition
 * Variants 7,9:  display:flex + margin-right:auto, transition LOST
 * Variant  8:    as 7/9 plus flex-flow:row + justify-content:flex-start
 *
 * 8's extras are the CSS defaults for a flex row, so they are no-ops. The merge
 * keeps `margin-right:auto` (the user's alignment fix) and `display:inline-flex`
 * (the original), which is correct in BOTH contexts:
 *   - package links are flex ITEMS, and flex items are blockified, so
 *     inline-flex and flex render identically there;
 *   - the footer "Directions" link is block-level, where inline-flex hugs its
 *     text (the current look) and flex would stretch the underline full width.
 *     `margin-right:auto` is inert on an inline-level box.
 * `transition` is restored: every variant still has a :hover colour change, so
 * losing it made hover snap instantly — collateral damage from the Designer
 * edit, not intent.
 */
import fs from 'node:fs';
import { call, collectElements } from './api.mjs';

const SITE = '6a6b84cc7fe55ddeabc0b314';
const HOME = '6a6b84cf7fe55ddeabc0b3bf';
const BOOKNOW = 'c6f4637a-2156-868a-ee78-ae6fdd2987ad';
const CTX = 'Merging the nine forked package-link classes into a single shared class.';
const COMMIT = process.argv.includes('--commit');
const TARGET = 'pk-more 7';
const FORKS = ['pk-more 2', 'pk-more 3', 'pk-more 4', 'pk-more 5', 'pk-more 6', 'pk-more 8', 'pk-more 9'];
const ALL = new Set([...FORKS, 'pk-more', TARGET]);
const LOG = 'merge-pkmore.jsonl';

const done = fs.existsSync(LOG)
  ? new Set(fs.readFileSync(LOG, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)).filter((j) => j.ok).map((j) => j.key))
  : new Set();
const log = (r) => { if (COMMIT) fs.appendFileSync(LOG, JSON.stringify(r) + '\n'); };

const MERGED = [
  { property_name: 'display', property_value: 'inline-flex' },
  { property_name: 'margin-right', property_value: 'auto' },
  { property_name: 'transition', property_value: 'color .35s, border-color .35s' },
];

async function main() {
  // ---- element inventory -------------------------------------------------
  const pageEls = JSON.parse(fs.readFileSync('pkmore-elements.json', 'utf8'));
  const bnEls = JSON.parse(fs.readFileSync('booknow-pkmore.json', 'utf8'))
    .filter((e) => e.styleNames.some((n) => ALL.has(n)));
  const targets = [
    ...pageEls.map((r) => ({ pageId: r.pid, page: r.page, id: r.id, before: r.names, scope: null })),
    ...bnEls.map((e) => ({ pageId: HOME, page: 'BookNow component', id: e.id, before: e.styleNames, scope: BOOKNOW })),
  ].filter((t) => t.before.some((n) => ALL.has(n)) && !(t.before.length === 1 && t.before[0] === TARGET));

  for (const t of targets) t.after = t.before.map((n) => (ALL.has(n) ? TARGET : n));

  console.log(`${COMMIT ? 'MERGE' : 'DRY RUN'} — surviving class: "${TARGET}"`);
  console.log(`  elements to restyle: ${targets.length}`);
  const chains = {};
  for (const t of targets) chains[`${JSON.stringify(t.before)} -> ${JSON.stringify(t.after)}`] = (chains[`${JSON.stringify(t.before)} -> ${JSON.stringify(t.after)}`] ?? 0) + 1;
  for (const [k, n] of Object.entries(chains)) console.log(`    ${n} x ${k}`);
  console.log(`  merged definition: ${MERGED.map((p) => `${p.property_name}:${p.property_value}`).join('; ')}`);
  console.log(`  forks to retire: ${FORKS.join(', ')}`);
  if (!COMMIT) { console.log('\nre-run with --commit'); return; }

  // ---- 1. write the merged definition onto the surviving class -----------
  if (!done.has('def')) {
    const [r] = await call('data_style_tool', {
      siteId: SITE, pageId: HOME, context: CTX,
      actions: [{ label: 'd', update_style: { style_name: TARGET, breakpoint_id: 'main', properties: MERGED } }],
    }, 'definition');
    const ok = !r.error;
    log({ key: 'def', kind: 'definition', ok, error: r.error?.message });
    console.log(ok ? `  definition written to "${TARGET}"` : `  DEFINITION FAILED: ${JSON.stringify(r.error).slice(0, 160)}`);
    if (!ok) return;
  }

  // ---- 2. restyle every element ------------------------------------------
  let ok = 0, bad = 0;
  for (const t of targets) {
    const key = `el:${t.id.component}/${t.id.element}`;
    if (done.has(key)) { ok++; continue; }
    const set = { id: t.id, style_names: t.after, return_element_info: true };
    if (t.scope) set.scope_component_id = t.scope;
    try {
      const [r] = await call('data_element_tool', {
        siteId: SITE, pageId: t.pageId, context: CTX,
        actions: [{ label: 's', set_style: set }],
      }, key);
      const got = r.result?.[0]?.data?.styleNames ?? null;
      const good = r.result?.[0]?.status !== 'error' && !r.error;
      log({ key, kind: 'set-style', page: t.page, before: t.before, after: t.after, got, ok: good, error: good ? undefined : (r.result?.[0]?.message ?? JSON.stringify(r).slice(0, 200)) });
      good ? ok++ : bad++;
      if (!good) console.error(`  FAILED ${t.page}: ${(r.result?.[0]?.message ?? '').slice(0, 120)}`);
    } catch (e) {
      log({ key, kind: 'set-style', page: t.page, before: t.before, after: t.after, ok: false, error: String(e.message).slice(0, 200) });
      bad++; console.error(`  ERROR ${t.page}: ${String(e.message).slice(0, 120)}`);
    }
  }
  console.log(`  elements: ${ok} ok, ${bad} failed`);
  if (bad) { console.error('  stopping before cleanup — not retiring anything while elements still reference the old classes'); return; }

  // ---- 3. retire the forks ------------------------------------------------
  for (const f of FORKS) {
    const key = `rm:${f}`;
    if (done.has(key)) continue;
    try {
      const [r] = await call('data_style_tool', { siteId: SITE, pageId: HOME, context: CTX, actions: [{ label: 'r', remove_style: { style_name: f } }] }, key);
      log({ key, kind: 'remove-fork', style: f, ok: !r.error, error: r.error?.message });
      console.log(`  retired ${f}${r.error ? ' FAILED' : ''}`);
    } catch (e) { log({ key, kind: 'remove-fork', style: f, ok: false, error: String(e.message).slice(0, 160) }); console.error(`  retire ${f} failed`); }
  }

  // ---- 4. free the name `pk-more`, then rename the survivor back ----------
  // Best effort. If any step fails the site is still correct; the class is just
  // still called "pk-more 7".
  for (const base of ['contact-a-9', 'contact-a-10']) {
    const key = `combo:${base}`;
    if (done.has(key)) continue;
    try {
      const [r] = await call('data_style_tool', { siteId: SITE, pageId: HOME, context: CTX, actions: [{ label: 'c', remove_style: { style_name: 'pk-more', parent_style_names: [base] } }] }, key);
      log({ key, kind: 'remove-combo', base, ok: !r.error, error: r.error?.message });
      console.log(`  combo .${base}.pk-more removed${r.error ? ' FAILED' : ''}`);
    } catch (e) { log({ key, kind: 'remove-combo', base, ok: false, error: String(e.message).slice(0, 160) }); }
  }
  try {
    const [r] = await call('data_style_tool', { siteId: SITE, pageId: HOME, context: CTX, actions: [{ label: 'g', remove_style: { style_name: 'pk-more' } }] }, 'rm-global');
    log({ key: 'rm-global', kind: 'remove-global', ok: !r.error, error: r.error?.message });
    console.log(`  global pk-more removed${r.error ? ' FAILED' : ''}`);
  } catch (e) { log({ key: 'rm-global', kind: 'remove-global', ok: false, error: String(e.message).slice(0, 160) }); console.error('  global pk-more not removable'); }
  try {
    const [r] = await call('data_style_tool', { siteId: SITE, pageId: HOME, context: CTX, actions: [{ label: 'n', rename_style: { style_name: TARGET, new_name: 'pk-more' } }] }, 'rename');
    log({ key: 'rename', kind: 'rename', ok: !r.error, error: r.error?.message });
    console.log(r.error ? `  rename to "pk-more" FAILED — surviving class stays "${TARGET}"` : `  renamed "${TARGET}" -> "pk-more"`);
  } catch (e) { log({ key: 'rename', kind: 'rename', ok: false, error: String(e.message).slice(0, 160) }); console.error(`  rename failed — surviving class stays "${TARGET}"`); }
}

main().catch((e) => { console.error(e); process.exit(1); });
