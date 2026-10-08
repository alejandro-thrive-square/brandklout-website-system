# scenario-0-new-site · 03-design-build · runbook

Newest run first. Each run: date, what was done (with the commit), what is next, and the gotchas.

## 2026-10-07 — Editor canvas: overlays closed in CSS, not by `hidden`

- Done: the menu drawer, story modal and gallery lightbox covered every page in the Instatic editor (React drops `hidden=""`, no site scripts run there). `site-src` now closes them in CSS by default and opens them with `.is-open` (`IFA.setOpen` toggles `hidden` too, for assistive tech). Rebuilt, pushed through `push/` (seq 21), editable, published on staging. Gates: `migration-gates.mjs final` EDITABLE · IN BOUNDS · CLEAN · editor canvas ok; cascade-check OK; head parity 0/57; css + runtime parity in the run file. Run: `docs/runbook/2026-10-07-editor-canvas-overlays.md`.
- Next: nothing; production gets it with the launch push.
- Gotchas: never close an overlay with `hidden` alone (`KIT.md` *Lessons*); gate it with `tools/instatic-api-sync/editor-canvas.mjs --site $S` and look at the screenshot.

## 2026-10-06 — Client-First class names; everything editable on staging

- Done: `code/site-src` and `code/push` renamed with `class-standard/class-map.json` (371), `KIT.md` rewritten; pushed (58 pages, HIPAA page and footer link included), `site.css` moved into the style registry and 22 colours into the Framework; new pipeline steps `code/push/editable.mjs` (after every push) and `code/push/cascade-check.mjs` (gate); staging seq 18 published. Gates: EDITABLE, IN BOUNDS, CLEAN, published HTML and heads identical on 57 pages, css and runtime parity read to a cause. Commit `59f7e191`.
- Next: team review on staging continues; production only with the launch. Follow-ups in `class-standard/README.md` (*Open questions*).
- Gotchas: every push replaces the registry (run `editable.mjs --apply` before publishing); colours are edited in the Framework panel; write a combo compound when it sets what its base sets (`.path_step.is-closing`), `cascade-check.mjs` fails on a swap; the 404 page is outside the parity gates. Full list in the client run file `docs/runbook/2026-10-06-class-standard-on-staging.md`.

## 2026-10-01 — Core page approved (home); complete site built and on staging

- Done: system frozen from the approved home (split into `code/site-src/css` + `js` layers, proven identical); section kit and `KIT.md`; photo library (`library/`), `images.csv` ledger; 57 pages; push pipeline `code/push/`; published on staging seq 12. Commits 5804ac65, e2912e5a and this run's.
- Next: BugHerd team review (checklist item *Team complete site review*), WebKit 1512x735, open questions to Brandklout, SEO step.
- Gotchas: flat slugs + zone-wide rewrites (no nested routing on this instance); the standard push pipeline is deliberately not used (attributes and the cascade); parallel builders need `--out`/`--only` and their own ports. Full list in the client run file `docs/runbook/2026-10-01-full-site-on-staging.md`.

## Version Control

Follows [SYSTEM_RULES.md §5](../../../../../../SYSTEM_RULES.md).
