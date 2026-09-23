/**
 * build-blog-index.mjs — the /posts index, a CMS loop over the 43 migrated posts.
 *
 * WHY THE CARDS SHOW NO DATE. {currentEntry.publishedAt} is the moment the
 * document was loaded into Instatic, not when the practice published it: every
 * card would read 2026 for posts written between 2022 and 2024. The collection's
 * fields are builtIn-only (title, slug, body, featuredMedia, seoTitle,
 * seoDescription) and there is no tool to add one, so the true date has no
 * queryable home. It is written into each post BODY instead, where it is
 * visible on the article itself and cannot mislead a listing.
 *
 * Ordering has the same root cause: sorting by publishedAt sorts 43 near
 * identical timestamps, so the sequence is effectively load order rather than
 * chronology. Load order happens to be newest-original-first, but that is a
 * coincidence and not something to rely on, so it is called out rather than
 * dressed up as chronological.
 */
import fs from 'node:fs';
import { callJson, callWrite } from './instatic-mcp.mjs';

const SLUG = 'posts';
const docs = await callJson('site_list_documents', {});
let page = (docs.documents || []).find((d) => d.slug === SLUG);
if (!page) {
  const r = await callWrite('site_add_page', { title: 'Journal | Implant and Prosthodontic Articles | Dr. Nahlah', slug: SLUG });
  console.log('created:', JSON.stringify(r).slice(0, 140));
  const d2 = await callJson('site_list_documents', {});
  page = (d2.documents || []).find((d) => d.slug === SLUG);
}
if (!page) throw new Error('index page not found after create');
console.log('index page:', page.document.id, 'root', page.rootNodeId);

const src = JSON.parse(fs.readFileSync('.instatic2/thank-you.json', 'utf8')).html.replace(/\suid="[^"]*"/g, '');
const nav = src.slice(src.indexOf('<header'), src.indexOf('</header>') + 9);
const footer = src.slice(src.indexOf('<footer'), src.indexOf('</footer>') + 9);

const hero = `<section class="pg-hero" id="hero" style="min-height:clamp(380px,46svh,520px)">
  <div class="ph-bg"><img src="/uploads/EfUO--It3DpyR-2r8j0XP-xray-consult.jpg" alt="" loading="eager"></div>
  <div class="wrap ph-in">
    <div class="pk-crumb"><a href="/">Home</a><i></i><span>Journal</span></div>
    <h1>Written by the <em>specialist</em>.</h1>
    <p class="ph-lead">Forty-three articles on implants, full-arch restoration, cost, aftercare
      and what actually goes wrong, from the practice's own archive.</p>
  </div>
</section>`;

const list = `<section class="pk pk-alt" id="articles">
  <div class="wrap section">
    <instatic-loop class="bl-grid" data-source-id="data.rows" data-table-id="posts" data-order-by="publishedAt" data-direction="desc" data-limit="60">
      <article class="bl-card">
        <h2><a href="{currentEntry.permalink}">{currentEntry.title}</a></h2>
        <p>{currentEntry.seoDescription}</p>
        <a class="bl-more" href="{currentEntry.permalink}">Read the article</a>
      </article>
    </instatic-loop>
  </div>
</section>`;

await callWrite('site_replace_node_html', { nodeId: page.rootNodeId, html: nav });
await callWrite('site_insert_html', { parentId: page.rootNodeId, html: hero, index: 1 });
await callWrite('site_insert_html', { parentId: page.rootNodeId, html: list, index: 2 });
await callWrite('site_insert_html', { parentId: page.rootNodeId, html: footer, index: 3 });

const back = await callJson('site_read_document', { document: page.document });
const h = (back.html || '').replace(/\suid="[^"]*"/g, '');
fs.writeFileSync('blog-index-readback.html', h);
// A loop serialises as a COMMENT in the static read, e.g.
//   <!-- instatic: loop "abc" has no resolved data -->
// The children and their {currentEntry.*} tokens are not in that output, so
// "tokens: 0" here says nothing about whether the loop works. The canvas
// resolves it: snap-page.mjs is the check that matters.
const loop = /<!--\s*instatic: loop "([^"]+)"/.exec(h);
console.log('loop node stored:', loop ? loop[1] : 'NO');
console.log('verify with: node snap-page.mjs posts snap-blog-index');
