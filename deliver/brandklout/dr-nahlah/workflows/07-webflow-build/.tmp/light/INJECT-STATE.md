# Webflow injection — live state (resume here)

Site `6a6b84cc7fe55ddeabc0b314` · Home `6a6b84cf7fe55ddeabc0b3bf`
Staging: https://dr-nahlah.webflow.io

## HOME — DONE ✅ (2026-08-04)

Pasted once onto a cleared namespace, published, verified.

- 9 chapters as native `section` elements, **zero forked class names**, single
  `page` wrapper, all `data-chapter` / `data-theme` attributes intact.
- Dark chapters render correctly: `#proof`, `#invitation`, `#drawer` are
  `rgba(255,255,255,.78)` on `rgb(20,20,22)` / `rgb(11,11,12)`, headings
  `#FFFFFF` — matching the design.
- Parity vs `../04-design/.tmp/final-site`: **54/54 id-addressed elements,
  0 design-only, 0 live-only. `color` diffs 13 → 0.** 82 diffs remain across
  10 properties, all dimensional (height/width/max-width/font-size/line-height/
  grid-template-columns/padding) — the known `clamp() → fixed px` trade-off,
  since Webflow's style panel cannot render a CSS function.
- Site head + footer installed at SITE level only; no page-level code.

## THE RULE THAT MATTERS FOR THE REMAINING 10 PAGES

**Webflow class names are free exactly once. Paste each page ONCE.**

Re-pasting a corrected payload forks ~180 classes to `"ch-proof 2"` etc.,
because deleting the elements does NOT free the names — orphaned styles keep
them, and `remove_style` refuses anything created in an earlier session. The
only lever on a pre-existing style is `rename_style`.

So: get the payload right BEFORE pasting (gate it), paste once, and make any
later correction with `data_style_tool > update_style`. Never iterate by
re-pasting.

Freeing a burned namespace costs ~250 renames in 6 batches of 40. Global and
combo classes can share a name, so a first pass leaves ~15 stragglers and a
second ~4 — use `zz-p1b-`, `zz-p1c-` suffixes for those. Verify with:
`live_style_names ∩ payload_style_names == ∅`.

Also: `remove_element` via the Data API is NOT in the Designer's undo stack.
Ctrl+Z reverts a paste but cannot restore an API-removed tree.

## Paste procedure (proven twice)

1. `orca goto --page <copyTab> --url file:///…/PASTE-full-page.html`
2. **Empty the payload element first**: `getElementById('payload').textContent=''`.
   The handler captured the JSON in a closure at load, so copy still works, and
   `orca snapshot` stops returning `runtime_unavailable` — a 426 KB string in
   the DOM is what breaks it.
3. `orca snapshot` → `orca click --element @<button>`. A scripted `.click()`
   fails (`execCommand` needs user activation); a synthesized click works.
4. Designer tab: `orca click` the Navigator's Body row (the clickable `generic`
   ancestor of `StaticText "Body"` — clicking the canvas iframe does NOT select
   Body), then `orca keypress --key Control+v`. Wait ~25s.

## Converter fixes this session (tests 24/24, gate 13/13)

1. **Body `background`/`overflow` propagated onto every top-level element** —
   `background` is not inherited; it painted the fixed header opaque and the
   dark drawer cream.
2. **Scoped custom properties resolved globally** — `parse_rules` wrote every
   `--*` block into one flat map regardless of selector, so
   `[data-theme="light"]` (last in the file) beat `[data-theme="dark"]`
   document-wide and every dark chapter baked light text. Now `parse_rules`
   returns `var_scopes`, `CascadeResolver.vars_for(el)` walks the ancestor
   chain, and `_sig()` dedups on RESOLVED declarations (keying on raw ones
   merged a dark heading onto its light twin — both read `color: var(--fg)`).
3. **`prep_light_source` missed `.nav[data-journey="1"]`** — enumerated
   punctuation lookahead instead of a negative name-char lookahead.
4. **`simulate_paste.mjs` dropped `data.xattr`** — the simulated DOM had no
   `data-theme`, `data-chapter`, `data-anim`, `role` or `aria-*`, so the new
   dark-section check found "0 dark sections" and passed vacuously on a
   black-on-black build. Always verify a new gate assertion FAILS on the broken
   input before trusting it.

