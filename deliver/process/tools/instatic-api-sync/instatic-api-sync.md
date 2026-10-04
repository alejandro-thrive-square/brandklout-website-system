# Tool · Instatic API Sync

## Client-Facing Overview
Changes to the Instatic site are made through a scripted, verified pipeline instead of hand edits, and the site's styling is held where the visual editor can reach it, so routine design tweaks stop needing a developer.

> [!IMPORTANT]
> **Integrity Rule**: Any change to the scripts or technical logic of this tool must be documented here immediately.

## Operational Purpose

Two problems, one tool.

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

> [!NOTE]
> Sections below marked *(bk-dr-nahlah)* were written on that branch up to 2026-09-22 and brought
> here on 2026-09-27. Scripts they name without a path are client scripts in Dr. Nahlah's worktree,
> `deliver/brandklout/dr-nahlah/workflows/22-instatic-api-sync/`; read them there as worked
> examples. `render-draft-page.mjs` is shared at `../instatic-site/ops/`.

### Undo, in two halves *(bk-dr-nahlah)*

Take a snapshot BEFORE any scripted write (`backup.mjs <stamp>` in the client worktree, or
`../instatic-site/ops/backup-site.mjs`): the whole shell and every page.

```bash
node rollback-registry.mjs output/backups/<stamp>-site.json --apply   # CSS half (this folder)
node restore-pages.mjs     output/backups/<stamp>-pages.json --apply  # content half (Dr. Nahlah worktree)
```

The two are separate on purpose. `rollback-registry.mjs` restores `styleRules` + `conditions`
only; `restore-pages.mjs` restores page `nodes`, `rootNodeId`, `title` and `slug` only and passes
the shell through untouched. A bad CSS conversion and a bad page write are different accidents,
and restoring the registry because one page is wrong would discard every style edit made in the
browser since. What a page restore must do, all of it deliberate:

- pages **created since** the snapshot are reported and LEFT ALONE (`--delete-new` opts in);
  deleting a page someone added in the browser is not an undo, it is a second accident;
- pages in the snapshot that no longer exist are reported, never recreated;
- `baseSeqs` carries each page's CURRENT seq, so a 409 means someone edited that page while the
  restore ran. Re-read and re-run, never force;
- it targets pages by SLUG and writes the LIVE id, so a page deleted and recreated in the browser
  is restored into the id that exists now;
- it reads back and compares `nodes` byte-for-byte before reporting success;
- **it does not publish.**

Neither half can undo a PUBLISH. That is the platform's own version history (see the volume
section below, and `prune-versions.mjs`, which deletes it).

## Technical Setup

- **Executor status**: Working. `insta-api.mjs` (client), `repair-site-css.mjs`, `migrate-css-to-registry.mjs`, `css-parity.mjs`.
- **Credentials**: set the client's `[<client>]` section in `~/.webzite/.env` (`INSTATIC_EMAIL`,
  `INSTATIC_PASSWORD`, and `INSTATIC_BASE_URL`; `insta-api.mjs` still falls back to Dr. Nahlah's
  old host, so **always set it**), then run `node scripts/env-sync.mjs` in the worktree. A worktree
  `.env` is generated; hand edits are discarded on the next sync. See
  [SYSTEM_RULES.md §4.2.2](../../../../SYSTEM_RULES.md). Never in source.
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
- **Never create new rules as `kind: 'class'`.** A class rule survives publish only if its id is in some `node.classIds`; a rule you just invented is referenced by nothing and is deleted on the next publish. Create ambient.
- **After a domain cutover the toolkit can talk to the OLD host and say `403` about it** *(bk-dr-nahlah, 2026-08-29)*. A cached session cookie from another host comes back as `403` with an HTML body, not `401`, so the re-login retry never fires and you get `non-JSON body: <!DOCTYPE html>`. The per-host session file prevents the cross-host replay; the tell for anything similar is to `curl` the same endpoint with no cookie. A `401 {"error":"Unauthorized"}` means host and route are fine and the problem is on this side. Then run `../instatic-domain-origins/check-origins.mjs --all`, which needs no credentials and names the host to use.

### Cascade order — three separate traps

Once the code asset is off, `rule.order` and condition order are the only tiebreakers, and none of them come out of the converter correctly.

