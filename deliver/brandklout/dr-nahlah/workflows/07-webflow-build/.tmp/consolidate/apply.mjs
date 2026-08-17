#!/usr/bin/env node
/**
 * apply.mjs — execute the consolidation plan.
 *
 *   node apply.mjs                 # DRY RUN: prints what it would do
 *   node apply.mjs --commit        # actually writes
 *   node apply.mjs --commit --family chapter-tag   # one family only
 *
 * Order matters:
 *   1. delete the redundant combos that make a canonical name unresolvable
 *      (`set_style(["pk-more"])` fails while `.contact-a-9.pk-more` also exists)
 *   2. rewrite every element onto the canonical class
 *   3. only then retire the fork classes — never before every element that
 *      referenced them is confirmed moved, or those elements lose their styling
 *
 * Every write is journalled to `journal.jsonl` (before + after + result) so the
 * run is resumable and reversible. Re-running skips work already journalled.
 */
import fs from 'node:fs';
import { call } from './api.mjs';

const SITE = '6a6b84cc7fe55ddeabc0b314';
const CTX = 'Consolidating duplicated per-page classes into shared global classes so one edit reaches every page.';
const COMMIT = process.argv.includes('--commit');
const ONLY = (() => { const i = process.argv.indexOf('--family'); return i > -1 ? process.argv[i + 1] : null; })();
const JOURNAL = 'journal.jsonl';

/**
 * Families held back from this run, with the reason. Anything here is skipped
 * even with --commit.
 */
const HOLD = {
  'fa-body': 'coverage incomplete — 1 of 4 elements on Implant Cost could not be captured (every query for it 429s). Retiring fa-body-2 would strip that element.',
  'pk-more': 'awaiting a user decision: the user edited pk-more-7/8/9 to display:flex + margin-right:auto. Collapsing onto that changes pages still on inline-flex.',
  'pk-more-7': 'same pending decision as pk-more — this is the user-edited variant pair (pk-more-7 + pk-more-9).',
};

const journal = fs.existsSync(JOURNAL)
  ? fs.readFileSync(JOURNAL, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l))
  : [];
const doneKeys = new Set(journal.filter((j) => j.ok).map((j) => j.key));
const log = (rec) => { journal.push(rec); if (COMMIT) fs.appendFileSync(JOURNAL, JSON.stringify(rec) + '\n'); };

