/**
 * faqscan.mjs — what the FAQ actually is in the Webflow tree.
 *
 * The user's report: "the embed is inside of a heading block". Before touching
 * anything, dump the exact shape of one accordion row on every page: the h3,
 * the HtmlEmbed inside it, the embed's code, the panel it controls, and the
 * classes each carries. The conversion has to reproduce all of that on a
 * native element or the accordion script stops finding its buttons.
 */
import { callTool } from './wfmcp.mjs';
const SITE = '693c51e685b19f0d0c149cab';
const PAGES = { implants: '6a79f2aeabc1d37969522293', aox: '6a7a21d7f34df29a4defacdf',
  veneers: '6a7a21fef87845352663538f', emergency: '6a7a223bf8c58b0aa0c6af2e',
  'dentist-near-me': '6a7a2268da766fb28cddb149', 'next-door': '6a7a228d106ed97b8a7885c9' };
const only = process.argv[2];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function call(tool, args, pick) {
  for (let i = 0; i < 8; i++) {
    const r = await callTool(tool, args);
    let v; try { v = pick(JSON.parse(r.text)); } catch { v = undefined; }
    if (v !== undefined && v !== null) return v;
    const lim = /\b429\b/.test(r.text);
    process.stderr.write(`   …${lim ? '429' : 'no data'}, waiting\n`);
    await sleep(lim ? 20000 : 2500);
  }
  throw new Error('no usable response from ' + tool);
}

/** Flatten the nested get_all_elements payload into id -> node with parent links. */
function index(root) {
  const byId = new Map();
  const walk = (n, parent) => {
    if (!n || !n.id) return;
    byId.set(n.id, { node: n, parent });
    (n.children || []).forEach((c) => walk(c, n.id));
  };
  walk(root, null);
  return byId;
}

for (const [page, pid] of Object.entries(PAGES)) {
  if (only && only !== page) continue;
  const body = await call('data_element_tool', { siteId: SITE, pageId: pid,
    context: 'Reading the FAQ accordion structure before converting its Code Embeds to native elements.',
    actions: [{ label: 't', get_all_elements: {} }] }, (o) => o?.result?.[0]?.data);
  const byId = index(body);

  const rows = [];
  for (const [id, { node, parent }] of byId) {
    if (node.type !== 'HtmlEmbed') continue;
    const p = parent ? byId.get(parent)?.node : null;
    const code = node.settings?.code || node.text || '';
    if (!/faq__q/.test(code) && !/aria-expanded/.test(code)) continue;
    rows.push({ id, parentId: parent, parentType: p?.type, parentTag: p?.tag,
      parentClasses: (p?.classes || []).map((c) => c.name || c),
      classes: (node.classes || []).map((c) => c.name || c),
      code: code.replace(/\s+/g, ' ').trim() });
  }
  console.log(`\n=== ${page}  (${rows.length} FAQ embeds) ===`);
  rows.forEach((r, i) => {
    console.log(` ${i + 1}. embed ${r.id.slice(-8)}  classes [${r.classes.join(' ')}]`);
    console.log(`    parent ${r.parentType}${r.parentTag ? '/' + r.parentTag : ''} [${r.parentClasses.join(' ')}]  id ${String(r.parentId).slice(-8)}`);
    console.log(`    code: ${r.code.slice(0, 220)}`);
  });
  await sleep(1500);
}