## NOTE ON THE DESIGN (not a conversion bug)

`#invitation`'s second `<h2>` and its `<p>` are `#0B0B0C` on `#0B0B0C` in the
SOURCE design too. The conversion is faithful. Worth raising — either
intentional (revealed later by script) or a genuine contrast miss.

## NEXT — the remaining 10 pages

about, all-on-4, contact, dental-implants, implant-cost, patient-stories,
sedation-dentistry, smile-gallery, smile-makeover, veneers.

Per page: `prep_light_source` → `html_to_webflow_wholepage.py --wrap
--wrap-class page --page-prefix nahlah` → `resolve_wholepage.mjs` →
`rebind_assets.mjs` → `make_paste_page.py` → gate with `simulate_paste.mjs`
(must be 13/13) → `create_page` → paste ONCE → publish → `parity.mjs`.

**Shared vocabulary matters now.** Page 2+ reuse Home's classes only if their
definitions are byte-identical; otherwise they fork. Use `build_vocab.py` /
`--vocab` so the shared class system is generated once and every page maps onto
it, and pass `--avoid` against already-built pages. Check `wf_tools.py qa
--against` for cross-page collisions before pasting each page.

## Version Control
- Follows the version control rules in [SYSTEM_RULES.md - Section 4](../../../../../SYSTEM_RULES.md).

---

# PAGES 2-11 — pipeline validated 2026-08-04

## Established this iteration

- **All 10 sources prepped** into `.tmp/src10/` (`about, all-on-4, contact,
  dental-implants, implant-cost, patient-stories, sedation-dentistry,
  smile-gallery, smile-makeover, veneers`).
- `prep_light_source.py` now works on ANY page: the index-derived hit counts are
  behind `--expect-counts` (still ON for index.html, so a design change there
  still fails loudly), while the INVARIANTS — no banned/bare-tag class name
  survives — run unconditionally on every page. That invariant immediately paid
  for itself: 5 pages ship `class="ba-tag b"` in the source, a naming the
  index rules never reached, and `b` would have become a site-wide TAG style
  repainting every `<b>`. Rules added, with boundary-aware regexes because a
  plain replace of `.ba-tag.b` also matches inside `.ba-tag.ba-b`.

## No shared-vocabulary rebuild is needed — measured, not assumed

Converted `about` and compared its POST-resolve definitions against Home's:
**33 of 34 shared class names are byte-identical.** The pages come from the same
partials, so they already agree. (Comparing a raw payload to a resolved one
shows every `clamp()` as a difference and means nothing — resolve first.)

The one conflict was `grid`: empty combo artifact on Home, real definition on
About. Nothing in the head CSS or JS targets `.grid`, so the live empty one was
renamed to `zz-empty-grid` — the real definition should own the name, and pages
3-11 now reuse it. Baseline `final.json` was updated to match live.

## Per-page recipe (steps 1-4 proven on `about`)

```bash
P=about                                    # distinct prefix per page
python html_to_webflow_wholepage.py --html .tmp/src10/$P.html \
       --out .tmp/p-$P --wrap --wrap-class page --page-prefix $P
node   resolve_wholepage.mjs .tmp/p-$P/paste_00_full-page.html .tmp/p-$P/resolved
python check_shared_classes.py --baseline .tmp/light/final.json \
       --payload .tmp/p-$P/resolved.json          # MUST report WOULD FORK 0
#   ... then assets, paste page, gate, create page, paste ONCE, publish, parity
```

**`--page-prefix` must differ per page.** Auto-names (`nahlah-div-5`,
`about-div-5`) are page-scoped that way and can never collide; only SOURCE class
names are shared, and those are what `check_shared_classes.py` guards.

Add each pasted page to the `--baseline` list as it goes live, so page N is
checked against every page already on the site.

## Still to do per page

- **Assets**: `asset-uploads.json` currently holds Home's 16. Each page's images
  must be uploaded (`upload_assets.mjs`) and rebound (`rebind_assets.mjs`)
  before the paste page is built, or images arrive unbound.
