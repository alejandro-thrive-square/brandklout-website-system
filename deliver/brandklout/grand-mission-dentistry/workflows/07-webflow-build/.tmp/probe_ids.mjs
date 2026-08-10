/**
 * probe_ids.mjs — the decisive question for the headless build path:
 * does `data_whtml_builder` PRESERVE element ids?
 *
 * This design's motion layer selects by id (#lossPin, #arrivalTitle,
 * #pathPin …). The 2026-07-31 finding on Dr. Nahlah was that whtml dropped
 * 7 of 54 ids and they could not be repaired (`set_attributes` on `id`
 * errored). If that still holds, the headless route cannot carry this design
 * and the pages must be pasted by hand.
 *
 * Inserts one throwaway section into the EMPTY thank-you page, reads it back,
 * and deletes it. Safe: the page has no content to damage.
 */
import { call, sleep, SITE, PAGES } from './mcp.mjs';

const pageId = PAGES['thank-you'];
const BODY = { component: pageId, element: '6a724b6977f9b0019d2a0401' };

const html = `<section class="probe-sec" id="probePin" data-chapter="9" data-chapter-name="Probe">
<div class="probe-inner" id="probeInner"><h2 class="probe-h" id="probeTitle">Probe heading</h2>
<p class="probe-p" id="probeLede">Probe copy.</p><i class="probe-i" id="probeRail"></i></div></section>`;
const css = `.probe-sec { padding-top: 40px; padding-bottom: 40px; background: #002241; }
.probe-inner { max-width: 600px; margin-inline: auto; }
.probe-h { font-size: 40px; color: #ffffff; }
.probe-p { font-size: 18px; color: #abd6ff; }
.probe-i { display: block; width: 60px; height: 1px; background: currentColor; }`;

console.log('inserting probe section …');
const built = await call('data_whtml_builder', {
  siteId: SITE, pageId,
  actions: [{
    build_label: 'probe',
    parent_element_id: BODY,
    creation_position: 'append',
    html, css,
  }],
});
console.log(JSON.stringify(built).slice(0, 600));
await sleep(4000);

console.log('\nreading back …');
const tree = await call('data_element_tool', {
  siteId: SITE, pageId,
  context: 'Reading back a throwaway probe section to measure whether the WHTML builder preserves element ids and class stacks, before committing to a headless rebuild of this page. Read-only.',
  actions: [{ label: 'tree', get_all_elements: {} }],
});

const found = { ids: new Set(), classes: new Set(), types: {} };
const walk = (n) => {
  if (!n || typeof n !== 'object') return;
  if (Array.isArray(n)) return n.forEach(walk);
  if (n.type) {
    found.types[n.type] = (found.types[n.type] || 0) + 1;
    const attrs = n.attributes ?? n.attr ?? {};
    if (attrs.id) found.ids.add(attrs.id);
    for (const c of n.styleNames ?? n.classes ?? []) found.classes.add(typeof c === 'string' ? c : c.name);
  }
  for (const k of ['children', 'nodes', 'elements', 'data']) if (n[k]) walk(n[k]);
};
walk(tree[0].result);

const want = ['probePin', 'probeInner', 'probeTitle', 'probeLede', 'probeRail'];
const kept = want.filter((i) => found.ids.has(i));
console.log(`ids kept   : ${kept.length}/${want.length}  ${kept.join(', ')}`);
console.log(`ids MISSING: ${want.filter((i) => !found.ids.has(i)).join(', ') || '(none)'}`);
console.log(`classes    : ${[...found.classes].filter((c) => c && c.startsWith('probe')).join(', ')}`);
console.log(`types      : ${JSON.stringify(found.types)}`);
console.log(`\nall live ids: ${[...found.ids].join(', ')}`);
