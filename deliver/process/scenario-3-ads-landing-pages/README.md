# Scenario 3 · Ads Landing Pages

Brandklout's paid-traffic unit is a **combo of three pages per campaign**, all under
`/ads-landing-pages/`:

    landing (form in the hero)  ->  consultation (form first)  ->  thank you (phone first, conversion fires)

Each campaign has its own Go High Level form, and that form redirects to that campaign's own
thank-you page. Without that, the Google Ads conversion never fires and leads are untagged.

The reference is Livewell's live set (`livewelldentalva.com/ads-landing-pages/{dental-implants,
dental-implant-consultation, thank-you-implants}`). **Follow its flow beat for beat.** Dr. Nahlah's
and Mason Park's first cuts improvised the flow, and both were rejected. Spend the originality on
the client's own design system, not on the order of the sections.

Works on both platforms: Instatic (Dr. Nahlah, Mason Park) and Webflow (Livewell, Stone Dental,
Arvada).

## Steps

| Step | Directive | Output |
| :-- | :-- | :-- |
| 01 | [01-campaign-intake.md](./01-campaign-intake.md) | `combo.json`, `INTAKE.md`, forms checked, assets located |
| 02 | [02-build-the-combo.md](./02-build-the-combo.md) | three pages per campaign on staging, named as the reference names them |
| 03 | [03-qa-and-launch.md](./03-qa-and-launch.md) | gates green on staging and production, a human test lead, handover |

The client's working folder is `deliver/brandklout/<client>/workflows/ads-landing-pages/`.

## The manifest

Every gate reads one `combo.json` (template: [scripts/combo.example.json](./scripts/combo.example.json),
filled with Livewell's live values). It gives the origin (`--origin` overrides it for staging),
the production origin, the folder prefix, the display phone, the tag strings that must be on
every page, the campaigns (`name`, `landing`, `consultation`, `thankYou`, `formId`, `conversion`)
and the number pools (`src`, `pages`, `except` globs). If a campaign is added, add it to the
manifest and every gate covers it.

## Scripts

All scripts are Node 22 or later, with no npm dependencies. Browser gates drive the installed
Chrome over raw CDP (set `CHROME_PATH` if Chrome is not at the Windows default). Redirect output
to a file (`> x.log 2>&1`). Never pipe it: Node 24 on Windows dies when stdout is a pipe.

| Script | Purpose | Usage | Origin |
| :-- | :-- | :-- | :-- |
| `verify-combo-live.mjs` | Fetch-only gate for every page and form. Checks: 200 for a browser and for AdsBot with `?gclid`, noindex, not in the sitemap, the right form on landing and consultation, no form and a `tel:` link on thank-you, the landing page links to its consultation page, no `ad`-named classes, tags present, the phone in a DNI-swappable format, and each form's redirect. | `--combo c.json [--origin url]` | bk-dr-nahlah `workflows/22-instatic-api-sync/verify-ads-live.mjs`, generalized and extended |
| `check-ghl-form.mjs` | Reads a GHL form's public settings. Fails if save-and-exit is on, or (with `--combo`) if the form does not redirect to its campaign's thank-you page. | `<formId>...` or `--combo c.json` | bk-ifa-dentistry `workflows/21-instatic-upload/check-ghl-form.mjs`, plus the redirect check |
| `verify-form.mjs` | Rendered form check. Exactly one iframe with the right id, form and loader requests return 200, no CSP blocks, width at least 90% of its card, not clipped by any ancestor. Thank-you pages must have no form. | `--combo c.json [--origin url] [--widths 1440,390] [--wait ms]` | bk-mason-park `workflows/10-lp-instatic/.tmp/verify-form.mjs` merged with `09-static-rebuild/.tmp/probe-ad-form-box.mjs` |
| `probe-adblock.mjs` | Uses CDP to ask Chrome which foreign `!important` hiding rules hit an element (ad-blocker cosmetic lists). | `<url>...` or `--combo c.json` | bk-mason-park `workflows/09-static-rebuild/.tmp/probe-adblock.mjs`, ported off playwright-core |
| `check-conversion.mjs` | Lists the GTM, Google Ads and GA4 ids reaching each thank-you page, and whether the path is named in the GTM container. | `--combo c.json` | new, 2026-09-23 |
| `dni-proof.mjs` | Proves the GHL number pool actually swaps the number, walking the pages as one visitor. `--relay` routes the pool's calls through Node, which works around NordVPN; `--accept` clicks through Termly. | `[--relay\|--accept] <url>...` or `--combo c.json` | bk-dr-nahlah `workflows/22-instatic-api-sync/dni-proof.mjs` |
| `check-pool-scope.mjs` | Checks every sitemap URL and every combo page: each carries exactly the pools the manifest globs give it, no pool is consent-held unexpectedly, and the CSP allows the pool's calls. | `--combo c.json [--origin url]` | bk-dr-nahlah `workflows/22-instatic-api-sync/check-pool-scope.mjs` |
| `grab-page-images.mjs` | Downloads every image on a set of pages, one folder per page, with a manifest per page and a README for the set. | `--out dir [--title T] <url>[=Title]...` | bk-arvada `workflows/07-webflow-build/.tmp/grab-page-images.mjs` |
| `lib/combo.mjs` | Shared helpers: loads the manifest, lists the URLs, fetches with a browser UA, and reads GHL forms. | imported | new |
| `lib/cdp.mjs` | Minimal headless Chrome over CDP. | imported | the raw-CDP harness shared by the Mason Park and Dr. Nahlah gates |

Not promoted: the page builders and push scripts. Their content is specific to each client, and
the directives point to them as examples: Mason Park `build-ads-landing-pages.mjs` and
`place-ad-embeds.mjs`; Dr. Nahlah `build-site.mjs`, `ads-to-nodes.py`, `push-ads-pages.mjs`,
`set-site-tags.mjs`, `upload-ads-media.mjs`; Stone Dental `build_v2.py`; Arvada `v2-native/`.

## Hard rules (each one cost a day)

- Never name a class or id `ad`-anything. Ad blockers collapse those elements on http(s) only, so
  every local gate stays green. Use `lp-*`.
- A GHL form stays invisible to automation behind Turnstile. Prove it on the deployed domain,
  never from localhost.
- The form slot's classes carry over to the Instatic Embed block. Scope placeholder CSS to
  `:not(.wz-embed)`, and reserve the form's height.
- Never pin or re-parent an iframe. Each move reloads it.
- A DNI test walks the pages as one visitor. Clearing cookies burns real pool numbers.
- Keep pools and real GTM off staging.
- On Instatic, a row PATCH flattens a nested slug. Re-save the page through site-document.

## Version Control
Follows [SYSTEM_RULES.md §4](../../../SYSTEM_RULES.md).