- `make_paste_page.py` → `simulate_paste.mjs` gate (13/13) → `create_page` →
  paste ONCE → publish → `parity.mjs` against `../04-design/.tmp/final-site`.

---

# PROGRESS: 2 of 11 pages live

| page | Webflow page id | status |
| :--- | :--- | :--- |
| Home  | `6a6b84cf7fe55ddeabc0b3bf` | ✅ 13/13 gate · 54/54 parity · published |
| About | `6a7192045e08986900c971b0` | ✅ 11/11 gate (2 N/A) · 15/15 parity · published |

Remaining 9: all-on-4, contact, dental-implants, implant-cost, patient-stories,
sedation-dentistry, smile-gallery, smile-makeover, veneers.

## About proved the shared-class strategy works

Pasted classes came out as `page`, `about-header site-nav`, `about-div-2 drawer`
— the page-scoped auto-names carry the `about-` prefix, while `page`,
`site-nav` and `drawer` MERGED into Home's existing classes. **Zero forks.**

## The gate now reports N/A instead of failing on absent features

About has no before/after slider, so the carousel and wipe checks hard-FAILed
for content that is correctly missing. They are now guarded by
`payloadHas(...)` — applicability is decided from the PAYLOAD, never from the
rendered DOM. "The DOM has no slides, so skip" would pass vacuously on a build
whose slides went missing; the payload is the spec, so if it declares the
classes the check MUST run. Home still reports 13/13 with zero skips; About
reports `11/11 checks passed (2 not applicable to this page)`.

## Per-page runbook (both pages done this way)

```bash
P=<page>                                   # prefix MUST be unique per page
# 1. which images does this page need that are not uploaded yet?
python -c "import json,pathlib,re
have={a['file'] for a in json.loads(pathlib.Path('.tmp/assets-all.json').read_text(encoding='utf-8'))}
refs=set(re.findall(r'assets/([A-Za-z0-9._-]+\.(?:jpg|png|svg|mp4|webp))',
    pathlib.Path('.tmp/src10/$P.html').read_text(encoding='utf-8')))
print(sorted(refs-have))"
#    for each: md5 -> data_assets_tool.create_asset -> POST bytes to S3 with the
#    EXACT uploadDetails returned (policy expires ~1h; upload_assets.mjs has a
#    STALE hard-coded credential — use the fresh values, not that script)
#    then append {file,id,ct} to .tmp/assets-all.json

python html_to_webflow_wholepage.py --html .tmp/src10/$P.html \
       --out .tmp/p-$P --wrap --wrap-class page --page-prefix $P
node   resolve_wholepage.mjs .tmp/p-$P/paste_00_full-page.html .tmp/p-$P/resolved
cp     .tmp/assets-all.json .tmp/p-$P/asset-uploads.json
node   rebind_assets.mjs .tmp/p-$P/resolved.json .tmp/p-$P/asset-uploads.json \
       .tmp/p-$P/final.json
python check_shared_classes.py --baseline .tmp/light/final.json \
       --baseline .tmp/p-about/final.json --payload .tmp/p-$P/final.json   # MUST be 0
python make_paste_page.py --payload .tmp/p-$P/final.json \
       --out .tmp/p-$P/PASTE-full-page.html
python gen_install_pages.py .tmp/p-$P
node   simulate_paste.mjs .tmp/p-$P/final.json .tmp/p-$P \
       ../04-design/.tmp/final-site/assets      # 0 FAIL
```
Then: `create_page` → open `…design.webflow.com/?pageId=<id>` in the Designer
tab → copy → click Navigator Body row → `Control+v` → `publish_site` →
parity (copy the design page to `.tmp/parity-$P/index.html` + its `assets/`,
then `node parity.mjs .tmp/parity-$P https://dr-nahlah.webflow.io/$P 1440`).

**Add each completed page to the `--baseline` list** so page N is checked
against every page already live.

Expected residual parity diffs: height/width/padding only — the `clamp() → px`
resolution. Any `color`, `background` or structural diff is a real defect.

---

# PROGRESS: 5 of 11 pages live (2026-08-04)

