# Scenario 0 · 03 Design & Build

## Purpose

Build the site on the VPS, get the core pages approved, then build and upload the complete site to
Instatic staging for team review. The design bar is
[`DESIGN-STANDARD.md`](./DESIGN-STANDARD.md), which lives beside this directive; its static motion gate
is `scripts/journey-audit.mjs`.

## Inputs

- Style pick and `reference-inventory.md` (step 01), sitemap, keyword map and confirmed claims (step 02).
- Client assets: the Google Drive, any album or links in the brief, and the old site's assets
  ([`IMAGES.md`](../../../docs/IMAGES.md) §1).

## Checklist

- [ ] Client-First framework set up on Instatic: tokens in the Framework panel (`framework.mjs apply`), manual-edit proof done (`INSTATIC-FRAMEWORK.md`)
- [ ] Every style editable by hand: `editability.mjs --published` ends `EDITABLE` on staging
- [ ] Every class inside Client-First + Relume ([`CLASS-STANDARD.md`](../../tools/client-first-style-guide/CLASS-STANDARD.md)): `class-audit.mjs --local <site-src> --strict` before the first push, `class-audit.mjs --site <client>:staging --strict` after every publish, both `IN BOUNDS`
- [ ] Facts sheet (`docs/facts.md`) complete
- [ ] Images sourced client-first, every photo matching its text, none overused (`IMAGES.md`, ledger in `output/images.csv`)
- [ ] Core pages built and tested
- [ ] Developer core pages review
- [ ] Client core pages review, approved
- [ ] Complete site built and tested
- [ ] Legal pages (privacy, terms, SMS)
- [ ] Ads landing combos, if running ads
- [ ] Uploaded to Instatic staging with the full push pipeline
- [ ] Team complete site review on BugHerd

## Steps

1. **Framework.** Create the Client-First style guide page with the base components on Instatic
   ([`tools/client-first-style-guide/`](../../tools/client-first-style-guide/),
   [`CLIENT-FIRST.md`](../../../docs/CLIENT-FIRST.md)). Put the Relume style guide's tokens, brand
   colours from the style pick, type sizes, spacing and radii **in the Instatic Framework panel**, by
   [`INSTATIC-FRAMEWORK.md`](../../tools/client-first-style-guide/INSTATIC-FRAMEWORK.md): root 16 and
   rem, Framework-safe names, min = max on every size. The `tokens.css` code asset must not re-declare
   any of them, or a hand edit in the Framework is silently overridden. Draft the spec with
   `tools/instatic-api-sync/framework.mjs extract css/01-tokens.css`, review it, `apply` it on staging
   and production; `css/01-tokens.css` in site-src mirrors the Framework (`framework.mjs pull`).
2. **Breakpoints and type.** Add the `desktop` base breakpoint plus 1279, 991, 767 and 479 on Instatic.
   One fluid `html { font-size }` ([`FLUID-ROOT.md`](../../../docs/FLUID-ROOT.md),
   `node scripts/fluid-root.mjs`); type, spacing and radii in `rem`, never `px` and never `clamp()` for
   font size. Font sizes live on the Client-First type role classes.
3. **Fonts and styles.** Upload fonts to Instatic's font library on production and staging
   (`tools/instatic-api-sync/install-fonts.mjs`). Keep styles in the Styles panel registry so the
   client can edit them (`tools/instatic-api-sync/migrate-css-to-registry.mjs`).
4. **Classes.** Start `site-src/css/10-client-first.css` as a copy of
   [`client-first-starter.css`](../../tools/client-first-style-guide/client-first-starter.css) (the whole
   Relume utility vocabulary on Framework tokens) and the Framework spec from
   [`framework-spec.template.json`](../../tools/client-first-style-guide/framework-spec.template.json)
   (fill values, keep names). Name every class by [`CLASS-STANDARD.md`](../../tools/client-first-style-guide/CLASS-STANDARD.md)
   from the first line of HTML: Relume utilities first, custom classes `folder_element` in full words
   (no `btn`, `rv-`, `-num`, `eyebrow`, `wrap`), combos `is-*`, scripts select by `data-` attributes, not
   styling classes. `tools/instatic-api-sync/class-audit.mjs --local <site-src> --strict` must end
   `IN BOUNDS` before the canary is shown. Fixing names after launch costs a fleet migration.
5. **Facts sheet.** Keep phones, hours, addresses, doctors and credentials in `docs/facts.md` and build
   every page, footer and schema from it.

### Core pages

6. Build a canary first: home, one service page and contact, on the VPS in
   `scenario-0-new-site/03-design-build/output/code/site-src/`, from the inquiry, research and style pick.
7. **Images, by [`IMAGES.md`](../../../docs/IMAGES.md).** Source in order: the client's Google Drive,
   albums and links in the brief, the old site's assets, then licensed stock (Freepik), AI last and
   with approval. Every photo shows what its heading says (fit score 3), appears once per page and on
   at most two pages, and each page's hero is its own. Keep the ledger in `output/images.csv`. Check
   every upscaled face with `tools/instatic-site/images/contact-sheet.py`.
