## DRAFT 2026-08-27 (session 16): pin #7 revisited - the article layout, NOT PUBLISHED

The client asked for the LAYOUT of the competitor page attached to BugHerd #7,
kept in Dr. Nahlah's style guide. Draft is at **seq 98, verified, unpublished**.

    .pk
      .pg-hero.bl-ph      full bleed, featured image, title + date over it
      .wrap.section
        .bl-post          three columns above 1280px
          .bl-rail-l      contents, moved in at runtime, PINNED
          .bl-main        outlet + FAQ (runtime) + consult block
          .bl-rail-r      specialist / review / two-office consult cards
          .bl-related     now with thumbnails
          .bl-foot

Written: `15-instatic-api-sync/push-post-layout.mjs` (new), `css/62-blog.css`,
`sections/blog-post.js`, `gen-blog.mjs` (the local `post.html` is a faithful
preview of the template again). site.js pushed, byte-exact, seq 96.

### position:sticky IS INERT ON THIS SITE, and has been for a long time

ScrollSmoother puts the page inside `#smooth-wrapper{position:fixed;overflow:hidden}`
and translates the content, so nothing has a scrolling ancestor to stick to.
Measured on /sedation-dentistry: 400px of scroll moved the "sticky"
`.pk-lede .lc-head` the full 400px. **That rule has never worked live.** The
contents rail is `ScrollTrigger` `pin: true, pinSpacing: false` instead, desktop
only, skipped when the rail is taller than the window.

Anything else in this design that reads as sticky is the same lie. Check it.

### Three more things worth keeping

- **A pinned grid item is replaced by GSAP's `.pin-spacer`**, which becomes the
  grid child in its place. Auto-placement happened to put it back in column one;
  `.bl-post > .pin-spacer{grid-column:1;grid-row:1}` says so explicitly now.
- **A selector can exist TWICE in the registry** - `.bl-rel-grid` is an empty
  class-kind rule (the name a node references) plus an ambient that paints. An
  upsert keyed on "first match by selector" wrote one and verified the other,
  and the script failed its own gate. Pick the highest `order`: that is the rule
  the cascade lands on.
- **`.pk h2{max-width}` was capping every heading in all 43 articles** (28ch in
  the registry, 18ch in the local CSS - they had drifted). Article headings are
  sentences; `.bl-body h2{max-width:none}` now.

### Decisions the client made, and one they did not get

- FAQ accordion: they chose "build it from the article's H2s". It is built from
  the QUESTION-shaped H2s only (>= 3, else no accordion), and each row carries
  the OPENING of that section plus a link into it - not the section again. The
  full answers ship as FAQPage JSON-LD. Restating 2,000 words underneath
  themselves is not what the reference's accordion does.
- Rail reviews: they ticked BOTH "static quote" and the LeadConnector widget.
  Built as a static quote. The widget is a third-party script plus an iframe,
  and 43 article pages is the wrong place to multiply the one remaining mobile
  performance problem. One-line swap if they insist.
- The trust rail is NOT pinned: three cards run ~1,100px, taller than any laptop
  window. It sits at the top of the article and scrolls away, as the reference's
  does.

### Before publishing

Pre-publish audit of `index` is snapshotted (words 1385 -> 1973, up because of
the services section; no `.rv-card` regression). Volume is at 31%, 3.1G free.
`.bl-hero` and `.bl-hero img` are now unreferenced and the publish shake will
drop them - that is intended, not a loss.

**Unrelated, and live right now:** the Vimeo embed added for pin #2
(`player.vimeo.com/video/1221240290`) returns **401** on the home page. The
video is private. Someone has to unlist it or the block is a dead frame.
