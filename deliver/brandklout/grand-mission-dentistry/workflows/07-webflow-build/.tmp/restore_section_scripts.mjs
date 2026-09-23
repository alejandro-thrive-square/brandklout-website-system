/**
 * restore_section_scripts.mjs — put back the per-section behaviour scripts that
 * data_whtml_builder discarded.
 *
 *   node restore_section_scripts.mjs <implant|cosmetic|thank-you> [--dry]
 *
 * THIS IS WHY cosmetic AND thank-you REPORTED `0 pinned`.
 * Each chapter's motion lives in a `<script class="wz-js …" data-embed>` block
 * INSIDE its own section — that is the pasteable-component architecture. The
 * clipboard build carries them (implant serves 9 `WZ.add(` blocks); WHTML
 * silently dropped them (cosmetic and thank-you served 2, both from the shared
 * footer runtime). Nothing errored, because nothing ran: no chapter code means
 * no pinned scenes, no scrubbed rails, no chapter readout — a stack of static
 * bands with a working header.
 *
 * `payload_to_whtml.py` treats only the ONE non-script embed as a placeholder
 * (`embeds_kept: 1` against 7 `<script>` blocks in cosmetic's payload). The
 * converter has since been taught to route `<script>` through the same
 * placeholder mechanism; this repairs the pages already built without one.
 *
 * Position does not matter for behaviour — `WZ.add()` only registers a callback
 * for the runtime to invoke later — but each script is appended to its ORIGINAL
 * parent section anyway, so the page reads the way the design does.
 */
import fs from 'node:fs';
import { call, sleep, SITE, PAGES } from './mcp.mjs';
import { parse, sigOf, liveSigOf, indexBySig } from './payload_dom.mjs';

const name = process.argv[2];
const dry = process.argv.includes('--dry');
const pageId = PAGES[name];
if (!pageId) { console.error(`usage: node restore_section_scripts.mjs <${Object.keys(PAGES).join('|')}> [--dry]`); process.exit(2); }

const root = parse(JSON.parse(fs.readFileSync(`${name}/whtml/chunks.json`, 'utf8'))
  .map((c) => c.html).join(''));

/* Every <script> in the payload, with the parent it belongs to. */
const scripts = [];
(function walk(n) {
  for (const c of n.children) {
    if (c.tag === '#text') continue;
    if (c.tag === 'script') scripts.push(c); else walk(c);
  }
})(root);
console.log(`${name}: ${scripts.length} script block(s) in the payload`);

const tree = await call('data_element_tool', {
  siteId: SITE, pageId,
  context: `Reading the ${name} landing page's element tree to locate the sections whose per-section behaviour scripts the HTML converter dropped, so each can be restored as an HtmlEmbed. Read-only.`,
  actions: [{ label: 'tree', get_all_elements: {} }],
});

/* Live elements by signature, in document order, plus what each already holds
   so an already-restored script is not added twice. */
const liveBySig = new Map();
const existing = [];
(function walk(n) {
  if (!n || typeof n !== 'object') return;
  if (n.type !== 'String') {
    const s = liveSigOf(n);
    if (!liveBySig.has(s)) liveBySig.set(s, []);
    liveBySig.get(s).push(n);
    if (n.type === 'HtmlEmbed') existing.push(n);
  }
  (n.children ?? []).forEach(walk);
})(tree[0].result?.[0]?.data ?? tree[0].result?.data);

/* Which signature does each payload script hang under, and which occurrence? */
const bySig = indexBySig(root);
const plan = [];
const refused = [];
for (const s of scripts) {
  const parent = s.parent;
  const sig = sigOf(parent.attrs);
  const cands = bySig.get(sig) ?? [];
  const nth = cands.indexOf(parent);
  const live = (liveBySig.get(sig) ?? [])[nth];
  const code = `<script${Object.entries(s.attrs).map(([k, v]) => ` ${k}="${v}"`).join('')}>${s.raw ?? ''}</script>`;
  if (!live || nth < 0) { refused.push(`${sig} #${nth}: no live match (${(liveBySig.get(sig) ?? []).length} candidate(s))`); continue; }
  plan.push({ sig, nth, live, code, len: (s.raw ?? '').length });
}

console.log(`  ${plan.length} placeable, ${refused.length} unmatched, ${existing.length} HtmlEmbed(s) already on the page`);
for (const p of plan) console.log(`  ${String(p.len).padStart(5)}b -> .${p.sig.slice(0, 48)} #${p.nth}  (${p.live.type} ${p.live.id.element})`);
for (const r of refused) console.log(`  REFUSED ${r}`);
if (dry || !plan.length) { console.log(dry ? 'dry run — nothing written' : 'nothing to do'); process.exit(refused.length ? 1 : 0); }

let done = 0;
for (const p of plan) {
  const made = await call('data_element_builder', {
    siteId: SITE, pageId,
    actions: [{
      build_label: `script-${done}`,
      parent_element_id: p.live.id,
      creation_position: 'append',
      element_schema: { type: 'HtmlEmbed' },
    }],
  });
  const entry = Array.isArray(made[0]) ? made[0][0] : made[0];
  if (entry.status !== 'success' && entry.status !== 'partial_success') {
    console.error(`  FAILED to create: ${JSON.stringify(entry).slice(0, 400)}`); process.exit(1);
  }
  await sleep(1200);
  await call('data_element_settings_tool', {
    siteId: SITE, pageId,
    context: `Writing a chapter's behaviour script into a new HtmlEmbed on the ${name} landing page. Without it that chapter registers no motion at all and its pinned scene never exists.`,
    actions: [{ label: 'code', set_settings: { operations: [{ label: `s${done}`, element_id: entry.data.id, settings: [{ key: 'code', static_text: { value: p.code } }] }] } }],
  });
  await sleep(1200);
  const back = await call('data_element_settings_tool', {
    siteId: SITE, pageId,
    context: `Confirming the chapter script landed intact on the ${name} landing page.`,
    actions: [{ label: 'read', get_settings: { type: 'all_raw_settings', element_id: entry.data.id } }],
  });
  const got = (back[0].result?.[0]?.data?.matches ?? []).find((m) => m.key === 'code')?.value ?? '';
  if (got !== p.code) { console.error(`  MISMATCH: wrote ${p.code.length}, read ${got.length}`); process.exit(1); }
  done++;
  console.log(`  ${done}/${plan.length} restored (${p.code.length} chars, verified)`);
  await sleep(1200);
}
console.log(`${done} script block(s) restored — republish, then re-run staging-verify`);
