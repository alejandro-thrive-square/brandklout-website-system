# 2026-09-25 — Image rules and BugHerd scope rule, in the directives and on the SOP board

## Why

Team feedback from past runs: photos did not match their text, stock was used while the client's own
photos sat in Drive or on the old site, the same photo repeated across the site, and a BugHerd
comment pinned on one page but written "for the whole site" was fixed on that page only.

## Done

- **`deliver/docs/IMAGES.md`** (new): source order (client Drive → brief links/albums → old-site
  assets → licensed stock → AI with approval; never stock for doctors, team, patients, office), match
  (fit score 3 only), variety (once per page, at most two pages, every hero its own), ledger
  `output/images.csv`.
- **`deliver/docs/BUGHERD.md`** (new): decide scope before the fix, fix site-wide items at the source,
  prove on every page, write the scope in the change list and the pin reply.
- **`tools/instatic-site/gates/image-reuse.mjs`** (new, read-only): TWICE on a page, REUSE on more
  than `--max-pages` (2), HERO shared by pages; shell images on ≥80% of pages listed, not failed.
  Follows sitemap indexes. Tested against westlaimplants.com (old WordPress site, 92 pages): 37
  problems found, exit 1 as expected.
- Linked from Scenario 0 steps 03, 04, 06; Scenario 2 steps 01, 02, 03; Scenario 3 step 02;
  `DELIVER_SYSTEM_RULES.md` §4; toolkit README gate tables.
- **FigJam Deliver SOP's:** Scenario 0 Design & Build (checklist line, image source card rewritten,
  match and variety cards, BugHerd scope card, no-client-photos conditional rewritten), QA (two
  checklist lines, image check card, BugHerd scope card); Scenario 2 Request Intake (checklist line,
  scope card, photos conditional). Confirmed from a freshly loaded tab (211 and 87 cards).

## Next

- Scenario 3 on the board has no image card yet; the directive links IMAGES.md.
- Existing client sites have not been swept with `image-reuse`; run it per client when next worked on.

## Gotchas

- `image-reuse` keys photos by file name without size suffixes; a photo re-uploaded under a new name
  (Instatic needs one for a re-cut) counts as a different photo. It reads raw HTML only.
- Home pages that ship the same photo twice for desktop and mobile show as TWICE; check whether one
  copy is hidden at each breakpoint before changing anything.
- The FigJam batch edit hit the 45 s javascript_tool limit and still finished; query before re-running.

## Version Control

Tracked runbook, per [SYSTEM_RULES.md §5](../../SYSTEM_RULES.md).
