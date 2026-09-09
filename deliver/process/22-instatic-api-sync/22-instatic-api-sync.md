# Workflow: 15 - Instatic API Sync

## Client-Facing Overview
Changes to the Instatic site are made through a scripted, verified pipeline instead of hand edits, and the site's styling is held where the visual editor can reach it, so routine design tweaks stop needing a developer.

> [!IMPORTANT]
> **Integrity Rule**: Any change to the scripts or technical logic of this workflow must be documented here immediately.

## Operational Purpose

Two problems, one workflow.

**1. Every `site_*` MCP tool needs a human with the Site editor open in a browser.** 29 of the connector's 52 tools declare it, the bridge drops without warning, and a pull cannot run unattended. That is a bridge limitation, not a platform one: underneath sits a plain cookie-authenticated REST API that needs no browser at all.

**2. The site's CSS lives where the editor cannot edit it.** The design was pushed as two code-asset stylesheets. Instatic serves those as `userStyles.css`, which loads last and wins every tie, while the Styles panel reads only the `site.styleRules` registry. The result is a site that looks right and cannot be edited: empty class chips, no hover states to select, and panel edits silently overridden.

## The two CSS layers

| Layer | Stored on | Served as | Editable in the Styles panel |
|---|---|---|---|
| Style registry | `site.styleRules` | `style-<hash>.css` | Yes — chips, pills, controls |
| Code assets | `site.files` where `type: 'style'` | `userStyles-<hash>.css` | No — raw text in the Code tab only |

Cascade order is `reset -> framework -> style -> userStyles` (`src/core/publisher/siteCssBundle.ts`), so a code asset beats the registry at equal specificity. Within `userStyles`, files are ordered by `priority` then path.

State editing is fully supported once a rule is in the registry: `cssStatePseudo.ts` recognises `:hover`, `:focus`, `:active`, `:checked` and 14 more, the picker surfaces them as inactive-pseudo pills, and `ClassStyleInjector` force-paints the state so it can be styled without triggering it.

## The publish-time tree shake, precisely

`src/core/publisher/styleRuleTreeShake.ts` drops registry rules at publish. It is narrower than the "publish purges unused CSS" folklore:

- a **class rule** survives iff its id appears in some `node.classIds`;
- an **ambient rule** survives iff no class token in its selector is a *known class-kind rule name that is unused*;
- `knownClassNames` contains **only class-kind rule names**. A class that is not registered as a class-kind rule is invisible to the shake.

So `.drawer.open` was purged because `open` existed as an unassigned class-kind rule — not because the class is added at runtime. **Demoting an unassigned class rule to `kind: 'ambient'` makes it and every selector mentioning it survive.** That is what `--cutover` does, and it is why the whole design system can live in the registry without needing the code-asset escape hatch.

## Execution Steps

### A. Repair the draft (do this first)
```bash
node repair-site-css.mjs            # dry run
node repair-site-css.mjs --apply
```
The draft copy of `src/styles/site.css` is truncated — a chunked push lost its opening ~13.7 KB, leaving the file starting on a dangling `cubic-bezier(.22,1,.36,1)}`. The live site is unaffected only because nobody has published since. Restores from the live published bundle and verifies by re-reading. Refuses to run if the draft does not show the truncation signature.

### B. Convert the stylesheets to registry rules
The converter is Instatic's own `cssToStyleRules`, run headlessly on the Railway container (which carries the full TS source, bun, and happy-dom). Using the platform's own converter keeps the classification, breakpoint folding and condition ids exactly as the editor expects. See `convert-css.md`.

### C. Merge, then cut over
```bash
node migrate-css-to-registry.mjs --merge   --apply   # code assets still enabled: zero visual change
# publish, then: node css-parity.mjs snapshot mid && node css-parity.mjs diff before mid
node migrate-css-to-registry.mjs --cutover --apply   # disables the two code assets
# publish, then: node css-parity.mjs snapshot after && node css-parity.mjs diff before after
```
Each stage is reversible by re-enabling the code assets; their content is never deleted.

### D. Gate
```bash
node css-parity.mjs snapshot before
node css-parity.mjs diff before after      # must report 0
```

## Technical Setup

- **Executor status**: Working. `insta-api.mjs` (client), `repair-site-css.mjs`, `migrate-css-to-registry.mjs`, `css-parity.mjs`.

### Undo, in two halves

Take a snapshot BEFORE any scripted write. `.tmp/backup.mjs <stamp>` writes
`.tmp/backups/<stamp>-{site,pages}.json` — the whole shell and every page.

```bash
node .tmp/backup.mjs pre-<whatever>                    # before
node rollback-registry.mjs .tmp/backups/<stamp>-site.json --apply    # CSS half
node restore-pages.mjs     .tmp/backups/<stamp>-pages.json --apply   # content half
```

The two are separate on purpose. `rollback-registry.mjs` restores `styleRules` +
`conditions` only; `restore-pages.mjs` restores page `nodes`, `rootNodeId`,
`title` and `slug` only and passes the shell through untouched. A bad CSS
conversion and a bad page write are different accidents, and restoring the
registry because one page is wrong would discard every style edit made in the
browser since.

`restore-pages.mjs` notes, all of which are deliberate:

- pages **created since** the snapshot are reported and LEFT ALONE. Deleting a
  page someone added in the browser is not an undo, it is a second accident.
  `--delete-new` opts in;
- pages in the snapshot that no longer exist are reported, never recreated;
- `baseSeqs` carries each page's CURRENT seq, so a 409 means someone edited that
  page while the restore ran. Re-read and re-run — never force;
- it targets pages by SLUG and writes the LIVE id, so a page deleted and
  recreated in the browser is restored into the id that exists now;
- it reads back and compares `nodes` byte-for-byte before reporting success;
- **it does not publish.** The live site keeps serving the last publish until
  someone runs `node insta-api.mjs publish`.

