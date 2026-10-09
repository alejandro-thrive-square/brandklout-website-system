# scenario-7-seo-aeo · 04-content-depth · runbook

Newest run first. Each run: date, what was done (with the commit), what is next, and the gotchas.

## 2026-10-09 — content depth on the money pages, STAGING (the user: "go with the copy change on staging")

**Done** (this run's commit)
- `output/code/insert-sections.mjs`: new sections in an existing page, fresh-id clones of the site's
  own sections with every word from a spec, placed after a named section; `"bg"` sets the background
  tone so the page keeps alternating. Re-running rebuilds a section in place.
- `/dental-implants` 974 → 1,445 words (candidacy, recovery, risks, implant/bridge/denture);
  `/all-on-4` 1,094 → 1,299 (candidacy, recovery); `/veneers` 517 → 678 (compared, cost);
  `/implant-cost` 882 → 962 (the consultation). Brief with sources and the three statements the
  practice must confirm: `output/briefs/money-pages-depth.md`.
- Gates: overlap 6/6 CLEAN (highest `/all-on-4-mclean-va` vs hub 24.2%), keyword gate 1107/0, schema
  unchanged and CLEAN. Screenshots `output/assets/review/depth-*.png`.

**Next**
- Practice sign-off, including the three flagged statements; then production with the rest
  (`insert-sections.mjs output/code/depth/<page>.json --apply --allow-production`).
- `/all-on-4-mclean-va` sits at 24.2% against the deeper hub: any further All-on-4 hub copy must not
  reuse its wording.

**Gotchas**
- A cloned section brings its source page's background tone: set `"bg"` or two alternate-toned
  sections end up side by side.
- The same stock photo travels with every clone of a section; check each insert's image against its
  copy (three were swapped after the first screenshots).

## 2026-10-08 (later) — the gap pages and office versions, built on STAGING

The user: "give me recommendations yourself and let's go all the way through on staging". So the open
decisions were taken here (they are in the plan doc's "Decisions" section) and the new pages built on
staging only. Production and the live sitemap are untouched; nothing ships before the team's review
and the practice's copy sign-off.

**Decisions taken**
- Office URLs stay `/contact-mclean` and `/contact-alexandria` (no 301s).
- New pages, flat slugs (a nested slug flattens on a cells PATCH): `/full-mouth-dental-implants`,
  `/same-day-dental-implants` (the site states same-day provisional teeth with All-on-4), `/dentures`,
  `/full-mouth-reconstruction`, `/what-is-a-prosthodontist` (sources: ADA specialties, ACP statement),
  and four office versions: `/dental-implants-mclean-va`, `/dental-implants-alexandria-va`,
  `/all-on-4-mclean-va`, `/all-on-4-alexandria-va`.
- The other six office versions (implant dentures, veneers, full-mouth reconstruction per office)
  wait for 8 weeks of Search Console data on the first four: thin office facts, doorway risk.
- No cost pages until the practice confirms price ranges; FAQ answers cover "what does it cost" meanwhile.
- No "implant centre vs prosthodontist" page: it reads as naming chains, which needs the practice.
- `/our-facility` becomes the practice-wide facility page (keyword "in-house dental lab"); its stock
  "Reception" photo (an aquarium waiting room, not this practice) is replaced by the real Alexandria
  reception, and the Alexandria photos are labelled as Alexandria.

**Done** (this run's commit)
- `output/code/compose-page.mjs`: a page composed from the site's own sections (fresh-id clones) with
  every visible word from a spec (`output/code/pages/*.json`); `--outline` lists each section's text
  slots. Images by `media:<file name>`, resolved per host by exact name. Nine pages built, published.
- SEO titles/descriptions (`output/new-pages-seo.json`, `our-facility-seo.json`, `desc-fix-seo.json`).
- `output/code/push-text-edits.mjs` + `edits-existing-pages.json`: hub FAQs linking the new pages
  (`/dental-implants`, `/all-on-4` incl. All-on-4 vs All-on-6, `/implant-supported-dentures`,
  `/implant-cost`, `/sedation-dentistry`), Arlington named for Alexandria and Fairfax for McLean
  (office FAQs, home FAQ, schema departments), the `/our-facility` captions and photo.
- City-named FAQs via `push-page-faq.mjs` on `/meet-dr-nahlah`, `/cosmetic-dentistry`,
  `/smile-makeover`, `/crowns-and-bridges`, `/teeth-whitening`, `/emergency-dentistry`, `/oral-surgery`.
- `output/code/nav-add.mjs`: the five new topic pages in the menu drawer of all 49 pages that carry
  one (the 19 ads landing pages have none, left alone). Articles show it through their template.
- Schema: base entries for the nine pages (MedicalWebPage + Service, + SurgicalProcedure where it is
  one; office versions tied to their office and its towns; no `reviewedBy` until sign-off); scan with
  the new `--also` flag (main `976dd0c9`); VOCAB CLEAN, SCHEMA CLEAN; every new page's JSON-LD parses
  with its FAQPage (`output/ld-new-pages.log`). FAQPage now on 22 sitemap pages + the nine.
- Gates: overlap `twins.txt` CLEAN 6/6 (twins 19.2% and 21.3%, office versions vs hub 19.5–21.8%);
  keyword gate CLEAN 1107 passed, 0 failed (`/our-facility` passes now), 22 warnings, all on old posts.

**Next**
1. Team review of the plan doc and staging; practice sign-off on all new copy (list in the plan doc).
2. Production, in order: step 03's office pages (uploads the Alexandria photos), then each
   `compose-page.mjs <spec> --apply --allow-production`, `set-page-seo` with the three SEO files,
   `push-text-edits` + the FAQ specs, `nav-add`, `push-keyword-h1 --only /our-facility`, schema.
   Then the sitemap (Scenario 0 step 06) and Search Console submission.
3. After sign-off: add `reviewedBy` + `lastReviewed` to the nine base entries.
4. Eight weeks after launch: GSC for the four office versions, then decide the other six.

**Gotchas**
- `output/siblings.txt` (informational): `/full-mouth-reconstruction` vs `/smile-makeover` is 27.4%,
  all of it floor: the drawer (106 shingles) plus the two-office booking block (55) are 27% of the
  595-word makeover page. Office versions avoid that floor by keeping only their own office's card.
- Git Bash rewrites an argument that starts with `/` into a Windows path: pass `--also` slugs without
  the leading slash.
- `media:` lookups must match the whole file name after the upload id: a suffix match picked
  `dental-implant-crown-model.jpg` for `crown-model.jpg`.
- `set-page-seo` refuses titles over 60 and descriptions outside 120–160 characters, and writes the
  SEO title into the page's title cell (`compose-page` keeps it on a rebuild).

## 2026-10-08 — dentures hub FAQ on STAGING; the rest of step 04 waits on the team and the practice

**Done**
- Brief `output/briefs/implant-supported-dentures.md`, then a 7-question FAQ (`#faq`, after `#cost`)
  on `/implant-supported-dentures`: snap-in dentures named on the hub for the first time ("snap in
  dentures" 6.3K/month), Autocomplete's "cost" and "vs All-on-4" answered. Every answer uses facts
  the site already states (the brief lists where). `output/code/push-page-faq.mjs` + its spec
  `faq-implant-supported-dentures.json`; schema rebuilt (FAQPage 15 → 16), SCHEMA CLEAN; keyword gate
  unchanged (1016 / 1, the held `/our-facility`). Screenshots `output/assets/review/isd-faq-*.png`.

**Not done, and why**
- Gap pages (full-mouth implants, dentures, cost pages, full-mouth reconstruction, same-day teeth,
  explainers) and the office versions of the money pages are **new URLs**: held until the team has
  reviewed the sitemap proposal (the user's rule).
- Deeper money-page sections (candidacy, recovery, risks, alternatives) need facts the practice
  confirms; nothing medical is invented. Ask the practice, then brief each page as above.
- Same-day teeth: a page only if the practice confirms it offers it (gap #8).

**Next**
1. Practice sign-off on every staging copy change (office pages, FAQs, H1s, titles) before production.
2. After the sitemap review: gap pages in the gap report's order, a brief each.
3. The same FAQ treatment for pages with none, once their facts are listed: `/smile-makeover`,
   `/crowns-and-bridges`, `/cosmetic-dentistry` (spec + `push-page-faq.mjs`).

**Gotchas**
- `push-page-faq.mjs` refuses a page that already has a section with the spec's id: pick a new id
  (`faq` is free on most pages; the office pages and home use `local-faq`).

## Version Control

Follows [SYSTEM_RULES.md §5](../../../../../../SYSTEM_RULES.md).
