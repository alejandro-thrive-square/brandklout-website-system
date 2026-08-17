/**
 * compare_forks.mjs — read-only. For every forked class twin on a page, diff
 * the twin's definition against the canonical class it forked from.
 *
 *   node compare_forks.mjs <implant|cosmetic|thank-you>
 *
 * Webflow reconciles a pasted/inserted class by NAME, but only when the
 * definition matches byte-for-byte; otherwise it mints `name-1`, `name-2`.
 * Mixing the clipboard build (implant) with the headless WHTML build
 * (thank-you, cosmetic) produced 20 and 33 twins respectively, all of it
 * shared chrome.
 *
 * Repointing an element from the twin onto the canonical class is only safe
 * where the two definitions AGREE. This prints that diff so the repoint pass
 * can be scoped to the classes where it changes nothing, and the rest reported
 * rather than silently restyled.
 *
 * Canonical resolution is by LONGEST payload-name prefix, not by stripping
 * trailing `-N` greedily: `btn-before-2-1-2` is a twin of `btn-before-2`, not
 * of `btn-before` — both exist, and the greedy read picks the wrong one.
 */
import fs from 'node:fs';
import { call, SITE, PAGES } from './mcp.mjs';

const name = process.argv[2];
const pageId = PAGES[name];
if (!pageId) { console.error(`usage: node compare_forks.mjs <${Object.keys(PAGES).join('|')}>`); process.exit(2); }

const expected = new Set(JSON.parse(fs.readFileSync(`${name}/final.json`, 'utf8'))
  .payload.styles.map((s) => s.name));

const tree = await call('data_element_tool', {
  siteId: SITE, pageId,
  context: `Listing the classes in use on the ${name} landing page so each forked twin can be compared with the canonical class it forked from. Read-only.`,
  actions: [{ label: 'tree', get_all_elements: {} }],
});
const live = new Set();
const walk = (n) => {
  if (!n || typeof n !== 'object') return;
  (n.styleNames ?? []).forEach((c) => live.add(c));
  (n.children ?? []).forEach(walk);
};
walk(tree[0].result?.[0]?.data ?? tree[0].result?.data);

/** Longest payload-name prefix P such that twin === P + one or more "-<digits>". */
const canonicalOf = (twin) => {
  let best = null;
  for (const p of expected) {
    if (!twin.startsWith(p + '-')) continue;
    if (!/^(-\d+)+$/.test(twin.slice(p.length))) continue;
    if (!best || p.length > best.length) best = p;
  }
  return best;
};

const pairs = [];
for (const c of live) {
  if (expected.has(c)) continue;
  const canon = canonicalOf(c);
  if (canon) pairs.push({ twin: c, canon });
}
console.log(`${name}: ${live.size} classes live, ${pairs.length} forked twin(s)`);
if (!pairs.length) process.exit(0);

/* One query per CANONICAL name is enough: name_path is a substring match, so
   `gm-header` returns `gm-header` and `gm-header-1-2` together. */
const wanted = [...new Set(pairs.map((p) => p.canon))];
const defs = new Map();
for (let i = 0; i < wanted.length; i += 10) {
  const batch = wanted.slice(i, i + 10);
  const r = await call('data_style_tool', {
    siteId: SITE, pageId,
    context: `Reading the CSS of ${batch.length} classes on the ${name} landing page to compare each forked twin with its canonical class. Read-only.`,
    actions: [{
      label: 'q',
      query_styles: {
        /* include_breakpoints is an ARRAY of breakpoint ids, not a boolean —
           passing `true` fails the whole call with a union error that names
           `actions` rather than the offending field. */
        queries: batch.map((n2) => ({
          label: n2, name_path: [n2], include_properties: true, limit: 50,
          include_breakpoints: ['main', 'medium', 'small', 'tiny', 'large', 'xl', 'xxl'],
        })),
      },
    }],
  });
  for (const block of r[0].result ?? []) {
    for (const s of block.matches ?? []) defs.set(s.name, s);
  }
}

/* Normalise before comparing: the two builds serialise the same value
   differently often enough that a raw string diff is useless (`0` vs `0px`,
   `#FFF` vs `#ffffff`, `1px solid #e7ecf1` vs the four longhands). */
const norm = (v) => String(v).toLowerCase().replace(/\s+/g, ' ').replace(/\b0px\b/g, '0')
  .replace(/#([0-9a-f])\1([0-9a-f])\2([0-9a-f])\3\b/g, '#$1$2$3')
  /* `background` vs `background-color`, and the same colour written with or
     without spaces, are the SAME rule serialised by two different builders. */
  .replace(/, /g, ',').replace(/"/g, '').trim();
const KEY = (k) => (k === 'background' ? 'background-color' : k);

const flat = (s) => {
  const out = new Map();
  for (const [bp, block] of Object.entries(s?.properties?.breakpoints ?? {})) {
    for (const [k, v] of Object.entries(block.properties ?? {})) out.set(`${bp}|${KEY(k)}`, norm(v));
  }
  return out;
};

let identical = 0;
const differing = [];
for (const { twin, canon } of pairs.sort((a, b) => a.twin.localeCompare(b.twin))) {
  const a = flat(defs.get(twin)); const b = flat(defs.get(canon));
  if (!defs.has(twin) || !defs.has(canon)) { differing.push({ twin, canon, why: ['NOT READ BACK'] }); continue; }
  const keys = new Set([...a.keys(), ...b.keys()]);
  const diff = [...keys].filter((k) => a.get(k) !== b.get(k))
    .map((k) => `${k}: twin=${a.get(k) ?? '(unset)'} canon=${b.get(k) ?? '(unset)'}`);
  if (diff.length) differing.push({ twin, canon, why: diff }); else identical++;
}
console.log(`  identical after normalisation : ${identical}`);
console.log(`  differing                     : ${differing.length}`);
for (const d of differing) {
  console.log(`  * ${d.twin}  ->  ${d.canon}`);
  for (const w of d.why.slice(0, 8)) console.log(`      ${w}`);
  if (d.why.length > 8) console.log(`      … ${d.why.length - 8} more`);
}
fs.writeFileSync(`fork-report-${name}.json`, JSON.stringify({ pairs, identical, differing }, null, 1));
console.log(`written: fork-report-${name}.json`);
