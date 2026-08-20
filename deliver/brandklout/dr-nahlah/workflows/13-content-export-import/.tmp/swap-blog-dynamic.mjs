#!/usr/bin/env node
/**
 * swap-blog-dynamic.mjs — turn the two pushed blog pages into their dynamic
 * Instatic forms, after push-page/push-all has put the local build up.
 *
 * The local build owns the DESIGN of both pages (site-src/gen-blog.mjs); this
 * owns only the two things a static build cannot express:
 *
 *   /posts   the static `.bl-grid` of 43 cards  ->  <instatic-loop> over the
 *            posts collection, so a new entry appears without a rebuild.
 *   post     the contents of `.bl-body`         ->  <instatic-outlet>, and the
 *            page registered as the postTypes template.
 *
 * WHY THIS REPLACED build-blog-index.mjs / build-post-template.mjs
 * ---------------------------------------------------------------
 * Those built both pages from scratch by copying the shell out of thank-you.
 * That is what left the blog stranded when the Journal link went into the nav:
 * every other page picks the shell up from a partial and rebuilds, these two
 * carried a snapshot of someone else's page. Now they are ordinary pages in the
 * build and this only performs the swap.
 *
 * The loop's CHILD is the card markup, verbatim from the pushed page, with the
 * three text nodes swapped for {currentEntry.*} tokens. Keeping it identical is
 * what makes the static and dynamic versions render the same.
 *
 *   node swap-blog-dynamic.mjs            # both
 *   node swap-blog-dynamic.mjs posts      # just the index
 *   node swap-blog-dynamic.mjs post       # just the template
 */
import { callJson, callWrite } from './instatic-mcp.mjs';

const only = process.argv[2];

/** Read a document in full; site_read_document paginates. */
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

/** uid of the first element whose start tag matches `re`. */
function uidOf(html, re) {
  const m = re.exec(html);
  if (!m) return null;
  const u = /uid="([^"]+)"/.exec(m[0]);
  return u ? u[1] : null;
}

const docs = await callJson('site_list_documents', {});
const find = (slug) => (docs.documents || []).find((d) => d.slug === slug);

/* ---- /posts: the grid becomes a loop ------------------------------------ */
if (!only || only === 'posts') {
  const d = find('posts');
  if (!d) throw new Error('no /posts document — push it first');
  const html = await readDoc(d.document);

  if (/<instatic-loop|instatic: loop/.test(html)) {
    console.log('posts: already dynamic, nothing to swap');
  } else {
    // Replace the CHILDREN of the grid's parent, which is the one call that
    // swaps a whole subtree without needing to delete and re-index siblings.
    const gridParent = uidOf(html, /<div\b[^>]*class="wrap section"[^>]*>(?=[\s\S]{0,400}?class="bl-grid")/);
    if (!gridParent) throw new Error('could not locate the grid container on /posts');

    const loop = `<instatic-loop class="bl-grid" data-source-id="data.rows" data-table-id="posts" data-order-by="publishedAt" data-direction="desc" data-limit="60">
  <article class="bl-card" data-rv>
    <h2><a href="{currentEntry.permalink}">{currentEntry.title}</a></h2>
    <p>{currentEntry.seoDescription}</p>
    <a class="bl-more" href="{currentEntry.permalink}">Read the article</a>
  </article>
</instatic-loop>`;

    await callWrite('site_replace_node_html', { nodeId: gridParent, html: loop });

    const back = await readDoc(d.document);
    // A loop serialises as a COMMENT in the static read; its children and their
    // {currentEntry.*} tokens are NOT in that output, so a token count here says
    // nothing. The canvas is what resolves it.
    const m = /<!--\s*instatic: loop "([^"]+)"/.exec(back);
    console.log(`posts: loop ${m ? 'stored (' + m[1] + ')' : 'NOT STORED — inspect'}`);
    console.log(`posts: static cards remaining ${(back.match(/class="bl-card"/g) || []).length} (want 0)`);
  }
}

/* ---- post: the body becomes the outlet, and the page becomes the template */
if (!only || only === 'post') {
  const d = find('post');
  if (!d) throw new Error('no post document — push it first');
  const html = await readDoc(d.document);

  if (/instatic-content-region|instatic-outlet/.test(html)) {
    console.log('post: already has its outlet');
  } else {
    const body = uidOf(html, /<div\b[^>]*class="bl-body"[^>]*>/);
    if (!body) throw new Error('could not locate .bl-body on the post page');
    await callWrite('site_replace_node_html', {
      nodeId: body,
      html: '<instatic-outlet data-tag="div"></instatic-outlet>',
    });
    const back = await readDoc(d.document);
    console.log(`post: outlet ${/instatic-content-region|instatic-outlet/.test(back) ? 'in place' : 'MISSING — inspect'}`);
  }

  // Re-registering is idempotent and cheap, and a push that recreated the page
  // would have dropped the registration silently.
  const set = await callWrite('site_set_page_template', {
    pageId: d.document.id,
    target: { kind: 'postTypes', tableSlugs: ['posts'] },
  });
  console.log('post: template target ->', JSON.stringify(set).slice(0, 160));
}
