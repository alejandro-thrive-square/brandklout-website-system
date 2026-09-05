## DRAFT 2026-08-27 (session 18b): BugHerd #9 — /posts cards carry the post's image — NOT PUBLISHED, NOT COMMITTED

> "Here we should display the main image of the blog post."   `/posts`

Draft is at **seq 105, verified, unpublished, uncommitted.** Three other agents
(#8, #10, #11) were writing the same document throughout.

### The first job was to find out whether there was anything to bind

There was. All 43 `posts` rows already carry a `featuredMedia` id; all 43 resolve
to a library asset; all 43 assets have alt text; none has an edit newer than its
last ROW publish. Session 15c's runbook entry says `--apply` was "not yet
written" — it was written and run in 15d, and `applied.json` records one 502 that
was evidently retried later. **Check the live data, not the runbook.**

So this was a template change only. `push-posts-card-image.mjs` (new).

### `/posts` is ONE node, not 43

`section#articles > div.wrap.section > div.bl-grid` is a **`base.loop`**
(`data.rows`, `tableId: posts`, `publishedAt desc`, `limit 60`,
`pagination: 'none'`), and its single child is `article.bl-card`. The publisher
renders that subtree once per row. One figure added to one node gives 43 cards.

The corollary is the constraint that decided the perf answer below: **every card
renders from the same props.** `renderLoop` round-robins over the loop's
CHILDREN — N children are N alternating variants, so with 3 variants items 0,1,2
and 3,4,5 both cycle A,B,C. It is not a hook on item 0.

### What is on the card now

```
article.bl-card
  a.bl-rel-fig   href={currentEntry.permalink} aria-hidden="true" tabindex="-1"   NEW
    img          src={currentEntry.featuredMediaPath} loading=lazy decoding=async  NEW
  span.bl-topic  (pin #10's chip — added after mine, lands between figure and h2)
  h2 > a
  p
  a.bl-more
```

`aria-hidden` + `tabindex="-1"` because the card already links to the post twice;
a third announced, tabbable link in a 43-card list is noise. `aria-hidden` on a
**non**-focusable element is valid, so the two attributes travel together.

No `alt` in `htmlAttributes`, deliberately: `base.image` renders htmlAttributes
FIRST and the library alt second, HTML keeps the first occurrence, and an alt
here would shadow the library's — the exact bug `perf-image-priority.mjs` was
written to undo on 194 images.

### Styling: `.bl-rel-fig` is REUSED, not forked

The figure carries the article page's own related-strip class. One 16/10 box, one
`object-fit:cover`, one `--mist` placeholder, in one place. The only new rules are
`.wz-fine .bl-card:hover .bl-rel-fig img` (the index's hover ancestor is
`.bl-card`, not `.bl-rel-card`) and `.bl-rel-fig:empty`. Both `ambient`. Read
`.bl-rel-fig` as "the blog thumbnail"; the name says "related" for historical
reasons only.

### The empty case needs no JS, and `:empty` is exact

`base.image.render` returns `{html: ''}` when `src` is empty, and `base.link`
joins children with `''`. So a row with no `featuredMedia` publishes a genuinely
empty `<a class="bl-rel-fig"></a>` — `.bl-rel-fig:empty{display:none}` hides it
before first paint, with no flash of grey plate and no script. It also covers the
article page's related strip, where `sections/blog-post.js` does the same removal
at runtime, so that now works with JS off too.

Both selector shapes were confirmed against the LIVE stylesheet before relying on
them: `.bl-ph-when:empty` and `.wz-fine .bl-rel-card:hover .bl-rel-fig img` are
already published, so `:empty` ambients and `.wz-fine ...` descendants both
survive the shake. `styleRuleTreeShake.ts` drops a selector part only when it
names a class that is KNOWN (has a class-kind rule) and UNUSED; `bl-rel-fig` and
`bl-card` are both used, and `wz-fine` has no class rule at all so it is never
even checked.

### The perf answer, and why it is not "first row eager"

The brief asked for eager/`fetchpriority` on the first row. **A loop cannot
express it** (see above), and it is also the wrong thing: `/posts`'s LCP is the
`.pg-hero` photo, which already carries the page's one `fetchpriority="high"`,
and `perf-image-priority.mjs` is explicit that a second competes with it.
Verified in the rendered draft: exactly 1 `fetchpriority="high"` page-wide, 0 in
the grid, 43 `loading="lazy"`.

**The real regression was `sizes`, and it is worth remembering why.** Every
thumbnail first published `sizes="auto, 100vw"`. `sizesResolver.ts` derives
`sizes` by walking the ancestor chain for **px** `width`/`max-width`/padding, and
on this site it finds nothing to read: `.wrap` caps with `max-width:var(--maxw)`,
every gutter and card padding is a `clamp()`, and the resolver bails out of a
`base.loop` grid's track maths by design. So it returns null and the module falls
back to `100vw`. Chrome 121+ honours the `auto` keyword and picks correctly;
**Safari and Firefox read 100vw and fetch the w2000 variant — 238 KB where the
38.5 KB w640 would do, measured, on every card.**

The only hook the resolver reads is a px length on a rule the node's `classIds`
point at. `.bl-rel-fig` now carries `max-width:640px`, which is inert at every
width this design produces — the widest the figure can ever be is **595.08px**,
at a 699px viewport in one column (699 − 2×27.96 gutter − 2×24 card padding).
Result: `sizes="auto, min(100vw, 640px)"` on all 43. If the index is ever made
one column ABOVE ~700px, raise it or the thumbnail stops short of the card.

That one declaration is MERGED into pin #7's rule, one key, never a wholesale
replace, and the read-back asserts the other five declarations came through
untouched.

### How it was verified without publishing

`POST /admin/api/cms/runtime/preview` renders a page from the DRAFT through the
platform's own publisher. `resolvePreviewPage` reads `site.pages`, which the
shell does **not** carry (pages are data rows), so the site document has to be
rebuilt with them attached — that is the 404 "Page not found" you get otherwise.
`.tmp/pin9-preview.mjs` does it. It returns HTML and JS assets but **no CSS**;
the stylesheet is generated at publish, so CSS still cannot be verified this way.

On the draft: 43 cards, 43 figures, 0 empty, 43 imgs with real alt / srcset /
intrinsic width+height / lazy / aria-hidden, and **0 unresolved `{currentEntry.`
tokens page-wide**. `.tmp/pin9-shot.mjs` composes that render with the published
stylesheet plus the draft's `62-blog.css` and screenshots it in Chrome at 1685 /
900 / 390 px.

### Gotchas earned

- **`htmlAttributes` are NOT token-interpolated.** `resolveDynamicProps` iterates
  `Object.keys(target)` and `continue`s on anything not `typeof v === 'string'`;
  `htmlAttributes` is an object, and `htmlAttributesAttr` emits each value
  verbatim through `escapeHtml`. So `data-topic="{currentEntry.topic}"` publishes
  that literal text. Per-row values must ride a top-level string prop — `href`,
  `src`, `text`, `label`. This is why the card carries no data attributes and why
  pin #10's topic is a rendered `<span>`. (Tokens do have a fallback syntax:
  `{currentEntry.x|default}`.)
