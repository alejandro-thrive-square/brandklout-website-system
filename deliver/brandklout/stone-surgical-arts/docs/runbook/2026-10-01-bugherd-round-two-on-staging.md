# 2026-10-01 — BugHerd round two: 127 pins applied, published to STAGING only

## What was asked

> Let's resolve the BugHerd comments

The board (project **539158**) held **127 open pins**, all from `agency@brandklout.com`, pinned on
production on 2026-09-29 and 2026-09-30, local ids #5 to #139. 64 carried attachments. Every task was
fetched by id with its screenshot and attachments (`deliver/docs/BUGHERD.md`); the scratch fetch
script is reproduced under Gotchas.

## Done

Source edits in `04-design/.tmp/surgical-arts/site-src/`, then the full pipeline to **staging**
(`https://staging.dfwsurgicalarts.com`): `upload-media` (47 new files), `build-site`,
`build-import-input`, `ship.sh` (54 pages, **0 warnings**), `push-site --apply --force`,
`place-embeds --apply` (4 blocks), `publish()` → `{"publishedPages":54}`. Staging was at seq 8
before the push (the same as after the 2026-09-30 run), so no admin edit was overwritten; snapshot in
`21-instatic-upload/.tmp/backup-staging-2026-10-01-pre-bugherd-r2/`.

**Production is untouched.** It still serves the pre-round site.

