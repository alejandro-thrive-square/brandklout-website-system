/**
 * reconcile_forks.mjs — repoint a headlessly-built page's elements off their
 * forked class twins and onto the canonical classes the site already owns.
 *
 *   node reconcile_forks.mjs <page> [--dry]
 *
 * WHY THE TWINS EXIST
 * -------------------
 * Webflow reconciles an inserted class by NAME only when the definition matches
 * exactly. implant was built through the clipboard; thank-you and cosmetic
 * through data_whtml_builder, whose CSS is equivalent but not byte-identical.
 * So the shared chrome forked: `gm-header-1`, `gm-header-1-2`, and so on.
 *
 * WHY REPOINTING IS AN IMPROVEMENT, NOT A COMPROMISE
 * --------------------------------------------------
 * compare_forks.mjs diffed every pair. Nothing the canonical class lacks is
 * lost — every apparent gap is the same rule in shorthand (`padding-block` vs
 * `padding-block-start`/`-end`, `place-items` vs `justify-items`/`align-items`,
 * `overflow` vs `overflow-x`/`-y`, `background` vs `background-image`). What
 * the canonical has and the twin does NOT is real, and it is the design:
 *   - the true base value, where the twin carries a min-width value folded into
 *     it (gm-header 15.52px vs the twin's 17.46px, which is the ≥1920 step);
 *   - the actual `large`/`xl`/`xxl` breakpoint variants, which the WHTML route
 *     cannot emit at all and therefore flattened away;
 *   - the full font stack — WHTML collapses `"Montserrat", system-ui, …` to
 *     `Montserrat`, so the twin has no fallback family;
 *   - every layer of a multi-layer gradient (`arrival__aurora` has three
 *     radial-gradients canonically and one on the twin).
 * So this pass closes the fork report AND the unresolved min-width variants at
 * the same time.
 *
 * THE TWINS ARE NOT DELETED HERE, ON PURPOSE. remove_style is site-wide, and a
 * twin left over from one page can still be in use on another — `gm-header-1`
 * belongs to thank-you while cosmetic carries `gm-header-1-2`. Once nothing
 * references them, Webflow prunes unreferenced styles when it compiles at
 * publish time; that has already been observed on this site (146 orphan names
 * disappeared after the superseded band-stack build was removed). Reconcile
 * every page, publish, then confirm they are gone rather than deleting by hand.
 */
import fs from 'node:fs';
import { call, sleep, SITE, PAGES } from './mcp.mjs';

const name = process.argv[2];
const dry = process.argv.includes('--dry');

const pageId = PAGES[name];
if (!pageId) { console.error(`usage: node reconcile_forks.mjs <${Object.keys(PAGES).join('|')}> [--dry]`); process.exit(2); }

const expected = new Set(JSON.parse(fs.readFileSync(`${name}/final.json`, 'utf8'))
  .payload.styles.map((s) => s.name));

const tree = await call('data_element_tool', {
  siteId: SITE, pageId,
  context: `Listing every element on the ${name} landing page with the classes it carries, so elements sitting on forked class twins can be repointed onto the canonical classes the site already owns. Read-only.`,
  actions: [{ label: 'tree', get_all_elements: {} }],
});

/** Longest payload-name prefix P where twin === P + one or more "-<digits>".
 *  Greedy trailing-digit stripping picks `btn-before` for `btn-before-2-1-2`,
 *  which is a DIFFERENT real class — the longest prefix picks `btn-before-2`. */
const canonicalOf = (twin) => {
  if (expected.has(twin)) return null;
  let best = null;
  for (const p of expected) {
    if (!twin.startsWith(p + '-') || !/^(-\d+)+$/.test(twin.slice(p.length))) continue;
    if (!best || p.length > best.length) best = p;
  }
  return best;
};

const edits = [];
const twins = new Set();
const walk = (n) => {
  if (!n || typeof n !== 'object') return;
  const names = n.styleNames ?? [];
  if (names.length) {
    const mapped = names.map((c) => canonicalOf(c) ?? c);
    if (mapped.some((c, i) => c !== names[i])) {
      names.forEach((c, i) => { if (mapped[i] !== c) twins.add(c); });
      edits.push({ id: n.id, from: names, to: mapped });
    }
  }
  (n.children ?? []).forEach(walk);
};
walk(tree[0].result?.[0]?.data ?? tree[0].result?.data);

console.log(`${name}: ${edits.length} element(s) on ${twins.size} forked twin(s)`);
for (const t of [...twins].sort()) console.log(`  ${t} -> ${canonicalOf(t)}`);
if (!edits.length) process.exit(0);

if (dry) { console.log('dry run — nothing written'); process.exit(0); }

/* set_style REPLACES the element's whole class list, so the full mapped list
   goes in every time — passing only the changed name would strip the rest. */
for (let i = 0; i < edits.length; i += 8) {
  const batch = edits.slice(i, i + 8);
  await call('data_element_tool', {
    siteId: SITE, pageId,
    context: `Repointing ${batch.length} element(s) on the ${name} landing page from forked class twins onto the canonical classes, so the three landing pages share one class system instead of duplicating the shared header, footer and chrome.`,
    actions: batch.map((e, j) => ({ label: `set-${i + j}`, set_style: { id: e.id, style_names: e.to } })),
  });
  console.log(`  repointed ${Math.min(i + 8, edits.length)}/${edits.length}`);
  await sleep(1500);
}

/* Re-read rather than trust the write: a set_style that silently no-ops leaves
   the page looking reconciled in the log and forked on the site. */
const after = await call('data_element_tool', {
  siteId: SITE, pageId,
  context: `Re-reading the ${name} landing page's classes to confirm no element is still sitting on a forked twin. Read-only.`,
  actions: [{ label: 'tree', get_all_elements: {} }],
});
let left = 0;
const recheck = (n) => {
  if (!n || typeof n !== 'object') return;
  if ((n.styleNames ?? []).some((c) => canonicalOf(c))) left++;
  (n.children ?? []).forEach(recheck);
};
recheck(after[0].result?.[0]?.data ?? after[0].result?.data);
console.log(left === 0 ? `reconciled — 0 elements on twins` : `INCOMPLETE — ${left} element(s) still on a twin`);
process.exit(left === 0 ? 0 : 1);
