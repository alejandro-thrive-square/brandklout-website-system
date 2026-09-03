# All-on-X Ad Campaign — Landing Page Set

Status: **LIVE** on `stonedentalimplantcenter.com`, published 2026-09-03.
Reference implementation: Livewell Dental's implant ad trio
(`/ads-landing-pages/dental-implants`, `-consultation`, `thank-you-implants`), cloned and
adapted to Stone's brand and the All-on-X service. No Livewell content shipped.

## Pages (site `6a07d5aac093f0e4521d29bc`, folder `/ads-landing-pages/` = `6a9976fa58138b416a8de7ea`)

| Page | Page ID | Path | Purpose |
| :--- | :--- | :--- | :--- |
| Landing | `6a99792d6642f8d8d2c99716` | `/ads-landing-pages/all-on-x` | Google Ads destination; hero + form |
| Consultation | `6a9985eb38e229b39cdcd4d2` | `/ads-landing-pages/all-on-x-consultation` | CTA target from every landing CTA |
| Thank You | `6a9985ec10482f3af4ffd9b4` | `/ads-landing-pages/thank-you-all-on-x` | Post-submit reassurance; drives a call |

All three are excluded from the sitemap (`includeInSitemap: false`, matching the Livewell
convention for ad pages). SEO titles/descriptions set per page.

## Structure (mirrors Livewell, section for section)

**Landing** (14 sections, mirroring Livewell 1:1): header → hero (copy left / GHL form card
right) → trust strip (Google/Yelp) → **before/after drag-comparison slider** ("One Patient. One
Complete Plan.") → journey (4 story cards) → why-Stone (4 features) → specialist (Dr. Stone
photo + credential chips) → options (single vs All-on-X comparison cards) → process (3 steps) →
**smile gallery** (all four patient before/after photos) → office experience (2-image grid) →
FAQ (6, real answers from the client's own All-on-X service page) → final CTA → footer.

The slider is an HtmlEmbed (self-contained `<style>` + markup + `<script>`, id `axon-ba2`) over
cropped before/after halves. The four Livewell-style combined BA photos were split into halves
with PIL, uploaded as 8 new assets (`allonx-p1..p5-before/after.jpg`), and wired through a
range-input slider. Livewell's §12 credential-logos strip was deliberately NOT reproduced: those
logos (ICOI, Implant Accelerator, etc.) belong to Livewell's doctor. Stone's credential proof
lives in the specialist section's chips instead; if the client supplies their own membership
badges they can be added as a strip.

**Consultation**: minimal header → hero (copy + doctor card left / form card right) → patient
stories (practice imagery + links to live Google/Yelp/testimonials) → footer.

**Thank You**: minimal header → confirmation hero with call CTA → what-to-expect (3 steps) →
why-now (4 risk cards) → why-Stone (3 cards) → FAQ (4) → closing CTA → footer.

## Brand

- Fonts: **Italiana** (display) + **Montserrat** (body) — both already loaded site-wide via the
  site's Google Fonts `WebFont.load`. No font uploads were needed.
- Palette: navy `#081f33` (primary), cyan `#2179a8` (buttons/accents), yellow `#e6ff0b`
  (hero accent + CTA on dark), soft grey `#f2f2f2` (alternating sections), body `#606060`,
  star gold `#efb44d`.
- Assets: all images are **existing assets of the Stone site** (SDIC logo, Dr. Mona Stone banner
  and portrait, four "Before & After All on X implants" photos, office photo, review badges).
  The `whtml_builder` matched the S3 URLs to library assets automatically.

## Class system

Campaign-scoped Client-First-style namespace `axon-*`, one class per element (no combos):
layout (`.axon-section`, `.axon-container`, `.axon-grid2/3/4`), type (`.axon-h1`, `.axon-p`, …),
components (`.axon-button`, `.axon-form_card`, `.axon-ba_item`, …), all with tablet/landscape/
portrait breakpoint overrides. ~140 styles created site-global; shared CSS is idempotent across
the three pages. House reference: Grand Mission Dentistry's `campaign-*` ad pages (same
naming spirit); this client's pages are `axon-*` because the campaign is All-on-X.

## Copy rules that were enforced

- Every fact sourced from the client's own live site (Dr. Stone's credentials, the process, the
  FAQ answers, the `$25,000–$50,000` per-arch range and finance partners, "255+ five-star
  reviews", "available 24/7", hours, languages). Nothing invented.
- Zero Livewell copy: after building, the rendered pages were diffed against the Livewell
  originals on 6-gram overlap; 343 shared 6-grams were found and rewritten down to 3, and the
  remaining 3 are boundary artifacts across separate elements (e.g. a heading followed by a
  button label), not sentences. The check script lives next to the build (see below).

## Forms

Both form cards embed the practice's existing GoHighLevel form (the same widget as the client's
`/contact` page) via an HtmlEmbed iframe:
`https://api.leadconnectorhq.com/widget/form/0mtZk3CrshD7Y0OYOao4`.
GHL iframes cannot be inserted through `whtml_builder` (sanitized) — create an `HtmlEmbed` with
`data_element_builder`, then set its `code` setting with `data_element_settings_tool`. The
thank-you page intentionally has no form (call CTA instead). If the client wants campaign-level
lead tracking, a dedicated GHL form for this campaign should be created in their GHL account and
swapped in.

## Build mechanics (reproducible)

- `workflows/07-webflow-build/.tmp/mcp-call.py`: minimal JSON-RPC client for the Webflow MCP using the
  `webflow-brandklout` OAuth token from `~/.claude-team/.credentials.json`. The token does **not**
  work as a Bearer token against `api.webflow.com` — MCP only.
- `workflows/04-design/.tmp/build/content.py`: the single source of truth for all three pages
  (sections as HTML + the shared CSS).
- `build.py` / `rebuild.py` / `add-forms.py`: insert, wipe+reinsert, and re-attach form embeds.
- Publish: `data_sites_tool` → `publish_site` with the four domain **IDs** (not URLs) and
  `publishToWebflowSubdomain: true`. Expect a 429 on rapid retries; wait and repeat.

## Build gotchas learned here

- `whtml_builder` drops a class from an element when no CSS rule for it exists in the call or the
  site — a placeholder div with a class but no styles comes back classless. Give every element a
  rule, or query for it by position instead.
- Descendant selectors (`.grid img`) and `:first-of-type` are rejected; media queries must use
  Webflow's exact breakpoints (tiny = **479px**). A single bad rule aborts the whole call.
- `<style>`/`<script>` are stripped from `html` — custom components go in an **HtmlEmbed**
  (`data_element_builder` → type HtmlEmbed, then set its `code` setting), which allows them.
- `query_elements` with `return_parent` returns the element itself, not the parent — walk a
  full-depth `get_all_elements` tree locally instead.
- **HtmlEmbed `code` has been observed to end up empty after later element operations on the same
  page.** After any structural change, re-read the `code` setting of every embed
  (`get_settings` → key `code`) and re-set if empty, before publishing.

## QA

Screenshots of every section on all three live pages are in
`workflows/08-qa/.tmp/screens/` (captured via the Orca browser). Verified: typography (Italiana
renders), responsive CSS published, forms render, images resolve, no Livewell markers, correct
titles. Not yet done: mobile-viewport screenshots, form submission end-to-end test.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../SYSTEM_RULES.md). This doc and the
`04-design/.tmp/build/` scripts are committed. Screenshots and downloaded reference HTML/CSS stay
untracked media.
