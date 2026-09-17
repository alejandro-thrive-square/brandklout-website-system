# 2026-09-17 — bk-stone-dental merged into main (consent module 23) — carries **gotchas**

## Done
- `bk-stone-dental` merged with `--no-ff` (`53d57ef7`), then fixed on main (`fc6b6b86`). The branch was
  fast-forwarded to main, so both sit on the same commit.
- Brought in `deliver/process/23-termly-ghl-consent/` (Termly + GHL consent standard, kit, site
  registry) and Stone Dental's client work since 2026-09-09.
- Conflicts and how each was resolved:
  - `embed-origins/plugin.json`: kept main's 1.6.0.
  - `.claude/RUNBOOK.md`: kept main's standing file.
  - Stone Dental `docs/RUNBOOK.md` and `docs/runbook/INDEX.md`: took the branch; five INDEX rows split
    by stray line breaks were rejoined.
- Loss check: every line either side added since the merge base is in the result, apart from those
  resolutions. No deletions on either side. AGENTS/CLAUDE/GEMINI are still identical.
- Not pushed to `origin`.

## Next
- Push `main` when ready.
- The consent rollout state lives in `deliver/process/23-termly-ghl-consent/23-termly-ghl-consent.md`.

## Gotchas
- **Checkouts differ in line endings.** The worktree held the kit as CRLF, main as LF. From main, every
  Instatic asset deployed from the worktree looked "outdated" until `consent-kit.mjs` stopped counting
  CR. Run a module from main once after merging.