Neither script can undo a PUBLISH. That is the platform's own version history —
see the volume section below, and `prune-versions.mjs`, which deletes it.
- **Credentials**: set the client's `[<client>]` section in `~/.webzite/.env` (`INSTATIC_EMAIL`, `INSTATIC_PASSWORD`, and `INSTATIC_BASE_URL` — this module is shared, so
  the host is never guessed correctly by default), then run `node scripts/env-sync.mjs` in the
  worktree. A worktree `.env` is a generated artifact; hand-edits are discarded on the next
  sync. See [SYSTEM_RULES.md 4.2.2](../../../SYSTEM_RULES.md). Never in source.
- **Endpoints**: `GET /admin/api/cms/site` (shell + seq), `GET /pages`, `PUT /site-document` (atomic, `incremental` or `replace`, 409 on seq conflict), `POST /publish`, `GET /publish/status`.
- **Deployment**: Railway workspace/project `Brandklout` -> service `Dr Nahlah`, `ghcr.io/corebunch/instatic:latest`, volume `/app/storage`, DB `/app/storage/data/cms.db`.

## Also proven on a second client

`insta-api.mjs` and this workflow's reasoning were reused on 2026-08-31 to put a seven-page site
into a **fresh** Instatic instance for Stone Surgical Arts — see
`21-instatic-upload` (on the `bk-stone` branch, at
`deliver/brandklout/stone-surgical-arts/workflows/21-instatic-upload/`; it was `05-instatic-upload`
until the 2026-09-04 renumber and is itself due for promotion into `deliver/process/`).
Four things learned there belong here, because they are properties of the platform and not of that
client:

1. **Custom properties do not survive `cssToStyleRules`.** happy-dom does not enumerate `--*`
   declarations, so every `:root { --token: … }` block converts to an EMPTY rule with no warning,
   while the `var()` usages that consume them survive intact. On a token-driven design that is not
   a missing colour, it is the whole layout. Ship token primitives as a **code asset** (`type:
   'style'`, served as `userStyles-*.css`, never parsed) and keep everything built on them in the
   registry. This is the one legitimate use of the code-asset layer this workflow otherwise exists
   to eliminate.
2. **`PATCH /admin/api/cms/data/rows/:id` replaces `cells` wholesale.** `body.cells ?? currentRow.cells`,
   then the slug is re-derived from whatever it was handed. A partial patch silently deletes every
   cell it omits — title, slug and page body included — and answers 200. Always read, merge, write
   the whole object, then read back.
3. **The tree-shake demotion this workflow documents is not optional on a JS-driven site.** Any
   class added at runtime purges itself AND every ambient rule mentioning it. Demoting every
   class-kind rule that no node references to `kind: 'ambient'` is the general form of `--cutover`
   and can be computed from the page trees without a hard-coded list.
4. **AVIF cannot be uploaded to the media library.** The magic-byte sniffer matches ISO-BMFF `ftyp`
   without reading the brand, so AVIF stores as `video/mp4` with null dimensions and no variants.
   Convert to WebP first. Worth reporting upstream.

Two bugs in this folder's own client were fixed at the same time: `BASE` was evaluated **before**
`loadEnv()` ran, so `INSTATIC_BASE_URL` in `.env` never took effect (harmless while the only
instance was the hard-coded default, fatal on the second one); and the cached session was a single
file shared across hosts, replaying one client's cookie at another.

## Gotchas

Every one of these shipped a regression before the parity gate caught it. None announced itself.

- **CSRF, not permissions.** Every state-changing request is checked against `PUBLIC_ORIGIN`. A missing or foreign `Origin` header returns 403 "invalid origin", which reads exactly like a capability problem. The client always sends the canonical origin.
- **Publishing needs step-up auth.** `POST /publish` answers `401 {"error":"step_up_required"}` until the password is re-entered, and the step-up **rotates the session token** — miss the new cookie and every later request 401s.
- **`@media(min-width:720px)` with no space converts to NOTHING, silently.** Browsers accept the space-less prelude; happy-dom does not, and `cssToStyleRules` returns zero rules and zero warnings for the whole block. 52 of this site's 64 media blocks are that form.
- **A surviving declaration is not an intact one: multi-layer `background` is flattened to its LAST layer.** happy-dom's `background` SHORTHAND parser handles one layer, so `background: radial(), linear(), linear()` returns the last gradient plus a row of `initial` longhands. That is `length > 0`, so the "did the parser drop it?" probe passes it and two layers vanish with no warning. The `background-image` LONGHAND parses layers correctly — which is why `.ct-form select`'s two-layer arrow survived the same run that gutted the hero. **The probe now also asserts no layers were lost** (`conv-encode.ts`): if the input has N top-level layers and no longhand the parser produced carries N, the declaration is encoded verbatim. Verified against real happy-dom on the container across `background`, `background-image`, `font-family`, `transition` and `box-shadow`, with no false positives.
- **happy-dom drops declarations whose values it cannot evaluate** — `padding: clamp(...)`, `margin-top: clamp(...)`, `width: min(...)`, `height: 100svh`. Instatic's substitution encoder covers only `var()`/`env()`. Widen it, and trigger it by **probing the real parser** (`length === 0` after `replaceSync`), not by listing function names: the list version still missed `100svh`.
- **A converter class rule's `name` is not its selector.** 144 of 286 carry a descendant selector with a binding name from the last class token (`.ch-difference .df-stat b` is named `df-stat`). **Match by selector, never by name** — matching by name put the number's display type on its container.
- **The toolkit talks to the WRONG HOST after a domain cutover, and says `403` about it.** Two
  separate traps, found together on 2026-08-29 when the client's domain had moved to
  `www.drnahlah.com` and every script still reached `encorercm.com`:
  1. **`BASE` used to be evaluated ABOVE `loadEnv()`** in `insta-api.mjs`, so the repo-root `.env`
     could set `INSTATIC_EMAIL` and `INSTATIC_PASSWORD` but **not** `INSTATIC_BASE_URL` — that one
     had already been frozen to the hard-coded default. Setting it in `.env` looked like it worked
     and changed nothing. Fixed: `loadEnv()` now runs first, and the default tracks the canonical
     `adminUrl` in `deliver/process/20-instatic-domain-origins/sites.json`.
  2. **A cached session cookie from the OLD host comes back as `403` with an HTML body, not `401`.**
     `request()` only re-logs-in on a `401`, so the transparent retry never fires and you get
     `non-JSON body: <!DOCTYPE html>` from an endpoint that answers a clean `401` to plain `curl`.
     **Delete `.tmp/.session` after any domain change.**

  The tell that separates these from a real credentials problem: `curl` the same endpoint with no
  cookie. A `401 {"error":"Unauthorized"}` means the host and the route are fine and the problem is
  on this side. Then run `node ../../../../process/20-instatic-domain-origins/check-origins.mjs --all`
  — it needs no credentials and names the host to use.