| page | Webflow page id | gate | parity |
| :--- | :--- | :--- | :--- |
| Home               | `6a6b84cf7fe55ddeabc0b3bf` | 13/13 | 54/54 ids, 82 dimensional |
| About              | `6a7192045e08986900c971b0` | 11/11 (2 N/A) | 15/15 ids, 12 dimensional |
| Patient Stories    | `6a719510e5ce71dc7be8cfb2` | 11/11 (2 N/A) | 19/19 ids, 35 dimensional |
| Contact            | `6a719510e5ce71dc7be8d079` | 11/11 (2 N/A) | 12/12 ids, 10 dimensional |
| Sedation Dentistry | `6a719511f930119433ab4247` | 11/11 (2 N/A) | 14/14 ids, 12 dimensional |

Every page: **0 design-only, 0 live-only elements**, and every remaining diff is
height/width/padding/grid-column-width — the `clamp() → px` resolution. Checked
one grid case explicitly: column COUNTS match, widths differ ~0.6%. No colour,
background or structural diffs anywhere.

Remaining 6: all-on-4, dental-implants, implant-cost, smile-gallery,
smile-makeover, veneers.

## NEW: `adopt_shared_classes.py` — run it before every paste

`check_shared_classes.py` found real conflicts on all three pages (1, 3 and 2).
Most were a bare `box-sizing: border-box` present in one definition and not the
other — semantically identical, but Webflow forks on ANY difference.

One was substantive and worth knowing: `a-after` (the nav underline) baked
`transform: scaleX(1)` on whichever page was current, versus `scaleX(0)`
elsewhere — the `aria-current` state had been folded into the shared class.

`adopt_shared_classes.py` rewrites the incoming payload's shared classes to the
definitions already live. That is the CORRECT semantics, not a compromise:
Webflow stores one definition per name site-wide, and per-page variation belongs
in the runtime-state CSS — which already raises the current-page underline via
`.nav-links a[aria-current="page"] > .a-after`. Every adoption is printed so a
genuine divergence stays visible; if one is real, rename that class in the
page's source instead of sharing it.

Order is: rebind → **adopt** → check (must be 0) → paste page → gate.

> **Superseded — see "RESOLVED — cross-page class forks" at the end of this
> file.** The claim above that "Webflow forks on ANY difference" implies that no
> difference means no fork. Measured on the finished site, that is false: 283
> class instances forked with byte-identical definitions. Keep running adopt for
> one-definition-per-name hygiene, but do not treat a clean `check` as proof the
> class survived — write head CSS as `[class*="name"]` and verify by computed
> style on the live page.

## Asset upload notes

- Webflow **dedupes by content hash**: `office-hero.jpg` and `sedation-patient.jpg`
  returned ids for the already-uploaded `office.jpg` / `sedation.jpg`, so their
  bytes needed no S3 POST.
- `upload_assets.mjs` has a STALE hard-coded AWS credential (20260730). Use the
  `uploadDetails` returned by `create_asset` verbatim; the policy expires ~1h.
- `.tmp/assets-all.json` is the running manifest (27 entries). `smile-gallery`
  alone still needs 57 new assets — do it last.

## Paste automation

`scratchpad/paste_page.sh <slug> <pageId>` runs the whole browser sequence.
It retries the Designer snapshot up to 4× — after switching pages the Designer
returns `runtime_unavailable` for a while, and a single fixed sleep failed on
two of three pages.

## +Implant Cost → 6 of 11 live

| page | id | gate | parity |
| :--- | :--- | :--- | :--- |
| Implant Cost | `6a7198a872eeb266fa217f3b` | 11/11 (2 N/A) | 15/15 ids, 13 dimensional |

Remaining 5: all-on-4, dental-implants, smile-gallery, smile-makeover, veneers.
Asset manifest `.tmp/assets-all.json` now 32 entries.

Reusable uploader: `scratchpad/upload_specs.mjs specs.json`, where specs.json is
`[{file,ct,date,key,policy,sig}]` copied from each `create_asset` response.
Beats hand-writing a script per batch; the presigned policy still expires ~1h.

Still-needed new assets by page (union already computed):
  smile-makeover 7 · veneers 8 · all-on-4 8 · dental-implants 9 · smile-gallery 57

