# 2026-10-08 — FigJam *Deliver SOP's* synced with every directive change since 2026-10-04

## Why
The Asana task *Finish SOP's* (Internal Website System). The board was last compared with the
directives at `fa0ba467` (2026-10-04). Since then, main had gained the Client-First class standard and
the editable Framework, the never-lazy GHL rule, SEO & AEO hooks, the Clarity ban, hardened GA4 rules,
the Dentiq Webflow fixes and the Ahrefs volume route. None of that was on the board, apart from the
Clarity card and the Scenario 7 lane.

## Done
- **76 board changes, 46 cards added and 30 edited**, on the real board
  ([Deliver SOP's](https://www.figma.com/board/9684Y7YwnDo2pZr8A5rKz1/Deliver-SOP-s)):
  - **S0 (25):** keyword research through `seo-aeo` and the keyword map (02), multi-office money pages
    and no second site; the Framework tokens, editability and class-audit gates, starter stylesheet,
    class naming and keyword H1 (03); `check-embed` in QA (04); content-built schema, `/llms.txt`,
    local FAQ with FAQPage and areaServed, GA4 hardened, ask before session replay (05); the SEO & AEO
    baseline handing over to Scenario 7 (06).
  - **S1 (1):** drop Clarity from the old site and its GTM.
  - **S2 (7):** Framework tokens, the tokens sync before a build, class and editability gates, migrate on
    first visit, re-run keyword-gate, `check-embed`, never-lazy.
  - **S3 (5):** intake card now says we reach GHL through Codex; `check-embed` in the combo checks; read
    which number the pool swaps; the pool as a scoped Embed Origins line; never-lazy.
  - **S6 (7):** sweep of hours, address and per-page JSON-LD, GA4 hardened and the noscript container,
    `scope_component_id` for component text, irregular hours, no Clarity, `check-embed`, GA4 cookieless
    pings expected.
  - **S7 (31):** Ahrefs first for volumes, service hubs, baseline keyword gate, the Instatic H1 and schema
    chains, office links, Search Console window, drift check, missing conditionals. Every Conditional
    now starts with "If" and every Don't card with "Don't", as in the other lanes.
- One agent per group of lanes wrote the plan from `git diff` against the board, which was read
  through REST. Then one idempotent `window.figma` script in Chrome applied it, with a dry run first.
  The script skips an edit already made, refuses one whose card text has changed, and keeps each block's
  original gap. No overlaps in any lane, and each section keeps its bottom margin.
- **Verified from the server:** a second tab loaded the board fresh, and its fingerprint for each
  changed section (child count, height and a hash of every card's text, y and height) matched the
  working tab.
- **Directives fixed on main** where the board check found them lagging or contradicting themselves:
  - `scenario-3 01-campaign-intake.md`: we reach GHL through Codex; Google Ads usually not.
  - `scenario-3 03-qa-and-launch.md` step 2: a form failure is fixed by us in GHL through Codex, not
    sent to Brandklout. This matches step 3 of intake (since 2026-10-04).
  - `scenario-0 02-research-sitemap.md`: volumes come from the signed-in Ahrefs web app through Codex,
    as in Scenario 7, not SpyFu or Keyword Planner.

## Next
- *Finish SOP's* in Asana: the user decides whether this closes it. One idea from the 2026-08-30
  rewrite was a five-field step template (Preconditions, Gate, Done, Owner, Failure modes). No step
  directive and no board lane carries it; the board uses the owner's own layout (Checklist, Context
  Actions, Conditionals, AI Models, Do, Don't).
- The INDEX row for 2026-10-07 Scenario 7 said "FigJam lane not yet drawn". The lane was drawn the
  same day (`f2e5e131`), and the row is corrected.

## Gotchas
- **Figma REST is rate-limited again** (429, Retry-After about 83 h on 2026-10-08), right after one
  full `GET /v1/files` read. Read the board once, early. Verify with a fresh second tab and a
  fingerprint, not `/nodes`.
- **The gap after a card is not always 16 px.** Block labels are 28 below the last card, and the next
  step's title is 100 below. An insert must push everything below it by `h + 16` and keep the old gap.
  Recomputing the gap closed a step's 100 px gap to 28 in the dry run. A card added at the end of a
  section must also grow the section.
- **Several adds below the same card:** the script puts each one directly below its anchor, so send
  them in reverse order.
- **Agents escape HTML** in their JSON (`&amp;`, `&lt;prefix&gt;`). Unescape before writing cards.
- `figma.createText()` measuring did not match the cards' wrap (70 of 351 misfit). Canvas `500 16px Inter`
  at 690 px matched 346 of 351, even though `document.fonts.check` says Inter is not loaded. Delete any
  measuring node you create.
- Async IIFEs return `{}` through `javascript_tool`; use top-level `await`.

## Version Control
Tracked runbook, per [SYSTEM_RULES.md §5](../../SYSTEM_RULES.md).
