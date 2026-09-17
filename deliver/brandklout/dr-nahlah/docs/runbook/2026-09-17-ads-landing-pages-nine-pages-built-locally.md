# 2026-09-17 — ads landing pages: nine pages built locally, NOT PUBLISHED, forms blocked

Brandklout asked for Google Ads landing pages for Dr. Nahlah, ahead of Mason Park and West
LA. Three campaigns — **All-on-4, dental implants, porcelain veneers** — each a combo of
landing page, consultation page and thank-you page. Nine pages. The instruction was
explicit: Livewell's `/ads-landing-pages/*` set is a **guide, not something to duplicate**,
and the flow should be improved for conversion.

Local only, as asked. Nothing is on Instatic, nothing is published.

## Done (not committed yet)

| Campaign | Landing | Consultation | Thank you |
| :--- | :--- | :--- | :--- |
| All-on-4 | `ads-all-on-4` | `ads-all-on-4-consultation` | `ads-all-on-4-thank-you` |
| Dental implants | `ads-dental-implants` | `ads-dental-implants-consultation` | `ads-dental-implants-thank-you` |
| Porcelain veneers | `ads-veneers` | `ads-veneers-consultation` | `ads-veneers-thank-you` |

Files added under `workflows/04-design/.tmp/site-src/`:

| File | What |
| :--- | :--- |
| `pages/ads-*.body.html` (9) | The page bodies |
| `partials/lp-nav.html` | Stripped header: trust strip, logo, telephone, one CTA |
| `partials/lp-foot.html` | Two offices, hours, legal pair, medical disclaimer |
| `partials/lp-rail.html` | Mobile CTA rail, CSS-only, outside `#smooth-wrapper` |
| `css/70-landing.css` | The whole `lp-` vocabulary, 300 lines |
| `sections/lp-steps.js` | The scroll-scrubbed process rail, the one bespoke behaviour |

Files changed: `build-site.mjs` (the `landing:` branch + nine PAGES entries), `seo.json`
(nine entries, all `noindex, follow`), `fluid-qa.mjs` and `site-test.mjs` (the gates,
below). **All 37 editorial pages came out byte-identical** — only `assets/site.css` (+300)
and `assets/site.js` (+57) changed. Verified with `git diff --numstat`.

Design record, including every deviation from the reference and why:
[`SITE.md` § The ads landing pages](../../workflows/04-design/.tmp/SITE.md).

## Verified

| Gate | Result |
| :--- | :--- |
| `site-test.mjs`, all 46 pages | **778/781.** Zero failures on any of the nine. |
| `css-vocab.mjs` | 10 problems, all pre-existing, none naming `landing` |
| `check-page-lists.mjs` | all three page lists agree, 46 pages |
| per-page image repeats | 0 across all nine (bytes hashed, not filenames) |
| contrast, AA @1440 | passes on all nine |
| overflow @1440 and @390 | passes on all nine |
| `fluid-qa.mjs`, the nine at 360/390/768/991/1280/1440/1920 | **135/135** |
| CTA rail reachable on a phone | passes (hit-tested, not measured) |

Three site-test failures survive and **none of them is mine**, both files unmodified per
`git status`:

- `[index] no broken images` — an `<img>` with no `src`, created at runtime by
  `sections/ch-services.js` as `.sv-follow` (the cursor-follow image). Pre-existing.
- `[our-facility] no broken images` + `no console errors` — four `assets/tech-*.webp`
  files referenced by the page that do not exist in `final-site/assets/`. Pre-existing;
  `assets/` is gitignored and syncs separately, so this may only be a local gap.

## Next

1. **The forms, and this blocks the campaign going live.** All three consultation pages
   carry the McLean general contact form `axgcdqEPUFoHF8Dt5Nji` as a placeholder. See
   Gotchas: it cannot serve a campaign.
