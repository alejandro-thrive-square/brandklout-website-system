/**
 * delete_twins.mjs — remove the forked class twins left behind after
 * reconcile_forks.mjs has repointed every element off them.
 *
 *   node delete_twins.mjs [--dry]
 *
 * Run this ONLY after every page is reconciled. `remove_style` is SITE-WIDE, so
 * a twin still referenced by another page would lose its styling.
 *
 * Publishing does NOT clean these up. The runbook's note that Webflow prunes
 * unreferenced styles applies to styles removed from the project, not to ones
 * that merely stopped being referenced: after reconciling both pages and
 * republishing, all six spot-checked twins were still in the published CSS
 * bundle. They are dead weight in the bundle and clutter in the style panel.
 *
 * TWO GUARDS, both required to delete a name:
 *   1. it is not in `site-classes-before.txt` — the style-name snapshot taken
 *      before any of this work touched the site, so anything the client already
 *      had is untouchable even if its name happens to end in `-1`;
 *   2. no element on any of the three landing pages still carries it.
 */
import fs from 'node:fs';
import { call, sleep, SITE, PAGES } from './mcp.mjs';

const dry = process.argv.includes('--dry');

const baseline = new Set(fs.readFileSync('site-classes-before.txt', 'utf8')
  .split(/\r?\n/).map((l) => l.trim()).filter(Boolean));
console.log(`baseline: ${baseline.size} class names existed before this work`);

/* Union of every page's payload names — a twin is a fork of one of these. */
const expected = new Set();
for (const p of Object.keys(PAGES)) {
  for (const s of JSON.parse(fs.readFileSync(`${p}/final.json`, 'utf8')).payload.styles) expected.add(s.name);
}
const canonicalOf = (twin) => {
  if (expected.has(twin)) return null;
  let best = null;
  for (const p of expected) {
    if (!twin.startsWith(p + '-') || !/^(-\d+)+$/.test(twin.slice(p.length))) continue;
    if (!best || p.length > best.length) best = p;
  }
  return best;
};

/* What is still referenced, across all three pages. */
const inUse = new Set();
for (const [n, pageId] of Object.entries(PAGES)) {
  const tree = await call('data_element_tool', {
    siteId: SITE, pageId,
    context: `Listing the classes still in use on the ${n} landing page, so a forked twin is only deleted once nothing anywhere references it. Read-only.`,
    actions: [{ label: 'tree', get_all_elements: {} }],
  });
  const walk = (x) => {
    if (!x || typeof x !== 'object') return;
    (x.styleNames ?? []).forEach((c) => inUse.add(c));
    (x.children ?? []).forEach(walk);
  };
  walk(tree[0].result?.[0]?.data ?? tree[0].result?.data);
}

/* Every style on the site, so twins are found by name rather than guessed. */
const all = await call('data_style_tool', {
  siteId: SITE, pageId: PAGES.implant,
  context: 'Listing every style on the site so the forked class twins created by the headless builds can be identified by name and removed. Read-only.',
  actions: [{ label: 'all', get_styles: { query: 'all' } }],
});
const names = JSON.stringify(all).match(/"name":"[^"]+"/g)?.map((s) => s.slice(8, -1)) ?? [];
const siteNames = [...new Set(names)];
console.log(`site currently has ${siteNames.length} style names`);

const doomed = siteNames.filter((n) => canonicalOf(n) && !baseline.has(n) && !inUse.has(n));
const kept = siteNames.filter((n) => canonicalOf(n) && (baseline.has(n) || inUse.has(n)));
console.log(`twins to delete : ${doomed.length}`);
console.log(`twins KEPT      : ${kept.length}${kept.length ? ' -> ' + kept.join(', ') : ''}`);
for (const d of doomed) console.log(`  ${d} (fork of ${canonicalOf(d)})`);
if (dry || !doomed.length) { console.log(dry ? 'dry run — nothing deleted' : 'nothing to delete'); process.exit(0); }

for (let i = 0; i < doomed.length; i += 8) {
  const batch = doomed.slice(i, i + 8);
  await call('data_style_tool', {
    siteId: SITE, pageId: PAGES.implant,
    context: `Removing ${batch.length} unreferenced class twins that the headless build forked off the landing pages' shared chrome; every element has already been repointed onto the canonical class and none of these names existed before this work.`,
    actions: batch.map((n, j) => ({ label: `rm-${i + j}`, remove_style: { style_name: n } })),
  });
  console.log(`  deleted ${Math.min(i + 8, doomed.length)}/${doomed.length}`);
  await sleep(1500);
}
console.log('twins removed — republish for the CSS bundle to lose them');
