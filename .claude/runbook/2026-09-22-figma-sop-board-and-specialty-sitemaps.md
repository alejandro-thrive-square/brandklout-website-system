# 2026-09-22 — Figma API access, the Deliver SOP board, and five specialty sitemap templates

## Why

The owner wanted the Deliver SOPs and the sitemap work in FigJam, readable and editable by agents,
and a set of sitemap templates per practice type drawn from what our clients actually publish.

## Done

- **Figma token.** `FIGMASECRET` in `[shared]` of `~/.webzite/.env` is now a working personal access
  token (`figd_…`). The old value (an OAuth client secret, 401 on every call) is kept as
  `FIGMASECRET_OLD`. Backup of the master before the edit: `~/.webzite/.env.bak-20260922`.
- **Deliver SOP board** ([Deliver SOP's](https://www.figma.com/board/9684Y7YwnDo2pZr8A5rKz1/Deliver-SOP-s)):
  v1 content moved into the owner's v2 card layout (section "Secenario 0", five steps), a **QA**
  step added between Design & Build and Launch, and cookie consent (Termly, process module 23) added
  to Launch. The owner deleted v1 and renamed v2 himself.
- **Sitemap board** ([Sitemap](https://www.figma.com/board/COB1NVbhZFDvCUgEB5izba/Sitemap)):
  - Section "Sitemap": the Relume ads-landing-page sitemap (Relume project `P3522107_…`), drawn from
    `deliver/process/01-content-intake/.tmp/sitemap.csv`: 22 pages, 236 sections.
  - Five sections "Sitemap · <specialty>": General & Family, Implant & Full-Arch, Oral & Maxillofacial
    Surgery, Pediatric, Med Spa. Built from 14 client sites; each card shows how many sites carry
    that page type. Umbrella-ready: brand pages at the root, locations as a cloned `[City]` branch.
  - Analysis and rerunnable scripts: `deliver/process/01-content-intake/.tmp/specialty-sitemaps/`.
  - **Second pass, same day:** the five sections were rebuilt in the Relume reference format, with
    every page's section flow (1,800+ section cards). Flows come from 191 sampled client pages
    (`outline-pages.py` → `outlines.txt`, condensed by a subagent) and live in `section-flows.py`.
  - **Third pass (2026-09-23):** the Ads Landing Pages branch is now the three-page campaign combo
    (landing → consultation → thank you, plus a clone card), following Livewell's live set.
- `01-content-intake.md` step 5: start every sitemap from the matching specialty template.

## Next

- Pediatric and Med Spa rest on one site each; revisit when a second client of that type signs.
- The owner may want the two duplicated offer sets in the Relume sitemap labelled (A / B).
- Section name "Secenario 0" on the SOP board keeps the owner's typo; not renamed unasked.

## Gotchas

- **The Figma REST API cannot write FigJam content.** Edits go through Chrome: open the board, take a
  screenshot (the tab must be in front, or `window.figma` stays undefined), then run the plugin API
  through `javascript_tool`. Reads and render checks go through REST.
- **FigJam shapes do not grow to fit text.** Size every card yourself; heights that worked are in the
  `figma-rest-api-token` memory. Check with `GET /v1/images/<file>?ids=<section>`, not by eye.
- **`/v1/files/<key>` lags edits by minutes; `/v1/files/<key>/nodes?ids=` is current.** Polling
  `/nodes` and `/images` shares one rate limit and hits 429 fast; poll every 10 s at most.
- **Reflowing by y-range captures the next row's cards** once earlier rows have moved down. Rebuild
  the section from data instead of reflowing it.
- **javascript_tool gives up after 45 s, but the page keeps running the script.** A 600-card build
  "times out" and still finishes; query the board before re-running, or you get duplicates.
- **Never start a fire-and-forget async loop in the Figma tab.** It stalls while no tool call is
  driving the tab and resumes later, which produced a duplicate section. Build one section per call.
- **Reloading the tab drops edits that have not synced yet.** A freshly built section vanished on
  reload. Confirm by opening the board in a second tab (it loads from the server) before reloading
  or closing the working tab.
- **A page can be several page types.** The first classifier counted each path once and reported
  Stone's `all-on-x-implants` as "Dental Implants" only; `classify.py` now counts every match.

## Version Control

Tracked runbook, per [SYSTEM_RULES.md §5](../../SYSTEM_RULES.md).