- **Rank rules by their last BASE-context occurrence.** `cssToStyleRules` keeps the FIRST occurrence's order for a selector defined twice. `.ta-card h3` (runtime-states, then site.css) landed before `.pk h3` and the card headings went 21.6px -> 27.36px.
- **A redefinition inside `@media` must not move the base rule.** Ranking by "last seen anywhere" pushed `.vs-row > span` past `.vs-head-row > span` because of a breakpoint override, and the comparison table's header row lost its display type.
- **Custom conditions emit in `site.conditions` ARRAY order** — only viewport breakpoints get `classCss.ts`'s max-desc/min-asc sort, and per-rule `contextStyles` key order is ignored. `.bl-grid`'s 1080px block emitted before its 700px one and the blog grid fell from three columns to two, doubling the page height. Sort the array the way the platform sorts breakpoints, then **assert no rule needs the opposite order** (comparing only contexts that set an overlapping property, or the `:root` token blocks raise false alarms).

### The Styles panel's breakpoint model is NOT Webflow's *(bk-dr-nahlah)*

Verified against the v0.0.16 source after a client could not make two embeds swap by breakpoint.
Every one of these is a place where a Webflow habit produces a different result here, silently.

- **Desktop IS base.** `getActiveStyleTab` (`cssControlTypes.ts`) returns `'base'` for the literal
  breakpoint id `'desktop'`, so anything set while the Desktop context is active is
  **unconditional CSS at every width**, not a `(max-width: 1440px)` rule despite that being
  Desktop's stored `mediaQuery`. A desktop-like viewport with any other id does NOT get this
  treatment and leaks down into tablet and mobile.
- **Clicking a node in the Layers tree does not change the editing context.** A click in a canvas
  frame calls `setActiveBreakpoint(frameId)`; `DomPanel/TreeNode.tsx` calls `selectNode` only.
  Select from Layers and the next style write lands wherever the context chip was last left,
  usually Desktop, i.e. base.
- **The panel merges base underneath the breakpoint tab** (`{ ...cls.styles,
  ...contextStyles[ctx] }`). On the Tablet tab a field shows the base value as if it were set
  there, so setting it again looks like a no-op even though it stores a real override.
- **The "N set" badge is the only honest readout.** It counts the active context ONLY. Value shown
  + no badge = inherited from base; value shown + `1 set` = stored here.
- **The × clears the property EVERYWHERE**, base and every context, in one history entry. To
  change a base value while keeping breakpoint overrides, **set the new value; never clear it.**
- **Two chips are not a combo class.** `.a` and `.b` on one node are two independent rules at
  0,1,0. The winner is `rule.order`, and `generateClassCSS` emits each rule's base block plus all
  its media blocks as one group, so a lower-order rule's `@media` override loses to a higher-order
  rule's **base** declaration. Webflow's `.a.b` (0,2,0) always wins; here it does not.
- **The default viewport widths are not Webflow's**, and `width` is not the published condition.
  Defaults are Mobile 375 / Tablet 768 / Desktop 1440, all `max-width`; an 820px iPad Air misses
  `(max-width: 768px)` entirely. `width` is only the canvas frame size; `mediaQuery` is what
  publishes, and the two are edited separately.

