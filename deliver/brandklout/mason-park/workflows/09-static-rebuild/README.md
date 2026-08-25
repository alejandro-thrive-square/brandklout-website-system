# 09 — Static rebuild of bestdentistinkatytx.com

**Status: the main site is rebuilt and passing its own QA gate. 72 pages, 0 blockers, 0 errors,
0 warnings.** Blog posts are deliberately out of scope.

The client's WordPress install is compromised (see the malware sections in `.claude/RUNBOOK.md`
and [`docs/security-incident-2026-08-24.md`](../../docs/security-incident-2026-08-24.md)) and
SiteGround is taking it down. This workflow rebuilds the site as **plain static HTML/CSS**, with no
WordPress, no plugins, no PHP and no database — so there is nothing of the old attack surface left
to re-infect. The output is a flat folder ready to host on **Instatic**.

## Run it

```bash
cd deliver/brandklout/mason-park/workflows/09-static-rebuild/.tmp
node extract.mjs      # crawl snapshots -> content/*.json   (only needed if the crawl changes)
node build.mjs        # content + templates -> dist/
node audit.mjs        # QA gate; exits non-zero on any blocker or error
node shot.mjs .       # screenshot the built pages (add --mobile for 390px)
```

`dist/` is the deployable site. It is gitignored — it is generated, and it carries ~14MB of the
practice's photography, which the repo rules keep out of git.

## What is in the build

| | |
| :--- | :--- |
| Pages | **72** — 35 service pages, 3 doctor pages, 11 hand-authored pages, 23 content pages |
| Images | 126 files, 13.3MB, all copied from the pre-takedown crawl |
| Third-party code | none, except Google Fonts, the practice's Google Maps pin and its own booking/form embeds |
| JavaScript | one 2KB file for the mobile menu and lazy map. The site is fully usable with JS off |
| Out of scope | ~180 blog posts, `/category/*`, the blog index |

## How it works

```
.tmp/
├── pages.config.mjs     the real main menu, footer links, practice details
├── extract.mjs          drives headless Chrome over the saved crawl snapshots
├── extract-in-page.js   runs inside that page and emits structured blocks
├── content/<slug>.json  the extracted content, one file per page
├── theme/site.css       the design system (tokens sampled from the live site)
├── theme/site.js        mobile menu + deferred map
├── site/pages.mjs       hand-authored templates for the Elementor-built pages
├── build.mjs            content + templates -> dist/
├── audit.mjs            static QA gate over dist/
├── shot.mjs             serve dist/ and capture it, sliced for review
└── slice.mjs            slice a pre-takedown screenshot for side-by-side comparison
```

Source of truth is `01-content-intake/.tmp/site-scrape/` (252 rendered pages + 2,534 assets) and
`01-content-intake/.tmp/site-screenshots/desktop/` (252 full-page captures). Nothing was retyped:
copy is lifted out of the extracted JSON, and layout follows the screenshots.

**Safety**: `extract.mjs` never executes the compromised markup. Every `<script>`, `<iframe src>`,
`<img src>` and stylesheet is stripped from a throwaway sanitised copy *before* it reaches the
browser, and Chrome additionally runs with `--disable-javascript`. `audit.mjs` re-checks the built
output for every known malware IOC on each run.

## Three things found in the old site that were NOT carried over

**1. Fabricated awards.** Every Elementor page carried a hidden ThemeREX demo block listing four
awards the practice has not won — "Top Dental Clinic 2019", "Dental Business Annual Award 2020",
"Dental Laboratory 2021", "Best Dental Practice 2022" — alongside lorem ipsum body copy. It was
CSS-hidden on the live site, so nobody at the practice would have seen it, but it was in the HTML
and readable by search engines. Stripped, and `audit.mjs` fails the build if any of it comes back.

**2. The smile gallery was stock photography.** `/before-after/` was 100% theme demo content: lorem
ipsum plus the theme's own before/after stock photos, presented as this practice's results. The
rebuilt page says plainly that the gallery is being restocked and links to the treatment pages
instead. **It needs real, consented patient photography before it means anything.**

**3. Two contradictory sets of office hours.** The footer and homepage say Mon 9–6, Tue 8–5,
Wed 9–6, Thu 8–5, Fri/Sat/Sun closed. The three doctor pages say Mon 9–7, Tue 7–5, Wed 8–6,
Thu 7–5, **Fri 7–5**. The rebuild uses the footer/homepage set throughout. **The practice needs to
confirm which is right** — this is the third time this has come up (see Open Question 9 in
`docs/project-overview.md`).

## Pages that had to be authored rather than copied

| Page | Why |
| :--- | :--- |
| `/our-team/` | returned **403** on the live site, and it is in the main menu |
| `/privacy-policy/` | returned **403**, and it is linked from every page's footer |
| `/financing/` | rendered **completely empty** — header straight into footer |
| `/appointment/` | was a bare, non-functional month calendar and nothing else |
| `/before-after/` | 100% theme demo content (see above) |
| `/contacts/` | rebuilt as a real contact layout around the practice's own copy |
| `/our-services/` | the live page was an icon carousel that listed no services in text |
| `/thank-you/` | one line of copy on the live site |

`/pricing/` is **not** rebuilt: it was the theme's demo "Silver / Gold / Platinum Pack" tiers with
lorem ipsum, it is in no menu, and the practice's real prices live on `/special-offers/`.

## Open items for the client

1. **Office hours** — which of the two published sets is correct (see above).
2. **Smile gallery** — real before/after photography, with consent.
3. **Cherry financing link.** The live site's "Apply Now" pointed at
   `pay.withcherry.com/grand-mission-dentistry` — the **sibling practice's** account, so Mason Park
   applications were being attributed to Grand Mission. The rebuilt financing page describes Cherry
   but deliberately does **not** link it until Mason Park's own account URL is supplied.
4. **Heading typeface.** Headings on the WordPress site were Adobe Typekit **Stolzl**, licensed
   through the ThemeREX theme's kit. That licence does not travel to a static rebuild, so headings
   use **Figtree** (Google Fonts, closest free geometric sans). If the practice licenses Stolzl in
   its own name, swap two lines at the top of `theme/site.css`.
5. **Team profiles.** Hygienists and front-office staff are named constantly in patient reviews and
   have no profiles. `/our-team/` has a slot ready for them.
6. **Blog.** ~180 posts are captured in the crawl and can be rebuilt on the same templates when the
   main site is live. Six in-body links to blog posts are currently unwrapped to plain text; they
   are listed in `build-report.json` under `droppedLinks`.
7. **Forms.** The appointment form is the practice's live GoHighLevel form and the virtual-consult
   form is its live 123FormBuilder form; both are embedded as-is and should be test-submitted after
   launch.

## Hosting notes for Instatic

- Upload the contents of `dist/`. Every route is a directory with an `index.html`, so it works on
  any static host with directory-index support.
- `404.html` is at the root for the host's not-found handler.
- `sitemap.xml` and `robots.txt` are generated and point at `bestdentistinkatytx.com`. If the site
  launches on a different hostname first, change `SITE_URL` at the top of `build.mjs` and rebuild.
- No redirects are needed for the pages in scope: every rebuilt route matches its old WordPress URL
  exactly, so existing search rankings and inbound links land in the right place. The only
  exception is `/pricing/`, which is intentionally gone and will 404.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md). Scripts,
templates, extracted content JSON and the two reports are committed; `dist/`, `shots/` and
`slices/` are gitignored because they are generated and carry binary media.
