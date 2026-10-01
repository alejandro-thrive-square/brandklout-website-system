# hackensack-dental-implants runbook

Standing state: what is true now, what is next, the traps. Each step's own history is in its
`output/RUNBOOK.md`; add a row below for every run.

## Standing

**Hackensack Center for Dental Implants**, a Brandklout client. The worktree `bk-hackensack-dental-implants`
owns this folder and nothing else. Start at [`docs/project-overview.md`](./docs/project-overview.md).

- **The current site is captured in full** (2026-09-30): 38 pages, 1440 + 390 screenshots, 675 assets,
  a scanned mirror that renders offline, 6 blog posts from the Webflow CMS, URL inventory, email DNS,
  tracking. Read [`docs/migration/old-site-capture.md`](./docs/migration/old-site-capture.md) first.
- **The home page is on Instatic staging:** https://hackensack-dental-implants-staging.up.railway.app/
  (not indexed). Built to the concept the client chose, concept 04
  (https://hackensack-dental-implants.webflow.io/concept-04-human-transformation), with editorial
  motion, pointer interaction and editorial layouts in nine of twelve blocks (2026-09-30). Read
  [`scenario-0-new-site/03-design-build/output/canary-review.md`](./scenario-0-new-site/03-design-build/output/canary-review.md).
- **Film hero and the doctor moved up** (2026-10-01, Jess): the hero is now a muted loop cut from the
  Isaac and Daniel patient films (agency Vimeo, folder "Hackensack Center") with Dr. Meskin's card
  and the 4.7 Google rating in the first view, and "Watch Isaac's story" opening the full film with
  sound. Chapter 1 is now the doctor: credentials, then four numbers (4.7, 50,000+, 30+, 4) and the
  three surgeons. **Two numbers are the practice's own claims, to confirm** (canary-review items 7
  to 10).
- **Google reviews on staging** (2026-09-30): the client's Elfsight widget (`cf96ca10-…`, registry key
  `hackensack`) is an Embed block under the Smile Gallery (`#reviews`), placed by the push chain from a
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
- `scenario-1-migration` is started (from `dd0359ee`) because the capture step lives there. **The
  scope is still not recorded**: migration to Instatic, or work on the Webflow site, is not decided.
- The current site is Webflow site `6a1f4de5739bab24f074660f`, in the `webflow-brandklout` grant.
  Read-only: [`docs/mcp-access.md`](./docs/mcp-access.md).
- Shared drive `0ADqUKcTkH0SxUk9PVA` is readable and holds logos, before and afters, clinical and
  office photos. Nothing is pulled from it yet.
- Heavy capture files are in R2 ([`assets.tsv`](./assets.tsv)), not on the shared drive.
- `~/.webzite/.env` `[hackensack-dental-implants]` has the Railway project id, both Instatic URLs and
  the password reference. `INSTATIC_BASE_URL` is PRODUCTION: prefix staging explicitly.

## Next

1. BugHerd #10 (reviews widget on the wrong Google listing) and posting the replies wait on
   Alejandro: `scenario-0-new-site/03-design-build/output/bugherd/2026-10-01/change-list.md`.
1. Get rulings on the ten items in `canary-review.md` (7 to 10 are new: team numbers, rating
   listing, other dentists in the film, captions), and decide where the menu, financing, hours
   and office photographs go (the concept has no place for them); then the inner pages.
1. Record the scope and the Asana task in `docs/project-overview.md`, and get a ruling on the
   content findings (blog posts that still name Arvada Dental Center, four dead links, the second
   phone number).
2. Upload the capture to the shared drive (manual) and re-run the Wayback sweep once; both are in the
   step runbook.
3. Migration: step 02, redirect map. Staying on Webflow: start `scenario-6-webflow-sites` instead.
4. On `main`: add this client to the Webflow registry in `deliver/docs/mcp-access.md` and to the map
   in `deliver/docs/GOOGLE_DRIVE.md`, and fix the capture scripts for Webflow (list in the step runbook).

## Gotchas

- **Paths.** The step output folder is ~180 characters deep and Windows stops Python at 260. Capture
  files use short flat names; do not nest deeper under `output/`.
- The toolkit copy in `tools/instatic-site` needs three workarounds to push (missing `paths` import, embed markers, favicon name). They are scripted in `output/code/push-staging.sh`; the fixes belong on `main`.
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

## Version Control

Follows [SYSTEM_RULES.md §5](../../../SYSTEM_RULES.md).
