# 2026-10-08/09 · Staging stood up, then the Client-First migration on it (phase 1 names + editability, phase 2 tokens + combos)

Fleet brief `output/fleet/BRIEF-west-la-full.md` (main checkout), coordinator on main. **Production was never
written to in Part 2.** Everything below is on `https://west-la-implants-staging.up.railway.app`.

## 1. Staging clone (new; the site had none)

| Step | What |
| :-- | :-- |
| Railway | environment `staging` (`900c770b-8abd-4e6d-9cd9-374fc92c1bcf`) duplicated from production in project `a55b5cac-b92d-4653-a9ff-6da522a5c89c`, service `f54653f7-fc7a-41db-8eea-6bfb6bf386c5`; it minted `west-la-implants-staging.up.railway.app` (id `65571d80-7919-45bb-b9d8-6d1eb527466f`); `PUBLIC_ORIGIN` upserted to that host (skipDeploys) before `volumeCreate` `/app/storage` (`9f76d2f3-e380-4e4a-82a8-4cdcb139afae`); one deploy, SUCCESS |
| No custom domain | westlaimplants.com is on GoDaddy DNS (not our Cloudflare): the Railway host is the only door; no `staging.<domain>`, no edge header rule |
| Setup | claimed at once with the production login (same owner) |
| Seed | `clone-site.mjs --strategy replace` (document 10.37 MB, 87 rows); media rows by `chunk-media.py 70` → 2 chunks → `import-media-chunks.mjs` (455 rows); media bytes by `pull-media.js` in the staging container (3,702 files, 120.8 MB incl. srcset variants); `clone-plugins.mjs` (embed-origins 1.8.0 + settings, the only plugin production runs); `publish-rows.mjs` (no collection rows) |
| Staging-only edits before the first publish | `src/scripts/site.js`: host-conditional guard (marker `WZ_STAGING_NOINDEX`) that writes `<meta name=robots content="noindex, nofollow">`, drops the canonical and moves `og:url` to the staging origin (the head is written at runtime from `data-seo`; production has no Open Graph plugin). embed-origins `siteScripts`: the two GHL number-pool lines (`#pages=ads-landing-pages/*`) removed, so review traffic burns no numbers |
| Registered | `INSTATIC_STAGING_URL` in the master env `[west-la-implants]`; `--site west-la-implants:staging` resolves (no `sites.json` entry: that file is process on main) |
| Proof | `diff-sites.mjs`: 87/87 content-equivalent, 0 differences (srcset a=676 b=0, expected). `verify-staging-clean.mjs` (rendered): every path points at no other host, no analytics or number pool on staging, production still loads its pool; **only the `X-Robots-Tag` header line fails, by construction on a Railway host**. `check-noindex.mjs` (raw HTML) fails the same way (runtime meta). Documented in `staging-clone.md` by the coordinator |

Scripts for the clone live in the session scratchpad; the recipe is the staging-clone directive. The
staging publish helper is `output/publish.mjs --site west-la-implants:staging` (accepts a Railway host
since main `4950604e`).

## 2. Phase 1 on staging (CLASS-STANDARD §8)

Backup `output/fleet/west-la-implants/backup-pre-migration` (seq 1). Baseline `migration-gates snapshot before`
(87 pages, css at 1440/390/1920 twice, runtime at 1440/390); killed twice by the memory reaper and resumed
pass by pass through `migration-gates.mjs slot` (`runtime-parity --resume`).

| Step | Result |
| :-- | :-- |
| `css-to-registry` | `tokens.css` `--in-place --keep-residual` (72 rules; 69 merged in place, 24 dead media overrides dropped, 3 @font-face stay); `wla-lp-review.css` append (37 ambient rules, asset disabled); `wla-site-review.css` append `--keep-residual` (12 ambient + 3 merged into chips, 2 @font-face stay). `order-pairs.mjs`: 0 risky pairs for all three |
| Framework | `framework-spec.json` (17 colours, root 16/rem); `--wrap` 1312px stays in the registry; every `--t-*` type size, the fluid root and `--gutter` stay in `:root` (formulas / breakpoint-redefined). `editability` EDITABLE |
| **Seat flip found and fixed forward** | the review asset's `.display,.display em {Playfair 600}` was followed by a bare `.display{letter-spacing;line-height}`; css-to-registry merged the bare rule into the `display` chip and moved the chip after the Playfair rule → every H1 fell back to Bodoni, blog H1s lost their small combo (961 raw diffs at 1440). Fix (seq 6, 7): chip back at its original seat 16 with its original values, a new ambient `.display {letter-spacing:-.015em; line-height:1.08}` seated after the Playfair rule (the asset's cascade exactly). Written up for the coordinator in `output/fleet/west-la-implants/TOOL-BUG.md` |
| `migration-gates diff before mid` | css 0 real at 1440 / 390 / 1920 (2 / 2 / 4 raw, auto-margin flips); runtime: 1 persistent "difference" (blog page height 6722→7145 @390) **proven noise by direct loads**: staging and production both settle 6882→6891 as the GHL iframe grows 1267→1276, every load |
| `class-rename` | map `workflows/class-standard/class-map.json` re-audited (402 of 405 used classes out of bounds; +4 since 2026-10-05: `lp-form`, `in-ghl`, `st-services`, `st-services-k`); 405 class rules, 1,325 selector tokens, 3 script assets (241 selectors, 42 classList tokens), 0 page edits; review: 10 bare words (ids via `getElementById`, a CSS property name, text) |
| `migration-gates diff mid after` | css 0 real at 1440 / 1920; at 390 "2 real of 6 raw" = the HIPAA page's auto margin (width identical 355.594px in all six captures; the value reads 17.2px in five incl. the second `after` capture and 0 in one): noise by the gate's own definition. Runtime parity OK |
| `migration-gates final` | EDITABLE · IN BOUNDS (405 classes, 0 out of bounds) · CLEAN (no old name published; the "drawer" mention is an id) · editor canvas ok (3 frames, 0 overlays) |
| `head-parity` | before → after: 0 of 87 URLs differ |

