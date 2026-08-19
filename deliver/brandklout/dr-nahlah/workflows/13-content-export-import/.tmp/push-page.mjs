#!/usr/bin/env node
/**
 * push-page.mjs — put one built local page into Instatic.
 *
 * Two modes, chosen by whether the slug already exists:
 *   create   site_add_page, then insert the transformed body under the new
 *            page's rootNodeId.
 *   replace  site_replace_node_html on the existing page's rootNodeId, which
 *            keeps the page (and its id, SEO fields and route) and rebuilds
 *            only its children.
 *
 * The body is inserted SECTION BY SECTION rather than in one call. Three
 * reasons, in order of how much they cost when ignored:
 *   - a single 30-50KB payload is exactly the shape that gets dropped silently
 *     by this bridge, and a silent drop on a replace leaves a page half-built;
 *   - per-section failures name the section, so a bad block is obvious;
 *   - `index` lets sections land in source order even when one is retried.
 * The trade is that a replace is briefly empty between the clear and the first
 * insert. That is a draft, so nobody sees it.
 *
 *   node push-page.mjs thank-you.html            # create or replace, by slug
 *   node push-page.mjs veneers.html --dry        # print the plan only
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { callJson } from './instatic-mcp.mjs';
import { transform } from './to-instatic.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const file = argv[0];
const DRY = argv.includes('--dry');
if (!file) { console.error('usage: push-page.mjs <page.html> [--dry]'); process.exit(1); }

const slug = file === 'index.html' ? 'index' : path.basename(file, '.html');

/** The page title Instatic should carry, taken from the built page's <title>. */
function titleOf(f) {
  const raw = fs.readFileSync(path.resolve(HERE, '../../04-design/.tmp/final-site', f), 'utf8');
  const m = /<title>([^<]+)<\/title>/.exec(raw);
  return m ? m[1].trim() : slug;
}

/**
 * Split the body into top-level blocks. The local pages are a flat run of
 * <section>/<header>/<div>/<footer> siblings, so a depth counter over the tag
 * stream is enough and avoids pulling in a parser.
 */
function topLevelBlocks(html) {
  const blocks = [];
  let depth = 0, start = -1;
  const tag = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)\b([^>]*)>/g;
  const VOID = new Set(['img', 'br', 'hr', 'input', 'meta', 'link', 'source', 'area', 'col', 'embed', 'track', 'wbr']);
  let m;
  while ((m = tag.exec(html))) {
    const [whole, close, name, attrs] = m;
    if (VOID.has(name.toLowerCase()) || attrs.trimEnd().endsWith('/')) continue;
    if (!close) {
      if (depth === 0) start = m.index;
      depth++;
    } else {
      depth--;
      if (depth === 0 && start > -1) {
        blocks.push(html.slice(start, m.index + whole.length));
        start = -1;
      }
    }
  }
  return blocks.filter((b) => b.trim());
}

const { html, unmapped } = transform(file);
if (unmapped.length) { console.error(`REFUSING: unmapped media ${unmapped.join(', ')}`); process.exit(1); }
const blocks = topLevelBlocks(html);
const covered = blocks.join('').length;
console.log(`${file}: ${html.length} chars -> ${blocks.length} top-level blocks (${covered} chars covered)`);
if (covered / html.length < 0.95) {
  console.error(`REFUSING: blocks cover only ${(100 * covered / html.length).toFixed(1)}% of the body; the split is wrong`);
  process.exit(1);
}
for (const [i, b] of blocks.entries()) {
  const t = /<([a-zA-Z][a-zA-Z0-9-]*)\b[^>]*?(?:id="([^"]*)")?[^>]*>/.exec(b);
  console.log(`   ${String(i).padStart(2)} ${String(b.length).padStart(6)}  ${b.slice(0, 72).replace(/\s+/g, ' ')}`);
}
if (DRY) process.exit(0);

// ---- find or create the page ------------------------------------------------
const docs = await callJson('site_list_documents', {});
let doc = (docs.documents || []).find((d) => d.slug === slug);
let rootNodeId;

if (doc) {
  rootNodeId = doc.rootNodeId;
  console.log(`replacing existing page /${slug} (root ${rootNodeId})`);
  // Clear by replacing the root's children with the first block, then append.
  await callJson('site_replace_node_html', { nodeId: rootNodeId, html: blocks[0] });
  console.log(`   0 replaced (${blocks[0].length})`);
  for (let i = 1; i < blocks.length; i++) {
    await callJson('site_insert_html', { parentId: rootNodeId, html: blocks[i], index: i });
    console.log(`   ${i} inserted (${blocks[i].length})`);
  }
} else {
  const title = titleOf(file);
  console.log(`creating page /${slug} — "${title}"`);
  const added = await callJson('site_add_page', { title, slug });
  rootNodeId = added.rootNodeId || added.page?.rootNodeId;
  if (!rootNodeId) throw new Error(`no rootNodeId from site_add_page: ${JSON.stringify(added).slice(0, 300)}`);
  console.log(`   pageId=${added.pageId || added.page?.id} root=${rootNodeId}`);
  for (let i = 0; i < blocks.length; i++) {
    await callJson('site_insert_html', { parentId: rootNodeId, html: blocks[i], index: i });
    console.log(`   ${i} inserted (${blocks[i].length})`);
  }
}

console.log(`\ndone: /${slug}. Draft only — nothing is published.`);
