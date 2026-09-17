## DONE 2026-08-27 (pin #10): /posts search bar + topic filter — DRAFT, not published

BugHerd #10, client: "Here we should have a search bar and a filter per topic",
pinned on `section#articles.pk.pk-alt > div.wrap.section`. 43 articles and no way
to find one. Worked alongside pins #8, #9 and #11 in this worktree.

### What shipped to the draft

| where | what |
|---|---|
| `posts` table | new CUSTOM `select` field `topic`, 12 options |
| 43 post rows | `topic` cell set from the taxonomy — **DRAFT rows only, see below** |
| `/posts` page | `#blFilter` (label + search input, label + select, live count) before the grid; `#blEmpty` after it; a `.bl-topic` chip inside the loop card |
| registry | 25 rules — 9 class-kind, 16 ambient — parsed out of `css/62-blog.css` |
| `src/scripts/site.js` | `sections/blog-filter.js` (already on the draft — see the shared-push gotcha) |

The local reference is the thing to look at first:
`04-design/.tmp/site-src` → the pin #10 block of `css/62-blog.css`,
`sections/blog-filter.js`, and the markup `gen-blog.mjs` now emits.
`node gen-blog.mjs && node build-site.mjs`, then open `final-site/posts.html` —
it reproduces the published card markup 1:1.

```
node push-posts-filter.mjs            # plan, writes nothing
node push-posts-filter.mjs --apply    # idempotent; a re-run reports "nothing to do"
node verify-posts-filter.mjs          # read-only gate, run it any time
```

### THE ONE THING LEFT, and it is a publish

**A post row's cells do not ship with a site publish.** `PATCH /data/rows/:id`
writes the DRAFT cells only; `active_version_id` moves only on
`POST /rows/:id/publish` (`server/handlers/cms/data/rows.ts:238`). And
`persistSitePublish` (`server/repositories/publish.ts`) iterates `input.pages`,
with `where data_rows.table_id = 'pages'` beside it — post rows are invisible to
it. The loop reads `data_row_versions` joined on `active_version_id`, so it keeps
serving whatever that row was last **row**-published with.

`15-instatic-api-sync.md` says "publishing ships the whole draft". That is true
of PAGES and false of POST ROWS, and from outside the two are
indistinguishable: your value is in `GET /data/rows/:id`, the Data grid shows
it, the publish succeeds, and the loop renders the old one with no error
anywhere.

So: **all 43 rows carry `topic` on the draft; none carry it published.**

```
node publish-post-rows.mjs            # report which rows are stale, and why
node publish-post-rows.mjs --apply    # 43 row publishes   <-- NOT RUN
```

`--apply` re-bakes 43 article pages from the current draft, including whatever
is unpublished on the `post` template. That is a publish, so it was left for the
human. Its dry run currently reports `topic` as the ONLY divergence on all 43
rows, so nobody else had pending row-cell work at the time of writing.

**Until it runs the page is correct and degrades cleanly** — verified in Chrome
against a build with all 43 chips emptied: the chips collapse
(`.bl-topic:empty`), `blog-filter.js` drops a topic no card carries so the
control offers only "All topics", search still narrows, and a stale `?topic=`
link shows all 43 rather than an empty grid. Nothing looks broken; the topic
filter is simply not there yet.

### Verified

Local build, headless Chrome, 43 assertions, all passing. The driver is a
dependency-free CDP client in the session scratchpad — this repo has no
`node_modules`, and `css-parity.mjs` drives Chrome the same way.

- 43 cards listed, count reads "43 articles"
- search narrows, and matches the EXCERPT as well as the title. The probe word
  is derived empirically — a word present in some excerpt and in NO title —
  rather than guessed. My first guess, "titanium", is simply not in this
  archive, so that version of the test was testing my guess, not the code.