## +Smile Makeover → 7 of 11 live

`6a719ad75e08986900cb81a8` · gate 11/11 (2 N/A) · parity 14/14 ids, 12 dimensional
(prefix `sm`, since `smile-makeover-` would be needlessly long on every class)

Asset manifest now 39. More content-hash dedupes seen:
`case-veneers-implants-2-{after,before}.jpg` are byte-identical to
`case1-{after,before}.jpg`, so Webflow returned the existing ids and no upload
was needed. Always record the RETURNED id, never assume a new one.

Remaining 4: all-on-4, dental-implants, smile-gallery, veneers.
New assets still needed: veneers 8 · all-on-4 8 · dental-implants 9 · smile-gallery 57

## +Veneers → 8 of 11 live

`6a719dd61311f970076306e6` (prefix `vn`) · gate 11/11 (2 N/A) · parity 14/14 ids,
12 dimensional. Asset manifest 47.

Remaining 3: all-on-4 (8 new assets), dental-implants (9), smile-gallery (57).

Note: build `specs.json` for `upload_specs.mjs` with the **Write tool**, not a
bash heredoc — the base64 policies are long enough to break heredoc quoting.

## +All-on-4 → 9 of 11 live

`6a71a01c67dd06721b4fb6db` (prefix `ao4`) · gate 11/11 (2 N/A) · parity 17/17 ids,
15 dimensional. Asset manifest 55.

Remaining 2: dental-implants (9 new assets), smile-gallery (57).

## +Dental Implants → 10 of 11 live

`6a71a26282b5747f186b6a67` (prefix `di`) · gate 11/11 (2 N/A) · parity 17/17 ids,
15 dimensional. Asset manifest 63.

Three more content-hash dedupes: case-ao4-single-1-{after,before} -> case3-*,
pt-interaction -> consult.jpg.

REMAINING: **smile-gallery only** (57 new assets — the full case library).

---

# ALL 11 PAGES LIVE (2026-08-04)

| page | id | parity |
| :--- | :--- | :--- |
| Home | `6a6b84cf7fe55ddeabc0b3bf` | 54/54 |
| About | `6a7192045e08986900c971b0` | 15/15 |
| Patient Stories | `6a719510e5ce71dc7be8cfb2` | 19/19 |
| Contact | `6a719510e5ce71dc7be8d079` | 12/12 |
| Sedation Dentistry | `6a719511f930119433ab4247` | 14/14 |
| Implant Cost | `6a7198a872eeb266fa217f3b` | 15/15 |
| Smile Makeover | `6a719ad75e08986900cb81a8` | 14/14 |
| Veneers | `6a719dd61311f970076306e6` | 14/14 |
| All-on-4 | `6a71a01c67dd06721b4fb6db` | 17/17 |
| Dental Implants | `6a71a26282b5747f186b6a67` | 17/17 |
| Smile Gallery | `6a71a491d883c20ee30dc0d4` | 14/14 |

Every page: 0 design-only, 0 live-only elements; all residual diffs are
height/width/padding — the `clamp() -> px` resolution. 95 assets in the library.

## RESOLVED — cross-page class forks (2026-08-04)

Fixed and verified. The root cause turned out NOT to be what I first wrote here,
so the corrected version is below; the original diagnosis is kept because the
wrong version is the one that reads as obvious.

### What I first concluded (WRONG)

"I did not follow my own runbook — pages 3-11 were checked against Home and
About only, so classes the earlier pair never defined forked silently. Pass the
full `--baseline` list and the forks go away."

The process complaint is true and worth keeping: the runbook says to add each
page to `--baseline` as it goes live, and I did not. But it is not the cause.

### What actually causes the fork (MEASURED)

**Identical definitions fork anyway.** Across the finished build there are 283
forked class instances live, and in **zero** of them did the definition differ:

- payload side — `a-after-2` is md5 `91e10af7` in all ten later payloads,
  byte-identical `styleLess` + `variants`
- published side — the forked rules equal their originals in the site CSS:
  `.nav-right` == `.nav-right-2`, `.eyebrow` == `.eyebrow-2`,
  `.dr-foot` == `.dr-foot-2`, `.pk-head` == `.pk-head-2`

