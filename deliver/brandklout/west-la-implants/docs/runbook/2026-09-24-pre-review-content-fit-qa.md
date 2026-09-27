# 2026-09-24 — Backup, then a content-fit QA pass on all 80 pages before Jessica's review

**Commit:** `b85fbd57`. **Published seq 22** (from 21). Report: [`../qa-report.md`](../qa-report.md). Reviewer doc:
"West LA Implants — Pre-Review QA" <https://claude.ai/code/artifact/6613c321-fd82-4fb0-aae3-04222e1b3cbc>.

## Done

Alejandro asked for (1) a backup of the current Instatic version and (2) a QA of the whole site
that catches what the human review otherwise catches: images that don't fit their copy, and copy
that doesn't fit its box. The process is now step 5 of `deliver/process/08-qa/08-qa.md`.

**Backup (seq 21)**. Instatic has no branches (page versions hold only title and slug), so it's three copies:
- git tag `wla-pre-qa-2026-09-24` (local)
- API snapshot + 80 published HTML files in `21-instatic-upload/.tmp/backup-2026-09-24-pre-qa/`
  (`backup-live.mjs` now creates the folder for nested `blog/x` slugs; it crashed on them)
- `VACUUM INTO /app/storage/backups/cms-2026-09-24-seq21-pre-qa.db` (159 MB; it was 14.5 MB on
  09-22, which is most likely the snapshot history of the seq 18–21 publishes)

**Audit**. `08-qa/.tmp/qa-fit.mjs` (new). Baseline: about 1,000 copy findings and 438 image placements on
47 contact sheets. Five subagents judged the sheets and produced 82 image findings.

**Fixes** (source, then rebuild):
- `02-base.css`: `text-wrap: balance` on display type, `pretty` on copy and `.st-big`
- `01-tokens.css`: `--t-small` .82→.9rem (desktop), .9→1.04rem (≤767)
- `.faq-a p` at body size
- measure caps: `.tb-sec p`, `.cp-note`, `.pr2-body`
- journal `.cv-title--small` 3.4rem desktop / 2.15rem ≤767
- **focal points**: `pos: 'x% y%'` on an image object → `fp-x-y` class (`lib/blocks.mjs` `fp()`,
  new `css/45-focal.css`, 121 doubled-class rules); neighbourhoods take `photoPos`; the journal
  takes a `HERO` / `POS` map in `templates/blog.mjs`
- 30 photo swaps and alt rewrites (scratch script, all asserted), homepage cards 02/04 in `index.html`
- `Los Angeles, FL`→`CA` at journal load (the scrape stays verbatim)

**Push**: `upload-media` → `set-alt --apply` (94) → `build-import-input` → `ship.sh` →
`push-site --apply --force` (seq re-checked at 21 right before) → publish `{"publishedPages":80}`.
All live gates are clean (table in the report).

## Next

- Jessica reviews with the doc's checklist: the results story card, All-on-4 step 01, Emily on the
  zirconia page, and the long statements.
- The client still owes before/after originals (300×225), consent, pricing, privacy text, the form destination and the logo.
- Promote `qa-fit.mjs` to `deliver/process/08-qa/` once a second client has run it.

## Gotchas

- **Two headless Chromes at once time out** (`networkidle0` 90 s) and crash `check-local.mjs`
  with no FAIL line. Run the audits one after the other.
- **`qa-fit.mjs --no-images` used to overwrite `image-context.json` with `[]`**. It is guarded now.
  Copy the baseline out before re-running anyway.
- **Heredoc `\b` became a literal backspace (0x08)** in a Python-written regex in
  `templates/blog.mjs`, which silently never matched. Check with `cat -A` after scripted edits.
- **The portrait cover crops 2:1 photos to ~34% of their width**. Every off-centre subject vanished
  at 1440 while the 390 crop looked fine. Always review heroes at 1440.
- **Rail crops in the contact sheet show the neighbouring slide** (the rail had scrolled). Judge
  rail cards from the source file.
- The runt rule only counts one word under a line of three or more words. "Grafting / questions." is a line break, not an orphan.
- `ship.sh` reported `cssWarnings` 13 (7 on 09-22) with no detail; `css-parity` found every
  property live, including `text-wrap` and `object-position`.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md). Runbooks are tracked.