2. Google Ads conversions, fired on the thank-you URLs, not from page markup.
3. Review with Brandklout, then import to Instatic (workflow 22) and publish.
4. Confirm whether the same combo is wanted for Mason Park and West LA once these land.

## Gotchas

- **The placeholder form breaks both halves of the campaign, silently.** It has no
  redirect, so the visitor never reaches the thank-you page and the Google Ads conversion —
  which is a page view on `/ads-<campaign>-thank-you` — never fires. And it has no campaign
  tag, so leads from three campaigns plus the two organic contact pages land in one
  undifferentiated pile. **One LeadConnector form per campaign, each redirecting to its own
  thank-you page.** Then swap the id in the three places it appears in each embed. The pages
  render and review correctly meanwhile and collect nothing attributable.
- **Nested slugs are not an option.** Livewell's set lives at
  `/ads-landing-pages/<name>`; Instatic saves `a/b` and serves it at `/a-b`, so links to the
  nested path 404. Hence the flat `ads-` prefix.
- **`lp-nav` has to keep `id="nav"` and `#navProgress`.** `js/90-boot.js` reads both with no
  guard and throws on the first scroll past 40px otherwise, which takes the anchor handlers,
  the magnetic buttons and both `ScrollTrigger.refresh()` calls down with it. `#burger` and
  `#drawer` are absent on purpose; boot handles that already.
- **`css-vocab.mjs` rule A fails a class declared in two stylesheets**, so the landing
  stylesheet could not restate `.nav-in`, `.nav-cta`, `.nav-right`, `.foot-grid`,
  `.pg-hero`, `.rv-stars` or `.wz-embed` even to change one value. Each became either an
  `lp-` part of its own or a tag-targeted rule (`.lp-form-card iframe`). Budget for this
  before trying to tweak a site component from a new stylesheet.
- **An always-present template line that resolves to `""` rewrites every page.** The first
  build put `${railHtml}` in the fixed-UI block unconditionally and added one blank line to
  all 37 editorial pages. The block is now assembled as one joined string
  (`[navHtml, drawerHtml || railHtml].join("\n")`) so editorial output is byte-for-byte
  unchanged. Worth checking `git diff --numstat` after any build-script change.
- **A CSS counter in an empty `<dt>` will not survive Instatic.** The importer drops
  elements it considers empty, and a `<dt>` whose only content is a `::before` counter is
  one. The thank-you pages carry `01`/`02`/`03` as text instead.
- **The portrait needs `sp-fig-top`.** `DGT_Dr_Nahlah_Headshot_White-Coat_V2.png` is a
  full-length shot and `.sp-fig img` is `object-fit:cover`, so a centred crop takes the top
  of his head off. `/about` already uses the same opt-in for the same photograph.
- **`lab.jpg` IS `tech-hero.jpg`**, byte for byte, and the same holds for
  `consult.jpg`/`pt-interaction.jpg`, `Dr_Nahlah_with_patient.jpg`/`dr-with-patient.jpg` and
  `dr-headshot.png`/`DGT_Dr_Nahlah_Headshot_White-Coat_V2.png`. Using both names of a pair
  on one page is the repeat BugHerd #11 was about. Compare bytes, not filenames.
- **The LeadConnector widget hides its own iframe in headless Chrome** —
  `visibility:hidden; left:-9999px` — so the form card screenshots nearly empty. The
  existing `/contact-maclean` does exactly the same thing in the same harness, so it is the
  environment, not the page. `.lp-form-card iframe{min-height:640px}` at least holds the
  card's box while it loads.
- **The reviews are the practice's own eight**, from `reviews.json` via `gen-reviews.mjs`,
  picked per campaign by what they actually mention. No `AggregateRating` JSON-LD: self
  serving review markup on a business's own page is not eligible for rich results and risks
  a manual action.

## Version Control

Tracked with the repo. Follows the runbook rules in
[SYSTEM_RULES.md §5](../../../../../SYSTEM_RULES.md).