So on this whole-page paste path a name already taken on the site forks no
matter what it contains. Only the first paste gets the name. A complete
`--baseline` would have changed nothing — replaying every page against the full
prefix surfaces just 2 extra divergences, against 283 real forks.

`check_shared_classes.py` was written on the wrong premise and now says so in
its own docstring. It still earns its place as a *divergence report* — two pages
disagreeing about a shared class is a design smell — but it is not a gate, and
`adopt_shared_classes.py` is hygiene rather than protection.

### The fix that works: tolerance, not agreement

Applied to the site head and republished:

```css
.nav-links a[aria-current="page"] > [class*="a-after"]{transform:scaleX(1)}
.nav-chapter i > [class*="i-after"]{...}
* > [class*="div-before"]{...}   /* reduced-motion block */
* > [class*="div-after"]{...}
```

`[class*="x"]` has the SAME specificity as `.x`, so nothing else in the cascade
shifts; it just also matches `x-2-3`. Verified live by computed style, not by
grep — a fork is invisible to a grep because the selector text looks fine:

| page | matched class | scaleX |
|---|---|---|
| about | `a-after-2` | 1 |
| patient-stories | `a-after-2-2` | 1 |
| contact | `a-after-2-3` | 1 |
| sedation-dentistry | `a-after-5` | 1 |
| implant-cost | `a-after-6` | 1 |
| smile-makeover | `a-after-2-6` | 1 |
| veneers | `a-after-2-7` | 1 |
| all-on-4 | `a-after-9` | 1 |
| dental-implants | `a-after-10` | 1 |
| smile-gallery | `a-after-2-10` | 1 |

Home reports no current nav link, which is correct and matches the design
source: Home is not in `nav-links` (the logo is the home link). Likewise
patient-stories deliberately marks *Smile Gallery* current. Both were checked
against `04-design/.tmp/final-site/*.html` rather than assumed.

Script: ``verify_underline.mjs` (fork evidence: `fork_cause.mjs`)`.

### Rules that follow

1. **Head CSS on a shared class → `[class*="name"]`.** Never bare `.name`.
2. **JS hooks → `data-*` attributes.** Never class names. Audited all 39 affected
   names against every page's inline JS: only `chapter-tag` is hooked, only on
   Home, where it is unforked. No live defect remains.
3. **Verify with a computed-style probe on the live page.** Parity cannot catch
   this — it compares id-addressed elements and `.a-after` carries no id.
4. Keep the manifest (`.tmp/live-manifest.json`) current anyway: it makes the
   divergence report meaningful and records page ids in one place.

---

# DEFECT ROUND 2 — reported by client, all fixed 2026-08-04

Three symptoms reported: a Home CTA with misaligned text, several nav links
looking "current" on service pages, and dead case-study drag. All three traced
to declarations the CONVERSION DROPPED, and all three were fixed in the site
head/footer — no re-paste, so no class names were burned.

## What the conversion silently drops (the real lessons)

1. **Page-level `<script>` tags.** Only a `<script>` sitting INSIDE a `<section>`
   rides along as a `data-embed` HtmlEmbed. Home's scripts are inside sections,
   so Home worked; on every other page the block sat AFTER the sections and was
   lost — all 4 scripts, ~24,700 chars per page. That killed the before/after
   sliders, the `[data-rv]` reveals and the stat counters. Restored as one global
   block in the SITE FOOTER (Home defines neither `.pk-ba` nor `[data-rv]`, so it
   is a no-op there). Only ~3.3 KB of the 24.7 KB was unique — the rest was the
   theme CSS, the WZ helper and the footer runtime, all already global.

2. **`margin-inline:auto`.** Does not survive at all. A block with a max-width
   narrower than its parent then sits hard left. 12 elements across 10 pages.

3. **Specificity, when a descendant rule is folded into one generated class.**
   `.pk-cta .cta-in` (0,2,0) beat the shared `.wrap` (0,1,0) locally. Converted,
   both live on the same element as sibling classes — `.vn-div-6` vs `.wrap` —
   and `.wrap` wins on source order, so `max-width` reverted from `60ch` to
   `1560px`. Note the class definition looked CORRECT in isolation; only the
   cascade was wrong. Restoring the margin alone did nothing, because there was
   no longer a narrow max-width for `auto` to centre.