async function main() {
  const plan = JSON.parse(fs.readFileSync('plan.json', 'utf8'));
  let families = plan.families.filter((f) => !HOLD[f.canonical]);
  const held = plan.families.filter((f) => HOLD[f.canonical]);
  if (ONLY) families = families.filter((f) => f.canonical === ONLY);

  const forkToCanonical = new Map();
  for (const f of families) for (const fork of f.forks) forkToCanonical.set(fork, f.canonical);
  const rewrites = plan.rewrites.filter((r) =>
    r.before.some((n) => forkToCanonical.has(n.replace(/\s+/g, '-'))));

  console.log(`${COMMIT ? 'APPLY' : 'DRY RUN'}${ONLY ? ` [family=${ONLY}]` : ''}`);
  console.log(`  families      : ${families.length}`);
  console.log(`  forks to retire: ${families.reduce((a, f) => a + f.forks.length, 0)}`);
  console.log(`  elements       : ${rewrites.length}`);
  if (held.length && !ONLY) {
    console.log(`  HELD BACK      : ${held.length}`);
    for (const h of held) console.log(`     - ${h.canonical}: ${HOLD[h.canonical]}`);
  }
  if (!COMMIT) {
    for (const f of families.slice(0, 100)) {
      console.log(`  ${f.canonical.padEnd(18)} <- ${f.forks.join(', ')}`);
      for (const c of f.redundantCombosToDelete ?? []) {
        console.log(`      prereq: delete combo .${c.base}.${c.combo}${c.identicalToBase ? ' (identical to base — visual no-op)' : ' *** DIFFERS FROM BASE ***'}`);
      }
    }
    console.log('\nre-run with --commit to write');
    return;
  }

  // ---- 1. prerequisite combo deletions -----------------------------------
  for (const f of families) {
    for (const c of f.redundantCombosToDelete ?? []) {
      if (!c.identicalToBase) { console.error(`  SKIP combo .${c.base}.${c.combo} — differs from base, deleting it would change rendering`); continue; }
      const key = `combo:${c.base}.${c.combo}`;
      if (doneKeys.has(key)) continue;
      try {
        await call('data_style_tool', {
          siteId: SITE, pageId: plan.rewrites[0].pageId, context: CTX,
          actions: [{ label: 'rm', remove_style: { style_name: c.combo, parent_style_names: [c.base] } }],
        }, key);
        log({ key, kind: 'combo-delete', base: c.base, combo: c.combo, ok: true });
        console.log(`  deleted combo .${c.base}.${c.combo}`);
      } catch (e) {
        log({ key, kind: 'combo-delete', base: c.base, combo: c.combo, ok: false, error: String(e.message).slice(0, 200) });
        console.error(`  FAILED combo .${c.base}.${c.combo}: ${String(e.message).slice(0, 140)}`);
      }
    }
  }

  // ---- 2. element rewrites -----------------------------------------------
  const movedOk = new Map();   // fork -> count moved
  const movedBad = new Map();
  for (const [i, r] of rewrites.entries()) {
    const key = `el:${r.id.component}/${r.id.element}`;
    if (doneKeys.has(key)) continue;
    // Key by SELECTOR, because step 3 looks these up by selector. Keying by the
    // Designer name here (with its space) made every lookup miss, so the
    // "do not retire a fork whose elements failed to move" guard never fired
    // and all 133 forks were retired regardless of failures. Webflow's own
    // refusal to delete an in-use style is what prevented damage — do not rely
    // on that a second time.
    const forks = r.before
      .map((n) => n.replace(/\s+/g, '-'))
      .filter((sel) => forkToCanonical.has(sel));
    try {
      const [res] = await call('data_element_tool', {
        siteId: SITE, pageId: r.pageId, context: CTX,
        actions: [{ label: 'set', set_style: { id: r.id, style_names: r.after, return_element_info: true } }],
      }, key);
      const got = res.result?.[0]?.data?.styleNames ?? res.result?.data?.styleNames ?? null;
      const ok = res.result?.[0]?.status !== 'error' && !res.error;
      // Capture the API's own message on rejection. Without it a failure is an
      // unexplained ok:false and the cause has to be re-derived from scratch.
      const msg = ok ? undefined
        : (res.result?.[0]?.message ?? res.error?.message ?? JSON.stringify(res).slice(0, 300));
      log({ key, kind: 'set-style', page: r.page, before: r.before, after: r.after, got, ok, error: msg });
      for (const f of forks) (ok ? movedOk : movedBad).set(f, ((ok ? movedOk : movedBad).get(f) ?? 0) + 1);
      if (!ok) console.error(`  FAILED ${r.page} ${r.id.element}: ${JSON.stringify(res).slice(0, 160)}`);
      if ((i + 1) % 25 === 0) console.log(`  ...${i + 1}/${rewrites.length} elements`);
    } catch (e) {
      log({ key, kind: 'set-style', page: r.page, before: r.before, after: r.after, ok: false, error: String(e.message).slice(0, 200) });
      for (const f of forks) movedBad.set(f, (movedBad.get(f) ?? 0) + 1);
      console.error(`  ERROR ${r.page} ${r.id.element}: ${String(e.message).slice(0, 140)}`);
    }
  }

  // ---- 3. retire forks — ONLY those with zero failed rewrites -------------
  let retired = 0, skippedForks = 0;
  for (const f of families) {
    for (const fork of f.forks) {
      const key = `style:${fork}`;
      if (doneKeys.has(key)) continue;
      if (movedBad.get(fork)) {
        console.error(`  KEEPING ${fork} — ${movedBad.get(fork)} element(s) failed to move`);
        skippedForks++; continue;
      }
      const name = plan.forkNames?.[fork] ?? fork.replace(/-(\d+)$/, ' $1');
      try {
        await call('data_style_tool', {
          siteId: SITE, pageId: plan.rewrites[0].pageId, context: CTX,
          actions: [{ label: 'rm', remove_style: { style_name: name } }],
        }, key);
        log({ key, kind: 'style-remove', style: fork, name, ok: true });
        retired++;
      } catch (e) {
        log({ key, kind: 'style-remove', style: fork, name, ok: false, error: String(e.message).slice(0, 200) });
        console.error(`  FAILED remove ${name}: ${String(e.message).slice(0, 140)}`);
      }
    }
  }

  console.log(`\ndone: ${[...movedOk.values()].reduce((a, b) => a + b, 0)} element moves ok, ${[...movedBad.values()].reduce((a, b) => a + b, 0)} failed; ${retired} forks retired, ${skippedForks} kept`);
  console.log(`journal: ${JOURNAL}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