8. Test at every breakpoint with Playwright and run the local gates (`gates/check-pages.mjs`,
   `click-controls.mjs`, `colour-leak.mjs`, `cross-client-grep.mjs`, `image-reuse.mjs`,
   `fluid-root.mjs --check`).
9. Asana task *developer core pages review*: in progress + comment (confirm first).
10. Push to staging (pipeline below) and send the client the links. Remind until approved.
11. Freeze the approved tokens, shell and components. Later pages vary in content and layout, not in
    system.

### Complete site

12. Build every page in the sitemap. Blog: CMS collection and template page.
13. Legal pages from the client's own privacy, terms and SMS text. Ask the practice; don't draft them.
14. Ads combos if the client runs ads ([Scenario 3](../../scenario-3-ads-landing-pages/README.md)).
15. **Push pipeline, every time, to staging only:** back up (`ops/backup-site.mjs`) → `push/upload-media`
    (new filename for any re-cut image) → `set-alt` → `build-import-input` → `ship.sh` → `push-site` →
    `place-embeds` → `ops/apply-template-flags` (blog, 404) → `gates/template-guard` → publish. Then
    `gates/verify-live`, `css-declared-parity`, `compare-live`, `visual-diff`, `verify-motion-live`,
    and `tools/instatic-api-sync/editability.mjs --published`, which must end `EDITABLE` (every style
    in the Framework or the Styles panel, none in a code asset:
    [`INSTATIC-FRAMEWORK.md`](../../tools/client-first-style-guide/INSTATIC-FRAMEWORK.md)), and
    `class-audit.mjs --site <client>:staging --strict`, which must end `IN BOUNDS`.
    `image-reuse --base <staging>` must end `0 problem(s)` on the complete site.
    Details: [`tools/instatic-site/README.md`](../../tools/instatic-site/README.md).
16. Asana task *team complete site review*: in progress + comment (confirm first). The team reviews on
    BugHerd; fix every comment, deciding its scope first ([`BUGHERD.md`](../../../docs/BUGHERD.md)):
    a comment about a shared style or component, or one that says "all pages", is fixed at the
    source and checked on every page.

## Conditionals

- **If the client rejects a version:** rebuild at the elevated level (photo on every page, GSAP scroll
  moves, varied backgrounds, a sentence per idea), not a patch.
- **If the client supplied the design:** import it verbatim and prove it with `visual-diff --source`
  at 0.000%.
- **If there are no client photos:** check the Drive, the brief's links and the old site before
  saying so; then stock, and AI with approval. Doctors, team, patients and the office are never stock
  or AI: leave the slot and ask. A Magnific upscale below ~500px invents a new face: use the original.
- **If the client library is thin:** vary crop and framing before repeating a photo; the reuse limits
  still hold.
- **If the site has more than one office:** location pages are clones of the `[City]` branch, each
  with its own facts.

## Do / Don't

- Do make it fully responsive with high-end GSAP motion; smooth scroll on desktop only.
- Do use references as inspiration with plenty of layout variation.
- Do keep light backgrounds: brand dark for text, accent for fills and lines.
- Do keep text readable while it animates and photos in colour at rest; refresh ScrollTrigger when the
  page height changes.
- Do take only the palette and typefaces from a brand guide or board; the composition is ours
  (`DESIGN-STANDARD.md`, "What a brand handoff supplies").
- Do name chapter tags; never number them ("Chapter 04").
- Don't ship a wall of text: at most ~110 words of consecutive paragraphs, fold the rest into
  `<details>`, never rewrite clinical copy (`DESIGN-STANDARD.md`, "No wall of text").
- Don't use em dashes in copy.
- Don't put a photo on a section it does not show, or reuse one photo across many pages.
- Don't use the reference sites' code, only their screenshots.
- Don't copy reference layouts.
- Don't use `ad` in class names (ad blockers hide them); use `lp-`.
- Don't pin or move an iframe; the GHL form reloads every time.
- Don't push to production from this step.

## Tools

- `tools/instatic-site/` — push pipeline, ops, local and live gates, images.
- `tools/instatic-api-sync/` — fonts, CSS into the Styles registry, parity checks.
- `tools/instatic-embeds/` — Embed blocks and site scripts.
- `DESIGN-STANDARD.md` (this folder) — the design and motion bar, GSAP self-hosted.
- `scripts/journey-audit.mjs` (this folder) — static journey gate; `scripts/fluid-root.mjs` (repo root).

## Outputs

- `scenario-0-new-site/03-design-build/output/code/site-src/` (the build)
- `scenario-0-new-site/03-design-build/output/canary-review.md`
- `docs/facts.md`

## Evidence

Runbooks: bk-brandklout-website 2026-09-15 breakpoints, type roles, v18 verbatim; bk-dr-nahlah
2026-08-21 fonts and styles, 2026-08-25 incident (43 articles 404); bk-mason-park 2026-09-10 404 page,
2026-09-18 ad pages rebuilt; bk-stone-med-spa 2026-09-03 second build; bk-ifa-dentistry 2026-09-21
redesign; bk-mason-park-kids RUNBOOK (upscaled faces); bk-stone 2026-09-01 brand handoff and
motion tests; bk-mason-park no-wall-of-text rule.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../SYSTEM_RULES.md).
