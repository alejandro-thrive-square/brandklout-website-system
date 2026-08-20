#!/usr/bin/env node
/**
 * swap-blog-dynamic.mjs — turn the two pushed blog pages into their dynamic
 * Instatic forms. Run AFTER push-all.mjs, every time either page is pushed.
 *
 * `posts` and `post` are ordinary pages in the local build now (see
 * site-src/gen-blog.mjs), which is what lets them share the nav, drawer, footer
 * and gates with everything else. A push therefore ships their STATIC form:
 *
 *   posts   a .bl-grid holding 43 hand-written .bl-card articles
 *   post    a .bl-body holding one real article
 *
 * This restores the two platform mechanisms on top:
 *
 *   posts   the grid becomes an <instatic-loop> over the posts collection
 *   post    the .bl-body becomes an <instatic-outlet>, and the page is
 *           re-registered as the postTypes template
 *
 * THE LOOP MUST CARRY THE GRID CLASS. Wrapping a loop inside a grid puts every
 * iteration into ONE cell, so `.bl-grid` goes on the <instatic-loop> itself and
 * the static div it replaces is removed rather than filled. That is why this
 * replaces the grid's PARENT's children instead of the grid's own.
 *
 * The cards keep no date, deliberately: `publishedAt` is the import date, so
 * every card would read 2026 for a post written in 2022, and the collection's
 * fields are builtIn-only. The true date lives in each article body.
 *
 *   node swap-blog-dynamic.mjs           # both pages
 *   node swap-blog-dynamic.mjs --check   # report the current state, change nothing
 */
import { callJson, callWrite } from './instatic-mcp.mjs';

const CHECK = process.argv.includes('--check');

const LOOP = `<instatic-loop class="bl-grid" data-source-id="data.rows" data-table-id="posts" data-order-by="publishedAt" data-direction="desc" data-limit="60">
  <article class="bl-card">
    <h2><a href="{currentEntry.permalink}">{currentEntry.title}</a></h2>
    <p>{currentEntry.seoDescription}</p>
    <a class="bl-more" href="{currentEntry.permalink}">Read the article</a>
  </article>
</instatic-loop>`;

const OUTLET = `<instatic-outlet data-tag="div"></instatic-outlet>`;

/** Read a document whole; site_read_document paginates. */
async function readDoc(doc) {
  let html = '', part = 1;
  for (;;) {
    const r = await callJson('site_read_document', { document: doc, part });
    html += r.html || '';
    const n = r.pageInfo?.nextPart;
    if (!n) return html;
    part = n;
  }
}

const uidOf = (tag) => (/uid="([^"]+)"/.exec(tag) || [])[1];

/**
 * The uid of the element that CONTAINS the one matching `re`.
 * Walks back through the preceding open tags counting depth, which is enough
 * for this markup and avoids pulling in a parser for two known shapes.
 */
function parentUid(html, re) {
  const m = re.exec(html);
  if (!m) return null;
  const before = html.slice(0, m.index);
  const tags = [...before.matchAll(/<(\/?)([a-zA-Z][\w-]*)\b[^>]*?(\/?)>/g)];
  let depth = 0;
  for (let i = tags.length - 1; i >= 0; i--) {
    const [whole, close, name, selfClose] = tags[i];
    if (selfClose === '/' || /^(img|br|input|meta|link|hr|source|wbr|col|area)$/i.test(name)) continue;
    if (close) { depth++; continue; }
    if (depth === 0) return uidOf(whole);
    depth--;
  }
  return null;
}

const docs = await callJson('site_list_documents', {});
const find = (slug) => (docs.documents || []).find((d) => d.slug === slug);

// ---- 1. the index: static grid -> CMS loop --------------------------------
{
  const d = find('posts');
  if (!d) throw new Error('no `posts` document — push it first');
  const html = await readDoc(d.document);
  const cards = (html.match(/class="bl-card"/g) || []).length;
  const hasLoop = /instatic:\s*loop|<instatic-loop/.test(html);
  console.log(`posts: ${cards} static cards, loop ${hasLoop ? 'present' : 'ABSENT'}`);

  if (!CHECK && !hasLoop) {
    const holder = parentUid(html, /<div\b[^>]*class="bl-grid"[^>]*>/);
    if (!holder) throw new Error('could not locate the .bl-grid container');
    await callWrite('site_replace_node_html', { nodeId: holder, html: LOOP });
    const back = await readDoc(d.document);
    const loop = /<!--\s*instatic: loop "([^"]+)"/.exec(back);
    // A loop serialises as a COMMENT in the static read and its children are not
    // in that output, so "0 cards" here is the expected result of success.
    console.log('  -> loop node:', loop ? loop[1] : 'NOT STORED',
      '| static cards left:', (back.match(/class="bl-card"/g) || []).length);
  }
}

// ---- 2. the article layout: real body -> content outlet -------------------
{
  const d = find('post');
  if (!d) throw new Error('no `post` document — push it first');
  const html = await readDoc(d.document);
  const hasOutlet = /instatic-content-region|<instatic-outlet/.test(html);
  console.log(`post: outlet ${hasOutlet ? 'present' : 'ABSENT'}`);

  if (!CHECK && !hasOutlet) {
    const body = /<div\b[^>]*class="bl-body"[^>]*>/.exec(html);
    if (!body) throw new Error('could not locate .bl-body');
    // Replace the CHILDREN of .bl-body, keeping the element and its data-rv.
    await callWrite('site_replace_node_html', { nodeId: uidOf(body[0]), html: OUTLET });
    const back = await readDoc(d.document);
    console.log('  -> outlet:', /instatic-content-region|<instatic-outlet/.test(back) ? 'ok' : 'MISSING');
  }

  // Registration lives on the page record, not the nodes, so a body push should
  // not disturb it — but it costs one call to be certain, and an unregistered
  // template silently stops rendering every entry.
  if (!CHECK) {
    const set = await callWrite('site_set_page_template', {
      pageId: d.document.id,
      target: { kind: 'postTypes', tableSlugs: ['posts'] },
    });
    console.log('  -> template registered:', JSON.stringify(set).slice(0, 120));
  }
}

const after = await callJson('site_list_documents', {});
const tpl = (after.templates || []).find((t) => t.target === 'postTypes');
console.log('postTypes template:', tpl ? `${tpl.title} (${tpl.id})` : 'NONE');
