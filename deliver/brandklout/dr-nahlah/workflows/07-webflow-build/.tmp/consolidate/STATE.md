# Class consolidation — running state

Goal: collapse the per-page forked classes on the Dr. Nahlah Webflow site
(`6a6b84cc7fe55ddeabc0b314`) into shared global classes, so one edit reaches
every page instead of eleven.

## Scope agreed 2026-08-17

**IN — 38 hand-named UI component families**: 256 forked classes, ~531 elements.
`pk-more`, `eyebrow`, `chapter-tag`, `btn-after`, `ba-line-before`, `nx-k`,
`nx-d`, `pk-head`, `summary-after`, `fa-body`, `grid`, `facts`, `base`, `bg`,
`of-grid`, `menu`, `dr-grid`, `dr-foot`, `actions`, `ph-bg-after`, `pk-crumb`,
`ph-lead`, `pk-ba-cap`, `lc-head`, `sp-copy`, `lc-body`, `pg-hero`, `ph-meta`,
`sp-list`, `more`, `cr-list`, `pk-more-after`, `pk-quote*`, `nav-right`,
`contact-h4-2-copy`, `n`.

**OUT — 58 converter tag-name families** (`di-li`, `vn-span-2`, `di-a-4`, …):
415 classes, 2284 elements. Their definitions match only because the design is
consistent; they are auto-generated per-element names, not components. Merging
them would fuse unrelated elements under one meaningless name and make a future
per-page edit hit all eleven pages. Excluded unless the user says otherwise.

## Known traps (already hit)

1. **Designer name ≠ CSS selector.** The Designer calls it `pk-more 7` (space);
   the compiled selector is `.pk-more-7`. All style tools take the *name*.
   Never derive one from the other — read both from `get_styles`.
2. **`set_style` replaces the element's ENTIRE class list.** Every call must
   pass the full list with only the forked name substituted.
3. **Name collisions block `set_style`.** `set_style(["pk-more"])` fails with
   "styles not found" because three styles are named `pk-more`: the global plus
   combos `.contact-a-9.pk-more` and `.contact-a-10.pk-more`. Confirmed by
   setting the same element to `pk-more 8` (unambiguous) — that succeeded, and
   was reverted. Affects 3 families: `pk-more`, `pk-head`, `pg-hero`.
   Fix: delete the redundant combo first (it restates the base byte-for-byte, so
   it is a visual no-op), then the global name resolves.
4. **`rename_style` onto an existing name is refused** ("a style at path X
   already exists") — merging by rename is not available.
5. **The API rate-limits hard and the cooldown is long.** A 37-call burst tripped
   a window that 122s of exponential backoff did not clear. The MCP server also
   calls `GET /v2/assets` internally, which is what returns 429. All calls now go
   through `api.mjs` (min gap + backoff). Use `WF_MIN_GAP_MS=2500` or higher.

## Tooling built (in this folder)

| File | Purpose |
| :--- | :--- |
| `wfmcp.mjs` | Direct MCP-over-HTTP driver. Reads the `webflow-brandklout` grant from `$CLAUDE_CONFIG_DIR` (personal profile); override with `WF_CREDS`. Verified working. |
| `api.mjs` | Throttled/retrying `call()`, plus `frames()` and a shape-agnostic `collectElements()`. |
| `dump.mjs` | Read-only snapshot → `pages.json`, `styles.json`, `elements.json`. |

## Finding 2026-08-17: the site was republished mid-analysis

`lastPublished` moved to 2026-08-17T17:19Z. Diffing the Aug-14 stylesheet against
the new one: **25 selectors changed, 21 of them this session's fixes** (slider
`margin-top`, scrim `-2px`). All four of the rest are the USER editing in the
Designer:

    .pk-more-7  + display:flex, margin-right:auto  - display:inline-flex, transition
    .pk-more-8  + display:flex, flex-flow:row, justify-content:flex-start, margin-right:auto
    .pk-more-9  + display:flex, margin-right:auto  - display:inline-flex, transition
    .lc-body-8  + place-items:center start

