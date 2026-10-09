# hackensack-dental-implants runbook

Standing state: what is true now, what is next, the traps. Each step's own history is in its
`output/RUNBOOK.md`; add a row below for every run.

## Standing

**Hackensack Center for Dental Implants**, a Brandklout client. The worktree `bk-hackensack-dental-implants`
owns this folder and nothing else. Start at [`docs/project-overview.md`](./docs/project-overview.md).

- **The current site is captured in full** (2026-09-30): 38 pages, 1440 + 390 screenshots, 675 assets,
  a scanned mirror that renders offline, 6 blog posts from the Webflow CMS, URL inventory, email DNS,
  tracking. Read [`docs/migration/old-site-capture.md`](./docs/migration/old-site-capture.md) first.
- **The complete site is on Instatic staging** (2026-10-09): https://hackensack-dental-implants-staging.up.railway.app/
  (not indexed), 39 pages at the live site's own URLs (no redirects needed), after the home page was
  approved. Read [`scenario-0-new-site/03-design-build/output/site-review.md`](./scenario-0-new-site/03-design-build/output/site-review.md)
  first: the pages, what changed on the home page, eleven content questions to confirm. Source:
  `03-design-build/output/code/site-src/` (Client-First classes, tokens in the Instatic Framework,
  pages as modules over `lib/ui.mjs`; authoring rules in `pages/README.md`). Push with
  `output/code/push-staging.sh` (full replace; it re-applies the Framework before publishing).
- The home page's own review (concept 04, approved): [`canary-review.md`](./scenario-0-new-site/03-design-build/output/canary-review.md).
- **Film hero and the doctor moved up** (2026-10-01, Jess): the hero is now a muted loop cut from the
  Isaac and Daniel patient films (agency Vimeo, folder "Hackensack Center") with Dr. Meskin's card
  and the 4.7 Google rating in the first view, and "Watch Isaac's story" opening the full film with
  sound. Chapter 1 is now the doctor: credentials, then four numbers (5.0, 50,000+, 30+, 4) and the
  three surgeons, each linked to his profile page. **Two numbers are the practice's own claims, to confirm** (canary-review items 7
  to 10).