4. **Declarations referencing a runtime `var()`** — `clip-path:inset(0 0 0 var(--pos))`,
   `left:var(--pos)`. `--pos` is written by JS on drag, so it cannot be resolved
   at build time and the declaration is dropped. Worse, `.ba-line` lost its
   ENTIRE definition: live it rendered `position:static`, full-width,
   transparent, zero-height. Always re-declare runtime-variable rules in head CSS
   with a fallback: `var(--pos,50%)`.

5. **State baked into a class.** The nav underline's `aria-current` state was
   folded into whichever class the current link defined FIRST. On pages whose
   current link is the first one (`sedation-dentistry`, `implant-cost`,
   `all-on-4`, `dental-implants`), the base name got `scaleX(1)` and every OTHER
   link inherited it — all five appeared current. Declare the BASE state in head
   CSS too, not just the active state.

## Measurement traps hit while diagnosing (all cost real time)

- A converted pseudo-element is a real child `div` live but a `::after` locally.
  Any `Range` over element contents measures different things on each side and
  manufactures a 70px "misalignment" that is not on screen. Union the rects of
  TEXT NODES only.
- Reading `transform` from `a.firstElementChild` returns nothing locally (the
  underline is a pseudo), which scores every local link as `scaleX 1` and fakes a
  mismatch on the GOOD build. Fall back to `getComputedStyle(a, '::after')`.
- Matching elements by label alone pairs the footer copy with the drawer copy of
  the same text and reports a 400px skew. Key on label + occurrence index.
- Reveals never fire headlessly (no real scroll), so dark chapters stay hidden
  and unmeasurable. Emulate `prefers-reduced-motion: reduce` to force them
  visible without moving layout.

## Verification scripts (all in this folder)

| script | asserts |
|---|---|
| `nav_audit.mjs` | every nav link's underline scaleX + colour vs local |
| `drag_test.mjs` | slider actually moves: clip-path and divider position change |
| `automargin_audit.mjs` | every source auto-margin rule still centres live |
| `visible_check.mjs` | no text element stranded invisible (guards the reveals) |
| `skew.mjs` | ranks links by label-inset difference vs local |