- `ALL-ON-4` === `all on 4`; two terms are AND, not OR
- topic filter alone; every visible card really carries that topic
- search AND topic together, both params in the URL
- empty state: grid hidden outright, a real message and a real way back
- clear restores 43, resets the select, strips both URL params
- Escape clears the search box
- deep link `?topic=…&q=…` restores both controls and filters on load
- an unknown `?topic=` is ignored rather than desyncing the control
- `<input type="search">`, two real `<label for>`, `role="status"` +
  `aria-live="polite"` count, `role="search"` landmark, a real `<button>`
- mobile 390×844: single column, no horizontal overflow, input font 16px

Platform draft (`verify-posts-filter.mjs`, every count subtree-scoped): 9 class
rules, 6 attribute-selector ambients, 16 ambients that survive the tree-shake,
the chip is a token and precedes the title, card children read
`bl-rel-fig | bl-topic | h2 | p | bl-more`, 7 options + "All topics" in taxonomy
order, 43/43 draft rows correct.

### Gotchas earned

- **`htmlAttributes` are NOT token-interpolated.** `resolveDynamicProps`
  (`core/templates/dynamicBindings.ts`) iterates `Object.keys(target)` and skips
  anything that is not `typeof v === 'string'`; `htmlAttributes` is an object.
  So `data-topic="{currentEntry.topic}"` publishes that text LITERALLY on all 43
  cards. A per-row value has to ride a real string prop — `text`, `href`, `src`,
  `label`, `alt`. That is the entire reason the topic is a rendered `<span>`
  rather than a data attribute.
- **A SYSTEM table will take a custom field.** `posts` is `system: true`, but
  `assertSystemTableUpdateAllowed` (`core/data/systemTableGuard.ts`) freezes only
  the *built-in* fields and the table's identity. `PATCH /data/tables/posts` with
  the full `fields` array (built-ins byte-identical) adds one. Step-up gated;
  insta-api handles that. `gen-blog.mjs` used to say this collection was
  "builtIn-only with no tool to add one" — true of the UI, not of the platform,
  and corrected there now.
- **A `select` cell stores the option `id`**, not its `value` — `SelectCell.tsx`
  writes `opt.id`, and `SelectDisplay` resolves
  `o.id === value || o.value === value`. Setting `id` to the human label means
  the token renders human copy AND the panel still shows a clean labelled
  dropdown.
- **`loop-preview`'s default page is SIX.** `GET /data/tables/posts/loop-preview`
  returns 6 rows; `?limit=60` returns 43. Reading the default as "37 rows are
  missing" is a false alarm that cost me a round trip. It is otherwise the best
  tool here — it calls the same `fetchPublishedDataRowItems` the publisher does,
  so it answers "what would published HTML contain" without publishing.
- **Hide with the `hidden` ATTRIBUTE, not a state class.** `.bl-card[hidden]`,
  `.bl-grid[hidden]`, `.bl-empty[hidden]` — an attribute selector carries no
  class token, so `styleRuleTreeShake.ts` has nothing to purge and none of the
  `kind: 'ambient'` tightrope from the `is-swipe` session applies. (`.bl-card`
  sets `display:grid`, which outranks the UA sheet's `[hidden]`, so the
  `display:none` still has to be written out — same as `.ga-item[hidden]`.)
- **The reveal animation strands filtered cards, and the fix has to run BEFORE
  the flush.** `.wz-kit [data-rv]{opacity:0}` plus a per-card `gsap.from` means a
  card below the fold is invisible until its ScrollTrigger fires. `WZ.dom` runs
  at parse time; `js/20-pagekit.js` registers via `WZ.add` and is flushed later
  by `90-boot.js` — so anything the module sets is overwritten a moment later.
  Measured: a `?topic=…` deep link landed on a screen of blank cells. Removing
  `data-rv` from the cards before the flush is what works (pagekit never
  registers them and the CSS stops matching). For filtering AFTER load the
  tweens already exist, so `gsap.killTweensOf(el)` + `gsap.set(el,{opacity:1})`.