- **Never create new rules as `kind: 'class'`.** A class rule survives publish only if its id is in some `node.classIds`; a rule you just invented is referenced by nothing and is deleted on the next publish. Create ambient.

### Cascade order — three separate traps

Once the code asset is off, `rule.order` and condition order are the only tiebreakers, and none of them come out of the converter correctly.

- **Rank rules by their last BASE-context occurrence.** `cssToStyleRules` keeps the FIRST occurrence's order for a selector defined twice. `.ta-card h3` (runtime-states, then site.css) landed before `.pk h3` and the card headings went 21.6px -> 27.36px.
- **A redefinition inside `@media` must not move the base rule.** Ranking by "last seen anywhere" pushed `.vs-row > span` past `.vs-head-row > span` because of a breakpoint override, and the comparison table's header row lost its display type.
- **Custom conditions emit in `site.conditions` ARRAY order** — only viewport breakpoints get `classCss.ts`'s max-desc/min-asc sort, and per-rule `contextStyles` key order is ignored. `.bl-grid`'s 1080px block emitted before its 700px one and the blog grid fell from three columns to two, doubling the page height. Sort the array the way the platform sorts breakpoints, then **assert no rule needs the opposite order** (comparing only contexts that set an overlapping property, or the `:root` token blocks raise false alarms).

### The Styles panel's breakpoint model is NOT Webflow's

Verified against the v0.0.16 source after a client could not make two embeds
swap by breakpoint. Every one of these is a place where a Webflow habit
produces a different result here, silently.

- **Desktop IS base.** `getActiveStyleTab` (`cssControlTypes.ts:539`) returns
  `'base'` for the literal breakpoint id `'desktop'`, so anything set while the
  Desktop context is active is **unconditional CSS at every width** — not a
  `(max-width: 1440px)` rule, despite that being Desktop's stored `mediaQuery`.
  Zero rules on this site use a `desktop` context key; everything "desktop" is
  base. A non-`'desktop'` id for a desktop-like viewport would NOT get this
  treatment and would leak down into tablet and mobile.
- **Clicking a node in the Layers tree does not change the editing context.**
  `CanvasRoot.onNodeClick` calls `setActiveBreakpoint(frameId)` when you click
  *in a canvas frame*; `DomPanel/TreeNode.tsx` calls `selectNode` only. Select
  from Layers and your next style write lands wherever the context chip was
  last left — usually Desktop, i.e. base.
- **The panel merges base underneath the breakpoint tab.** `StyleRuleComposer`
  builds `currentStyles = { ...cls.styles, ...contextStyles[ctx] }` and the
  controls read *that*. On the Tablet tab a field shows the base value as if it
  were set there, so setting it again looks like a no-op even though it does
  store a real override.
- **The "N set" badge is the only honest readout.** It comes from
  `storedStyles` — the active context ONLY (`StyleSectionsEditor.tsx:153`).
  Value shown + no badge = inherited from base. Value shown + `1 set` = stored
  here. There is no Webflow-style tint on the field itself.
- **The × clears the property EVERYWHERE.** `handleClearProperty` routes to
  `removeClassStyleProperty`, which strips the key from base **and every
  context** in one history entry (deliberate — otherwise an inherited base
  value bleeds back and leaves a switcher segment stuck pressed). To change a
  base value while keeping breakpoint overrides, **set the new value; never
  clear it.**
- **Two chips are not a combo class.** `.a` and `.b` on one node are two
  independent rules at specificity 0,1,0. The winner is `rule.order`, and
  `generateClassCSS` emits each rule's base block *plus all its media blocks*
  as one group before the next rule starts — so a lower-order rule's `@media`
  override loses to a higher-order rule's **base** declaration. Webflow's
  `.a.b` (0,2,0) always wins; here it does not.
- **The default viewport widths are not Webflow's**, and `width` is not the
  published condition. Defaults are Mobile 375 / Tablet 768 / Desktop 1440, all
  `max-width`; Webflow's tablet is <= 991. An 820px iPad Air misses
  `(max-width: 768px)` entirely. `width` is only the canvas frame size —
  `mediaQuery` is what publishes, and the two are edited separately (pencil
  next to the breakpoint in the context switcher). Changing the query without
  the width is legitimate and is what this site now does for Tablet.

Before debugging a breakpoint that "doesn't work", dump the rule rather than
reading the panel: `.tmp/vimeo-inspect.mjs` prints `styles` vs `contextStyles`
per rule, plus the site's breakpoints and conditions. Base is almost always the
culprit.

### Pushing registry rules FROM the design package  `push-post-layout.mjs`

A push script that carries its own table of sixty rules is a second copy of the
stylesheet, and a second copy is how the two platforms forked the first time.
`push-post-layout.mjs` PARSES the rules out of `04-design/.tmp/site-src/css/
62-blog.css` instead and upserts them by selector. Three things make that safe,
and all three were learned by getting them wrong:

