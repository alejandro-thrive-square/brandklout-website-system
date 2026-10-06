// Generates the two blog pages from the migrated post archive.
//
// WHY THESE EXIST LOCALLY AT ALL
// ------------------------------
// The blog index and the article template were authored natively on Instatic
// (build-blog-index.mjs, build-post-template.mjs) and had no local counterpart.
// That is the same shape of problem as runtime-states.css: a file nobody can
// diff, gate, or restyle with the rest of the system, and the first thing that
// goes stale when the shell changes. Adding the Journal to the nav proved it —
// every other page picked the link up from a partial; these two could not.
//
// Now they are ordinary pages in the build. `posts` is the index, `post` is the
// article layout, and both get the same nav, drawer, footer, tokens and gates as
// everything else.
//
// WHAT THE PLATFORM STILL SWAPS
// -----------------------------
// On Instatic `/posts` renders through a CMS loop and `post` is registered as
// the postTypes template with a content outlet. Both swaps happen AFTER the
// push, in 13-content-export-import/.tmp:
//   posts -> swap-blog-loop.mjs   (static .bl-grid  ->  <instatic-loop>)
//   post  -> build-post-template.mjs (the .bl-body  ->  <instatic-outlet>)
// The markup here is written to make those swaps a single-node replacement.
//
// WHY THE CARDS CARRY NO DATE
// ---------------------------
// This mirrors the loop rather than improving on it, deliberately. Instatic's
// `publishedAt` is the moment the document was imported, so every card would
// read 2026 for a post written in 2022, and the collection's fields are
// builtIn-only with no tool to add one. The real date is written into each
// article body, where it is visible on the piece itself and cannot mislead a
// listing. Showing true dates here and none on the live loop would just make
// the two versions disagree.
//
//   node gen-blog.mjs            # writes pages/posts.body.html and pages/post.body.html
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const POSTS = path.resolve(HERE, '../../../13-content-export-import/.tmp/posts.json');

/* The topic taxonomy is NOT redefined here. `post-image-pool.mjs` is the one
   ordered, specific-before-general list this project has, and it already decides
   which photograph each article gets — deriving the topic label from anywhere
   else would let a card's picture and its topic label disagree.

   The chip LABEL is the id with its first letter capitalised, nothing more, so
   `slugify(label) === id` holds by construction and `?topic=implants` needs no
   lookup table in the browser. push-posts-filter.mjs asserts that for all twelve
   and refuses to run if it ever stops holding. */
import { TOPICS, topicFor } from '../../../22-instatic-api-sync/post-image-pool.mjs';
const topicLabel = (id) => id.charAt(0).toUpperCase() + id.slice(1);

const raw = JSON.parse(fs.readFileSync(POSTS, 'utf8'));
const posts = Array.isArray(raw) ? raw : raw.posts || [];
if (!posts.length) throw new Error('no posts in posts.json');

