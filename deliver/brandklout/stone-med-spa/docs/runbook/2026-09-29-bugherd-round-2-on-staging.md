# 2026-09-29 — BugHerd round 2 (45 tasks, #43–#87) on staging; 84 of 86 tasks done

BugHerd project `540569`. The client filed 45 new tasks on 2026-09-28 against **production** at
1920 wide, and re-described #27 ("Change image to AdobeStock_650016960"). Every task was fetched by
id; the selector's `html` field names the pinned element exactly (use it — the `nth-of-type` in the
path was wrong on #60). All 19 AdobeStock files the client named are on the Stone shared drive
(`drive.mjs search AdobeStock`).

## Done

**Staging `https://staging.westlaketxmedspa.com` — 24 pages published, `{"publishedPages":24}`.** Commit `7129cf29`.
Snapshot before: `05-instatic-upload/.tmp/backup-staging-2026-09-29-bugherd-round2` (seq 17).
Production untouched (last pushed 2026-09-18; it still lacks rounds 1 and 2).

| BugHerd | Change | Scope |
| :-- | :-- | :-- |
| #43 #48 #71 | Address **#110B** (capital B) | site-wide: footer, drawer, home, about, book, legal pages, `seo.json` |
| #45 #49 #72 | Hours Mon/Tue/Thu 9–5, Wed 9–3, Fri 9–4, Sat/Sun closed; footer is a seven-row list; "Monday to Friday, 9 to 5" copy on /book and in `11-form.js` now "during office hours" | site-wide + `openingHoursSpecification` |
| #44 | Footer switch hover — already fixed on staging as #25 | footer |
| #9 | Home providers paragraph says more about Brooke (Abby photo still missing) | home |
| #46 #50 #52 #53 #62 #74 #80 | Counters / lede / note / form lede removed | per page |
| #54 #81 | /results before-and-after and /meet-the-doctor filmstrip **hidden**: cut into `site-src/pages/_hidden/*.html`, a `HIDDEN:` comment marks where they go back | per page |
| #84 | Before-and-after placeholder removed from Botox (stashed) and from the generated template in `build-site.mjs` | all 12 treatment pages |
| #55 | `.plates_copy .button-group` margin (section hidden) | — |
| #27 #47 #56 #57 #59 #60 #63 #65–#70 #76 #78 #79 #83 #86 | Client's AdobeStock photos as `assets/stock-<id>.webp` (≤2000px, q82, PIL). #57 is a new fourth frame `.room_frame.is-d`; #47 a new `.words_photo` beside the home heading; #83 also on Dysport; #86 is the membership related card, shared | per slot |
| #51 | Concern chips are `<a href="#menu">` with a hover tooltip (`CONCERNS[].desc` + generated "Treated with …"); state is `data-active`, not `aria-pressed` | /treatments |
| #58 | /results FAQ = the client's four questions, answers from site facts | /results |
| #61 #64 #77 | Copy verbatim; the /about surgical photo and the doctor-card sentence link to Stone Surgical Arts (`stonesurgicalarts.com` 301s to `dfwsurgicalarts.com`, linked directly) | per page |
| #75 | Video card: "call us", button is a `tel:` link (the GHL form has no visit-type field) | /book |
| #82 | `.why_grid` two equal halves, photo centred | all 12 treatment pages |
| #85 | Every FAQ question names its subject (Botox + `seo.json` mirror, 39 in `treatment-pages.mjs`, 3 on /financing) | site-wide |
| #87 | Navbar Treatments dropdown (`navTreatments()`, CSS :hover/:focus-within, no JS) + drawer list (`drawerTreatments()`) | site-wide |

**BugHerd:** a reply with the scope on each of the 46, then `done` (script
`05-instatic-upload/close-bugherd-2026-09-29.mjs`, read back: 84 done, 2 todo).

## Still open

- **#10** Abby's and Brooke's photos — still only in Canva, not on Drive (searched again).
- **#73** GHL form colours (blue Submit, blue dropdown highlight) — a Go High Level form-builder
  setting, not the site. Needs someone with GHL access; the consent text there still names Stone
  Surgical Arts PLLC.

## Gates

- Local: `audit` FAIL none; `all-pages` 24 × 5 widths, 480 assertions clean; `menu-test` 10/10 (two
  new: pill active, lands on #menu); `drag-test` 3/3.
- Staging: `verify-live` FAIL none (24 routes, 24/24 titles); `css-parity` FAIL none; live
  puppeteer check: chip tooltip opacity 1 on hover, click → `#menu`, 2 rows for "Volume loss".
  Screenshots of every touched section at 1920 and 390: `04-design/.tmp/med-spa/site-src/bugherd-shots.mjs`
  (local and `…/shots/bugherd-2026-09-28-staging/`).
- `compare-live` / `visual-diff` not run this round.

## Gotchas

1. **The worktree had no `deliver/process/`** (sparse cone) and every upload script imported
   `../../../../process/22-instatic-api-sync/insta-api.mjs`, a pre-consolidation path. Fixed:
   `git sparse-checkout add deliver/process/tools` and the imports now point at
   `process/tools/instatic-api-sync/insta-api.mjs`.
2. `media-map.json` was put back to production's after the push (`cmp` with `media-map.production.json`).
3. The reviewer works on **production**, which is two rounds behind. Many round-2 pins (#44, the
   address) were already fixed on staging; expect repeats until production is pushed.
4. Bash heredocs broke the `.mjs` edit scripts (quote parsing); write them with the Write tool.

## Next

1. **Go-ahead for production** (rounds 1 + 2 + #15), then the sitemap redeploy — procedure in the
   2026-09-23 run. `upload-media.mjs` against production mints the 18 new stock assets there.
2. #10 photos from Canva; #73 in GHL.

## Version Control

Tracked runbook, per [SYSTEM_RULES.md §5](../../../../../SYSTEM_RULES.md).
