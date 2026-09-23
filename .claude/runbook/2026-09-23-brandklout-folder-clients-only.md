# 2026-09-23 — deliver/brandklout/ holds client folders only

Branch `system-v2`. Owner asked for `deliver/brandklout/` to contain only client folders.

## Done
- `deliver/brandklout/docs/` → `deliver/docs/` (design standard, fluid root, Client-First, Drive map,
  orchestration, Asana dispatch, partner `mcp-access.md`).
- `deliver/brandklout/scripts/` → `deliver/scripts/` (Asana auth/pull/context, journey-audit,
  staging-verify). `asana-context` now writes to `<client>/scenario-0-new-site/01-client-inquiry/output/asana-context/`;
  `asana-pull` writes to `deliver/scripts/output/asana/` (gitignored).
- `termly-setup.html` (each site's Termly account and resource-blocker script) → Scenario 0
  `05-launch/`, linked from the Consent step.
- `deliver/brandklout/.tmp/asana/` (an old task dump) deleted.
- `check-scope.mjs` and `scenario.mjs` no longer carve out `docs`/`scripts`; any slug folder under
  `deliver/brandklout/` is a client. Links in every system file rewritten; link check clean except the
  old `/docs/dictionary` in CLIENT-FIRST.

## Gotchas
- Client folders were NOT edited (scope rule): their old runbooks and each client's `docs/mcp-access.md`
  still point at `deliver/brandklout/docs|scripts/`. Fix them on the client branch when it next moves to
  the scenario layout — the partner file is now `deliver/docs/mcp-access.md`.
- `git mv` of a folder fails with "Permission denied" while the shell's cwd is inside it.

## Version Control
Follows [SYSTEM_RULES.md §4](../../SYSTEM_RULES.md).