## 3. Phase 2 on staging (CLASS-STANDARD §10, coordinator's proof: A by style captures, behaviour once before→after)

Backup `backup-pre-phase2` (seq 8). The phase 1 `after` captures are the phase 2 baseline (same published state).

| Step | Result |
| :-- | :-- |
| A `scale-tokens` | 10 house steps added to the Framework; 157 rules rewritten; 245 of 666 rem spacing literals on tokens (37%); 421 off-scale stay literal. css p2-before→p2-mid: auto-margin class only at 1440 / 390 / 1920 |
| B `context-combo` | `workflows/class-standard/combo-map.json` (+ `combo-map.notes.md`): 6 of 7 proposals, 11 pages gain combos; dropped `.section_transformation .text-style-lead` (0 nodes); 8 stay contextual (6 `[data-theme=light]`, one 3-class rule, one selector list). css p2-mid→p2-after: auto-margin class only at the three widths |
| D `fold-split` | 0 folded, 1 left split for a person: `heading-style-display` (its `font-family/weight/size` from seat 16 would move past `.is-small` at seat 300: the blog H1 small combo). The extra width captures were therefore not needed |
| Structure | before → after: space scale FAIL→ok, type tokens ok, overrides 11 → 5 (the refused ones), split 1 → 1, spacing on tokens 5% → 40% |
| `head-parity` | p2-before → p2-after and before → p2-after: 0 of 87 |
| Runtime p2-before → p2-after | RUNTIME PARITY OK (one page re-checked, no difference survives a second capture). css p2-before → p2-after: 0 real at 1440 and 1920; at 390 the 4 "real" values are the four auto-margin elements that flip 0/17.2px between two captures of one unchanged state (width identical in all 8 captures) |
| Final gate after phase 2 | EDITABLE · IN BOUNDS · CLEAN · editor canvas ok (3 frames, 0 overlays) · structure: space scale ok, type tokens ok, overrides 5 (refused), split 1 (refused), spacing on tokens 40% |

## 4. Local source (`workflows/04-design/.tmp/site-src`) and the draft-patch scripts

- `class-rename --files` on site-src (19 files; 1,422 selectors, 787 class attributes, 241 script selectors)
  plus hand edits for names the build computes: `object-position-X-Y` focal classes (`fp()` helpers),
  `is-photo-N` (`ph-shot--${i}`), `section-style-<theme>` (`dt-`), `is-landing-page` on body, helper
  arguments (`img(…, 'parallax_image')`, `creds('is-band')`), class attributes mixing text and `${}`.
  `class-audit --local --strict`: 408 classes, 0 out of bounds.
- `scale-tokens --files`: 7 files, 426 values on steps; the Framework mirror is `css/00-framework-tokens.css`
  (`framework.mjs pull`, 27 variables), so the build resolves `var(--space-*)`.
- B by hand: the six selectors in `40-blocks.css` / `60-lp.css` and the combo on the elements in
  `lib/blocks.mjs`, `lib/hipaa-notice.mjs`, `lib/lp.mjs`.
- `workflows/21-instatic-upload/*.mjs`: the same map (`hasClass`/`ruleId`/`needRule`/`classRule`/`CLASS`
  constants, the `fp-` regex), so the draft patches keep finding their nodes.
- `class-sync-check` build vs staging, before and after phase 2: the only differences are the known ones
  (the site carries the GHL embeds `invitation_form-embed` / `landing_form-embed` / `wz-embed` and the
  Elfsight widget; the build still renders the prototype form `invitation_fields` / `is-full-width` /
  `landing_form` and a few focal classes from image-map). Phase 2 introduced none.
- Computed theme classes `' st-' + theme`, `' ph-' + theme`, `' cv-' + tone` were left: no page sets them.

## Gotchas

- **css-to-registry append mode can re-seat a chip** when a bare `.class` rule merges into an existing chip
  (see §2). Read the raw css diff before trusting "0 real" on a move; `order-pairs` cannot see it.
- **The memory reaper kills background captures**; resume pass by pass with `migration-gates.mjs slot` and
  `runtime-parity --resume` (the brief authorises it). The slot queue was 4–8 deep all evening: a full
  snapshot took 3–5 hours.
- **Runtime page height on GHL-embed pages is iframe timing**: prove with direct loads
  (`scratchpad/probe-height.mjs`), not re-captures.
- `context-combo.mjs --map` reads every key as a selector: keep notes in a sibling file.
- `scale-tokens --files` leaves the source without the token definitions: the Framework mirror must be a
  CSS file inside the build's `css/` folder.
- Staging form submissions land in the practice's real inbox (the GHL embeds are page content).

## Version Control

Follows [SYSTEM_RULES.md §5](../../../../../SYSTEM_RULES.md).
