/**
 * audit_text_edit.mjs — which copy on a page has NO element of its own, and so
 * cannot be edited in the Designer?
 *
 * Nothing else in the harness can see this. parity, staging-verify and every
 * screenshot pass on copy the client cannot touch, because it renders and
 * behaves exactly right.
 *
 * The rules below are measured, not assumed (see probe_editable.mjs and
 * probe_textblock.mjs):
 *   - a `Block` holding a String IS a Text Block — the Designer edits it. A
 *     Text Block and a Div Block are the same `type: "Block"` in the tree;
 *     the String child is the whole difference.
 *   - a `DOM` element has no text caret at any time.
 *   - a loose String sharing its parent with BLOCK-level elements has no
 *     element of its own — there is nothing to select. Inline siblings
 *     (Span/Strong/Emphasized/Link) are fine: the Designer edits the parent's
 *     text flow as one run.
 *
 * Usage: node audit_text_edit.mjs [page …]   (default: all three)
 */
import fs from 'node:fs';
import { call, SITE, PAGES } from './mcp.mjs';

const INLINE = new Set(['Span', 'Strong', 'Emphasized', 'Superscript', 'Subscript', 'Link', 'Button']);
const TEXTHOST = new Set(['Heading', 'Paragraph', 'ListItem', 'Link', 'Button', 'Blockquote', 'Block', 'FormBlockLabel']);

export async function tree(page) {
  const [res] = await call('data_element_tool', {
    siteId: SITE, pageId: PAGES[page],
    context: 'Auditing which page copy has no element of its own and therefore cannot be edited.',
    actions: [{ label: 'tree', get_all_elements: { depth: -1 } }],
  });
  const inner = Array.isArray(res.result) ? res.result[0] : res.result;
  return inner?.data ?? inner;
}

/** Every text run with no editable element, with the reason. */
export function uneditable(root) {
  const out = [];
  const real = (c) => c.type !== 'String' || (c.textContent || '').trim();

  const visit = (n, chain) => {
    if (n.type === 'String' && (n.textContent || '').trim()) {
      const parent = chain.at(-1);
      let i = chain.length - 1;
      while (i > 0 && INLINE.has(chain[i].type)) i--;
      const host = chain[i];
      let why = null;
      if (host.type === 'DOM') why = 'DOM element (no text caret)';
      else if (!TEXTHOST.has(host.type)) why = `text loose in a ${host.type}`;
      else {
        const blocky = (parent.children || [])
          .filter((c) => c !== n && real(c) && c.type !== 'String' && !INLINE.has(c.type));
        if (blocky.length) why = `text sharing a ${parent.type} with ${[...new Set(blocky.map((c) => c.type))].sort().join('/')}`;
      }
      if (why) {
        out.push({ why, text: n.textContent.trim().slice(0, 70), host: host.type,
          styles: (host.styleNames || []).join('.'), id: host.id });
      }
    }
    for (const c of n.children || []) visit(c, chain.concat(n));
  };
  visit(root, []);
  return out;
}

const isMain = import.meta.url.endsWith('/' + process.argv[1].replace(/\\/g, '/').split('/').pop());
if (isMain) {
  const pages = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(PAGES);
  let total = 0;
  for (const page of pages) {
    const found = uneditable(await tree(page));
    total += found.length;
    const by = new Map();
    for (const f of found) {
      const k = `${f.why}  [${f.styles}]`;
      if (!by.has(k)) by.set(k, []);
      by.get(k).push(f.text);
    }
    console.log(`\n=== ${page}: ${found.length} text runs with no editable element`);
    for (const [k, v] of [...by].sort((a, b) => b[1].length - a[1].length)) {
      console.log(`   ${String(v.length).padStart(3)}  ${k}`);
      console.log(`        e.g. ${JSON.stringify(v[0])}`);
    }
    fs.writeFileSync(`text-audit-${page}.json`, JSON.stringify(found, null, 2));
  }
  console.log(`\nTOTAL: ${total}`);
}