- **Google reviews on staging** (2026-09-30, widget swapped 2026-10-02): Elfsight `948f2cd1-…`, the office's own
  listing "Hackensack Center for Dental Implants" (the old site's `cf96ca10` shows the host, Aesthetic Dental Center) is an Embed block under the Smile Gallery (`#reviews`), placed by the push chain from a
  marker in the source, so a re-push keeps it. Production has it once the site is first pushed there.
- **BugHerd project 544349** "Hackensack Dental Implants" (2026-10-01) on the staging URL, with the
  usual five members (Jessica, Sang, Alejandro, Gauge, agency@brandklout.com). Instatic's CSP blocks
  the BugHerd script, so reviewers pin with the browser extension. Fix comments per
  [`deliver/docs/BUGHERD.md`](../../docs/BUGHERD.md) on `main` (scope first).
- **Instatic on Railway**, project `Hackensack Dental Implants`: production
  https://hackensack-dental-implants-production.up.railway.app (admin works, nothing published) and a
  `staging` environment with its own volume. Alejandro and Sang can log in on both; three plugins on both.
  Details: [`scenario-0-new-site/01-client-inquiry/output/RUNBOOK.md`](./scenario-0-new-site/01-client-inquiry/output/RUNBOOK.md).
- `scenario-0-new-site` is started (from `dd0359ee`); steps 01 and 02 have not been run.
- `scenario-1-migration` is started (from `dd0359ee`) because the capture step lives there. Scope:
  a new site on Instatic ([`docs/project-overview.md`](./docs/project-overview.md)); launching it in
  place of the Webflow site is the client's call.
- The current site is Webflow site `6a1f4de5739bab24f074660f`, in the `webflow-brandklout` grant.
  Read-only: [`docs/mcp-access.md`](./docs/mcp-access.md).
- Shared drive `0ADqUKcTkH0SxUk9PVA` is readable and holds logos, before and afters, clinical and
  office photos. Nothing is pulled from it yet.
- Heavy capture files are in R2 ([`assets.tsv`](./assets.tsv)), not on the shared drive.
- `~/.webzite/.env` `[hackensack-dental-implants]` has the Railway project id, both Instatic URLs and
  the password reference. `INSTATIC_BASE_URL` is PRODUCTION: prefix staging explicitly.

## Next

1. **Team review of the complete site** on BugHerd (project 544349, 23 of 23 earlier tasks done).
   Asana task *team complete site review*: in progress + comment, after confirming with the user
   (step 03 directive, item 16). Fix every comment at its source (`lib/ui.mjs` or the page module).
1. Get rulings on the eleven items in `site-review.md` "To confirm" (phone number on the legal
   pages, the blog's cost figures and zygomatic implants, the cost page prices, numbers and claims,
   the referral PDF, two pages sharing one title tag, the blog as a CMS collection).
1. On `main`: update the reviews widget row in `review-widgets.json` (`948f2cd1`), and the toolkit
   fixes listed in the step runbook (2026-10-09).
2. Upload the capture to the shared drive (manual) and re-run the Wayback sweep once; both are in the
   step runbook.
3. Migration: step 02, redirect map. Staying on Webflow: start `scenario-6-webflow-sites` instead.
4. On `main`: add this client to the Webflow registry in `deliver/docs/mcp-access.md` and to the map
   in `deliver/docs/GOOGLE_DRIVE.md`, and fix the capture scripts for Webflow (list in the step runbook).

## Gotchas

- **Paths.** The step output folder is ~180 characters deep and Windows stops Python at 260. Capture
  files use short flat names; do not nest deeper under `output/`.
- The toolkit copy in `tools/instatic-site` needs workarounds to push (missing `paths` import, embed markers, embeds on nested pages, Framework re-apply after a full replace). They are scripted in `output/code/push-staging.sh`; the fixes belong on `main`.
- **Local browser gates need `LOCAL_GATES=1 node build.mjs`** (vendor widgets keep `check-pages` from settling). Never push that build; `push-staging.sh` builds without it.
- **Every designed page needs three held scenes at 1440** (`check-pages`). A block holds only when it fits the window, so long copy can push a page under; `pages/README.md` lists which components hold.
- The design authority is concept 04 on `hackensack-dental-implants.webflow.io`, a different Webflow site from the live one.
- The step's `mirror-site.mjs`, `export-posts.mjs --scrape` and plain `extract_assets.py` do not
  work on a Webflow site. Use the four scripts in the step's `output/code/`.
- The folder was scaffolded by hand before any scenario was chosen; `scenario.mjs start` left the
  README, RUNBOOK and `docs/` alone.
- `docs/facts.md` is read off the live site, not confirmed by the client.
- The Elfsight Google Reviews app renders only when `#reviews` nears the viewport: 0px at the top of
  a fresh load is not a failure. Both embed-marker scripts once cut at the first `</div>`; the client
  copies are fixed, `main` is not (step 03 runbook, 2026-09-30 evening).

## Runs

| Date | Scenario / step | What happened | Commit |
| --- | --- | --- | --- |
| 2026-09-30 | setup | Orca worktree `bk-hackensack-dental-implants` from `main` at `dd0359ee`; client folder scaffolded; master env section added | first commit on the branch |
| 2026-09-30 | scenario-1-migration / 01-old-site-capture | Full capture of the live Webflow site: 38 pages, screenshots, 675 assets, offline mirror (scanned), CMS blog export, URL inventory, email DNS, tracking; R2 backup; content findings written up | `6e6fc2cc`; R2 manifest (1,663 files, 568 MB) in the commit after it |
| 2026-09-30 | scenario-0-new-site / 03-design-build | Home page canary: eight chapters, four pinned scroll scenes, client photos only, local build; drive pulled; probe 35/35 | `1ef53236`; R2 manifest in the commit after it |
| 2026-09-30 | scenario-0-new-site / 03-design-build | Home page rebuilt to the client's chosen concept 04 (Newsreader, DM Sans, its sections and copy); client photos; three scroll scenes; double-click preview; probe 27/27 | `073af353`; R2 manifest in the commit after it |
| 2026-09-30 | scenario-0-new-site / 01-client-inquiry | Railway project, production and staging Instatic, Alejandro and Sang on both, three plugins on both, origins clean | `a8524f16` |
| 2026-09-30 | scenario-0-new-site / 03-design-build | Home page made import-safe, pushed and published on staging; live checks 13/13, visual diff 0.62% | `a8524f16` |
| 2026-09-30 | scenario-0-new-site / 03-design-build | Home page motion elevated to the editorial standard: arrival curtain, word-rise headlines, five pinned scenes (hero, story, journey, gallery, closing), self-drawing implant illustrations, CBCT scan line, pointer cursor, magnetic rolling buttons, draggable before/after; on staging; probe 29/29, live 14/14 | `c2f57ee7`; R2 manifest in the commit after it |
| 2026-09-30 | scenario-0-new-site / 03-design-build | Layouts recomposed editorially in nine of twelve blocks: type-led masthead, moving proof line, bleeding photographs, numbered treatment index, horizontal journey, stepped gallery, name behind the team, stacked closing words; on staging; probe 28/28, live 14/14 | `354923bd` |
| 2026-09-30 | scenario-0-new-site / 03-design-build | Google reviews: the client's Elfsight widget placed under the Smile Gallery as an embed-origins Embed (marker + `embeds.json`, chain re-run, backup first); verified in Chrome at 751px with 4.7 (1,104); production untouched (empty instance); marker regexes fixed for nested divs | `c9c283aa` |
| 2026-10-01 | scenario-0-new-site / 03-design-build | BugHerd project 544349 created via API on the staging URL; five team members added by default; columns todo/doing/done; no tasks yet | see the commit after `adcfdfd0` |
| 2026-10-01 | scenario-0-new-site / 03-design-build | Film hero (muted loop from the two Vimeo patient films, full film in a light box, pause control), doctor moved to chapter 1 with credentials and four numbers after researching his reputation; on staging; probe 28/28, live 14/14, click-film 16/16 | `a12f2124` |
| 2026-10-01 | scenario-0-new-site / 03-design-build | BugHerd 544349 round: 23 tasks, 22 fixed on staging (cursor, scan line, logo, Bergen County, rating 5.0 from the office listing, clipped capitals, pins, footer); #10 reviews widget account waits on Alejandro; replies drafted, not posted | `f1d061a4` |
| 2026-10-02 | scenario-0-new-site / 03-design-build | Every fixed BugHerd pin re-checked on live staging by the new `bugherd-verify.mjs`: 24/24, shots looked at; no new BugHerd activity; #10 and the replies wait on Alejandro | `8f7a9ba1` |
| 2026-10-02 | scenario-0-new-site / 03-design-build | 21 BugHerd tasks marked done after a fresh live check (24/24); #10 (widget account) and #12 (profile pages not built) left open | see the commit after `5078725f` |
| 2026-10-02 | scenario-0-new-site / 03-design-build | Reviews widget swapped to Elfsight `948f2cd1` (the office's own listing, 5.0 from 21), verified live; BugHerd #10 done; 22 of 23 done, #12 waits on the profile pages | see the commit after `2024e3f8` |
| 2026-10-09 | scenario-0-new-site / 03-design-build | The complete site: 39 pages built in the approved design (Client-First, Framework tokens, one component library), pushed to staging; every local and live gate passes; BugHerd #12 done (23 of 23); eleven content questions in `site-review.md` | `9319e015` + the commit after it |

## Version Control

Follows [SYSTEM_RULES.md §5](../../../SYSTEM_RULES.md).
