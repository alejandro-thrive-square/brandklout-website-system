# 2026-09-10 — Homepage built as an eight-chapter journey, two more competitors, Instatic instance provisioned

**Commits:** `a1c4da87` (build + research), `56a7ab3b` (instance + provisioning script), `9ee0a7ca`
(docs), `b8ff5487` (the push — its own entry follows this one in the index).

## Done

1. **Assets local again.** The 102 MB mirror (774 files) was only in the old Webzite checkout; copied
   into `workflows/03-graphic-resources/.tmp/downloads/` (gitignored). Four photos the concept uses
   but the mirror lacked were pulled from the live site. The four practice B-roll clips
   (`Master-Broll`, `Dr-Broll`, `Emily-B-ROLL`, `Leslie-Broll`, 1080p) are the practice's best
   imagery: re-encoded for web into `04-design/.tmp/site-src/media/video/` and 13 stills cut from
   them at 1920×1080 (better than any photo the site serves, which top out at 800×535).
2. **Two more competitors scraped in full** with the existing `scrapers/scrape_site.py`:
   `santamonicaoms.com` (91/91) and `implantcenterlosangeles.com` (66/69, three 404s). Both were the
   named runner-ups in `COMPETITOR-SELECTION.md`.
3. **Homepage gap analysis, four sites** — `01-content-intake/.tmp/gap-analysis/HOMEPAGE-GAP-ANALYSIS.md`
   (scoreboard, section walks, 15 ranked gaps, the moat, a 14-section blueprint, a
   claims-to-verify table). `CONTENT-GAP-ANALYSIS.md` got a four-site update and two corrections
   (the client already carries `AggregateRating` + `VideoObject`; Wilshire emits `LocalBusiness`
   on all 79 pages — the August pass missed `@graph`). Full-page screenshots of all four homepages
   plus the concept are in `01-content-intake/.tmp/homepage-screenshots/` (gitignored).
4. **The homepage** — `workflows/04-design/.tmp/site-src/` (`node build.mjs` → `dist/`). Dark
   Surgical Luxury per the concept the client picked: palette and type read off the concept's own
   stylesheet (`#11110F/#191815/#090909/#080808`, ink `#F4EFE5`, gold `#C4A36A`, Bodoni Moda +
   Manrope, self-hosted variable woff2). Eight named chapters: Arrival (b-roll hero, split
   headline) · The Reality (pinned, statement written word-by-word by scroll) · The Answer
   (pinned horizontal rail of six treatments; native swipe rail on touch) · Precision (the
   signature moment: a gold iris opens on the Yomi robot footage while "Plan digitally. Place
   precisely. Restore beautifully." writes itself) · The Surgeon · The Transformation (light
   theme, pinned; scroll turns the page through Leslie, Emily and Michael with their real
   before/afters and links to their own YouTube films) · The Experience (amenities + the Google
   quotes as a velocity-reactive marquee) · The Invitation (form, both phone lines, hours, a
   four-question accordion). Reading-progress bar, chapter readout in the nav, magnetic CTAs,
   gold cursor, sticky mobile call bar, `prefers-reduced-motion` honoured throughout.
5. **Gates.** `journey-audit` PASS (8 chapters, 3+ pins, 18 scrubs, 0 IntersectionObserver, 0
   band classes) · `fluid-root --check` clean · scrub proof: all four pins show different states at
   25/50/75 % (`scratchpad/probe-motion.mjs`, copied into `21-instatic-upload/verify-motion-live.mjs`
   by the upload run) · six-breakpoint capture 360/390/768/1024/1440/1920, `scrollWidth ==
   innerWidth` at every one, zero console errors · captures in `08-qa/.tmp/screenshots/home/`.
6. **Instatic instance** — `https://west-la-implants-production.up.railway.app`, Railway project
   `a55b5cac-b92d-4653-a9ff-6da522a5c89c`, service "West LA Implants", created name-first by the new
   `deliver/process/22-instatic-api-sync/provision-instance.mjs` (the six mutations had only ever
   existed as prose). Healthy 10 s after deploy; admin bootstrapped for the owner account.
   Registered in `20-instatic-domain-origins/sites.json` (`check-origins --all` clean), in the
   master credential file (`[west-la-implants]` filled, `env-sync` run), and a link dir at
   `21-instatic-upload/.tmp/railway-link`.
7. **Upload toolkit** copied from Stone Med Spa into `workflows/21-instatic-upload/`; retargeting and
   the push are the upload agent's run (its own runbook entry follows).

## Next

- Send the review link to Brandklout — paste text in `../../HOMEPAGE-REVIEW-COMMENT.md`.
- Client verification list (do not publish to the real domain before these are answered): the
  implant count (concept says 6,000+, live site says "more than 5,000 sets" — the page shows
  neither), the amenities (Netflix, headphones, blankets, Spanish come from the concept's
  questionnaire, not the live site), the "1,000+ hours" and "more than a decade" claims are
  2022-era copy, the 4.9 rating in the site's JSON-LD is static 2022 markup (not shown).
- The form is a visual prototype (`action="#"`, submit is intercepted). Wire it to the Instatic
  form module before launch.
- Vector logo still does not exist; the nav uses the icon cropped from the 250 px PNG plus a
  typeset wordmark. Ask again.
- Patient consent for Leslie, Emily, Michael (stills, B-roll, before/afters) — still unconfirmed.
- Domain: `westlaimplants.com` stays WordPress until the full site exists; when it moves,
  `14-migration-seo-redirects` enters the route and `PUBLIC_ORIGIN` gains the client hosts.

## Gotchas

- **The client's own "Read Our Google Reviews" link points at Dr. Nahlah's Google listing**
  (`current-site-scrape/data/home.json`, external_links) — the previous vendor reused a template.
  The build links the West LA Google search and Yelp instead. Tell the client.
- **Footer on the live site displays (310) 481-0111 but dials 692-9316.** New-patient line is
  692-9316; that is the CTA everywhere in the build, 481-0111 is labelled "current patients".
- **The B-roll has blank beige transition frames** (Master ~5.9–6.7 s, Dr ~3.1–4.1 s and 8.4–9.9 s).
  They read as a broken video when a pin lands on them; the encodes cut them out with a trim+concat.
- **`node … | grep` crashed Node 24 with a libuv assertion** (`!(handle->flags & UV_HANDLE_CLOSING)`)
  mid-way through the provisioning run, before any mutation. Redirect to a file instead of piping.
  The script refuses a duplicate project name, so a rerun is safe.
- **journey-audit's chapter gate is 6–8.** The first cut had nine; The Proof folded into The
  Experience as a second beat (a `div.ch-proof` inside the section) rather than losing content.
- **Full-page captures need `prefers-reduced-motion: reduce`** (ScrollSmoother pins by transform);
  motion is verified separately by driving the page. The two are different tools for different
  questions — see `DESIGN-STANDARD.md`.
- The nav wrapped at 1440 during the Transformation pin because the readout text grew; nav items
  are now `flex-shrink:0; white-space:nowrap` and the readout hides under 1280 px.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md). Runbooks are tracked.