const esc = (s) => String(s)
  .replace(/&(?![a-zA-Z#0-9]+;)/g, '&amp;')
  .replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** One card, shaped like the loop's child.
 *
 * NO LONGER 1:1, and deliberately so. BugHerd #9 gave the Instatic loop card a
 * leading thumbnail bound to `{currentEntry.featuredMediaPath}`:
 *
 *     <a class="bl-rel-fig" aria-hidden="true" tabindex="-1" href="...">
 *       <img src="{currentEntry.featuredMediaPath}" loading="lazy">
 *     </a>
 *
 * The static build cannot reproduce it. Those 22 photographs live in the
 * Instatic media library and `site-src/assets/` holds nine files, none of them
 * a match — the picks are in `15-instatic-api-sync/.tmp/post-images/picks.json`
 * (slug -> asset) if anyone wants to close the gap, but it means copying the
 * library into the design package, and the repo rules say no binary assets.
 *
 * Emitting the markup anyway with a src that resolves to nothing would print a
 * broken image on every static card, which is worse than the honest omission:
 * a row with no image publishes an EMPTY `<a>` on Instatic too, and
 * `.bl-rel-fig:empty{display:none}` hides it. So the static build renders what
 * the CMS renders for an imageless row, which is the closest thing to parity
 * available here.
 *
 * The STYLING is shared and unaffected — it is all in css/62-blog.css.
 */
const card = (p) => `      <article class="blog_card" data-rv>
        <span class="blog_topic">${esc(topicLabel(topicFor(p.title).id))}</span>
        <h2><a href="posts/${p.slug}.html">${esc(p.title)}</a></h2>
        <p>${esc(p.seoDescription || '')}</p>
        <a class="blog_more-link" href="posts/${p.slug}.html">Read the article</a>
      </article>`;

/* The <option> list is published in TAXONOMY order (specific before general),
   not alphabetical: `topicFor` is first-match-wins, so this order is the one
   that explains the assignments. Only topics some article actually landed in
   are offered — a choice that can only ever return the empty state is a dead
   end, not a filter. blog-filter.js prunes again at runtime against the cards
   on the page, so the published list and the DOM can never disagree. */
const usedTopics = new Set(posts.map((p) => topicFor(p.title).id));
const TOPIC_OPTIONS = TOPICS.filter((t) => usedTopics.has(t.id))
  .map((t) => `          <option value="${t.id}">${esc(topicLabel(t.id))}</option>`)
  .join('\n');

const index = `<!-- ==========================================================================
     JOURNAL — the index over the 43 posts migrated from the WordPress site.
     GENERATED by gen-blog.mjs. Do not hand-edit; edit posts.json and re-run.

     On Instatic the .blog_grid below is replaced by an <instatic-loop> over the
     posts collection, so this list is what the local build and every static
     host serve, and the loop is what the CMS serves. The card markup is
     identical either way, which is the point.
     ========================================================================== -->
<section class="section_page-hero" id="hero" style="min-height:clamp(380px,46svh,520px)">
  <div class="page-hero_background">
    <img src="assets/xray-consult.jpg" alt="A clinician showing a patient their X-ray beside an implant model" data-drift>
  </div>
  <div class="container-large page-hero_content">
    <div class="breadcrumb_component" data-rv><a href="index.html">Home</a><i></i><span>Journal</span></div>
    <h1 data-split>Written by the <em>specialist</em>.</h1>
    <p class="page-hero_lead" data-rv>${posts.length} articles on implants, full-arch restoration, cost,
      aftercare and what actually goes wrong, from the practice's own archive.</p>
    <div class="page-hero_actions" data-rv>
      <a class="button is-primary is-magnetic" href="contact.html#book"><span>Book a consultation</span></a>
      <a class="button is-secondary is-magnetic" href="dental-implant-faq.html"><span>Read the implant FAQ</span></a>
    </div>
  </div>
</section>

<!-- ---------- the archive ---------- -->
<section class="section_content is-background-alternate" id="articles">
  <div class="container-large padding-section-large">
    <!-- The reveal is per CARD, not a stagger on the grid. A stagger over 43
         children runs for ~3.9s from a single trigger at the top of the list,
         so the last cards animate long after they are on screen; and the loop
         that replaces this grid on Instatic copies its CHILD markup, so a
         per-card attribute is the only one that survives the swap. -->
    <div class="blog_filter" id="blFilter" role="search">
      <div class="blog_filter-field">
        <label class="blog_filter-label" for="blSearch">Search the journal</label>
        <input class="blog_filter-input" type="search" id="blSearch" name="q"
               placeholder="implants, cost, sedation…" autocomplete="off">
      </div>
      <div class="blog_filter-field">
        <label class="blog_filter-label" for="blTopic">Topic</label>
        <select class="blog_filter-select" id="blTopic" name="topic">
          <option value="">All topics</option>
${TOPIC_OPTIONS}
        </select>
      </div>
      <p class="blog_filter-count" id="blCount" role="status" aria-live="polite">${posts.length} articles</p>
    </div>
    <div class="blog_grid">
${posts.map(card).join('\n')}
    </div>
    <div class="blog_empty" id="blEmpty" hidden>
      <h3>Nothing in the archive matches that.</h3>
      <p>Try a single word rather than a phrase — or clear the filters and browse
        the whole archive.</p>
      <button class="blog_clear-button" type="button" id="blClear">Show every article</button>
    </div>
  </div>
</section>
`;

/* The article layout. Locally it renders a real piece, so the type, measure and
   spacing of a post are gated by site-test and fluid-qa like any other page;
   on Instatic the .bl-body becomes the content outlet.

   THE SAMPLE IS CHOSEN, NOT posts[0]. The FAQ accordion only builds itself from
   headings that are questions, so a sample whose sections are statements would
   render a layout with a whole component silently missing and nothing to look
   at. The first Q&A-shaped article is used instead — which is also the page the
   client pinned. */
const sample = posts.find((p) => (p.body.match(/<h2[^>]*>[^<]*\?\s*<\/h2>/gi) || []).length >= 3)
  || posts[0];

/* One review in the rail, taken from the same feed the home page's wall is
   generated from. It is a fixed quote, not a live widget, deliberately: the
   vendor's review embed is a third-party script plus an iframe, and putting it
   on all 43 articles would multiply the one remaining mobile-performance
   problem this site has by 43. Re-run gen-reviews.mjs and this picks up
   whatever that feed holds. */
const reviews = JSON.parse(fs.readFileSync(path.resolve(HERE, '../reviews.json'), 'utf8'));
const pick = (Array.isArray(reviews) ? reviews : reviews.reviews || [])
  .filter((r) => r.rating === 5)
  .sort((a, b) => a.body.length - b.body.length)[0];

/* The two offices, each booking its own calendar. Never collapse this to one
   button — a single "book now" sends every reader to Alexandria, which is the
   bug add-cta-offices.mjs exists to have fixed. */
const OFFICES = [
  ['Tysons Corner · McLean', 'https://www.flexbook.me/DrNahlahTy/1'],
  ['Alexandria', 'https://flexbook.me/drnahlah'],
];

const railCards = `        <div class="article_rail-card">
          <div class="article_rail-card-image"><img src="assets/dr-nahlah.png" alt="Dr. Esam Nahlah, Prosthodontist" loading="lazy"></div>
          <span class="text-style-tagline">The specialist</span>
          <strong>Dr. Esam Nahlah</strong>
          <p>D.D.S., M.S. — Diplomate of the American Board of Prosthodontics, practising in Northern Virginia since 2013.</p>
          <a class="more-link_component" href="meet-dr-nahlah.html">Meet the specialist</a>
        </div>
        <div class="article_rail-card">
          <span class="text-style-tagline">Trusted by patients</span>
          <i class="reviews_stars" aria-hidden="true">★★★★★</i>
          <blockquote>${esc(pick.body)}</blockquote>
          <cite>${esc(pick.author)} · Google</cite>
          <a class="more-link_component" href="patient-stories.html">More patient stories</a>
        </div>
        <div class="article_rail-card is-dark-card" data-theme="dark">
          <strong>Request a consultation</strong>
          <p>A 3D scan and a straight answer about what your case actually needs, before you commit to anything.</p>
${OFFICES.map(([name, href]) => `          <div class="article_rail-card-office"><span>${esc(name)}</span><a href="${href}" target="_blank" rel="noopener">Book</a></div>`).join('\n')}
        </div>`;

/* Three thumbnails for the related strip. On Instatic these come from the loop
   binding {currentEntry.featuredMediaPath}; locally they are three stand-ins,
   present so the row is measured with images in it rather than without. */
const RELATED_ART = ['assets/patient_hero.jpg', 'assets/advanced_tech.jpg', 'assets/office-room.jpg'];
const related = posts.filter((p) => p.slug !== sample.slug).slice(0, 3);

const article = `<!-- ==========================================================================
     ARTICLE LAYOUT — one post, and on Instatic the postTypes template.
     GENERATED by gen-blog.mjs. Do not hand-edit.

     The body below is a real article (${esc(sample.slug)}), present so the
     article's typography is measured by the gates rather than assumed. On
     Instatic build-post-template.mjs replaces the contents of .article_body with
     <instatic-outlet data-tag="div">, and every entry renders through this same
     shell.

     THE SHAPE, and where each piece comes from on the platform:

       .section_page-hero.is-article-hero   full bleed, outside .container-large. The photograph is the entry's
                        featuredMedia; the title is {currentEntry.title}; the
                        date is MOVED here from the body by sections/blog-post.js
                        because there is no date field to bind.
       .is-left-rail       empty in the markup. The contents list is built at
                        runtime and moved in above 1280px.
       .article_main         the outlet, the FAQ (runtime) and the consult block.
       .is-right-rail       three fixed cards. Pinned by ScrollTrigger, not by
                        position:sticky, which cannot work under ScrollSmoother.
       .article_related      a base.loop on Instatic; three stand-ins here.
     ========================================================================== -->
<main class="section_content" id="top">

  <section class="section_page-hero is-article-hero" id="hero">
    <div class="page-hero_background">
      <img src="assets/consult-discussion.jpg" alt="A clinician and a patient talking through a treatment plan">
    </div>
    <div class="container-large page-hero_content">
      <div class="breadcrumb_component" data-rv><a href="index.html">Home</a><i></i><a href="posts.html">Journal</a></div>
      <h1 data-rv>${esc(sample.title)}</h1>
      <p class="article_hero-date" data-rv></p>
    </div>
  </section>

  <div class="container-large padding-section-large">
    <article class="article_component">

      <aside class="article_rail is-left-rail"></aside>

      <div class="article_main">
        <div class="article_body" data-rv>
          <div>
${sample.body.trim().split('\n').map((l) => '            ' + l.trim()).join('\n')}
          </div>
        </div>
        <div class="article_cta" data-rv>
          <div>
            <strong>Still deciding whether this applies to you?</strong>
            <p>A consultation includes the 3D scan and a straight answer about what your case actually needs, before you commit to anything.</p>
          </div>
          <a class="button is-primary is-magnetic" href="contact.html#book"><span>Book a consult</span></a>
        </div>
      </div>

      <aside class="article_rail is-right-rail">
${railCards}
      </aside>

      <div class="article_related" data-rv>
        <strong>More from the Journal</strong>
        <div class="article_related-grid">
${related.map((p, i) => `          <article class="article_related-card">
            <a class="blog_card-image" href="posts/${p.slug}.html" tabindex="-1" aria-hidden="true"><img src="${RELATED_ART[i]}" alt="" loading="lazy"></a>
            <h3><a href="posts/${p.slug}.html">${esc(p.title)}</a></h3>
          </article>`).join('\n')}
        </div>
      </div>

      <div class="article_footer" data-rv>
        <a class="blog_more-link" href="posts.html">All articles</a>
        <a class="button is-primary is-magnetic" href="contact.html#book"><span>Book a consultation</span></a>
      </div>
    </article>
  </div>
</main>
`;

fs.writeFileSync(path.join(HERE, 'pages/posts.body.html'), index);
fs.writeFileSync(path.join(HERE, 'pages/post.body.html'), article);
console.log(`posts.body.html  ${posts.length} cards, ${index.length} chars`);
console.log(`post.body.html   sample "${sample.slug}", ${article.length} chars`);
