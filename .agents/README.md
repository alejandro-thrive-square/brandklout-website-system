# Agent Dispatch — Quickstart

Cross-provider orchestration: let any agent (Claude Code, Codex, pi, Gemini) trigger
another provider's agent and read back the answer. Local + VPS. See [DISPATCH.md](./DISPATCH.md) for the full rules.

```bash
# health + routing
python .agents/dispatch.py doctor
python .agents/dispatch.py routes
python .agents/test_dispatch.py     # offline resolution tests; run after a roster edit
python .agents/test_loop.py         # offline loop-driver tests; run after a recipe edit

# sync: get an answer now (stdout)
python .agents/dispatch.py ask --role backend --prompt "..." --cwd <workflow-folder>
python .agents/dispatch.py ask --role review  --prompt "..."
python .agents/dispatch.py ask --role docs    --prompt "..."

# async: queue, then process + collect
TID=$(python .agents/dispatch.py handoff --role docs --prompt "...")
python .agents/dispatch.py worker --once
python .agents/dispatch.py collect "$TID"

# autonomous: iterate a goal produce->verify->refine until a stop condition
python .agents/dispatch.py loop --recipe design-refine --cwd <workflow-folder> \
  --prompt "Build an awwwards hero+nav+footer; a11y clean, reduced-motion safe"

# inspect
python .agents/dispatch.py status
```

**Pick the role by task type — it already carries the model.** Don't rate difficulty unless you mean to override it.

| Tier | Model | Roles |
| :--- | :--- | :--- |
| max | Fable | `review` `code-review` `audit` `bugs` · `plan` `strategy` `system-improvement` · `design-qa` `design-review` `ux-review` |
| heavy | Opus / Codex Sol | `design` `build` · `design2` `build2` · `automation` `backend` · `motion` `animation` `remotion` |
| standard | Sonnet / gpt-5.5 | `site-update` `media` · `scrape` `data` |
| lite | GLM 5.2 | `docs` `vcs` `commit` `token-opt` `linking` · `docs2` `vcs2` `commit2` `token-opt2` `linking2` (2nd worker, via opencode) |

Override a role's tier for one call with `--diff N` (1–10); it may switch provider. Run `--account personal` for the 2nd Claude account. Edit the roster in [config/roster.toml](./config/roster.toml).

**Autonomous loops** (`loop`) iterate a *goal* produce→verify→refine across cold sub-agents until a stop condition (verifier-approved, self-report, stall, max-iter, or budget). A **recipe** names the producer + judge; explicit flags override it. See [DISPATCH.md → The autonomous loop](./DISPATCH.md#the-autonomous-loop).

| Recipe | Producer → Verifier | Until |
| :--- | :--- | :--- |
| `design-refine` | `design` (Opus) → `design-qa` (Fable) | verifier |
| `bug-hunt` | `backend` (Codex Sol) → `review` (Fable) | verifier |
| `doc-tighten` | `docs` (GLM) → `review` (Fable) | verifier |
| `plan-sharpen` | `plan` (Fable), self-terminating | sentinel |

The async/VPS model, MCP `loop` tools, and the `@dispatch loop …` trigger phrase are later phases — not yet wired.