i.e. the same layout fix applied three times to three forked copies — the exact
pain that prompted this work. **Consequences:**

- `pk-more-7/8/9` no longer match `pk-more`, so the planner correctly refuses to
  merge them. Merging would revert the user's edits and drop `margin-right:auto`.
- Consolidating `pk-more` needs a DECISION: adopt the new intent (`display:flex`
  + `margin-right:auto`) as the canonical definition and collapse all ten, which
  also changes the pages still on the old `inline-flex` version. Not guessed.
- **Always rebuild the plan from the freshly published stylesheet.** Analysis
  against a stale sheet would have merged away live work.

## Planner defects — FIXED

1. **Selector collisions.** `"btn-after 2"` and `"btn-after-2"` are two distinct
   Designer classes that both sanitise to `.btn-after-2`; the published CSS
   cannot tell them apart, so a merge could retire the wrong one. Those families
   are now refused outright (this removed `btn-after` and `eyebrow`).
2. **Canonical selection** now prefers the unnumbered stem even when it is
   applied to no element, as long as its definition matches — `dr-grid` instead
   of `dr-grid-2`.
3. **Identical definition is not sufficient.** `creds-more-after` and
   `pk-more-after` are byte-identical but are different components; merging them
   would tie the credentials block to the package block forever. Members must now
   share a stem, i.e. be numbered variants of the same class. Also skips anything
   that looks like a Relume library class (`_`, `rl-`, `slider-`, `navbar`) so
   the shared kit is never edited.

## Apply run 2026-08-17 — results and three defects

**Confirmed good: 273 of 299 element rewrites landed**, each verified by comparing
the `styleNames` the API returned against the intended list (`journal.jsonl`,
`mismatched returns: 0`). All 7 prerequisite combo deletions reported success.

**Defect A — the access token expires mid-run.** `wfmcp.mjs` fetched the bearer
once per process via `ensureSession()`; a long run outlives it and ~160 writes
became `401 invalid_token`. FIXED: `callTool` now calls `accessToken()` (which
refreshes near expiry) on every call. The MCP session id survives a refresh.

**Defect B — the published CSS is NOT a complete inventory of style objects.**
Webflow emits a CSS rule only for a combo that HAS properties, so a property-less
combo is invisible in the stylesheet. That is why `set_style(["pg-hero"])` and
`set_style(["pk-head"])` still fail with "One or more styles not found" after the
combos I could see were deleted: more combos of that name exist. 26 elements
(6 `pg-hero`, 20 `pk-head`) did not move. **Enumerate combos via
`query_styles(name_path)`, never from the stylesheet.**

**Defect C — the "do not retire a fork whose elements failed to move" guard never
fired.** `movedBad` was keyed by style NAME (`"pg-hero 7"`) but looked up by
SELECTOR (`pg-hero-7`), so every lookup missed and all 133 forks were retired
regardless. This is the dangerous one: it is the single safety rule protecting
elements from losing their class. MUST be fixed before any further run.

**Mitigating observation (being confirmed):** querying after the run still lists
`pg-hero 2..7`, `pk-head 2..6` AND the seven combos that reported successful
deletion — which suggests `remove_style` reports success without removing
anything. If so, nothing was orphaned. `check-removed.mjs` is testing whether ANY
of the 133 removals took effect.

## Where it actually stands (verified 2026-08-17, post-run)

**No element was orphaned.** All 26 elements whose restyle failed still carry
their original fork class, and those classes still exist (`check26.json`, 0 of 26
orphaned). Webflow refuses to delete a style that is still applied to an element
— that is what absorbed defect C. Do not rely on it again; defect C is now fixed
(`movedBad` is keyed by selector, matching the step-3 lookup).

**Element rewrites: 273 of 299 landed and were verified** by comparing the
classes the API returned against the intended list.

**Fully consolidated — 15 families, 90 forks retired** (`survey.json`):
`ph-bg-after` 9, `pk-crumb` 9, `ph-lead` 9, `nx-k` 9, `nx-d` 9, `lc-head` 8,
`ph-meta` 6, `lc-body` 6, `sp-copy` 6, `sp-list` 6, `summary-after` 4,
`ba-line-before` 4, `pk-ba-cap` 3, `pk-quote` 1, `pk-quote-by` 1.

