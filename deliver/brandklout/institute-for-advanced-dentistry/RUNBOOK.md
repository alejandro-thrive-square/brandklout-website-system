# institute-for-advanced-dentistry runbook

Standing state: what is true now, what is next, the traps. Each step's own history is in its
`output/RUNBOOK.md`; add a row below for every run.

## Standing

The live standing state of this client is in [docs/RUNBOOK.md](docs/RUNBOOK.md) (history in `docs/runbook/`). In short: production `www.ifadentistry.com` serves the WordPress clone; `staging.ifadentistry.com` serves the whole redesigned site (58 pages; 57 since 2026-10-01, HIPAA Disclosure since 2026-10-06), awaiting the team review on BugHerd.

- `/hipaa-disclosure` is live on production (2026-10-01) and linked from every page's footer legal row;
  on staging the page and the footer link shipped with the 2026-10-06 push. See 06-post-launch.
- Since 2026-10-06 staging uses Client-First class names and is editable in Instatic (registry + Framework);
  every push needs `push/editable.mjs --apply` before the publish (docs/RUNBOOK.md, top).

## Runs

| Date | Scenario / step | What happened | Commit |
| --- | --- | --- | --- |
| 2026-10-07 | scenario-0 / 03-design-build | Instatic editor canvas on staging: drawer, modal and lightbox closed in CSS by default + `.is-open` (React drops `hidden`); pushed, editable, published seq 21; final gates incl. the new editor-canvas gate pass ([run](docs/runbook/2026-10-07-editor-canvas-overlays.md)) | (this commit) |
| 2026-10-07 | GTM (no step) | Microsoft Clarity removed from the unused old container GTM-KBG9XX2 (v6); never live on IFA ([run](docs/runbook/2026-10-07-microsoft-clarity-removed.md)) | (this commit) |
| 2026-10-06 | scenario-0 / 03-design-build | Class standard + editability on staging: source renamed (371), pushed, stylesheet into the registry, colours into the Framework; EDITABLE / IN BOUNDS / CLEAN; HIPAA page + footer link shipped to staging with it ([run](docs/runbook/2026-10-06-class-standard-on-staging.md)) | `59f7e191` |
| 2026-10-01 | scenario-0 / 03-design-build | BugHerd round 1 re-verified and closed on the board: 40 done, #33 and #38 open ([run](docs/runbook/2026-10-01-bugherd-round-1-closed.md)) | 49d856fc |
| 2026-10-01 | scenario-0 / 03-design-build | Home approved; whole site built on its frozen system and published on staging ([run](docs/runbook/2026-10-01-full-site-on-staging.md)) | 5804ac65, e2912e5a, e8861d52 |
| 2026-10-01 | scenario-0-new-site / 06-post-launch | HIPAA Disclosure page injected on production (one page, other 59 byte-identical); staging copy added to `site-src/pages/` for the next replace push | `ee7f64db` |
| 2026-10-01 | scenario-0-new-site / 06-post-launch | HIPAA Disclosure added to the footer legal row on all 60 production pages, plus a wrap fix for that row (approved); site-src footer updated for staging | `ea7dd53c` |

## Version Control

Follows [SYSTEM_RULES.md §5](../../../SYSTEM_RULES.md).
