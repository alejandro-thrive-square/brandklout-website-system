# 2026-09-18 - Redesigned ad funnels published to staging

The client-approved staging publish was requested after the six paid-traffic routes had passed
their local build gates. This run imported only those six redesigned routes, preserved the rest of
staging, published once, and verified the real third-party integrations in a browser. Production
was read only throughout.

## Done

- Backed up staging before any write:
  `backup-staging.masonparkdental.com-2026-09-18T04-06-40.json` (57 pages, 747 media,
  shell seq 83, draft matched published).
- Exported 61 static sources with the existing staging media map. No media path was unmapped, so
  no upload was needed.
- Shipped the 61-page payload to the Railway **staging** environment, verified matching SHA-256
  checksums, converted all 61 pages with zero failures and zero converter warnings, and verified
  the returned 10.2 MB node graph by checksum.
- Applied body classes and image accessibility data, then replaced the four form placeholders and
  six tracking placeholders with `brandklout.embed-origins.embed` modules. Staging has the enabled
  `brandklout.embed-origins` plugin at 1.5.1.
- Imported only these new page rows, without `--publish`:
  `/invisalign`, `/invisalign-consultation`, `/invisalign-thank-you`,
  `/new-patient-special`, `/new-patient-special-consultation`, and
  `/new-patient-thank-you`.
- Reapplied the Articles template and branded 404 template, imported the stylesheet, and rebuilt
  the runtime script scope after the page rows existed. The scope contains all 63 page IDs.
- Passed the draft gate: the four lead pages had exactly one correct campaign form plus one tracking
  block; both thank-you pages had tracking and no form; shared assets and both templates persisted.
- Published staging once. It now reports 63 draft / 63 published pages with no drift, last published
  `2026-09-18T04:18:24.527Z`.
- Took the post-publish backup:
  `backup-staging.masonparkdental.com-2026-09-18T04-29-18.json` (63 pages, 747 media,
  shell seq 91).

## Verified live

- `verify-live.mjs`: all six URLs return 200; stylesheet and three webfonts paint; GSAP and the
  journey layer initialize; every page has `has-journey is-ad-page`; zero broken or local-path
  images; zero horizontal overflow; no first-party console or network failures.
- `verify-ad-responsive-live.mjs`: six 390px renders, zero problems. The persistent CTA rail stays
  in the viewport, its targets meet 44px, every page has an H1, and the expected form presence and
  campaign ID survive the published node graph.
- `verify-form.mjs` with `TARGET_ORIGIN=https://staging.masonparkdental.com`: zero problems. All four
  form iframe requests and `form_embed.js` requests return 200 with the correct IDs; thank-you pages
  have no form; no form resource was blocked by CSP.
- `verify-ad-tracking-isolated.mjs`: zero problems. In a fresh browser context for every route,
  `number_pool.js` returns 200 and rewrites `(281) 769-8878` to the tracked number.
- `verify-ad-draft.mjs` after publish: all six pages and shared assets pass; draft matches published.
- Production read-only inventory remains 78/78 with no draft drift and last publish
  `2026-09-17T03:26:35.837Z`; this run issued no production write or publish.

## Workflow improvements

- The Windows npm Railway shim was visible inside WSL but WSL had no Node, so the first payload
  attempt stopped before any remote change with `exec: node: not found`. `ship-payload.mjs`,
  `run-converter.mjs`, and `fetch-nodes.mjs` now use the CLI package's bundled native
  `railway.exe` through WSL when available. The retry passed all checksum gates.
- The generic live gate now classifies three known GoHighLevel iframe telemetry/preview failures and
  its obfuscated `NaN` console diagnostic as third-party noise. Form, loader, CSP, and tracking are
  still tested directly by dedicated gates.
- The comparison tracking verifier can false-fail its first routes because it reuses one browser
  across staging and Webflow. The isolated-context verifier is the final authority for staging and
  passed every route with the longer 15-second observation window.
- Workflow 10's form and tracking verifiers now accept `TARGET_ORIGIN`; production remains their
  default.

Workflow and verifier commit: `b0a77ff6` (`chore(mason-park): harden staging ad publish verification`).

## Next

1. Have the client review the six redesigned routes on staging.
2. Keep the workflow-10 Webflow ports on production until the client explicitly approves launch.
3. Before promoting the full staging site, upgrade staging's embed-origins plugin to 1.6.0 and add
   the production Termly configuration; staging is still on 1.5.1 without Termly.
4. At promotion time, take fresh backups, re-run the six live integration gates, and preserve the
   campaign form mapping exactly.

## Gotchas

- The repo `.env` defaults to production. Every Instatic write in this run explicitly set
  `INSTATIC_BASE_URL=https://staging.masonparkdental.com`, and every converter transport explicitly
  set `RAILWAY_ENV_NAME=staging`.
- Do not export `RAILWAY_TOKEN`; the CLI login is the working authentication path.
- A form iframe existing in the DOM is not proof that it works. Require 200 for the iframe and
  loader, the exact form ID, non-zero dimensions, and no CSP block.
- A loaded number-pool script is not proof that calls are attributed. Require a fresh browser
  context and verify the visible telephone number actually changes.
- After any page import, reapply both template scripts. After new page rows exist, re-import the
  site script so its explicit page-ID scope includes them.
- Existing untracked Asana, BugHerd and `gm/` artifacts were unrelated and left untouched.

## Version Control

Follows the root rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md). The workflow/tooling
changes are commit `b0a77ff6`; this run file, the index, and the standing runbook are committed as
the documentation handoff.

## Infrastructure

Staging runs on Railway/Instatic. The transport was driven from Windows through WSL and Railway's
bundled native CLI. Production on Railway/Instatic was queried read only. The repository's VPS
target remains Ubuntu 24.04 LTS on Hostinger.
