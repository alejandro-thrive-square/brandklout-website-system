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

- **CSRF, not permissions.** Every state-changing request is checked against `PUBLIC_ORIGIN`. A missing or foreign `Origin` header returns 403 "invalid origin", which reads exactly like a capability problem. The client always sends the canonical origin.
- **`@media(min-width:720px)` with no space converts to NOTHING, silently.** Browsers accept the space-less prelude; happy-dom's CSS parser does not, and `cssToStyleRules` returns zero rules and zero warnings for the whole block. 52 of this site's 64 media blocks are that form. Preludes are normalised before conversion — never remove that step.
- **Condition ids are the prelude text verbatim.** `media:(max-width: 679px)` and `media:(max-width:679px)` are two different conditions. Normalise spacing to match the site's existing `site.conditions` or you mint whitespace-only duplicates.
- **`:root` and `html` have 52 duplicate copies each** in the registry, left over from the per-page import. Merging must target the highest-`order` copy — the one winning the cascade today. Collapsing the duplicates is a separate job.
- **Publishing ships the whole draft**, including anyone else's in-progress work. No script here publishes; it is always a separate, announced step.
- **The volume fills silently.** At ~90% full, writes fail with no error (`railway metrics`, or `df -h /app/storage`). Check before any large operation. Instatic never prunes published versions.
- **Verify against a fresh read, never the object you sent.** Every write path here re-reads and compares.

## Output Artifacts
- `.tmp/parity-<label>.json` — computed-style snapshots (28 pages, ~557k values, deterministic across runs)
- `.tmp/shell.before.<seq>.json` / `.tmp/shell.after.<seq>.json` — shell state either side of a write
- `.tmp/conv-out.json` — converted rules, conditions and warnings
- `.tmp/site.css.published` / `.tmp/site.css.draft-before` — repair evidence

## Version Control
Follows the root-level rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md). Scripts and `.md` are committed; `.tmp/` snapshots are lightweight and may be committed when useful. `.tmp/.session` holds a live session cookie and must never be committed.
