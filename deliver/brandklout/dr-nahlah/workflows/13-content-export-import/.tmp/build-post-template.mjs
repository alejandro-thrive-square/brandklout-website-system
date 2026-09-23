/**
 * build-post-template.mjs — the wrapper Instatic renders every blog entry into.
 *
 * A postTypes template needs exactly one <instatic-outlet>; on an ENTRY route the
 * outlet stays and wraps the entry body, so data-tag is what the body sits in.
 * It reads back as <div data-instatic-content-region>, not as the input marker.
 *
 * THE TITLE AND DATE ARE NOT HERE. {currentEntry.*} tokens are stripped outside a
 * loop: inserted into this template they vanished and left an empty <h1>, and
 * setting the text prop afterwards returned {"ok":true} and stored nothing. Each
 * post body therefore carries its own <h1> and date (see extract-posts.mjs),
 * which also keeps the ORIGINAL publication date rather than the moment the
 * document was loaded into the CMS.
 * Everything around it is the site shell, which is why the nav and footer are
 * copied from an existing page rather than re-authored: they carry the classes
 * site.css already styles, and a second hand-built nav is a second thing to fix.
 */
import fs from 'node:fs';
import { callJson, callWrite } from './instatic-mcp.mjs';

const SLUG = 'post';
const docs = await callJson('site_list_documents', {});
let page = (docs.documents || []).find((d) => d.slug === SLUG);
if (!page) {
  const r = await callWrite('site_add_page', { title: 'Post', slug: SLUG });
  console.log('created page:', JSON.stringify(r).slice(0, 160));
  const d2 = await callJson('site_list_documents', {});
  page = (d2.documents || []).find((d) => d.slug === SLUG);
}
console.log('template page:', page.document.id, 'root', page.rootNodeId);

// Shell: reuse the nav and footer exactly as another page holds them.
const src = JSON.parse(fs.readFileSync('.instatic2/thank-you.json', 'utf8')).html
  .replace(/\suid="[^"]*"/g, '');
const nav = src.slice(src.indexOf('<header'), src.indexOf('</header>') + 9);
const drawer = src.slice(src.indexOf('<div class="drawer"'), src.indexOf('</div>', src.indexOf('id="drawer"')) );
const footer = src.slice(src.indexOf('<footer'), src.indexOf('</footer>') + 9);
console.log(`shell: nav ${nav.length} chars, footer ${footer.length} chars`);

const body = `<main class="pk" id="top">
  <div class="wrap section">
    <article class="bl-post">
      <div class="pk-crumb"><a href="/">Home</a><i></i><a href="/posts">Journal</a></div>
      <div class="bl-body"><instatic-outlet data-tag="div"></instatic-outlet></div>
      <div class="bl-foot">
        <a class="bl-more" href="/posts">All articles</a>
        <a class="btn btn-primary" href="/contact#book"><span>Book a consultation</span></a>
      </div>
    </article>
  </div>
</main>`;

await callWrite('site_replace_node_html', { nodeId: page.rootNodeId, html: nav });
await callWrite('site_insert_html', { parentId: page.rootNodeId, html: body, index: 1 });
await callWrite('site_insert_html', { parentId: page.rootNodeId, html: footer, index: 2 });

const set = await callWrite('site_set_page_template', {
  pageId: page.document.id,
  target: { kind: 'postTypes', tableSlugs: ['posts'] },
});
console.log('set as postTypes template ->', JSON.stringify(set).slice(0, 200));

const back = await callJson('site_read_document', { document: page.document });
const h = (back.html || '').replace(/\suid="[^"]*"/g, '');
// The outlet is stored as <div data-instatic-content-region>, NOT as the
// <instatic-outlet> marker that was sent. Grepping for the input form reported
// "outlets: 0" on a template that was correctly built.
console.log('outlet present:', /data-instatic-content-region/.test(h));
console.log('shell present :', h.includes('<header') && h.includes('<footer'));
fs.writeFileSync('post-template-readback.html', h);