Result after fixes: nav identical to local on all pages; sliders move on 5/5;
**0 dropped auto-margins across all 11 pages**; 1 hidden element live and local
alike (the drawer's "Close", correct).

## Still open

- `.ch-proof .shot` carries `clip-path:inset(0 0 100% 0)` locally — a rule that
  HIDES the element until its reveal animates it. It is absent live, so the shot
  currently just shows. Restoring it without confirming the reveal runs would
  risk a blank panel, so it was deliberately left alone.
- The other dropped descendant rules found by the sweep (`.pg-hero .ph-in`,
  `.pk-split .sp-fig`, `.pk-ba .ba-tag`, `.vs-row .vs-mid`, ...) were NOT
  restored: spot-checking showed their declarations did land on the generated
  per-element class, so only the ones proven broken were touched.

---

# DEFECT ROUND 3 + NAVBAR COMPONENT (2026-08-04)

## The Home navbar regression — stale PAGE-LEVEL code from the dark build

Symptom: on Home the nav turned DARK on scroll (`rgba(11,11,12,.82)`) where the
design is cream (`rgba(250,248,243,.9)`). At load it looked fine, which is why no
earlier check caught it — the defect only exists in the `.solid` scrolled state.

Cause: **Home still carried page-level head AND footer custom code from the
ORIGINAL DARK build.** Page-level code is emitted after site-level code, so on an
equal-specificity tie it wins. Both blocks defined the same
`.site-nav.solid.solid.solid` selector; the stale dark one simply came last.

The stale block was doing far more damage than the nav colour:
- re-declared `window.WZ` (a second, older bootstrap without the `build` param)
- `body{background:#0B0B0C;color:#fff}` — the whole dark theme
- a SECOND `ScrollSmoother.create()`, which tears down the first smoother and
  every ScrollTrigger attached to it
- stale selectors for classes that were renamed (`.nav-mid`, `.drawer li a`)

Detection that generalises — count these markers in the published HTML; any page
scoring 2 has duplicate custom code:

```
window.WZ = (function     -> expect 1
ScrollSmoother.create     -> expect 1
```

Home scored 2/2 (and 1 dark-body, 1 dark-nav). All ten other pages scored 1/1/0/0.
Fixed by clearing BOTH page-level slots via `set_page_freeform_code` with an empty
string. Re-verified: 1/1/0/0, nav cream at every scroll depth, Home parity still
54 ids / 0 design-only / 0 live-only.

**The earlier note in this file that said "Site head + footer installed at SITE
level only; no page-level code" was wrong for Home.** Always read BOTH
`get_site_freeform_code` and `get_page_freeform_code` before blaming the payload.

## Navbar is now a real Webflow component

Component `Navbar` (group `Global`), id `f656f48c-3e80-22ac-abf4-7f2a8af67055`,
created from Home's header with `transform_element_to_component` and instanced on
every page. Headless — the Designer bridge was never opened.

Before: each page had its OWN header subtree carrying its OWN generated class
(`nahlah-header`, `about-header`, `vn-header`, `sm-header`, `ao4-header`, ...).
All of those definitions were byte-identical, which is what made collapsing them
to one component safe — that was checked, not assumed.

Two things genuinely varied per page and could not be baked into a shared
component, so they are applied at runtime from the URL instead:

| varies | old approach | now |
|---|---|---|
| `aria-current="page"` on one link | baked per page | set by footer JS from `location.pathname` |
| `data-journey` (Home swaps links for the chapter readout) | `1` on Home, `0` elsewhere | component ships `0`; JS sets `1` on `/` |

The pathname -> current-link map mirrors the design exactly, including the two
non-obvious cases: `/patient-stories` marks **Smile Gallery** current, and the
four implant pages (`/dental-implants`, `/sedation-dentistry`, `/implant-cost`,
`/all-on-4`) all mark **Implants**. Home marks nothing — it is not in `nav-links`
(the logo is the home link).

Replacement procedure per page (both steps needed; there is no "replace" call):
1. `insert_component_instance` with `creation_position: "before"` the old header
2. `remove_element` on the old header

Note the Data API rate-limits (`429 GET /v2/assets`) after roughly a dozen
element calls in quick succession; it clears on its own, so pace the loop rather
than retrying in a tight loop.

## Navbar component — verified

Shared class renamed `nahlah-header` -> `nav-header` (it was Home's auto-name but
is now on every page, so a Home-flavoured name read as non-uniform in the
Designer). `rename_style` handles pre-existing styles; `remove_style` does not.

| check | result |
|---|---|
| current-page underline, 11 pages | 10/11 PASS (Home marks nothing, by design) |
| underline class name | plain `a-after` on EVERY page |
| Home journey mode | `data-journey="1"` applied at runtime, cream `.solid`, chapter readout advances |
| nav link states vs local | identical on about / veneers / smile-gallery / contact |
| structure | 1 header, 1 nav-links, 1 drawer, 1 `id="burger"`, 1 WZ per page |
| content stranded | 1 hidden live and local alike (drawer "Close") |

**A component structurally kills the class-fork problem.** Before, the underline
class was `a-after-2-3`, `a-after-5`, `a-after-2-10`... — a different fork per
page, because each page pasted its own copy of the same markup. One component =
one definition = one class name. This is the durable answer to the fork issue
that head-CSS `[class*="..."]` selectors were only papering over.

## Still per-page, NOT converted (flagged, not done — only the navbar was asked for)

| chrome | classes today |
|---|---|
| drawer | `nahlah-div-2 drawer`, `about-div-2 drawer`, `vn-div-2 drawer`, `sg-div-2 drawer`, ... |
| footer | `nahlah-footer`, `foot-2`, `foot-4`, `foot-8`, `foot-11` |

The footer names are genuinely FORKED (`foot-2/4/8/11`), not just per-page
auto-names. Converting both to components the same way would finish the job and
retire those forks; it is ~2 components x 11 pages of insert+remove calls.
