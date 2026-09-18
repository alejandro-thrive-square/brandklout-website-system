# 2026-09-18 - The Webflow ad pages on production: already cloned, verified, two leaks fixed

**Request:** "We have a Webflow site with landing pages. Extract those pages and clone them exactly
on Mason Park production so we can run ads meanwhile the new design is developed."
**Workflow:** [`workflows/10-lp-instatic/`](../../workflows/10-lp-instatic/README.md)
**Commit:** `a54648b0`

## What was found

- The Webflow site is **Mason Park Dental** (`6a60bdc0340e5f1784b4d553`,
  `mason-park-dental.webflow.io`, no custom domain, last published 2026-08-21). Eight pages: Home,
  a draft Style Guide and the **six ad pages** - `/invisalign`, `/invisalign-consultation`,
  `/invisalign-thank-you`, `/new-patient-special`, `/new-patient-special-consultation`,
  `/new-patient-thank-you`.
- **The clone already existed.** Workflow 10 ported these six to production at the same slugs on
  2026-08-28, with the GoHighLevel forms and call tracking. All six answered 200 on
  `www.masonparkdental.com` before this run started.
- So the run became a fidelity audit of production against Webflow, and it found two real defects.

## Done

- **CSS leaks closed.** The main site's unscoped `h1..h6`, `h2` and `.button` rules were setting
  properties the landing pages never set: buttons, form-card titles, step titles and every
  thank-you heading were in **Figtree** instead of Montserrat, h2s were tracked `-0.8px` and in the
  site's ink, `.button` was an `inline-flex` with an 8px gap. `build.mjs` now opens `lp.css` with a
  three-rule leak block.
- **`/invisalign` has its Privacy Policy link back.** `build.mjs` used to unwrap the PDF link to
  bare text (Instatic cannot host a PDF), which also left the text at 18px white instead of 12.8px
  at 60%. It is a `base.link` to the original Webflow CDN PDF again, class `lp_footer_legal-link`.
- **New gate `type-diff.mjs`** and **`patch-live.mjs`** (in-place, idempotent). `verify-form.mjs`,
  `compare.mjs` and `hero-shot.mjs` fixed; details in the workflow README.
- **Production written twice**, both through `patch-live.mjs --apply --publish`: shell seq 31 to 32
  (leak block, link, class), then 32 to 33 (the body-font rule replaced the portal rule). Published
  `2026-09-18T16:41:10.480Z`, 78 draft / 78 published, no drift. Backup taken first:
  `09-static-rebuild/.tmp/backup-www.masonparkdental.com-2026-09-18T16-30-40.json` (78 pages,
  153 media, shell seq 31; not committed, 18 MB).

## Verified, on production

| Gate | Result |
| :--- | :--- |
| `type-diff.mjs --all`, 1440 and 390 | 0 problems: every text element and every classed element matches Webflow |
| `compare.mjs --live --settle 14000` | text within 12 characters, heights within 1%, 0 broken images |
| `verify-live.mjs` | 0 problems; `/about-us` and `/our-services` still DM Sans, no `.lp-page` |
| `verify-form.mjs` | 0 problems; right campaign id on four pages, none on the thank-you pages |
| `verify-tracking.mjs`, `verify-faq.mjs` | 0 problems each |

## Next

1. **The Webflow site has unpublished Designer edits.** `/invisalign` reports `lastUpdated`
   2026-09-18T15:47Z and both New Patient pages 2026-08-28, against a last publish of 2026-08-21.
   Production mirrors what is published. If someone is editing those pages in Webflow and wants
   the edits live, publish the Webflow site to its `webflow.io` subdomain first, then re-capture
   (`fetch-assets.mjs`, `build.mjs`), diff, and ship the difference as a patch.
2. Production's Termly script is loaded with `autoBlock=on`; the agency standard in process
   module 23 is `autoBlock=off`. Forms, tracking and reviews all pass with it on. Not changed here.
3. These six root slugs are what the live ads point at. The redesigned set on staging lives under
   `/ads-landing-pages/` and is unaffected.

## Gotchas

- **Scoping a stylesheet protects only the properties it sets.** `.lp-page .button` outranks
  `.button`, but a property only the site's rule declares still applies. Any new unscoped element
  or shared-class rule in the main site's CSS is a new leak on these pages. Run
  `type-diff.mjs --all` after the main stylesheet changes.
- **Height and text gates cannot see a typeface.** Three weeks of green gates; the wrong face
  moves a page by a few pixels.
- **`compare.mjs` without `--live` compares the local preview**, and with no preview running it
  reports six pages of "-89% HEIGHT DRIFT" against a 1200px error page.
- **The GoHighLevel frame grows from 150px to about 900px for several seconds.** A 13% height
  drift that vanishes with `--settle 14000` is the form. The reference's own height moved 1,400px
  between two runs.
- **`captureBeyondViewport` draws a fixed header in the middle of the page and can leave the form
  frame blank.** Both looked like production defects and were not; `hero-shot.mjs` settled it.
- **The Sienna widget floors font sizes inline** (12.8px to 12px) once it runs. 105 "differences"
  became 34 real ones when the gate blocked it.
- **Termly appends `privacy_*` parameters to the form frame's `src`**, so an id read with
  `split("/").pop()` no longer equals the form id.
- **Elfsight sets `font-family:inherit` on its portal root** and beats a rule aimed at the portal.
  Set the face on `body:has(.lp-page)`, as Webflow sets it on `body`.
- **Do not re-run `import.mjs` to change a live page.** It rewrites all six pages from a
  conversion that predates the placed embeds. Patch in place.
- **`build.mjs` in this worktree rewrites `forms.json`, `media-manifest.json`, `tracking.json` and
  the page JSONs with CRLF and zero byte counts**, because the capture is checked out with CRLF
  and `capture/assets/` is not committed. `git diff --ignore-cr-at-eol --numstat` shows what is
  real; restore the rest.
- **Python through a bash heredoc loses backslashes too**, and an `assert` that fails halfway
  leaves the first file written and the second not. Use the editor for anything with escapes.

## Version Control

Follows the root rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md). Implementation and the
workflow README are commit `a54648b0`; this run file, the index and the standing runbook are
committed separately as the documentation handoff.

## Infrastructure

Production runs on Railway/Instatic behind Cloudflare. The scripts drive the installed Chrome over
CDP from Windows through Git Bash and use platform-neutral Node APIs, so they remain compatible
with Ubuntu 24.04 LTS on the Hostinger VPS given a `CHROME_PATH`.