- **Parse it yourself.** happy-dom (and therefore Instatic's own converter) drops
  `clamp()`, `min()` and `100svh` outright and flattens a multi-layer
  `background` to its last layer. A twenty-line parser that splits on `;` and
  `:` at paren-depth 0 and keeps every value VERBATIM is not a downgrade from
  the platform converter — for this job it is strictly better.
- **Upsert in place.** Same id, same `order`, same `kind`. Creating a fresh rule
  for a selector that already has one puts a duplicate later in the cascade and
  changes which declaration wins.
- **A selector can already exist TWICE.** `.bl-rel-grid` is an empty class-kind
  rule (the name a node references) AND an ambient rule that paints. "First
  match by selector" wrote one and verified the other. Take the one with the
  highest `order` — the one the cascade actually lands on — for both.

And the corollary of the tree-shake rules above: a class the CSS only ever uses
in a COMPOUND selector (`bl-ph` appears as `.pg-hero.bl-ph`, never bare) yields
no class-kind rule, so a node has nothing to reference and emits no class at
all. Create an empty class rule to carry the name.

### `position: sticky` cannot work while ScrollSmoother is on

ScrollSmoother wraps the page in `#smooth-wrapper{position:fixed;overflow:hidden}`
and translates `#smooth-content`. A sticky element's nearest scrolling ancestor
is then a box that never scrolls, so it never sticks — measured on
`/sedation-dentistry`, where 400px of scroll moved the "sticky"
`.pk-lede .lc-head` by the full 400px. That rule has been inert on the live site
for as long as the smoother has been on.

Use `ScrollTrigger.create({pin: true, pinSpacing: false})`. Two consequences:

- GSAP wraps the pinned element in a `.pin-spacer`, and inside a grid THAT
  becomes the grid item. Place it explicitly (`.bl-post > .pin-spacer{grid-column:1}`)
  rather than trusting auto-placement to pick the cell the element vacated.
- Do not pin anything taller than the window; it holds its own foot off screen
  for the length of the pin. Guard on `el.offsetHeight > innerHeight - top`.

### The parity gate itself

- **`getComputedStyle(el)` cannot see `::before` / `::after`, and this design keeps its scrims there.** The gate reported **0 differences on 557,670 values** while two overlay gradients were flattened, because it never sampled a pseudo-element. It now walks `[null, '::before', '::after']` and skips pseudos whose `content` is `none` (recording them would add two empty bags per element and swamp the diff). Coverage went 557,670 -> 592,834 values. A parity gate is only as good as the surfaces it samples: **if a defect is invisible to the gate, a green gate is not evidence.**
- **`--window-size` is not the viewport.** Headless does not reliably derive one from the other; the first version of this gate ran at some unknown narrow width, so it reported 26 differences while the desktop layout had **1,290**. Pin it with `Emulation.setDeviceMetricsOverride` and assert `innerWidth` before capturing. Gate desktop and mobile as separate snapshots.
- **Verify against a fresh read, never the object you sent**, and against the served URL, never the registry read-back.
- **Publishing ships the whole draft**, including anyone else's in-progress work. No script here publishes; it is always a separate, announced step.
- **The volume fills silently.** At ~90% full, writes fail with no error. Check `railway metrics` or `df -h /app/storage` before any large operation.

## There IS a way to look at the draft without publishing  `render-draft-page.mjs`

For a long time the only two options were "read the node tree back and imagine it" or "publish and see" — and publishing ships every other in-flight change on the draft, which is the one thing this workflow is always trying not to do. Neither `encorercm.com` nor `drnahlah.com` serves a draft; both serve the published bake.

`POST /admin/api/cms/runtime/preview` is the editor's own preview-iframe builder (`server/handlers/cms/runtime.ts`). Two properties make it usable headlessly:

- It is gated on the **read floor**, not on `pages.edit` — "anyone who can open the site editor can preview the draft they posted".
- It takes the **whole site document in the request body** rather than loading the persisted one, because the editor needs previews to reflect unsaved edits. So you hand it the draft you just read and it hands back the finished document, the compiled runtime bundles and a diagnostics array.

```bash
node render-draft-page.mjs index .tmp/draft-render     # writes HTML + runtime assets
node .tmp/probe-services-hover.mjs .tmp/draft-render index.html
```

`GET /pages` answers `{rows}` in the **data-row** shape and the endpoint validates **`Page`** records, so the rows have to be reshaped — and `template` rebuilt from `templateEnabled`/`templateTarget`/`templatePriority`, or `validatePages` rejects a templated page. `render-draft-page.mjs` does that.

Two things about the output: it is the **real publisher's render**, so it reflects the style registry and its cascade order — a class of bug the local design package under `04-design/.tmp/final-site` cannot show you, because the package has a hand-written stylesheet and no conditions array. And `seo-head.js` still rewrites the `<head>` at runtime, exactly as live, so read head tags from the DOM after scripts run.

Serve the output with any static server that proxies what is not on disk to `INSTATIC_BASE_URL`, so `/uploads/*` resolves; `.tmp/probe-services-hover.mjs` has that server in nine lines and takes the directory as its first argument.

### A floating element driven by JS must live OUTSIDE `#smooth-wrapper`

ScrollSmoother translates `#smooth-content`, and a transformed ancestor makes `position: fixed` resolve against **that element** instead of the viewport. Anything cursor-following, tooltip-ish or otherwise pinned to the window has to be appended to `document.body`, beside the nav and the drawer, or it scrolls away with the page and drifts further the further down you are. Same root cause as [`position: sticky` being inert](#position-sticky-cannot-work-while-scrollsmoother-is-on); different symptom.

The matching CSS gate should be a **class the JS adds only after the element actually exists** — the `.wz-smooth` shape from `js/90-boot.js`. Gating the fallback on the capability (`.wz-fine`) instead lets the two disagree: GSAP failing to load means the queued section never runs, and a card can end up with neither the follower nor its own laid-out image. `.wz-svfollow` in `push-services-images.mjs` is the worked example.

## Draft and published can diverge, and a publish bakes the difference

`POST /admin/api/cms/publish` republishes **every** page, not the one you edited. So the moment a draft page drifts from what is live, the next publish for any unrelated reason ships that drift.

It happened on 2026-08-22. Publishing to verify a plugin baked all 35 pages, and the home page lost the six `.rv-card` review-fallback cards — they were in the published HTML, they were not in the draft. Three records agreed the published page really had them: `13-content-export-import/.tmp/home-readback.html` (2026-08-19, a readback of the platform page), `.tmp/.instatic2/index.json` (2026-08-20), and the committed `08-qa/.tmp/audit-out/index.json` (`words: 1741`, against `1385` after). `restore-review-wall.mjs` rebuilt them from the local build and the audit is byte-identical to its baseline again.

**So: before publishing this site for any reason, and again afterwards**

```bash
node ../08-qa/.tmp/audit-site.mjs --base https://encorercm.com --only index
git diff ../08-qa/.tmp/audit-out/          # the committed records are the baseline
```

A whole-site run is ~20 minutes; a single page is under a minute and catches this class of thing on the page most likely to hold hand-built markup.

**Class names are NOT in a page.** Nodes carry `classIds` and the names live in `shell.styleRules`, so grepping a page's JSON for `rv-card` finds nothing whether the cards are there or not — resolve ids through the shell first. And `changedPages` takes FLAT `Page` objects (`id`, `slug`, `title`, `nodes`, `rootNodeId` at the top level), never the `cells`-shaped rows `GET /admin/api/cms/pages` returns.

## The Railway volume, and pruning it

Instatic self-hosts on Railway (project `Brandklout`, service `Dr Nahlah`, volume
`/app/storage`, 879 MB). It writes a full `site_snapshots` row **and a complete copy of
every runtime asset** on every publish, and **never garbage-collects them**. There is no
retention setting anywhere in the image.

**A publish costs ~15 MB across the site.** That is the number to plan around: roughly 40
publishes fills the volume from empty, and a heavy debugging session does 20 in an
afternoon. Near full, writes fail **silently** - no 5xx, no error in `railway logs` - so
the symptom is never "disk full", it is "my asset did not save" or "the big payload did
not land".

    node prune-versions.mjs                  # report volume + what a prune would free
    node prune-versions.mjs --keep 3         # dry run
    node prune-versions.mjs --keep 3 --apply # delete, compact, swap, restart

`--apply` is destructive and restarts the service. Page **content is never touched** -
every row keeps its active version, and the script aborts before swapping if any
published row would lose it. What is lost is the ability to roll back to an older
publish from the platform UI.

### Four traps, all of them found the hard way on 2026-08-21

1. **`VACUUM` cannot run in place on a nearly-full volume.** It writes the rebuilt pages
   through the WAL, which sits *beside* the database on that same volume, so it dies with
   `SQLITE_FULL` after inflating the WAL by ~50 MB. `SQLITE_TMPDIR` does not help - it
   governs temp *tables*, not the WAL. Use `VACUUM INTO` a path on the container overlay
   (`/tmp`, 1.8 TB free) and swap the file in.
2. **`rm cms.db` frees nothing while the server is running.** The process holds the inode
   open, so the blocks are not returned until it exits. Deleting the old database to make
   room for the new one therefore *fails*, and leaves you with a partially written
   database and no original. **Copy to a new name first**, verify it, and only then
   `rm` + `mv` + restart. The restart is what actually reclaims the disk.
3. **`/tmp` is the container overlay, and a restart wipes it.** Anything staged there -
   including a backup - is gone the moment you redeploy. Get a valid database onto the
   *volume* before restarting anything.
4. **Delete in batches with `PRAGMA wal_checkpoint(TRUNCATE)` between them.** One large
   `DELETE` grows the WAL faster than it frees pages, filling the disk while emptying it.

Related: `published_runtime_assets.public_path` is **version-scoped**
(`/_instatic/assets/<versionId>/...`), so deleting an old version can never orphan an
asset a current page references. Verify it anyway - compare active-version asset counts
either side of the prune.

## Repairing flattened multi-layer backgrounds

```bash
node repair-multilayer-backgrounds.mjs           # report
node repair-multilayer-backgrounds.mjs --apply   # write the draft
```

Reads the **local build** as the source of truth, finds every multi-layer
`background`/`background-image` in it, and repairs any registry rule carrying
fewer layers. It is re-runnable and reports `nothing to do` when clean, so it
doubles as a check. It writes the draft only; publish is a separate step.

Two rules on this site were hit, both `::after` overlays:

| rule | was | now |
|---|---|---|
| `.pg-hero .ph-bg::after` | 1 layer | 3 layers |
| `.ch-proof .pf-film::after` | 1 layer | 2 layers |

The hero one was the visible defect. The lost `linear-gradient(100deg,...)` is
the horizontal cream scrim that puts a floor under the copy column, so on all
27 interior pages the H1 was sitting on bare photograph.

## Pushing a code asset (`site.js` and friends)

```bash
node push-script-asset.mjs src/scripts/site.js ../04-design/.tmp/final-site/assets/site.js
node push-script-asset.mjs src/scripts/site.js ../04-design/.tmp/final-site/assets/site.js --apply
node insta-api.mjs publish
```

Code assets are just `files[]` entries in the site shell with their `content`
inline, and `PUT /site-document` is atomic with an optimistic `seq` check, so the
whole file goes in **one** write and a concurrent edit is rejected rather than
interleaved.

Prefer this over `13-content-export-import/.tmp/push-site-js.mjs`, which drives the
MCP bridge (needs the editor open in a browser) and writes in ~10 KB chunks. That
chunked path is what silently truncated the draft `site.css` once, losing its
opening 13.7 KB.

The banner and the `/*__wz_end__*/` sentinel are carried over from whatever is
already on the asset rather than assumed — the sentinel is how a truncated write is
detected later, so a push that dropped it would disarm that check. The script reads
the asset back after writing and refuses to report success unless it is byte-exact,
because **this platform reports some write failures as prose with a 200**.

## SEO metadata: where it actually lives

The Pages table **does** have `SEO title` and `SEO description` fields — `builtIn`
columns on the system `pages` table, visible in the Data tab, editable in the Content
panel, bindable as loop values through `dataRows.ts`. **On 0.0.16 they are inert at
publish time.** Nothing under `server/publish/` or `src/core/publisher/` reads them:

- `<title>` is emitted in exactly ONE place, `core/publisher/render.ts:461`, from
  `buildDocumentMetaTags`.
- `readSeoTitleCell` / `readSeoDescriptionCell` have exactly two callers, both under
  `src/admin/pages/content/` — the authoring UI.
- For templated data-row entries, `publicRenderer.ts:182` sets the document title from
  `row.cells.title`, again not `seoTitle`.

**This is the single most misleading thing about SEO on this platform**: the fields
that look like the answer are decorative, and the field that actually drives `<title>`
is the plain `Title` column beside them. Verify against `render.ts` before believing
any SEO field does what its label says. Fill them anyway (`push-page-seo-cells.mjs`) —
they are where a person looks, and an empty column reads as broken — but never report
filling them as a change to published output.

What the publisher actually resolves, from two site-wide settings plus the page row:

```
pageTitle = escapeHtml(settings.metaTitle ?? page.title ?? site.name)
metaDesc  = settings.metaDescription        // site-wide, no page equivalent
favicon   = settings.faviconUrl
```

There is no canonical, no `og:*`, no `twitter:*`, no `robots` anywhere in the
publisher. Consequences worth internalising before touching SEO on an Instatic site:

- **A set `settings.metaTitle` makes every page's `<title>` identical.** That is how
  this site shipped for months: 37 pages, one title. Clearing it drops resolution to
  `page.title`, which is the row title the CMS list already shows — 37 unique static
  titles for the cost of deleting one field. **Clearing `metaTitle` is the single
  highest-value SEO change available on this platform.**
- **Row titles are stored as PLAIN TEXT and escaped on the way out.** A row holding a
  literal `&amp;` publishes as `&amp;amp;` and renders as the visible text `&amp;`.
  Six rows here were contaminated that way. Anything that writes a page title —
  `site_add_page`, an import, a hand edit — can introduce it, and it is invisible
  until `metaTitle` is cleared and the row starts reaching `<title>`.
- **Descriptions cannot be per-page in published HTML.** One site-wide slot, full stop
  — the `SEO description` cell does not change that.
  Per-page descriptions, canonical, `og:*` and `twitter:*` on this site come from
  `src/scripts/seo-head.js`, a head-placement runtime script generated from
  `04-design/.tmp/site-src/seo.json`. Google renders it; **Bing and every social
  unfurler — Facebook, LinkedIn, Slack, X — do not.** Treat anything only that script
  emits as invisible to those crawlers.
- **The static title and the JS title must agree**, or the tab visibly re-titles
  itself on load. `.tmp/check-title-agreement.mjs` asserts all 37 match.

`push-page-seo.mjs` does the page half: aligns every row title to `seo.json`, refuses
to run if `seo.json` itself carries HTML entities, then clears `metaTitle` — shell and
pages in ONE atomic `PUT`.

## Asset SEO is alt text, and only alt text

`MediaAsset` carries `altText`, `caption`, `title` and `tags`. **Only `altText`
reaches published HTML.** `caption`, `title` and `tags` are admin-library metadata
with no render path — filling them is organisation, not SEO. Do not sell it as SEO.

`base.image`'s `render()` is explicit about where alt comes from:

```js
const media = props._resolvedMediaByKey?.src
const alt = escapeHtml(media?.altText?.trim() ?? '')
```

**Exclusively the library asset, never a per-instance module prop.** Two things follow:

1. One `PATCH /admin/api/cms/media/:id` changes every `<img>` on every page that
   renders that asset. It is the cheapest possible fix for a site-wide alt gap.
2. **Alt is per-ASSET, so it cannot be page-specific.** A design package that authored
   alt per instance will disagree with itself — here 38 images carried two to twelve
   different alt strings across pages. Each collision has to collapse to one value
   that is true wherever the image appears. Write the calls down; do not let a
   frequency heuristic pick silently. `.tmp/alt-overrides.json` is that record.
3. **An `<img>` whose `src` is not a library asset can never have alt.** The 13
   YouTube thumbnails on `/video-library` and `/patient-stories` point at
   `img.youtube.com` and are structurally stuck at `alt=""` until the thumbnails are
   uploaded to the library.

**Do not trust authored alt text without looking at the image.** Checking the design
package against the actual files found `office-hero` described as a reception when it
is a building lounge, `office-wide` as a treatment floor when it is one overhead
light, and `tech-hero` as a cone-beam scan when it is the lab bench under a stereo
microscope — the same photograph as `lab.jpg`.

`push-asset-alt-text.mjs` writes alt only to assets the site actually **references**
(page trees + shell), never overwrites an existing value, and reads every row back
after writing.

## Performance: the three things this platform gets wrong by default

All three shipped silently for weeks and were only found when someone ran
PageSpeed. Check them on every Instatic site.

### 1. `placement: head` means "block the parser"

`scriptTagsForRuntimeAssets` (`core/site-runtime/assetManifest.ts`) emits a classic
script as a BARE `<script src>` — **no `defer`, no `async`, ever**. The per-script
`timing` field (`immediate` / `dom-ready` / `idle`) is stored on every script and is
**never read at publish time**; grep the publisher for it and there are no hits. The
only levers that exist are `placement` (`head` | `body-end`) and `format` (`classic` |
`module`, where module gets deferred semantics for free).

This site had **246,151 raw bytes / ~71 KB gzip** of blocking JS in `<head>` — GSAP
(153 KB), `seo-head.js` (48 KB) and a per-page JSON-LD file. `perf-unblock-head.mjs`
moves every enabled script to `body-end`.

**Two things to verify before moving a script anywhere, both of which make this
unsafe if you get them wrong:**

- **Who reads the global, and when.** `gsap-head-i.js`'s own header insists it must
  stay head + blocking because per-page inline scripts latch
  `window.gsap && window.ScrollTrigger` during parse. **That comment is stale** — those
  inline scripts were retired and emptied on 2026-08-19. The only remaining consumer
  is `src/scripts/site.js`, which ships as the `type="module"` entry and is therefore
  deferred. A body-end classic script executes DURING parsing, a module only AFTER it,
  so ordering holds by spec. Re-derive this; do not assume it.
- **Whether anything is hidden pending JS.** If CSS hides content that JS reveals,
  deferring the reveal makes LCP *worse*. Here `[data-anim="hide"]` appears zero times
  in the published HTML and `.wz-kit [data-rv] { opacity: 0 }` never matches, because
  nothing carries `.wz-kit`. Both rules are dead. Grep for them before trusting it.

### 2. Every image is lazy, including the LCP

`base.image` resolves `loading` to `lazy` unless the node's prop is `eager`, and
resolves `fetchpriority` to `auto` unless the prop is `high`. A migrated site sets
neither, so **the hero and the header logo ship `loading="lazy"`** and Lighthouse
flags "LCP image was lazily loaded".

Walking a page tree in document order gives a stable shape: **image[0] is the header
logo, image[1] is the hero** — matching, file for file, the images the reference
package leaves eager. `perf-image-priority.mjs` sets image[0] eager and image[1]
eager + `fetchPriority: high`, with three exclusions (`contact` and `post`, where
image[1] is the footer logo; `index`, whose LCP is a `<video>` poster that cannot take
`fetchpriority`).

**The `sizes` trade-off is real and has no knob.** `resolveSizes()` emits
`auto, 100vw` for lazy images but plain `100vw` for eager ones, and the publisher's
auto-sizes pre-pass produces nothing here (`_resolvedAutoSizes` is undefined). For a
full-bleed hero that selects the same variant either way. For the logo it means
w1024 (29,128 B) rather than the w320 (14,362 B) `sizes=auto` picks — about +15 KB,
once, on a year-immutable asset. There is **no user-facing `sizes` prop** to do better.

### 3. A snippet embed ignores its own `lazy` and `height` props

With `source: 'snippet'` the embed-origins module returns the pasted markup verbatim,
so the vendor's tags ship exactly as pasted — and vendors paste blocking scripts.
All three embeds here loaded a third-party script with neither `defer` nor `async`.
`perf-review-embed.mjs` rewrites the snippet itself, which is the only place the fix
can live. Deferring a vendor script is also strictly *safer*: it then runs with the
DOM complete, so the element it looks for is guaranteed to exist.

### What cannot be fixed from inside Instatic

**`<link rel="preconnect">`.** The publisher emits only favicon, stylesheets and
scripts, and plugin frontend assets support kinds `script` / `script-inline` /
`style` / `style-inline` — **there is no `link` kind**. Injecting preconnect from an
inline head script would need `'unsafe-inline'` in the CSP and would fire too late to
help. The right place is the CDN: this site is behind Cloudflare, so a Transform Rule
adding a `Link: <https://…>; rel=preconnect` response header does it properly.
The same applies to edge-caching HTML (`cf-cache-status` is `DYNAMIC`) — a Cache Rule
would fix it, but needs a purge on publish or it serves stale pages.

## The 404 page is a TEMPLATE TARGET, not a page  `push-404-page.mjs`

**Instatic ships this; nothing needs patching.** A public 404 is served from
whichever page carries `template.target = { kind: 'notFound' }` — the target has
existed since 0.0.4 (`Not found (404)` in the Template settings dialog,
`src/core/page-tree/pageTemplate.ts`). With no such page the dispatcher falls
through to a bare `{"error":"Not found"}` JSON body, 21 bytes, which is what
**both** `www.drnahlah.com` and `staging.drnahlah.com` served until 2026-08-31.

The serving path is three layers deep and worth knowing, because only the first
one runs in practice:

1. `publishSite.ts` bakes the notFound template — wrapped in its `everywhere`
   chain, of which this site has none — to the `404.html` artefact, deliberately
   the static-hosting convention so a published slot stays a valid static export.
2. `renderNotFoundResponse` (`publish/publicRouter.ts`) reads that artefact for
   any GET no route claimed and serves it with **status 404**. One disk read, no
   DB — this is the path bot probes and crawler noise hit.
3. If the bake failed, it live-renders through the LRU under a reserved `/404`
   key so a burst of misses renders once. Returns `null` — and the bare JSON —
   only when no notFound template exists at all.

A direct GET of `/404` returns the same body with status **200**, exactly how a
static host treats `404.html`. That is not a bug.

### Things that are easy to get wrong here

- **The template page is never baked at its own slug.** `publishSite` skips
  every `isTemplatePage(page)`, so slug `404` cannot collide with the `404.html`
  artefact, and the page is not a public route. `404` is a legal, unreserved
  slug (`RESERVED_PUBLIC_SLUGS` is only admin/api/assets/health).
- **`seo-head.js` cannot title this page.** It keys off `location.pathname`,
  which on a 404 is the *missed* URL, and returns early on a miss. The published
  `<title>` is therefore `page.title` and nothing else — see the SEO section
  above. Set the row title to the real title, not "404".
- **`site` is REQUIRED in the `PUT /site-document` body** even when the shell is
  unchanged (`SiteDocumentBodySchema`, `additionalProperties: false`). Omitting
  it is a bare `400 Invalid request body` that reads like a payload bug in the
  page you are writing. Ship the shell you just read; the handler writes it only
  if the content actually differs.
- **The Open Graph plugin still runs on the 404.** It emits `og:url` and — where
  `emitCanonical` is on, which is production but not staging — a
  `<link rel="canonical" href="https://www.drnahlah.com/404">` on **every** 404
  response. The 404 responses themselves are harmless (status 404; Google drops
  them). The exposure is the 200 copy at `/404`. It is in no sitemap and linked
  from nowhere, so the risk is low; a hostname-and-path-scoped `X-Robots-Tag:
  noindex` Transform Rule closes it. Note this is the ONE case where noindex may
  be paired with a canonical — the canonical is self-referencing, so the noindex
  can only ever apply to `/404` itself.
- **Class ids and upload ids are per-site, and a wrong one fails SILENTLY** — the
  node publishes with a class that resolves to no rule, so the page renders
  completely unstyled rather than erroring. `assertClasses()` and the hero-image
  HEAD check refuse to build unless every id resolves on the host being written.
  Staging and production agreed (12/12, image 200) but they are only a
  clone-snapshot apart; nothing keeps them in step.
- **`publish` bakes the whole draft.** Check `GET /admin/api/cms/publish/status`
  for `draftMatchesPublished: true` before publishing a live site, or you ship
  whatever else was sitting unreviewed in the draft alongside your change.
- **Instatic has no sitemap route.** Production's `/sitemap.xml` is served by
  Cloudflare, so the notFound template neither breaks it nor leaks `/404` into
  it. Staging has no such rule, so that path now falls through to the 404 page.

### The script

`push-404-page.mjs` clones the `about` page — the only hero that already carries
a `.ph-actions` CTA row — keeps `header#nav`, `#drawer`, `#smooth-wrapper` and
`footer` byte for byte, strips every other `main` section, and rebuilds the hero
from the site's own class ids (`.pg-hero`, `.ph-lead`, `.ph-actions`,
`.btn .btn-primary .magnetic`, `.ph-meta`). Nothing is added to the style
registry. Node ids are remapped to fresh ones. It refuses to run without an
explicit `INSTATIC_BASE_URL`, deletes the host-blind `.tmp/.session` cookie
first, and re-asserts the whole template map after the save before it will
publish.

```bash
INSTATIC_BASE_URL=https://staging.drnahlah.com node push-404-page.mjs
INSTATIC_BASE_URL=https://staging.drnahlah.com node push-404-page.mjs --apply
INSTATIC_BASE_URL=https://staging.drnahlah.com node push-404-page.mjs --apply --publish
```

Verified on staging 2026-08-31: a missed URL returns `404` with 14,792 bytes of
real page, `/404` returns the same body at `200`, `<title>` is the page's own,
all three stylesheets and the GSAP + site bundle load, and Cloudflare's
`X-Robots-Tag: noindex, nofollow` still fires. Templates after the save:
`404, post` — `post` intact.

Shipped to production the same day after client review on staging: `404` with
15,681 bytes, `{"publishedPages":38}` at seq 125, templates `404, post`. Regression
pass after the publish — seven pages `200`, `sitemap.xml` still `200` with 79
`<loc>` entries, `/posts` still listing all 43 articles with four spot-checked
entries `200`.

There is no `[data-rv]{opacity:0}` rule in any of the three stylesheets — the
reveal animation is driven entirely by GSAP, so a JS failure leaves the 404
content visible rather than blank. Worth knowing: this is the page most likely to
be hit by a crawler that runs no JS.

## Output Artifacts
- `.tmp/parity-<label>.json` — computed-style snapshots (28 pages, ~557k values, deterministic across runs)
- `push-404-page.mjs` — creates the `notFound` template page (see above); dry run by default, `--apply`, `--apply --publish`
- `.tmp/page-404.json` — the exact `changedPages` entry that was written, for diffing a rebuild
- `push-script-asset.mjs` — headless single-write replacement of one code asset's content
- `render-draft-page.mjs` — renders any DRAFT page to real HTML through the platform's own preview builder, without publishing (see above)
- `.tmp/probe-services-hover.mjs` — CDP harness that drives a served directory at a fine pointer and three coarse ones; real `Input.dispatchMouseEvent`, not synthetic events
- `.tmp/shot-services.mjs` — the same harness, for screenshots
- `.tmp/shell.before.<seq>.json` / `.tmp/shell.after.<seq>.json` — shell state either side of a write
- `.tmp/conv-out.json` — converted rules, conditions and warnings
- `.tmp/site.css.published` / `.tmp/site.css.draft-before` — repair evidence
- `prune-versions.mjs` + `prune-versions.container.ts` — volume reclamation (see above)
- `repair-multilayer-backgrounds.mjs` — restores gradient layers the shorthand parser flattened
- `restore-review-wall.mjs` — rebuilds the home page's six review cards from the local build (dry run by default; never publishes)
- `.tmp/parity-pseudo-before-1440.json` / `.tmp/parity-pseudo-after-1440.json` — the 28-difference proof that only the two `::after` overlays moved

- `push-page-seo.mjs` — aligns all 37 page row titles to `seo.json` and clears the site-wide `metaTitle`, in one atomic save. **This is the one that changes published `<title>`.**
- `push-page-seo-cells.mjs` — fills the Pages table's `seoTitle` / `seoDescription` cells (inert at publish; see above). `PATCH /data/rows/:id` REPLACES `cells` wholesale, so it re-reads each row and spreads the current cells underneath, then asserts the `body` page tree survived byte-for-byte
- `push-asset-alt-text.mjs` — writes alt text to every referenced media asset that lacks it (dry run by default)
- `push-services-images.mjs` — BugHerd #8: one library image per home-page service card, plus the registry rules for the cursor-following presentation on a fine pointer. Writes altText for any of the eleven that had none, because `base.image` can read alt from nowhere else
- `.tmp/alt-overrides.json` — the hand-authored alt for each per-asset collision, and each place the design package was wrong about its own image
- `.tmp/simulate-head.mjs` — reproduces `buildDocumentMetaTags` against the draft, so the `<title>` a page WILL publish is readable without publishing
- `.tmp/check-title-agreement.mjs` — asserts the static `<title>` and the one `seo-head.js` assigns are identical on all 37 pages
- `.tmp/audit-img-alt.mjs` — how many `base.image` nodes will render real alt, and which srcs make alt unreachable

- `perf-unblock-head.mjs` — moves every enabled script out of `<head>` (246 KB off the blocking path); read its header before running it anywhere else
- `perf-image-priority.mjs` — eager + `fetchPriority: high` on the LCP image per page, and strips the duplicated `alt` out of `htmlAttributes`
- `perf-review-embed.mjs` — defers the vendor scripts inside snippet embeds, lazies the home-page reviews widget
- `perf-youtube-thumb-alt.mjs` — alt text for the 13 `img.youtube.com` thumbnails, which have no library row and so cannot get it from the media library
- `../08-qa/perf-budget.mjs` — the standing gate; run it against the PUBLISHED URLs after every publish

## Version Control
Follows the root-level rules in [SYSTEM_RULES.md](../../../SYSTEM_RULES.md). Scripts and `.md` are committed. **`.tmp/` is not** — this is shared tooling run against every
Instatic client from whichever worktree is active, so a tracked artifact here is one client's
output on a path every other client also writes to. `.tmp/.gitignore` ignores the whole folder.
The cached session (`.tmp/.session-<host>`) holds a live cookie and must never be committed.
