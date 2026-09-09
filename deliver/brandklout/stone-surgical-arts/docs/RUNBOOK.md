# Runbook

The **standing** state of this project: what is true now, what is next, and the traps.
Dated run history is one file per run under [`runbook/`](./runbook/INDEX.md) — read the index,
then only the runs you need. Do not read them all.

## Where it stands

Sixteen routes are built and published to Instatic, served from Railway at
`https://stone-surgical-arts-production.up.railway.app`.

| | |
| :--- | :--- |
| Twelve practice pages | `/`, `/neck-lift`, `/blepharoplasty`, `/treatments`, `/meet-the-doctor`, `/about`, `/team`, `/memberships`, `/results`, `/book`, `/myellevate-neck-lift`, `/face-and-neck-lift` |
| The journal, since 2026-09-08 | `/blog`, `/dermal-fillers-vs-botox`, `/types-of-plastic-surgery`, `/why-do-people-get-plastic-surgery` |
| Eight retired routes | checked gone on every `verify-live` run |

The build lives in `workflows/04-design/.tmp/surgical-arts/` — author in `site-src/`, never in
`final-site/`, which `build-site.mjs` regenerates. The publish lives in
`workflows/21-instatic-upload/`.

## The gates

All three pass as of `ce2a4f03` (2026-09-08). Run them in this order.

```bash
# 1. the local build is internally sound
cd workflows/04-design/.tmp/surgical-arts/site-src && node blog-test.mjs      # 27 checks

# 2. the published routes are healthy and every asset resolves
cd workflows/21-instatic-upload && node verify-live.mjs                       # ends "FAIL  none"

# 3. the published pages still LOOK like the local build
INSTATIC_BASE_URL=https://stone-surgical-arts-production.up.railway.app \
  COMPARE_PORT=8851 node compare-live.mjs                                     # "no differences"
```

`verify-live.mjs` ends with the literal line `FAIL  none` when it passes. That is the footer, not a
failure — do not read the tail of the report and panic, as a previous session did.

`compare-live.mjs` **with scripts off is the gate.** `--runtime-layout` measures geometry with
scripts on and reports a known platform condition on every prose-heavy page: it is a diagnostic.
See trap 27. `--shots` still crashes on a full run (pages are never closed); use it a page at a
time.

## Traps

The long list — 27 of them, each one a defect that shipped or nearly shipped — is in
[`workflows/21-instatic-upload/21-instatic-upload.md`](../workflows/21-instatic-upload/21-instatic-upload.md).
Read it before any publish. The three that bite hardest:

- **Trap 26 — a `compare-live` finding can mean the LOCAL build is wrong.** If live looks *more*
  correct than local, check whether the losing rule is inside an `@media`; appending a base rule to
  the bottom of a stylesheet is the habit that causes it.
- **Trap 27 — the published page picks a different font instance once scripts run.** Prose sets
  ~0.6px narrower a line, which flips a paragraph that sits on a line-break boundary. Not fixable
  from this repository, and not a regression. `node font-instance-probe.mjs <slug>` confirms it.
- **Trap 16 — fonts have to go into Instatic's own library.** Instatic ignores `assets/fonts`
  entirely and serves `/uploads/fonts/...`. Never "fix" a font difference by overwriting the local
  files: `*.woff2` is gitignored, so there is no undo. Regenerate with
  `node site-src/get-fonts.mjs --force`.

More broadly: **a lot of `.tmp/` is untracked or gitignored** (`*.woff2`, `*.png`, `*.jpg`,
`*.webp`, `*.avif`). Run `git check-ignore -v <path>` before overwriting anything there.

## Next

- `capture()` in `compare-live.mjs` needs a `pg.close()` so `--shots` survives a full sixteen-route
  run.
- The journal has had no client review pass. BugHerd is still installed sitewide and comes off at
  handoff.

## Version Control

Tracked, and committed with the work it describes. Add a dated run file under
[`runbook/`](./runbook/INDEX.md) for each session and refresh this file when the standing state
changes.
