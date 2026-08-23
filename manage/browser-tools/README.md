# manage/browser-tools

This folder is the one part of the Manage pillar that lives in this repository.

`playwright-browser/` is delivery tooling, not management tooling: the QA (`08-qa`) and
launch (`09-launch`) workflows call it directly, in `deliver/process/` and in five
Brandklout client folders. It kept its original `manage/browser-tools/` path so those
relative links keep resolving.

The rest of the Manage pillar — `MANAGE_SYSTEM_RULES.md` and `brand-assets/` (the Webzite
design system) — is deliberately absent. It belongs to Webzite Studio, not to Brandklout,
and lives in the `webzite-agentic-workflow` repository.