Site-wide (shared components, per BUGHERD.md's scope rule):

| Pins | Change |
| :--- | :--- |
| #5 | `--section` / `--section-sm` (58-breathe.css) cut to about two thirds; the CTA band uses `--section-sm`; the dossier hero keeps room for its Scroll cue |
| #16 | ghost words ~60% of the old size, darker stroke, opacity 0.38 → 0.55 |
| #22, #54 | navbar dropdowns: Treatments (Face, Neck & Jawline, Skin, Non-Surgical → `/treatments#…`), About (The practice, Meet the Team). CSS only, hover + focus-within. Verified opening on staging |
| #42, #139 | CTA band photo is `dr-stone-steps.webp` (3:2 frame, no fade); her name plate sits in the photo's bottom-left at every width |
| #43, #45 | footer: logo first and left-aligned, then only the main-menu links (+ Book), address, hours |
| #116 #120 #124 #130 #136 | every "Book a consultation" / "Book" on the four procedure pages → `/book` (was `#contact`) |
| #34 | the four procedure pages' booking chapter photo → `bh-dr-stone-coat-sign.webp` |
| #121 #122 #129 | layer tabs in the depth diagram's order (skin, fat, muscle; eyelids skin, muscle, fat) |

Per page: home (#13–#41, #139) — the thesis chapter retired, the surgeon chapter moved up into its
place with her sentence as heading and "Meet your surgeon" linking to her page; "What to expect"
follows the catalogue; the media band moved to the doctor's page; stars on the 4.8; concern rows
lead with the treatments + "Click for more info."; the CTA band now sits before the practice strip
and the facts (a `<!-- {{CTA}} -->` slot in the body, new in `build-site.mjs`); eight photos.
Doctor page (#17–#19, #46–#53) — hero rebuilt in three columns (name/facts, portrait, the line);
the "eye" chapter deleted; agency's surgical-approach copy verbatim; the media band; the vodcast
still; Instagram in a new tab. Treatments (#11, #90–#113, #138) — banners → hairline, bullets
instead of pills, sentence appended to the four notes (verbatim, "facial procedures" on all four
as written), a photo under each sticky fee aside, Sculptra packs as two rows. Book (#8, #9,
#81–#89) — dark card second, copy, four photos, the bold phrase that broke a numbered row, the
green wash moved to the follow-up note, the sign uncropped. Results (#10, #55, #56) — a scrolling
before-and-after strip of nine photos, the band's copy no longer says photography is coming.
Memberships (#57–#60), Team (#12, Abby's portrait), the four procedure pages' images, and the
blog: 18 article images via `blog-data.mjs` (card, article hero and every thumbnail), "apnoea" →
"apnea" in the copy (#63; slugs unchanged).

Gates: `audit.mjs` FAIL none; `check-copy` clean; `blog-validate` all passed;
`journey-test` 44/45 (the one failure is the Elfsight widget's off-origin requests, there since
2026-09-30); `all-pages` 648 assertions, 3 failures, the same three as 2026-09-30 (the widget is
`desktopOnly`, so it never shows at 390); staging `verify-live` FAIL none (54 routes, 222 URLs, 619
assets); `compare-live` against staging: 13 findings on 3 pages. `privacy-policy` and
`terms-of-service` are Cloudflare's email obfuscation (trap 31, not a defect); `book` was an
`is-in` reveal race and a single-page re-run says **no differences**.

## Not done, and why

- **#7 "the form is still pending"** — the screenshot is GoHighLevel's *Submission in progress*
  prompt. It is the form's `enableSaveExitConfirmation` setting in GHL plus the consent bridge's
  URL prefill (memory `ghl-submission-in-progress`). Fix in GHL (form `Nzf3xQVLhgMlABuVMxCN`, turn
  save-and-exit off). Nothing in this repository can reach it.
- **#95** has no attachment. Its pin is on the Face photo, same as #96 and #97, which carry
  `p-mirror`; treated as the same request.
- **Production promotion** is waiting on the user. When approved: re-run the whole chain with
  `INSTATIC_BASE_URL=https://www.dfwsurgicalarts.com` and a link dir on `-e production`, starting
  with `upload-media.mjs` (the map now points at staging). Decide first what happens to the Google
  reviews widget: the authored pages carry its markers, so a full push to production publishes the
  floating-badge widget there too (see the 2026-09-30 run).

## Decisions for the user (flag before production)

- **Before-and-after photographs.** The results page, the home results chapter, the proof photo,
  a treatments fee aside, the blepharoplasty and neck-lift pages and one blog article now show
  identifiable patients the agency supplied (`bh-ba-*`). Seven are **dental** cases (teeth, likely
  from the sister dental practice) on a facial-surgery site. The page's own history said no case
  goes up without current written consent. Confirm consent and that dental cases belong here.
- **The steps photograph.** The agency's attachment for #42/#46 was an AI-upscaled copy of
  `dr-stone-steps.webp` whose embroidery reads "Amber Marie Stone, Divine Dental Hygiene". The
  existing file was used instead. If the shirt really says that, the photo is not of Dr. Mona
  Stone and should not carry her name plate.

## Gotchas

- **The BugHerd list endpoint paginates and hides everything useful**; fetch each task by global
  id plus `/attachments.json` and `/comments.json`. 127 tasks with attachments took ~3 minutes.
- **Reviewer attachments that are `.webp` are usually the site's own files**, re-downloaded from
  `/uploads/`. A 32×32 grey-thumbnail difference against `site-src/assets/` (< 1.0) identified ten
  of them; uploading them again would have duplicated library files under new names.
- **A pin's selector can name the wrong element** when the page scrolled under the reviewer: #95's
  URL said `#neck` while its selector and screenshot were the Face band.
- **puppeteer element screenshots time out on this site** (pinned chapters + `captureBeyondViewport`).
  Take one full-page capture and crop the section boxes from it instead.
- **`journey-test.mjs` asserted the thesis chapter and the path chapter's number**; both changed
  with the home reorder and the test was updated with them.

## For main: add to `deliver/docs/BUGHERD.md` § 1

Not edited here because a client branch may only change its own client folder (check-scope). The
text to add after "The list endpoint hides the page, the selector and the screenshot.":

> Then look at the attachments before importing any of them:
> - A `.webp` attachment is usually the site's own photo, downloaded back from `/uploads/`. Match it
>   against `site-src/assets/` and reuse the existing file instead of uploading a duplicate.
> - An attachment can be an AI upscale that invented detail (here: embroidery naming somebody
>   else). When it disagrees with the original on text, a logo or a face, use the original and ask.
> - Identifiable patients (before-and-after) need the client's consent confirmed before they reach
>   production, whoever attached them. Staging is fine; flag it in the reply.
> - The selector can name the wrong element when the page scrolled under the reviewer. Trust the
>   screenshot over the selector, and the selector over the URL's `#hash`.

## Version Control

Tracked. Committed with the work it describes on `bk-stone`; not pushed, not merged.
