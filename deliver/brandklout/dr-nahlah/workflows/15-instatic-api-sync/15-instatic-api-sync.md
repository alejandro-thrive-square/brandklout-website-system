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
- **Credentials**: `INSTATIC_EMAIL` / `INSTATIC_PASSWORD` in the repo-root `.env`, optional `INSTATIC_BASE_URL`. Never in source.
- **Endpoints**: `GET /admin/api/cms/site` (shell + seq), `GET /pages`, `PUT /site-document` (atomic, `incremental` or `replace`, 409 on seq conflict), `POST /publish`, `GET /publish/status`.
- **Deployment**: Railway workspace/project `Brandklout` -> service `Dr Nahlah`, `ghcr.io/corebunch/instatic:latest`, volume `/app/storage`, DB `/app/storage/data/cms.db`.

## Gotchas

Every one of these shipped a regression before the parity gate caught it. None announced itself.

- **CSRF, not permissions.** Every state-changing request is checked against `PUBLIC_ORIGIN`. A missing or foreign `Origin` header returns 403 "invalid origin", which reads exactly like a capability problem. The client always sends the canonical origin.
- **Publishing needs step-up auth.** `POST /publish` answers `401 {"error":"step_up_required"}` until the password is re-entered, and the step-up **rotates the session token** — miss the new cookie and every later request 401s.
- **`@media(min-width:720px)` with no space converts to NOTHING, silently.** Browsers accept the space-less prelude; happy-dom does not, and `cssToStyleRules` returns zero rules and zero warnings for the whole block. 52 of this site's 64 media blocks are that form.
- **A surviving declaration is not an intact one: multi-layer `background` is flattened to its LAST layer.** happy-dom's `background` SHORTHAND parser handles one layer, so `background: radial(), linear(), linear()` returns the last gradient plus a row of `initial` longhands. That is `length > 0`, so the "did the parser drop it?" probe passes it and two layers vanish with no warning. The `background-image` LONGHAND parses layers correctly — which is why `.ct-form select`'s two-layer arrow survived the same run that gutted the hero. **The probe now also asserts no layers were lost** (`conv-encode.ts`): if the input has N top-level layers and no longhand the parser produced carries N, the declaration is encoded verbatim. Verified against real happy-dom on the container across `background`, `background-image`, `font-family`, `transition` and `box-shadow`, with no false positives.
- **happy-dom drops declarations whose values it cannot evaluate** — `padding: clamp(...)`, `margin-top: clamp(...)`, `width: min(...)`, `height: 100svh`. Instatic's substitution encoder covers only `var()`/`env()`. Widen it, and trigger it by **probing the real parser** (`length === 0` after `replaceSync`), not by listing function names: the list version still missed `100svh`.
- **A converter class rule's `name` is not its selector.** 144 of 286 carry a descendant selector with a binding name from the last class token (`.ch-difference .df-stat b` is named `df-stat`). **Match by selector, never by name** — matching by name put the number's display type on its container.
- **Never create new rules as `kind: 'class'`.** A class rule survives publish only if its id is in some `node.classIds`; a rule you just invented is referenced by nothing and is deleted on the next publish. Create ambient.

### Cascade order — three separate traps

Once the code asset is off, `rule.order` and condition order are the only tiebreakers, and none of them come out of the converter correctly.

- **Rank rules by their last BASE-context occurrence.** `cssToStyleRules` keeps the FIRST occurrence's order for a selector defined twice. `.ta-card h3` (runtime-states, then site.css) landed before `.pk h3` and the card headings went 21.6px -> 27.36px.
- **A redefinition inside `@media` must not move the base rule.** Ranking by "last seen anywhere" pushed `.vs-row > span` past `.vs-head-row > span` because of a breakpoint override, and the comparison table's header row lost its display type.
- **Custom conditions emit in `site.conditions` ARRAY order** — only viewport breakpoints get `classCss.ts`'s max-desc/min-asc sort, and per-rule `contextStyles` key order is ignored. `.bl-grid`'s 1080px block emitted before its 700px one and the blog grid fell from three columns to two, doubling the page height. Sort the array the way the platform sorts breakpoints, then **assert no rule needs the opposite order** (comparing only contexts that set an overlapping property, or the `:root` token blocks raise false alarms).

### The parity gate itself

- **`getComputedStyle(el)` cannot see `::before` / `::after`, and this design keeps its scrims there.** The gate reported **0 differences on 557,670 values** while two overlay gradients were flattened, because it never sampled a pseudo-element. It now walks `[null, '::before', '::after']` and skips pseudos whose `content` is `none` (recording them would add two empty bags per element and swamp the diff). Coverage went 557,670 -> 592,834 values. A parity gate is only as good as the surfaces it samples: **if a defect is invisible to the gate, a green gate is not evidence.**
- **`--window-size` is not the viewport.** Headless does not reliably derive one from the other; the first version of this gate ran at some unknown narrow width, so it reported 26 differences while the desktop layout had **1,290**. Pin it with `Emulation.setDeviceMetricsOverride` and assert `innerWidth` before capturing. Gate desktop and mobile as separate snapshots.
- **Verify against a fresh read, never the object you sent**, and against the served URL, never the registry read-back.
- **Publishing ships the whole draft**, including anyone else's in-progress work. No script here publishes; it is always a separate, announced step.
- **The volume fills silently.** At ~90% full, writes fail with no error. Check `railway metrics` or `df -h /app/storage` before any large operation.

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

## Output Artifacts
- `.tmp/parity-<label>.json` — computed-style snapshots (28 pages, ~557k values, deterministic across runs)
- `push-script-asset.mjs` — headless single-write replacement of one code asset's content
- `.tmp/shell.before.<seq>.json` / `.tmp/shell.after.<seq>.json` — shell state either side of a write
- `.tmp/conv-out.json` — converted rules, conditions and warnings
- `.tmp/site.css.published` / `.tmp/site.css.draft-before` — repair evidence
- `prune-versions.mjs` + `prune-versions.container.ts` — volume reclamation (see above)
- `repair-multilayer-backgrounds.mjs` — restores gradient layers the shorthand parser flattened
- `restore-review-wall.mjs` — rebuilds the home page's six review cards from the local build (dry run by default; never publishes)
- `.tmp/parity-pseudo-before-1440.json` / `.tmp/parity-pseudo-after-1440.json` — the 28-difference proof that only the two `::after` overlays moved

## Version Control
Follows the root-level rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md). Scripts and `.md` are committed; `.tmp/` snapshots are lightweight and may be committed when useful. `.tmp/.session` holds a live session cookie and must never be committed.
