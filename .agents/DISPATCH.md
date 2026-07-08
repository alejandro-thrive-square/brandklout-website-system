# Cross-Provider Agent Dispatch — Directive

This microsystem lets **any agent runtime trigger another provider's agent** and get an answer back, so a task can be routed to the cheapest / best-fit provider. It runs identically on **Windows (local)** and **Ubuntu (Hostinger VPS)**.

Executor: [dispatch.py](./dispatch.py) · Roster/config: [config/roster.toml](./config/roster.toml) · Quickstart: [README.md](./README.md) · Optional MCP wrapper: [../mcp-servers/agent-dispatch/setup.md](../mcp-servers/agent-dispatch/setup.md)

> [!IMPORTANT]
> The roster is routed by **role**, not model name. When new model ids ship (Opus 4.8, GPT 5.5, GLM 5.2, Fable 5), update only `config/roster.toml` — no code changes.

## Two mechanisms

| Mechanism | Command | Use when |
| :--- | :--- | :--- |
| **Synchronous** | `ask` | A quick question / sub-task where you need the answer now. |
| **Asynchronous** | `handoff` → `worker` → `collect` | Delegating a whole sub-project; the caller moves on and collects later. |

## Quick start

```bash
# 1. Verify provider CLIs are installed on this machine
python .agents/dispatch.py doctor

# 2. See the roster + role->agent routing
python .agents/dispatch.py routes

# 3. Synchronous: route by role, get the answer on stdout
python .agents/dispatch.py ask --role backend --prompt "Write a Flask webhook for X" \
  --cwd deliver/<client>/workflows/<wf>

# Async: queue, process, collect
TID=$(python .agents/dispatch.py handoff --role docs --prompt "Tighten README.md to half the tokens")
python .agents/dispatch.py worker --once          # process one pending task
python .agents/dispatch.py collect "$TID"
```

## Roster & routing

Source of truth: [config/roster.toml](./config/roster.toml). Edit freely, then run `routes` to confirm.

| Role(s) | Agent | Provider | Note |
| :--- | :--- | :--- | :--- |
| `design`, `build` | `claude-design` | claude (Fable) | Claude #1 — design + build |
| `design2`, `build2` | `claude2-design` | claude (Fable) | Claude #2 — concurrent worker |
| `backend`, `automation` | `codex-backend` | codex (GPT 5.x) | backend + automations |
| `docs`, `token-opt`, `linking` | `claude-docs` | claude (Sonnet) | Claude #1 — documentation |
| `docs2`, `token-opt2`, `linking2` | `claude2-docs` | claude (Sonnet) | Claude #2 — concurrent worker |
| `audit`, `system-improvement` | `pi-audit` | pi (GLM) | system audits + improvements |

> **"Claude2" note:** orchestration sees *providers*, not interactive windows. "Claude #2" is a **named worker on the same `claude` binary** so you can run two Claude jobs concurrently. To force the second worker, route by `design2`/`build2` or use `--agent claude2-design`.

## Capability routing (difficulty)

Difficulty is an **opt-in** second axis on top of role routing: role picks the *specialist*, difficulty picks the *power*. Pass `--diff N` (1–10) / `diff:N` to route to a capability tier that sets the model **and** reasoning effort per provider. Omit it to use the agent's default model.

| Difficulty | Tier | Claude | Codex | Pi |
| :--- | :--- | :--- | :--- | :--- |
| 1–3 | lite | Haiku | gpt-5.5, reasoning *low* | glm-5 |
| 4–6 | standard | Sonnet | gpt-5.5, reasoning *medium* | glm-5 |
| 7–9 | heavy | **Fable** | gpt-5.5, reasoning *high* | glm-5 |
| 10 | max | Opus | gpt-5.5, reasoning *high* | glm-5 |

```bash
python .agents/dispatch.py ask --role design  --diff 8 --prompt "..."   # -> Claude Fable
python .agents/dispatch.py ask --role backend --diff 2 --prompt "..."   # -> Codex, low reasoning
```

- **Why bucket 1–10 into 4 tiers:** no provider has 10 real capability tiers — the scale is a human vocabulary, the tiers are the real model/effort steps.
- **Bias conservative:** when unsure, round difficulty *up*. Under-routing a hard task risks a confidently-wrong answer.
- **Default is unchanged:** no `--diff` → the agent's configured model (design→Fable, docs→Sonnet). Difficulty never adds cost to the common case.
- **Difficulty is self-assessed by the calling agent:** if a trigger omits `--diff`, the agent that processes the `@dispatch` line rates the task 1–10 itself (calibration in [TRIGGER_PROMPT.txt](./TRIGGER_PROMPT.txt)) and adds `diff:N` before dispatching — free (no extra model call), using the agent's full context. If it can't tell, it omits `--diff` and the default model is used.
- **Optional (not built):** a dispatcher-side `--diff auto` classifier for non-agent callers (direct CLI / MCP tool / cron), and escalation fallback.

## Claude accounts (team vs personal)

You run two Claude accounts: **team** (default config dir `~/.claude`) and **personal/Max** (`~/.claude-account-b`). The dispatcher isolates them via the `CLAUDE_CONFIG_DIR` env var — one `claude` binary, two providers:

| Provider | Account | Config dir | Used by |
| :--- | :--- | :--- | :--- |
| `claude` | team | `~/.claude` | `claude-design`, `claude-docs` |
| `claude2` | personal (Max) | `~/.claude-account-b` | `claude2-design`, `claude2-docs` |

Pick the account per call with `--account team|personal` (or `account:team|personal` in the trigger):

```bash
python .agents/dispatch.py ask --role docs --account personal --prompt "..."   # -> your Max account
```