**Blocked — 3 families, 12 forks:**
- `pg-hero` (6) and `pk-head` (5): `set_style` cannot resolve the canonical name
  because combos share it (`.contact-div.pg-hero`, `.sg-div.pk-head`, …).
  `remove_style` with `parent_style_names` REPORTS SUCCESS BUT DOES NOT DELETE
  the combo — all 7 are still present after being "deleted". Needs another
  mechanism before these two families can finish.
- `pk-quote-mark` (1): its element moved successfully, yet `pk-quote-mark 2`
  still exists despite a successful removal response. Unexplained.

**Unverified — 4 families, 31 forks:** `chapter-tag` 10, `dr-grid` 8, `dr-foot` 8,
`n` 5. Their element moves all succeeded, so they are probably clean; the
confirming query 429'd. Re-run the survey for these four.

**Rate limiting is the dominant constraint.** Bursts of style/element queries trip
a long cooldown. Keep `WF_MIN_GAP_MS` >= 3500 and expect to re-run surveys.

## Status

- [x] Scope agreed, families identified
- [x] Direct MCP driver working (`list_sites` verified)
- [x] Throttle + retry layer written
- [x] `dump.mjs` written (two-pass style enumeration; per-letter paging was
      abandoned because it truncates at the 200-match cap and cannot be proven
      complete)
- [x] Rate-limit window cleared. **`get_styles(query:"all")` 429s every time**
      regardless of cooldown — too expensive at ~1900 styles. Dropped entirely:
      the published stylesheet is complete, authoritative and free. Element
      names come from the element dump. `dump.mjs` is now resumable (`RESUME=0`
      to refetch).
- [x] Snapshot **14/14 pages**. `get_all_elements` 429s *deterministically* on
      Implant Cost, Contact and Style Guide — per-page response cost, not the
      rate window (the MCP server enriches via `GET /v2/assets`). `fill.mjs`
      captures those pages with targeted `query_elements` style filters instead,
      accumulating across runs so intermittent 429s just need a re-run.
      Two residual traps: a one-character stem (`n`) matches nearly every style
      name and always 429s — settled from the published HTML, which shows the
      family is absent from Contact; and `fa-body` on Implant Cost 429s on any
      style filter, so its 4 elements are fetched by text -> `return_parent`.
- [x] `plan.mjs` written, defects fixed, re-run on the complete snapshot:
      **25 families, 143 classes to retire, 326 element rewrites, 57 skipped**.
      Output: `plan.json` (per-element before/after) and `PLAN.md`.
- [ ] `apply.mjs` — set_style each element (full class list, fork name
      substituted), delete the redundant combos for `pg-hero`/`pk-head`/`pk-more`
      first, then remove_style each retired fork. Default to dry-run.
- [ ] **DECISION PENDING (user has not answered):** `pk-more`. The user edited
      `pk-more-7/8/9` to `display:flex` + `margin-right:auto`. Collapsing the
      family onto that new definition would also change pages still on the old
      `inline-flex` version. `pk-more-7` (+`pk-more-9`) is listed as its own
      1-fork family for now; do not merge it into `pk-more` without an answer.
- [ ] `verify.mjs` — assert no element references a retired class and the
      retired styles are gone
- [ ] Re-run the earlier defect sweeps afterwards (the slider `margin-top` and
      scrim `-2px` fixes must survive consolidation)

## Prior fixes ARE published (verified 2026-08-17)

The 301 redirect CSV was imported and is live (`/about` -> `/meet-dr-nahlah`,
`/blog` -> `/dental-implants`, the `/category/(.*)` wildcard all return 301).
All five sliders read `margin-top:0`; all scrims read `inset:-2px`. Stakes are
now higher: any canvas change here ships on the client's next publish.

## Nothing from the consolidation is written

All prior fixes this session (slider `margin-top`, scrim `-2px` bleed) and this
consolidation are canvas-only. The site has not been republished.
