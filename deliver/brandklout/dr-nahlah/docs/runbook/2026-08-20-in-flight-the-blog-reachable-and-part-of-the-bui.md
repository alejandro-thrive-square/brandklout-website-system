## IN FLIGHT: the blog, reachable and part of the build (2026-08-20)

Commit **ddd9c31**. Local half done and gated. **NOT PUSHED** — the Instatic Site-editor bridge
reports `siteConnected:false` and stayed down through 30+ minutes of polling. Opening the Instatic
editor in a browser brings it back.

### The blog was live and linked from nowhere
Zero of the 33 pages pointed at `/posts`. The 43 articles, the index and the template all worked;
the only way in was to know the URL. The cause is structural, and it is the same shape as
`runtime-states.css`: `build-blog-index.mjs` and `build-post-template.mjs` authored both pages
natively on Instatic by copying the shell out of `thank-you`, so they had no local counterpart, no
gate, and no way to pick up a change to a partial.

- **Journal is in the nav, the drawer and the footer.** Six nav items now; measured at 1080px, the
  narrowest width that shows the links, 24px clearance to the CTA, no overflow. Drawer is 30 links
  and still 0 unreachable at 390x844.
- **`site-src/gen-blog.mjs`** builds `posts` and `post` from `posts.json`. Both are ordinary pages
  now: same shell, tokens, partials and gates as everything else. 35 pages in the build.
- **`swap-blog-dynamic.mjs` replaces the two old builders.** It does not build the pages any more,
  it performs only the two swaps a static build cannot express: `.bl-grid` -> `<instatic-loop>`,
  `.bl-body` -> `<instatic-outlet>`, plus re-registering the postTypes target.

### Two defects found while building it
- **`--h1` IS NOT A TOKEN IN THIS SYSTEM.** `.bl-post h1{font-size:var(--h1)}` was therefore an
  invalid declaration and the headline fell back to the inherited body size: every one of the 43
  published articles rendered its title at 15.6px against its own h2s at 25.6px. Now
  `calc(2.6rem * var(--t-sm))` = 41.6px, off the same ramp as the article's h2. **A `var()` with no
  fallback fails silently, and silently means "inherit".**
- **`data-rv="stagger"` on a 43-child grid** runs ~3.9s from one trigger at the top of the list, so
  the last cards animate long after they are on screen. The reveal is per CARD now, which is also
  the only form that survives the loop swap: the loop copies its CHILD markup.

### Gotchas
- **`site-test` resolves the 43 article links against `posts.json`, not the folder.** They are real
  URLs the CMS serves and there are no local files for them; a file-existence check reported 43
  broken links on a page where nothing is broken.
- **`to-instatic.mjs route()` needed the one nested case**, `posts/<slug>.html` -> `/posts/<slug>`.
  A flat-filename pattern leaves those alone silently, which would ship 43 dead links.
- **`probe.mjs` had the same fast-scroll artifact as `audit-site.mjs`** and reported 10 of 43 cards
  stranded at opacity 0. Both now hold at the bottom until ScrollSmoother catches up.
- **`pull2.mjs` caches by file existence** — `FORCE=1` to re-pull.

### The push sequence when the bridge is back
`push-all.mjs` (35 pages) -> `restore-img-attrs.mjs` (BEFORE the swaps, so the image counts still
match) -> `fix-video-poster.mjs` -> `swap-blog-dynamic.mjs` -> `site_publish` ->
`audit-site.mjs --out audit-blog`, then again with `--mobile`.

### Gates
`site-test` **603/603** | `interaction-test-gsap` **64/64** | `fluid-qa` **405/405** |
`css-vocab` 261 OK | `check-page-lists` 3/3 | visible em dashes **0** across 35 pages
