# 2026-10-04 — FigJam *Deliver SOP's* brought up to date with the directives

## Why
The board lagged the process. Scenario 2 still described Webflow first, although Webflow moved to
Scenario 6 on 2026-09-28. The concept deck, the GHL form standard, the Elfsight standard and Codex
computer use were not on the board, and the Plugins card listed old versions.

## Done
- **All seven lanes compared against their directives** (one agent per group of lanes), then changed
  on the real board ([Deliver SOP's](https://www.figma.com/board/9684Y7YwnDo2pZr8A5rKz1/Deliver-SOP-s)):
  46 cards edited, 23 added, 2 removed. Per lane:
  - **S0:** the header now says "mirrors from main". Also the concept deck, Railway pinned by digest,
    language and buying path, the 110-word cap, the SEO crawl, the content-fit pass,
    `check-ghl-form --standard`, the Elfsight registry and standard, Codex for GHL and Elfsight,
    `termly-setup.html`, deleting staging's railway link, and rebuilding sitemap.xml.
  - **S1:** step 01 items 3-10 before Research. Also `scrape_site.py`, Wayback for a dead host,
    anonymous checks on a hacked site, and phone numbers from the raw HTML.
  - **S2:** rewritten for Instatic only (insta-api, backup-site, staging first, push-site --update,
    site-document). The two Webflow-only cards are removed, and the ads combo now points to
    Scenario 3.
  - **S3:** campaign forms on the ghl-forms standard via Codex, `--standard --landing`, Webflow
    builds in S6 section K, check-pool-scope, no-shift.
  - **S4:** the no-staging route, and the login lockout.
  - **S5:** "never deploy latest", the editor smoke test, West LA with no staging, and the Plugins
    card at aeo 1.2.0, og 1.2.3, embed-origins 1.8.0 and link-editor 1.0.2.
  - **S6:** the GHL and Elfsight standards with their gates, and Codex for apps with no API.
- Tried on the sandbox *Deliver SOP's (copia)* first, then the real board. Checked for card overlap
  in the page, by eye, and from a fresh tab that loads from the server.
- **Directives on main brought in line:**
  - `scenario-0 04-qa.md` (step 5) and `05-launch.md` (step 4): the ghl-forms and Elfsight standards.
  - `scenario-6 03-qa-and-publish.md` (step 1): the same, for Webflow.
  - `scenario-3 01-campaign-intake.md` (step 3): **we** bring campaign forms to the standard through
    Codex; Brandklout no longer edits them. The user decided this on 2026-10-04.
  - `PROCESS_INDEX.md`: the migration route.

- **QA follow-up, same day (owner's list of recurring failures).** `04-qa.md` has a new section,
  *Recurring failures: check these first*. It covers four problems: photos that don't match their
  section, each doctor's focus and reputation, repeated images, and too few assets (download licensed
  photos and videos from Magnific). There are matching checklist items, a doctors check in step 6
  and a Magnific conditional. `IMAGES.md` source 4 now says Magnific, photos and videos.
  On the board's S0 QA lane: 5 cards added and the Design & Build image-order card edited, checked
  from a fresh tab.

## Next
- Board card 272:875 (S3 intake) still says "We usually can't log in to either" for Google Ads
  and GHL. With Codex working in the signed-in Chrome, GHL is reachable. Reword it if that turns out
  to be true for every sub-account.
- The board script is not saved as a tool. If the board needs this again, the recipe is below.

## Gotchas
- **The page cannot send data to localhost.** A `fetch` to 127.0.0.1 hung until Chrome asked for
  local-network permission. Getting text out of the board: arm a capture-phase `copy` listener that
  sets `clipboardData`, press ctrl+c through the extension, then read it with `Get-Clipboard`.
  `javascript_tool` output is cut off at about 1,000 characters.
- **`node.clone()` puts the copy on the page, not in the section.** Call `sec.appendChild(c)` and
  then set x/y relative to the section. The first sandbox run left 18 stray cards on the page.
- **Shape cards have `resize`, not `resizeWithoutConstraints`.** Sections have both.
- **Only the tab in front runs `window.figma` scripts.** A script started in a background tab timed
  out and only finished once that tab was the only one open. Keep one Figma tab per run, and make
  every run idempotent: skip an edit whose text already matches, and skip an add whose text already
  exists in the section.
- **Card layout:** a lane is one column. Card bodies sit at x 280, w 696. Block labels are h45, with
  a 28 px gap before the first card; cards are 16 px apart; one line is about 85 characters, h 32
  plus 34 per extra line. To shift cards, use their original y: every node below a change moves by
  its delta. The copy board keeps the real board's node ids for lanes 0-5, but not for S6 (match
  those by text).
- **The Figma REST API is still rate-limited** (Retry-After about 52 h on 2026-10-04).

## Version Control
Tracked runbook, per [SYSTEM_RULES.md §5](../../SYSTEM_RULES.md).
