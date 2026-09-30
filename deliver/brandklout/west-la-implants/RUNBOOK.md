# west-la-implants runbook

Standing state: what is true now, what is next, the traps. Each step's own history is in its
`output/RUNBOOK.md`; add a row below for every run.

## Standing

- **The organic site** (80 pages, Dark Surgical Luxury, on the client's Instatic instance): its
  standing state and eight earlier runs are in [`docs/RUNBOOK.md`](./docs/RUNBOOK.md) and
  [`docs/runbook/INDEX.md`](./docs/runbook/INDEX.md). The folder still uses the old
  `workflows/NN-*` layout; the build is `workflows/04-design/.tmp/site-src/`, the upload chain
  `workflows/21-instatic-upload/`.
- **The ads landing pages** (scenario 3): six pages live at
  `https://west-la-implants-production.up.railway.app/ads-landing-pages/` since 2026-09-30,
  published **seq 24**: `all-on-6`, `all-on-6-consultation`, `thank-you-all-on-6`, `3-on-6`,
  `3-on-6-consultation`, `thank-you-3-on-6`. Noindex, out of the menu.
- **Not ready for traffic.** The form is a prototype: Brandklout has not sent the two GHL forms.
  No conversion tag and no number pool is on the instance, and the host the ads will point at is
  undecided (the client's domain is still WordPress). The asks are in
  [`ADS-LANDING-COMMENT.md`](./ADS-LANDING-COMMENT.md); the full list in scenario 3's
  [`INTAKE.md`](./scenario-3-ads-landing-pages/01-campaign-intake/output/INTAKE.md).
- **Backups before the 2026-09-30 push**: tag `wla-pre-ads-2026-09-30`,
  `/app/storage/backups/cms-2026-09-30-seq23-pre-ads.db` on the container. The live state after it
  is `workflows/21-instatic-upload/.tmp/after-ads-2026-09-30/`.
- **Any push is still a full replace with `--force`.** Compare a fresh `backup-live.mjs` snapshot
  with `after-ads-2026-09-30/` first: identical means nobody edited in the admin.

## Runs

| Date | Scenario / step | What happened | Commit |
| --- | --- | --- | --- |
| 2026-09-30 | 3 · 01 campaign intake | Two Asana tasks pulled, `combo.json` and `INTAKE.md`, patient film transcripts found | `b9b96a5c` |
| 2026-09-30 | 3 · 02 build the combo | Six pages built in `site-src`, pushed and published seq 24; upload chain repaired (imports, media list) | `b9b96a5c` |
| 2026-09-30 | 3 · 03 QA and launch | Live gates clean except forms and conversion, which wait on Brandklout; three new checks | `b9b96a5c` |

## Version Control

Follows [SYSTEM_RULES.md §5](../../../SYSTEM_RULES.md).
