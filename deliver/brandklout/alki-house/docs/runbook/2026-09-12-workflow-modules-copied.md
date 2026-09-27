# 2026-09-12 (later) — workflow modules copied

## Done

- Copied the **Development from Scratch** route from `deliver/process/` (at `da1612b1`) into
  `workflows/`: `01-content-intake`, `02-wireframe`, `03-graphic-resources`, `04-design`,
  `05-design-revisions`, `06-content-seo`, `08-qa`, `09-launch`, `10-handoff-support`. Each keeps
  the template's `.md`, `.py` and `TRIGGER_PROMPT.txt`; the template's `.tmp/` contents were not
  copied, and each module got a fresh `.tmp/.gitkeep`.
- `00-client-delivery-initialization`: its directive, plus `.tmp/client-handoff/` and
  `.tmp/design-system/`. Its `style-guide/` and `client-first-docs/` reference folders stay in
  `deliver/process/` and were not duplicated.
- Added `04-design/.tmp/references/` as the drop folder for design references.
- The drop-folder table is in `project-overview.md` under Workflows.

## Skipped

- `07-webflow-build`: Webflow tooling. This site is built on Instatic. Copy `22-instatic-api-sync`,
  `18-instatic-embeds` and `20-instatic-domain-origins` when the build starts.

## Gotchas

- `*.png`, `*.jpg`, `*.pdf`, `*.mp4` are gitignored repo-wide. Pasted screenshots stay local until
  `scripts/mirror-assets.sh` syncs them; only text (`.md`, `.json`, URL lists) rides a commit.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md).
