# Agent Dispatch — Quickstart

Cross-provider orchestration: let any agent (Claude Code, Codex, pi, Gemini) trigger
another provider's agent and read back the answer. Local + VPS. See [DISPATCH.md](./DISPATCH.md) for the full rules.

```bash
# health + routing
python .agents/dispatch.py doctor
python .agents/dispatch.py routes

# sync: get an answer now (stdout)
python .agents/dispatch.py ask --role backend --prompt "..." --cwd <workflow-folder>
python .agents/dispatch.py ask --role docs    --prompt "..."
python .agents/dispatch.py ask --role audit   --prompt "..."

# async: queue, then process + collect
TID=$(python .agents/dispatch.py handoff --role docs --prompt "...")
python .agents/dispatch.py worker --once
python .agents/dispatch.py collect "$TID"

# inspect
python .agents/dispatch.py status
```

Common roles: `design build backend automation docs token-opt linking audit system-improvement`.
Edit the roster in [config/roster.toml](./config/roster.toml).
