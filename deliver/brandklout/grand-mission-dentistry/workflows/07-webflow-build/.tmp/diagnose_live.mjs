/**
 * diagnose_live.mjs — what is ACTUALLY on the three LP pages right now.
 *
 * Compares the live element tree against what each page's final.json payload
 * should have produced: element count, the element ids the page JS depends on,
 * and Body's direct children. Enough to tell "paste landed" from "paste landed
 * wrong" from "paste never landed".
 */
import fs from 'node:fs';
import { call, sleep, SITE, PAGES } from './mcp.mjs';

for (const [name, pageId] of Object.entries(PAGES)) {
  const expected = JSON.parse(fs.readFileSync(`${name}/final.json`, 'utf8')).payload;
  const expectedIds = new Set();
  for (const n of expected.nodes) {
    const id = n.data?.attr?.id;
    if (id) expectedIds.add(id);
  }

  let parsed;
  try {
    parsed = await call('data_element_tool', {
      siteId: SITE, pageId,
      context: `Reading the live element tree of the ${name} landing page to diagnose why its component paste rendered incorrectly (the implant page pasted fine, this one did not). Read-only inspection.`,
      actions: [{ label: 'tree', get_all_elements: {} }],
    });
  } catch (e) {
    console.log(`\n=== ${name}: MCP ERROR — ${e.message}`);
    continue;
  }
  const entry = parsed[0];
  if (entry.error) {
    console.log(`\n=== ${name}: ACTION ERROR — ${entry.error.message}`);
    continue;
  }
  fs.writeFileSync(`live-tree-${name}.json`, JSON.stringify(entry.result, null, 1), 'utf8');

  /* Shape-agnostic walk: find every object that looks like an element. */
  let total = 0;
  const liveIds = new Set();
  const types = {};
  const walk = (n) => {
    if (!n || typeof n !== 'object') return;
    if (Array.isArray(n)) { n.forEach(walk); return; }
    if (n.type || n.tag) {
      total++;
      types[n.type || n.tag] = (types[n.type || n.tag] || 0) + 1;
      const id = n.attributes?.id ?? n.attr?.id ?? n.settings?.attr?.id ?? n.id;
      if (typeof id === 'string' && id && !/^[0-9a-f-]{16,}$/i.test(id)) liveIds.add(id);
    }
    for (const k of ['children', 'nodes', 'elements', 'data']) if (n[k]) walk(n[k]);
  };
  walk(entry.result);

  const missing = [...expectedIds].filter((i) => !liveIds.has(i));
  console.log(`\n=== ${name}  (page ${pageId})`);
  console.log(`  live elements     : ${total}   (payload nodes: ${expected.nodes.length})`);
  console.log(`  types             : ${Object.entries(types).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([t, c]) => `${t}:${c}`).join(' ')}`);
  console.log(`  ids expected/live : ${expectedIds.size} / ${liveIds.size}`);
  console.log(`  MISSING ids (${missing.length}): ${missing.slice(0, 16).join(', ')}${missing.length > 16 ? ' …' : ''}`);
  await sleep(3000);
}
