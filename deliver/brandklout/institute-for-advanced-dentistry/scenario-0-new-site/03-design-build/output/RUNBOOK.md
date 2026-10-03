# scenario-0-new-site · 03-design-build · runbook

Newest run first. Each run: date, what was done (with the commit), what is next, and the gotchas.

## 2026-10-01 — Core page approved (home); complete site built and on staging

- Done: system frozen from the approved home (split into `code/site-src/css` + `js` layers, proven identical); section kit and `KIT.md`; photo library (`library/`), `images.csv` ledger; 57 pages; push pipeline `code/push/`; published on staging seq 12. Commits 5804ac65, e2912e5a and this run's.
- Next: BugHerd team review (checklist item *Team complete site review*), WebKit 1512x735, open questions to Brandklout, SEO step.
- Gotchas: flat slugs + zone-wide rewrites (no nested routing on this instance); the standard push pipeline is deliberately not used (attributes and the cascade); parallel builders need `--out`/`--only` and their own ports. Full list in the client run file `docs/runbook/2026-10-01-full-site-on-staging.md`.

## Version Control

Follows [SYSTEM_RULES.md §5](../../../../../../SYSTEM_RULES.md).