- `--account` only affects Claude-family agents (codex/pi ignore it).
- Shorthand without the flag: roles `design2`/`build2`/`docs2`/`token-opt2`/`linking2` route to the personal account.
- On a new machine (e.g. the VPS), log the personal account into its own dir once: `CLAUDE_CONFIG_DIR=~/.claude-account-b claude` → complete login. The roster path `~/.claude-account-b` expands per OS.

## Contract

- **Request in, answer out.** A spawned agent is a fresh process — it does **not** inherit the caller's conversation. Always give it: a focused prompt, and (usually) `--cwd` set to the relevant workflow folder.
- **Working directory matters.** `--cwd` should point at the workflow folder so the sub-agent (a) reads the right directive `.md` for context filtering, and (b) is bound by that folder's `mcp-access.md` (see [mcp-servers/ACCESS_MODEL.md](../mcp-servers/ACCESS_MODEL.md)).
- **The answer is the sub-agent's stdout.** For `ask`, stdout is the reply. Pass `--json` for a `{ok, agent, answer, meta}` envelope.

## Safety & cost

- **Recursion guard:** depth is tracked via the `AGENT_DISPATCH_DEPTH` env var. Default `max_depth = 3` (config) prevents an agent → agent → agent runaway. A chain that exceeds it is refused, not spawned.
- **Timeouts:** default `timeout_sec = 900` (config); override per call with `--timeout`.
- **Cost:** booting a full agent is heavier than a raw API call. Use `ask` for things needing reasoning + tools + file edits; for trivial lookups prefer a direct API call.
- **Run logs:** each `ask`/`worker` run records lightweight JSON in `runs/` (argv, duration, returncode, truncated stderr). No secrets are logged.

## Cross-platform

### Windows (local)
All four CLIs are npm globals on PATH; `dispatch.py` runs them through `cmd.exe` with safe quoting so multiline prompts survive. No special setup beyond the CLIs themselves.

### Hostinger VPS (Ubuntu 24.04)
1. Install the provider CLIs you intend to route to (run `doctor` to see what's missing):
   ```bash
   npm i -g @anthropic-ai/claude-code @openai/codex @earendil-works/pi-coding-agent
   ```
2. Ensure `python` resolves (Ubuntu ships `python3`): `sudo apt install -y python-is-python3` **or** call the dispatcher as `python3 .agents/dispatch.py ...`.
3. Authenticate each provider CLI on the VPS (its own runtime login) — credentials live outside this repo per the secret rules.

### Scheduling the async worker

| OS | Recommended | Alternatives |
| :--- | :--- | :--- |
| **VPS (Ubuntu)** | **systemd timer** (every 2 min, self-healing, persistent) — units in [.agents/vps/](./vps/) | `tmux`/`screen` running `worker --watch`; or `cron` |
| **Windows** | Task Scheduler running `worker --once` every few minutes | a terminal running `worker --watch` |

**VPS install (once, on the VPS):**

```bash
# repo is checked out at /root/webzite-agentic-workflow (per HERMES.md)
bash .agents/vps/install-worker.sh
systemctl status agent-dispatch-worker.timer       # verify it's active
journalctl -u agent-dispatch-worker.service -n 50  # see processed tasks
```

Units: `agent-dispatch-worker.service` (oneshot) + `agent-dispatch-worker.timer` in [./vps/](./vps/). Tune the interval by editing the timer's `OnUnitActiveSec`, then `systemctl daemon-reload && systemctl restart agent-dispatch-worker.timer`.

## Invoking from inside a provider

Any agent that can run shell commands can dispatch. Examples a Claude/Codex/pi session might use:

```bash
# Claude (design) asks Codex (backend) for a snippet
python .agents/dispatch.py ask --role backend --prompt "Flask route that proxies Webflow webhooks" --json

# Codex (backend) asks pi (audit) to review generated code
python .agents/dispatch.py ask --role audit --cwd . --prompt "Audit this webhook handler for security issues"

# Any agent delegates a big doc pass and moves on
TID=$(python .agents/dispatch.py handoff --role docs --prompt "Reduce README.md tokens by 50%, keep meaning")
```

## Optional: the MCP wrapper

`mcp-servers/agent-dispatch/server.py` exposes the same engine as MCP tools (`ask`, `handoff`, `collect`, `status`, `routes`) so an MCP client can call them natively instead of shelling out. Registration: [../mcp-servers/agent-dispatch/setup.md](../mcp-servers/agent-dispatch/setup.md). The `dispatch.py` CLI is the universal core — the MCP server is sugar. Access profile: [../mcp-servers/profiles/agent-dispatch.md](../mcp-servers/profiles/agent-dispatch.md) (`global` utility). The dispatch server holds no platform grants; sub-agents it spawns still follow the active folder's `mcp-access.md`.

## File layout

```
.agents/
  dispatch.py            # executor (stdlib only)
  config/roster.toml     # providers + named agents + settings
  inbox/                 # async handoff: pending/running/done task JSON
  outbox/                # async handoff: finished answers (.md)
  runs/                  # per-run logs (lightweight JSON)
```

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md §4](../SYSTEM_RULES.md). Commit `dispatch.py`, `config/`, `DISPATCH.md`, `README.md`, and the `.gitkeep` markers. The `inbox/`/`outbox/`/`runs/` contents are lightweight JSON/MD artifacts — commit finished/interesting ones, never secrets. Never commit provider login tokens, cookies, or API keys; those live outside this repo at runtime.

## Infrastructure

- **Hosting**: Hostinger VPS (Ubuntu 24.04 LTS) + local Windows workstation — identical dispatcher behaviour on both.
- **Runtime**: Python 3.11+ (stdlib only — uses `tomllib`). Provider CLIs installed per machine.