- **ANY page-tree write drops `seoTitle` / `seoDescription`.** `pageToCells`
  returns `{title, slug, body}` plus template keys and the row's cells are
  REPLACED with that. `/posts` has both. Caught here because my read-back gate
  failed on a value I had already restored once — another agent's script wrote
  the page in between and did not re-apply. New `restore-page-seo-cells.mjs`
  repairs it from a `.tmp/backup.mjs` snapshot and only ever fills a hole, so it
  cannot overwrite a newer edit. **Re-apply inside the script, in the same run;
  the window between the write and the next reader is where the page is wrong.**
- **A CSS slice keyed on a phrase moves when someone writes ABOUT the phrase.**
  My block was bounded `indexOf('INDEX CARD IMAGE') ... indexOf('A SINGLE POST')`.
  Pin #10 left a note above my block explaining that *their* slice had swept up
  my rules — and their note contains the words "A SINGLE POST", so my `to` landed
  above my `from` and the script refused to run. Anchor the second search to the
  first, and assert the slice contains only your own selectors.
- **Do not assert an exact child list on a shared node.** My verify asserted the
  card's children were exactly `bl-rel-fig | h2 | p | bl-more`; pin #10's chip
  made that false on a page that was fine. It now asserts the figure is first and
  that `h2`, `p`, `bl-more` are present in that relative order. Additions
  allowed, disappearances not — that is what makes two agents' scripts commute.

### Not mine, but found here, and one of it needs a person

`audit-image-dupes.mjs` (new) hashes the published `-w320.webp` bytes of every
image on a page and groups by hash, because **this library re-uploads the same
photograph under different filenames and asset ids**, and every de-dup tool on
this project counts ids or names.

- /posts: 43 cards, **29 distinct asset ids, 22 distinct PICTURES.** Cards 1 and
  2 are the same photograph, adjacent, in the first row at every breakpoint.
- `pick-post-images.mjs`'s `MAX_USES = 2` counts by asset name, so two ids for
  one picture silently permit **four** uses. One photograph is on cards 4, 11, 27
  and 32.
- Five duplicate groups carry **conflicting alt text** — one picture is described
  three different ways (`interior.jpg` "the reception area", `office-wide.jpg`
  "the surgical floor", `img-full-width-dental-office-1.jpg` "an operatory
  light"). Same pixels. At least two of the three are read aloud to somebody and
  are wrong. Alt lives on the ASSET, so merging the assets fixes every page.
- /smile-makeover (pin #11's own page): `lab.jpg` and `tech-hero.jpg` are
  byte-identical and adjacent at positions 15 and 16.

**The one for a person:** `post-image-pool.mjs` excludes named-patient
photography **by filename** — its header names `pt-yolanda.jpg`. The same
patient's photograph is also in the library as `pt-hero-1.jpg` and
`patient_hero.jpg`, both allowlisted, byte-identical to each other, and
`pt-hero-1.jpg`'s own library alt text reads *"Yolanda holding a framed
photograph of her smile before treatment"*. The allowlist blocked the filename
and the re-upload walked past it. That picture is the featured image on four of
the 43 articles and has been their LIVE hero since session 15d — this draft did
not introduce it, it made it visible. Untouched here: re-picking `featuredMedia`
changes live article heroes, spends Freepik quota, and is a decision about a real
patient's photograph. Hash first, merge the duplicate assets, THEN re-run the
pool — or the name-based allowlist lets it through again.

### Files

New: `15-instatic-api-sync/push-posts-card-image.mjs`, `audit-image-dupes.mjs`,
`restore-page-seo-cells.mjs`. Edited: `04-design/.tmp/site-src/css/62-blog.css`
(an INDEX CARD IMAGE block, and `max-width` on `.bl-rel-fig`), `gen-blog.mjs` (a
comment: the static card is no longer 1:1 with the loop card, and why — the 22
photographs live in the Instatic library and `site-src/assets/` has nine files,
none of them a match, so the static build renders what the CMS renders for an
imageless row).

**Not published. Not committed.** `site.css` has not been re-pushed; the registry
and the local file agree on these rules because the script parsed them out of the
local file, but nothing else was synced.
