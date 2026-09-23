## DRAFT 2026-08-27 (session 18a): BugHerd #8 — services cards get an image, two ways — NOT PUBLISHED, NOT COMMITTED

One of four agents on the same worktree at the same time (#8/#9/#10/#11). I own
**#8 only**. Draft is at **shell seq 106, index seq 101, verified twice, unpublished**.

Client, pinned on `a.sv-card` in Chapter 07: *"On desktop I want to have a hover
effect with an image showing following the cursor and on mobile and tablet the
image should be present on the card with no hover effect."*

### The shape of it

The image is IN the card in both cases — one `<figure class="sv-shot">` plus a
`base.image` per card, authored once. On a fine pointer `sections/ch-services.js`
takes those out of the flow and shows the picture on a **single shared floating
element** under the cursor instead, driven by `gsap.quickTo` at `.55s power3` so
it trails rather than snaps. Eleven absolutely-positioned images was the other
way to build it and it is worse on every axis.

Written:

- `15-instatic-api-sync/push-services-images.mjs` — 1 class rule + 5 ambient
  rules + 22 nodes, one atomic write, subtree-scoped readback, 409-retry loop.
- `site-src/sections/ch-services.js` (new), `css/39-ch-services.css`,
  the 11 figures in `pages/home.body.html`. site.js pushed byte-exact.
- `15-instatic-api-sync/render-draft-page.mjs` — **new, and generally useful**:
  see below.
- `.tmp/probe-services-hover.mjs` (33 assertions, fine + three coarse widths),
  `.tmp/shot-services.mjs`, `.tmp/svc-final-check.mjs`.

### THERE IS A WAY TO SEE THE DRAFT WITHOUT PUBLISHING

This is the finding worth carrying forward. `POST /admin/api/cms/runtime/preview`
is the editor's own preview-iframe builder. It is gated on the **read floor**,
and it takes the whole site document **in the request body** because previews
must reflect unsaved edits — so it works headlessly. Hand it the draft you just
read, get back finished HTML plus compiled runtime bundles plus diagnostics.

    node render-draft-page.mjs index .tmp/draft-render
    node .tmp/probe-services-hover.mjs .tmp/draft-render index.html

Every number below is from that render in a real Chrome — not from the local
package, and not from a node-tree readback. `GET /pages` answers `{rows}` in the
data-row shape while the endpoint validates `Page` records, so the rows have to
be reshaped and `template` rebuilt from the cells or `validatePages` rejects it.

### Verified on the DRAFT, both pointer types, all pass

    FINE 1440    .sv-follow: 1 in the DOM, child of <body>, position:fixed,
                 z-index 100 (under nav 120 / drawer 125), pointer-events:none,
                 closed at rest; opens on hover, arrives at the cursor, TRAILS
                 it (900px against a cursor at 972, one frame after a 260px
                 jump) and catches up; swaps card-to-card without closing;
                 closes on grid pointerleave.  scrollWidth 1425 <= iw 1440.
    COARSE 390 / 768 / 1024
                 .sv-follow does not exist in the DOM AT ALL — not hidden.
                 .sv-shot laid out, full-bleed (355.6px in a 355.6px card,
                 bleedL 0), 16:9, object-fit:cover, images load.
                 1 / 2 / 2 columns on the existing 620 and 1040 conditions.
                 No horizontal overflow at any of the three.

### Gotchas earned

- **A JS-built fixed element must be appended to `<body>`, outside
  `#smooth-wrapper`.** ScrollSmoother transforms `#smooth-content`, and a
  transformed ancestor makes `position:fixed` resolve against *that* — the plate
  would scroll away with the page. Same root cause as session 16's
  `position:sticky` finding, different symptom. The probe asserts there is no
  transformed or filtered ancestor above it rather than assuming.
- **Gate the fallback on a class the JS adds AFTER the element exists, not on
  the capability.** `.wz-svfollow` is set only once the follower is built — the
  `.wz-smooth` shape. Had the hide been on `.wz-fine`, a desktop where GSAP
  failed to load (queue never flushed) would have got no follower AND no in-card
  image. Reduced motion takes the same fallback deliberately: image stays, chase
  goes.
- **`display:none` plus `loading="lazy"` really is free.** Asserted, not assumed:
  all 11 in-card images report `naturalWidth === 0` at 1440. An image with no box
  never intersects, so it is never fetched. The follower then requests one
  variant at a time.
- **`base.image` publishes a `srcset` of `-w<N>.webp` variants**, and `src` is
  the full-size original — up to 3000px for `8L6A7479.jpg`. A follower reading
  `src` would pull ten times the image it can show. `ch-services.js` parses the
  srcset and takes the smallest variant at or above `width * DPR`; on the draft
  it correctly picked `-w640.webp` for a 271px plate at 2x.
- **`figure` is not one of `base.container`'s built-in tags.** Use
  `{tag:'custom', customTag:'figure'}` — the same escape hatch the chapter tag's
  `<i>` already uses. `resolveHtmlTag` falls back to `div` silently when the
  custom name is missing or fails its safe-name regex, so a typo is a silent
  `<div>` and the CSS quietly misses.
- **aria-hidden the figure.** The card is a LINK, so without it the image's alt
  joins the link's accessible name and it reads "An abutment and crown on an
  implant post 01 Dental Implants Single implants…". The card's own text says
  everything the picture does.
- **The index page row has NO `seoTitle`/`seoDescription` cells at all** — an
  earlier page write dropped them (any `PUT /site-document` does;
  `toChangedPage`'s header says so). Not restored: they are inert at publish on
  0.0.16, which `push-page-seo-cells.mjs` documents in detail, and it is not this
  pin. Worth someone's attention if a release ever wires them up.
- **`smile_makeover.png`'s altText is wrong** — it reads "A Digital Smile Design
  preview"; the picture is a woman holding a framed photograph of her teeth. Same
  shot family as `patient-story.jpg` and `cosmetic-transformation.jpg`. Not
  touched (not on the home page), flagged to #11 in `NOTES-images.md`.
- **The first hover raced its own preload, and `fetchPriority` is the fix.**
  Warming all eleven on grid `pointerenter` put them in flight in the SAME event
  burst as the first hover — cards tile the grid, so entering it *is* entering a
  card — and the wanted image came back after the plate had stopped waiting: one
  run in three showed `opacity 0, src ""` on the first card. Now the preloads
  are `fetchPriority = 'low'`, the on-demand load in `show()` is `'high'`, and
  the ScrollTrigger warms on `onEnter` so it starts when the section reaches the
  viewport rather than when the cursor does. Two clean probe runs since.
  **A first-hover-only race will not show in a probe that hovers a second card**
  — the card-to-card assertion passed happily throughout.
- **A catastrophic-backtracking regex will hang a grep on a 190 KB HTML file.**
  Nested `[^{}]*` around an alternation never returned and the call had to be
  backgrounded. Find the brace boundaries with `rfind`/`find` instead.

### The eleven images

All from the site's own library — **nothing bought from Magnific/Freepik, no
quota spent**. Hand-picked as pixels from contact sheets centre-cropped to the
16:9 the card actually renders (`.tmp/svc-images*/_sheet.jpg`), never from
filenames. The full claim table, and the notes I owe pin #11, are in
`05-design-revisions/.tmp/bugherd/briefs/NOTES-images.md`.

- **None collides with the home page's existing 32 distinct images**, and none
  repeats another. The four duplicates still on that page (`case2-before`,
  `case1-after`, `case2-after`, `logo`) were there before me and are #11's.
- **MIN_WIDTH is 800 here, not `post-image-pool.mjs`'s 1400**, and the reason is
  in the script header: 1400 exists because an article hero renders ~860 CSS px
  wide. The widest thing here is a `clamp(200px,20vw,320px)` follower. Holding
  out for 1400 would have meant passing over the model and treatment photography
  — which is what a treatment card wants — in favour of practice interiors.
- The whole square-PNG family in this library (507/593/617/654/672/771px
  `*-graphic.png`, `*-icon-*.png`, `sedation-*.png`, `full-arch-*.png`) is the
  old WordPress circular artwork. Skipped wholesale; it is the likeliest source
  of #11's round-radius offenders.
- Two assets had no altText and now have one:
  `implant-supported-dentures-model-3.jpg` and `8L6A7479.jpg`. `base.image` reads
  alt from the library row and nowhere else, so that row is the only place it can
  be set — and it changes those images everywhere they render.

### I shipped another agent's in-flight JS, on purpose

`build-site.mjs` bundles every file in `sections/`, and by the time I rebuilt,
pin #10's agent had added `sections/blog-filter.js`. My `site.js` push therefore
carries **their module as well as mine** (draft `src/scripts/site.js`, 90,016c).
It is safe — `WZ.dom('blog-filter', '#blFilter', …)` guards on a selector that is
on no page yet, so it is inert until their nodes land — and `node --check` on the
bundle passed before the push. But:

- **Whoever pushes `site.js` next must rebuild from `site-src` first.** The
  bundle is all-or-nothing; pushing a stale build silently deletes whichever
  modules were added since.
- Do not read a `site.js` size change as evidence of your own diff.

### Not done, deliberately

**Not published and not committed** — the human gives that instruction once all
four of us are finished. The draft also carries session 16's article layout, the
client's hand-applied Vimeo breakpoint edits, and whatever #9/#10/#11 land. A
publish ships all of it.
