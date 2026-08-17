/**
 * forks.mjs — how many classes did the headless build FORK?
 *
 * Webflow reconciles a pasted/inserted class by NAME, but only when the
 * definition matches; otherwise it creates `name-1`, `name-2`. A forked twin
 * is dead weight in the style panel and means the element is NOT sharing the
 * class the design intended. Compares the live styleNames on a page against
 * the names its own payload expects.
 */
import fs from 'node:fs';
import { call, SITE, PAGES } from './mcp.mjs';

const name = process.argv[2];
const pageId = PAGES[name];

const doc = JSON.parse(fs.readFileSync(`${name}/final.json`, 'utf8'));
const expected = new Set(doc.payload.styles.map((s) => s.name));

const tree = await call('data_element_tool', {
  siteId: SITE, pageId,
  context: `Auditing the class names the headless build produced on the ${name} landing page, to count how many were forked into -1/-2 twins instead of reusing the intended class. Read-only.`,
  actions: [{ label: 'tree', get_all_elements: {} }],
});

const live = new Map();
const walk = (n) => {
  if (!n || typeof n !== 'object') return;
  if (Array.isArray(n)) return n.forEach(walk);
  for (const c of n.styleNames ?? []) live.set(c, (live.get(c) || 0) + 1);
  for (const k of ['children', 'nodes', 'elements', 'data']) if (n[k]) walk(n[k]);
};
walk(tree[0].result);

const forked = [...live.keys()].filter((c) => /-\d+$/.test(c) && !expected.has(c) && expected.has(c.replace(/-\d+$/, '')));
const unknown = [...live.keys()].filter((c) => !expected.has(c) && !forked.includes(c));

console.log(`${name}: ${live.size} distinct classes live`);
console.log(`  matching the payload : ${[...live.keys()].filter((c) => expected.has(c)).length}`);
console.log(`  FORKED (-N twins)    : ${forked.length}`);
console.log(`  other/unexpected     : ${unknown.length}`);
if (forked.length) console.log('  forked: ' + forked.slice(0, 30).join(', ') + (forked.length > 30 ? ' …' : ''));
if (unknown.length) console.log('  other : ' + unknown.slice(0, 20).join(', '));
