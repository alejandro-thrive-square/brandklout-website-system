# 2026-09-23 — step folders with output/, scenarios copied into clients, client/system scope enforced

Branch `system-v2` (not merged, not pushed). Reference board: *Cloud Website Deliver System*
(figma.com/board/yEJh14DUmw9Qrhbo9gFh21).

## Done
- Every scenario step is a folder: `NN-step/{NN-step.md, scripts/, tools.json, output/}`. Toolkits'
  `.tmp/` renamed `output/`. Scripts read and write `./output` relative to the step folder.
- `scripts/scenario.mjs` — `list | start <client> <scenario> | update <client> [<scenario>] | status <client>`
  (`--dry`). `start` copies the scenario and the toolkits in its `tools.json` into
  `deliver/brandklout/<client>/`, scaffolds README, RUNBOOK, docs and an `output/{assets,code,RUNBOOK.md}`
  per step, and records the commit in `<scenario>/.process.json`. `update` never touches `output/`.
- `scripts/check-scope.mjs` + hooks `scripts/hooks/pre-commit` (main commits are system-only) and
  `pre-merge-commit` (a merge into main is one client folder or system files, never both).
- Rules: DELIVER_SYSTEM_RULES §2–3, SYSTEM_RULES §5 (runbook lives in the step's `output/RUNBOOK.md`
  plus a row in the client `RUNBOOK.md`), CLAUDE/AGENTS/GEMINI, PROCESS_INDEX, scenario READMEs and
  step directives updated. Deliver SOP board intro card updated (checked from a fresh tab).
- **Client folders restored on system-v2.** d187e1cd had deleted ~5,800 client files; under the new
  rule a system branch must not touch them, so they were checked out from the branch point. The
  branch's diff against main now leaves every client folder alone.

## Next
- Existing client branches still use `workflows/<module>/.tmp/`; move each to the scenario layout
  when it is next worked on (`scenario.mjs start`, then move its files into the step `output/`).
- Install the hooks where main is checked out: `git config core.hooksPath scripts/hooks` (bootstrap.sh
  sets it). Merge client branches with `git merge --no-ff` — a fast-forward skips pre-merge-commit.
- Plugin rollout, pinning the 14 Instatic instances, Railway volume backups (owner's queue).

## Gotchas
- `check-scope.mjs` with no flag compares committed HEAD; staged work shows only with `--staged`.
- `deliver/brandklout/docs/`, `deliver/brandklout/scripts/` and loose files at `deliver/brandklout/`
  count as system, not a client.
- The FigJam tab only gets `window.figma` once it is in front; take a screenshot first.

## Version Control
Follows [SYSTEM_RULES.md §4](../../SYSTEM_RULES.md).