- **`1rem` is not 16px on this site.** The root font-size is fluid
  (`00-fluid-root.css`), so `font-size:1rem` on a form control computes to
  13.76px at a 390px viewport — and iOS Safari zooms the page in when you focus
  anything under 16px. Use `max(1rem,16px)`. **`.ct-form input` has the same
  `1rem` and the same defect**; that is the contact form's to fix, but do not
  copy it into anything new.
- **`base.button` emits `props.label` with NO `<span>` wrapper**, while `.btn`
  slides a `::after` panel over its own label and depends on
  `.btn>span{z-index:1}` to keep it legible. `.btn` is therefore the wrong class
  for any button built out of nodes. The clear control uses its own `.bl-clear`,
  styled like `.bl-more`.
- **`base.label` needs `targetMode: 'explicit'`.** The default `'auto'` emits
  `data-instatic-label-target="auto"` and leans on the form runtime, which this
  page does not load. `'explicit'` + `targetId` emits a real `<label for>`.
- **`id`, `role`, `aria-*` and `hidden` all survive `htmlAttributes`.** Only
  `class`, `style`, `srcdoc`, `on*` and `data-instatic-*` / `data-canvas-*` are
  dropped (`core/htmlAttributes/attributes.ts`). An empty string value is kept,
  so `hidden: ''` renders `hidden=""`.
- **`push-script-asset.mjs` ships EVERY agent's sections.** We share
  `04-design/.tmp/site-src`, and `build-site.mjs` concatenates every
  `sections/*.js` into one `site.js`. My push reported
  `identical — nothing to do`: another agent's push had already carried
  `blog-filter.js` onto the draft before I had finished testing it. Rebuild
  immediately before pushing, and grep the asset afterwards for every `SECTION:`
  marker you expect.
- **Give a shared stylesheet slice a boundary you OWN.** `push-posts-filter.mjs`
  first sliced `62-blog.css` from its own opening marker to the "A SINGLE POST"
  heading, and swallowed the two `.bl-rel-fig` rules pin #9 had appended below
  mine — it would have created another agent's registry rules, at ordering of its
  choosing, inside its own atomic write. There is an explicit
  `/* --- end of the pin #10 block --- */` marker now.
- **Anchor a node insert on markup, never on an index.** Pin #9 was adding a
  featured image as the card's first child at the same time. Splicing in front of
  whichever child renders as the `<h2>` made the two writes commute — the final
  card is `bl-rel-fig | bl-topic | h2 | p | bl-more`, and neither of us had to
  wait for the other.

### Known limitation, deliberately not fixed

The topic distribution is lopsided: **Implants 16, Aftercare 11, All-on-4 8,
Technology 3, Dentures 3, Cost 1, Veneers 1** — 7 of the 12 topics are in use.
`aftercare`'s pattern (`/care|clean|maintain|last|lifespan|complication|fail/`)
is greedy and sits above `cost`, so a title carrying both lands in aftercare;
and "Should Sedation Dentistry Be Used For Full Mouth…" matches `full[- ]mouth`
first and is chipped **All-on-4**, not Sedation. That is first-match-wins working
as written, and it is the same ordering that chose that article's photograph.

Tightening it would re-shuffle the images too, and **pin #11 was actively editing
`post-image-pool.mjs`** while this ran. Left alone on purpose. If it is worth
doing later: tighten `aftercare`, then re-run `pick-post-images.mjs` and
`push-posts-filter.mjs` together so the picture and the label cannot disagree.

The chip label is the taxonomy id with its first letter capitalised, so
`slugify(label) === id` and `?topic=implants` needs no lookup table in the
browser. `push-posts-filter.mjs` asserts that for all twelve and refuses to run
if it ever stops holding.

### Not done, on purpose

**No publish. No commit.** Everything is in the working tree, as instructed.
The cross-agent contract, including the row-publish warning aimed at pins #9 and
#11, is in
`05-design-revisions/.tmp/bugherd/briefs/NOTES-posts.md`.

---
