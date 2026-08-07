/**
 * restore_ids.mjs — put back the DOM ids that data_whtml_builder dropped.
 *
 *   node restore_ids.mjs <implant|cosmetic|thank-you> [--dry]
 *
 * WHY THIS IS NOT COSMETIC
 * ------------------------
 * The page runtime addresses everything by id, and each chapter bails out
 * whole if one of its anchors is missing — `if (!pin || !rows.length ||
 * !marker) return;`. `#workMarker` never arrived, so cosmetic's entire "The
 * Work" chapter silently did not pin. staging-verify reported `0 pinned` on
 * cosmetic and thank-you against `3 pinned` on the clipboard-built implant,
 * with no console error, because a bail-out is not an error.
 *
 * WHAT WHTML ACTUALLY DROPS. The earlier probe concluded ids survive — it
 * tested Section/Heading/Paragraph/Block, and on those they do. They do NOT
 * survive on `<img>` or on inline elements (`<span>`, `<b>`): cosmetic lost
 * arrivalImg, workIcon, lightboxImg, workMarker, chName, chNum; thank-you lost
 * arrivalImg, stampRing, stampRipple, chName, chNum; the clipboard-built
 * implant lost none of its 58.
 *
 * MATCHING is by class, then by position within that class — the same
 * reasoning as bind_images.mjs, and for the same reason (the live tree does not
 * echo the attribute we are looking for). Both counts are asserted first; an
 * id is skipped rather than guessed if its class does not line up.
 */
import fs from 'node:fs';
import { call, sleep, SITE, PAGES } from './mcp.mjs';

const name = process.argv[2];
const dry = process.argv.includes('--dry');
const pageId = PAGES[name];
if (!pageId) { console.error(`usage: node restore_ids.mjs <${Object.keys(PAGES).join('|')}> [--dry]`); process.exit(2); }

/* --- every id the payload asks for, with its class and its index among the
       elements sharing that class, in document order ---------------------- */
const html = JSON.parse(fs.readFileSync(`${name}/whtml/chunks.json`, 'utf8')).map((c) => c.html).join('');
const seen = new Map();          // class -> running count
const wanted = [];               // {id, cls, nth}
for (const m of html.matchAll(/<([a-z][a-z0-9]*)\b([^>]*)>/gi)) {
  const attrs = m[2];
  const cls = (attrs.match(/\bclass="([^"]*)"/) || [])[1] || '';
  if (!cls) continue;
  const key = cls.trim();
  const nth = seen.get(key) ?? 0;
  seen.set(key, nth + 1);
  const id = (attrs.match(/\bid="([^"]+)"/) || [])[1];
  if (id) wanted.push({ id, cls: key, nth });
}

/* --- the live tree, in document order -------------------------------------
   Live elements carry styleNames (the classes that became Webflow styles), so
   the payload's class string is compared as an ordered list, not as text. */
const tree = await call('data_element_tool', {
  siteId: SITE, pageId,
  context: `Listing the ${name} landing page's elements in document order so the DOM ids the headless converter dropped can be matched back onto them by class and position. Read-only.`,
  actions: [{ label: 'tree', get_all_elements: {} }],
});
const live = [];
const walk = (n) => {
  if (!n || typeof n !== 'object') return;
  if (n.type !== 'String') live.push(n);
  (n.children ?? []).forEach(walk);
};
walk(tree[0].result?.[0]?.data ?? tree[0].result?.data);

const liveByClass = new Map();
for (const el of live) {
  const key = (el.styleNames ?? []).join(' ');
  if (!key) continue;
  if (!liveByClass.has(key)) liveByClass.set(key, []);
  liveByClass.get(key).push(el);
}

const todo = [];
const skipped = [];
for (const w of wanted) {
  const bucket = liveByClass.get(w.cls) ?? [];
  const payloadCount = seen.get(w.cls);
  const el = bucket[w.nth];
  /* Refuse the match unless the whole class bucket lines up — a class whose
     count differs has had elements added or dropped somewhere in between, and
     position no longer identifies anything. */
  if (bucket.length !== payloadCount || !el) {
    skipped.push(`${w.id} (class "${w.cls}": payload ${payloadCount}, live ${bucket.length})`);
    continue;
  }
  const already = el.settings?.domId;
  if (already === w.id) continue;                    // already correct
  todo.push({ ...w, el, was: already ?? '' });
}

console.log(`${name}: ${wanted.length} id(s) in the payload, ${todo.length} to restore, ${skipped.length} unmatched`);
for (const t of todo) console.log(`  ${t.id.padEnd(14)} <- .${t.cls} #${t.nth}  (${t.el.type} ${t.el.id.element})`);
for (const s of skipped) console.log(`  SKIP ${s}`);
if (dry || !todo.length) { console.log(dry ? 'dry run — nothing written' : 'nothing to do'); process.exit(0); }

for (const t of todo) {
  await call('data_element_settings_tool', {
    siteId: SITE, pageId,
    context: `Restoring the DOM id "${t.id}" on the ${name} landing page. The headless HTML converter drops ids on images and inline elements, and the page's own runtime selects its animation anchors by id — without this the chapter that uses it never initialises.`,
    actions: [{ label: t.id, set_settings: { operations: [{ label: t.id, element_id: t.el.id, settings: [{ key: 'domId', static_text: { value: t.id } }] }] } }],
  });
  console.log(`  set #${t.id}`);
  await sleep(1200);
}
console.log(`${todo.length} id(s) restored — republish, then re-run staging-verify`);