Before debugging a breakpoint that "doesn't work", dump the rule (`styles` vs `contextStyles`,
plus the site's breakpoints and conditions) rather than reading the panel. Base is almost always
the culprit.

### Pushing registry rules FROM the design package *(bk-dr-nahlah, `push-post-layout.mjs`)*

A push script that carries its own table of sixty rules is a second copy of the stylesheet, and a
second copy is how the two platforms forked the first time. Parse the rules out of the package's
own CSS file and upsert them by selector instead. Three things make that safe:

- **Parse it yourself.** happy-dom (and so Instatic's converter) drops `clamp()`, `min()` and
  `100svh` and flattens a multi-layer `background`. A twenty-line parser that splits on `;` and
  `:` at paren-depth 0 and keeps every value VERBATIM is strictly better for this job.
- **Upsert in place.** Same id, same `order`, same `kind`. A fresh rule for a selector that
  already has one lands later in the cascade and changes which declaration wins.
- **A selector can already exist TWICE**: an empty class-kind rule (the name a node references)
  AND an ambient rule that paints. Take the one with the highest `order`, the one the cascade
  lands on, for both the write and the verify.

Corollary of the tree shake: a class the CSS only uses in a COMPOUND selector (`.pg-hero.bl-ph`,
never bare `.bl-ph`) yields no class-kind rule, so a node has nothing to reference and emits no
class at all. Create an empty class rule to carry the name.

### `position: sticky` cannot work while ScrollSmoother is on *(bk-dr-nahlah)*

ScrollSmoother wraps the page in `#smooth-wrapper{position:fixed;overflow:hidden}` and translates
`#smooth-content`. A sticky element's scrolling ancestor is then a box that never scrolls, so it
never sticks (measured on `/sedation-dentistry`: 400px of scroll moved the "sticky" heading the
full 400px). Use `ScrollTrigger.create({pin: true, pinSpacing: false})`, and:

- GSAP wraps the pinned element in a `.pin-spacer`, which inside a grid becomes the grid item.
  Place it explicitly (`.bl-post > .pin-spacer{grid-column:1}`).
- Do not pin anything taller than the window; guard on `el.offsetHeight > innerHeight - top`.

The same root cause breaks **a floating element driven by JS** (cursor followers, tooltips):
`position: fixed` inside a transformed ancestor resolves against that ancestor, so the element
scrolls away with the page. Append it to `document.body`, outside `#smooth-wrapper`. Gate its CSS
on a class the JS adds only after the element exists (the `.wz-smooth` shape), not on the
capability (`.wz-fine`), or a GSAP load failure leaves a card with neither the follower nor its
own image.

### The parity gate itself

- **`getComputedStyle(el)` cannot see `::before` / `::after`, and this design keeps its scrims there.** The gate reported **0 differences on 557,670 values** while two overlay gradients were flattened, because it never sampled a pseudo-element. It now walks `[null, '::before', '::after']` and skips pseudos whose `content` is `none` (recording them would add two empty bags per element and swamp the diff). Coverage went 557,670 -> 592,834 values. A parity gate is only as good as the surfaces it samples: **if a defect is invisible to the gate, a green gate is not evidence.**
- **`--window-size` is not the viewport.** Headless does not reliably derive one from the other; the first version of this gate ran at some unknown narrow width, so it reported 26 differences while the desktop layout had **1,290**. Pin it with `Emulation.setDeviceMetricsOverride` and assert `innerWidth` before capturing. Gate desktop and mobile as separate snapshots.
- **Verify against a fresh read, never the object you sent**, and against the served URL, never the registry read-back.
- **Publishing ships the whole draft**, including anyone else's in-progress work. No script here publishes; it is always a separate, announced step.
- **The volume fills silently.** At ~90% full, writes fail with no error. Check `railway metrics` or `df -h /app/storage` before any large operation.

## Looking at the draft without publishing *(bk-dr-nahlah, `../instatic-site/ops/render-draft-page.mjs`)*

No instance serves a draft; every host serves the published bake. `POST
/admin/api/cms/runtime/preview` is the editor's own preview builder, and two properties make it
usable headlessly: it is gated on the **read floor**, not on `pages.edit`, and it takes the
**whole site document in the request body**, so you hand it the draft you just read and get back
the finished document, the compiled runtime bundles and a diagnostics array.

`GET /pages` answers `{rows}` in the data-row shape and the endpoint validates `Page` records, so
the rows are reshaped and `template` is rebuilt from `templateEnabled`/`templateTarget`/
`templatePriority`, or `validatePages` rejects a templated page. The output is the **real
publisher's render**, so it shows registry and cascade-order bugs a local design package cannot.
Serve it with a static server that proxies what is not on disk to `INSTATIC_BASE_URL`, so
`/uploads/*` resolves. Runtime head scripts still rewrite `<head>`, so read head tags from the DOM
after scripts run.

**It does NOT expand shared components.** The preview is handed an empty `visualComponents` list
and drops every `base.visual-component-ref`. On 2026-09-18 that made Dr. Nahlah's two office
panels look deleted; a "restore" then published them TWICE. Count `base.visual-component-ref`
nodes in the row before concluding a block is missing.

## Headless page import: HTML -> node tree over REST *(bk-dr-nahlah, `ads-to-nodes.py` + `push-ads-pages.mjs`)*

The platform's HTML importer (`site_insert_html`, `site_replace_node_html`) runs only inside the
Site editor through the MCP bridge. `PUT /site-document` takes whole page documents, so the only
missing piece is the conversion; on 2026-09-18 Dr. Nahlah's eighteen ads landing pages went in
that way, headlessly, on staging and production (the Scenario 3 build uses the same pair). The
node shapes, read back from pages the platform's importer had produced:

- `div|section|nav|header|footer|main|article|ul` are `base.container` with `tag`; every other
  element is `tag:'custom'` + `customTag`;
- `p|h2|h3|h4|span|em|strong` holding only text are `base.text` with that tag, bare text runs are
  `base.text` `tag:'none'`; `h1`, `li`, `dt`, `dd`, `summary`, `figcaption`, `blockquote`,
  `address`, `b`, `i` are containers with text children;
- `<a>` is `base.link` (`text` when it holds only text, children otherwise); `<img>` is
  `base.image` with `alt` in `htmlAttributes` (emitted FIRST, ahead of the module's own `alt=""`;
  browsers keep the first); a YouTube `<iframe>` is `base.video`; `<input>` is `base.input`;
  `style=""` is `inlineStyles` in camelCase;
- `div.wz-embed[data-wz-embed=auto]` becomes the `brandklout.embed-origins.embed` module with the
  inner markup as its `snippet`;
- class names travel as `classNames[]` and are resolved to `classIds` against the live registry
  by the pusher, which creates an EMPTY class-kind rule for any name that has none.

Learned on the way, each at the cost of a publish:

- **A nested slug (`ads-landing-pages/<name>`) is served nested after a site-document write, but
  `PATCH /data/rows/:id` re-derives the routable slug and flattens the slash**: the row still
  reads `a/b` and the page serves at `/a-b`. The site-document write has to be the LAST write a
  nested page gets.
- **A page-scoped code asset is the right home for a page-family stylesheet**: a `files[]` entry
  of `type:'style'` plus `runtime.styles[fileId] = { enabled, scope: { type: 'pages', pageIds },
  priority }`. It is served after the registry, ships `clamp()` and `svh` verbatim, and never
  reaches the other pages.
- **Check `publish/status` before publishing and look at what `draftMatchesPublished:false` is
  hiding.** A publish ships all of it.

## Draft and published can diverge, and a publish bakes the difference

`POST /admin/api/cms/publish` republishes **every** page, not the one you edited. So the moment a draft page drifts from what is live, the next publish for any unrelated reason ships that drift.

It happened on 2026-08-22. Publishing to verify a plugin baked all 35 pages, and the home page lost the six `.rv-card` review-fallback cards — they were in the published HTML, they were not in the draft. Three records agreed the published page really had them: `13-content-export-import/output/home-readback.html` (2026-08-19, a readback of the platform page), `output/.instatic2/index.json` (2026-08-20), and the committed `08-qa/output/audit-out/index.json` (`words: 1741`, against `1385` after). `restore-review-wall.mjs` rebuilt them from the local build and the audit is byte-identical to its baseline again.

**So: before publishing this site for any reason, and again afterwards**

```bash
node ../instatic-site/ops/backup-site.mjs     # snapshot before, and again after; diff the two
```

Check `draftMatchesPublished` (`GET /admin/api/cms/publish/status`) first: a drifted draft ships with whatever you publish.

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
node push-script-asset.mjs src/scripts/site.js scenario-0-new-site/03-design-build/output/code/site-src/dist/assets/site.js
node push-script-asset.mjs src/scripts/site.js scenario-0-new-site/03-design-build/output/code/site-src/dist/assets/site.js --apply
node insta-api.mjs publish
```

Code assets are just `files[]` entries in the site shell with their `content`
inline, and `PUT /site-document` is atomic with an optimistic `seq` check, so the
whole file goes in **one** write and a concurrent edit is rejected rather than
interleaved.

Prefer this over Dr. Nahlah's old `13-content-export-import/output/push-site-js.mjs` (bk-dr-nahlah), which drives the
MCP bridge (needs the editor open in a browser) and writes in ~10 KB chunks. That
chunked path is what silently truncated the draft `site.css` once, losing its
opening 13.7 KB.

The banner and the `/*__wz_end__*/` sentinel are carried over from whatever is
already on the asset rather than assumed — the sentinel is how a truncated write is
detected later, so a push that dropped it would disarm that check. The script reads
the asset back after writing and refuses to report success unless it is byte-exact,
because **this platform reports some write failures as prose with a 200**.

It recognises every end sentinel a chunked push has used (`/*__wz_end__*/` and `seo-head.js`'s
`/*__wz_seo_end__*/`, since bk-dr-nahlah); the single-sentinel version dropped the second one and
disarmed the truncation check on the file most likely to be truncated.

## SEO metadata: where it actually lives *(bk-dr-nahlah, v0.0.16 source)*

The Pages table has `SEO title` and `SEO description` columns (built-in, visible in the Data tab,
editable in the Content panel). **The platform itself never publishes them.** `<title>` is
emitted in one place, `buildDocumentMetaTags` (`core/publisher/render.ts`), and
`readSeoTitleCell` / `readSeoDescriptionCell` are called only by the authoring UI. For templated
entries `publicRenderer.ts` sets the title from `row.cells.title`. What the publisher resolves:

```
pageTitle = escapeHtml(settings.metaTitle ?? page.title ?? site.name)
metaDesc  = settings.metaDescription        // site-wide, no page equivalent
```

No canonical, no `og:*`, no `twitter:*`, no `robots`. The `brandklout.open-graph` plugin is what
publishes the `seoDescription` cell per page, plus canonical and og tags; see
[its README](../instatic-plugins/open-graph/README.md). Consequences:

- **A set `settings.metaTitle` makes every page's `<title>` identical.** Dr. Nahlah shipped that
  way for months: 37 pages, one title. Clearing it drops resolution to `page.title`, the row title
  the CMS list already shows. **Clearing `metaTitle` is the single highest-value SEO change on this
  platform.** Set each row title to the real SEO title.
- **Row titles are stored as PLAIN TEXT and escaped on the way out.** A row holding a literal
  `&amp;` publishes as `&amp;amp;` and renders as the visible text `&amp;`. Six Dr. Nahlah rows
  were contaminated that way, invisible until `metaTitle` was cleared.
- **Fill the SEO cells anyway** (people look there, and open-graph reads them), but never report
  filling them as a change to the platform's `<title>`. A page write through `PUT /site-document`
  drops them; re-apply with `../instatic-site/ops/restore-page-seo-cells.mjs`.
- **A runtime head script is invisible to Bing and every social unfurler.** Dr. Nahlah's
  `seo-head.js` wrote descriptions and og tags from JS; Google renders it, Facebook, LinkedIn,
  Slack and X do not. The static `<title>` and any JS-assigned one must agree, or the tab
  re-titles itself on load.

## Asset SEO is alt text, and only alt text *(bk-dr-nahlah)*

`MediaAsset` carries `altText`, `caption`, `title` and `tags`; **only `altText` reaches published
HTML**, and `base.image` reads it exclusively from the library asset
(`props._resolvedMediaByKey?.src?.altText`), never from a per-instance prop. So:

1. One `PATCH /admin/api/cms/media/:id` changes every `<img>` that renders that asset, site-wide.
2. **Alt is per ASSET, not per page.** A design package that authored alt per instance disagrees
   with itself (Dr. Nahlah: 38 images with two to twelve different alt strings). Collapse each to
   one value that is true wherever the image appears, and write the calls down.
3. **An `<img>` whose `src` is not a library asset can never have alt** (YouTube thumbnails on
   `img.youtube.com`), until the file is uploaded to the library.
4. **Look at the image before trusting authored alt.** Three of Dr. Nahlah's package descriptions
   named the wrong room or the wrong instrument.

`../instatic-site/push/set-alt.mjs` is the shared writer; write only to referenced assets, never
overwrite an existing value, read back after writing.

## Performance: three things this platform gets wrong by default *(bk-dr-nahlah)*

Found only when someone ran PageSpeed. Check them on every Instatic site; the standing gate is
`../instatic-site/gates/perf-budget.mjs` against the PUBLISHED URLs.

1. **`placement: head` means "block the parser".** `scriptTagsForRuntimeAssets` emits a classic
   script as a bare `<script src>`, never `defer` or `async`. The per-script `timing` field
   (`immediate` / `dom-ready` / `idle`) is stored and **never read at publish**. The only levers
   are `placement` (`head` | `body-end`) and `format` (`module` gets deferred semantics). Dr.
   Nahlah had ~71 KB gzip of blocking JS in `<head>`. Before moving a script, check who reads its
   global and when (a `type="module"` consumer runs after a body-end classic script, by spec), and
   whether CSS hides anything pending JS (deferring the reveal makes LCP worse).
2. **Every image is lazy, including the LCP.** `base.image` resolves `loading` to `lazy` unless
   the prop is `eager`, and `fetchpriority` to `auto` unless `high`. A migrated site sets neither,
   so the hero and header logo ship lazy. In document order image[0] is usually the header logo
   and image[1] the hero; set those eager, the hero `fetchPriority: high`, and check the pages
   where that order differs. Eager images get `sizes="100vw"` with no knob to do better.
3. **A snippet embed ignores its own `lazy` and `height` props.** With `source: 'snippet'` the
   pasted markup ships verbatim, blocking vendor scripts included. Add `defer` in the snippet
   itself; the script then runs with the DOM complete, which is also safer.

**Not fixable inside Instatic:** `<link rel="preconnect">` (no `link` kind in plugin frontend
assets) and edge-caching HTML. Both belong at Cloudflare: a Transform Rule adding a `Link: <…>;
rel=preconnect` response header, and a Cache Rule that is purged on publish.

## The 404 page is a TEMPLATE TARGET, not a page *(bk-dr-nahlah, `push-404-page.mjs`)*

A public 404 is served from whichever page carries `template.target = { kind: 'notFound' }` (the
`Not found (404)` option in Template settings, since 0.0.4). With no such page the dispatcher
answers a bare 21-byte `{"error":"Not found"}`, which both Dr. Nahlah hosts served until
2026-08-31. The publish bakes the template to a `404.html` artefact and `renderNotFoundResponse`
serves it with status 404 for any GET no route claimed; a direct GET of `/404` returns the same
body with status 200, as on a static host. `../instatic-site/ops/apply-template-flags.mjs` and
`gates/template-guard.mjs` handle template flags.

- **The template page is never baked at its own slug**, so slug `404` cannot collide with the
  artefact and is not a public route.
- **A runtime head script keyed on `location.pathname` cannot title it** (on a 404 the path is
  the missed URL). The published `<title>` is `page.title`; set the row title to the real title.
- **`site` is REQUIRED in the `PUT /site-document` body** even when the shell is unchanged.
  Omitting it is a bare `400 Invalid request body` that reads like a page payload bug.
- **The Open Graph plugin still runs on the 404**, emitting `og:url` and (where `emitCanonical`
  is on) a canonical to `/404`. The 404 responses are harmless; the 200 copy at `/404` is closed
  with a path-scoped `X-Robots-Tag: noindex` Transform Rule, the one case where noindex may pair
  with a canonical, because the canonical is self-referencing.
- **Class ids and upload ids are per site, and a wrong one fails SILENTLY**: the node publishes
  with a class that resolves to nothing and the page renders unstyled. Assert every id resolves
  on the host being written before building.
- **Instatic has no sitemap route.** A production `/sitemap.xml` comes from Cloudflare; a staging
  host without that rule falls through to the 404 page.

## Output Artifacts
- `output/parity-<label>.json` — computed-style snapshots (28 pages, ~557k values, deterministic across runs)
- `push-script-asset.mjs` — headless single-write replacement of one code asset's content
- `output/shell.before.<seq>.json` / `output/shell.after.<seq>.json` — shell state either side of a write
- `output/conv-out.json` — converted rules, conditions and warnings
- `output/site.css.published` / `output/site.css.draft-before` — repair evidence
- `prune-versions.mjs` + `prune-versions.container.ts` — volume reclamation (see above)
- `repair-multilayer-backgrounds.mjs` — restores gradient layers the shorthand parser flattened
- Dr. Nahlah's client scripts behind the sections above (`restore-review-wall.mjs`, `restore-pages.mjs`, `push-post-layout.mjs`, `ads-to-nodes.py`, `push-ads-pages.mjs`, `push-page-seo.mjs`, `push-page-seo-cells.mjs`, `push-asset-alt-text.mjs`, `perf-unblock-head.mjs`, `perf-image-priority.mjs`, `perf-review-embed.mjs`, `push-404-page.mjs`) stay in `deliver/brandklout/dr-nahlah/workflows/22-instatic-api-sync/` on `bk-dr-nahlah`; they carry that site's ids and are worked examples, not shared tools
- `output/parity-pseudo-before-1440.json` / `output/parity-pseudo-after-1440.json` — the 28-difference proof that only the two `::after` overlays moved

## Version Control
Follows the root-level rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md). Scripts and `.md` are committed. **`output/` is not** — this is shared tooling run against every
Instatic client from whichever worktree is active, so a tracked artifact here is one client's
output on a path every other client also writes to. `output/.gitignore` ignores the whole folder.
The cached session (`output/.session-<host>`) holds a live cookie and must never be committed.
