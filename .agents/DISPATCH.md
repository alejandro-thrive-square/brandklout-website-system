# Cross-Provider Agent Dispatch — Directive

This microsystem lets **any agent runtime trigger another provider's agent** and get an answer back, so a task can be routed to the cheapest / best-fit provider. It runs identically on **Windows (local)** and **Ubuntu (Hostinger VPS)**.

Executor: [dispatch.py](./dispatch.py) · Roster/config: [config/roster.toml](./config/roster.toml) · Quickstart: [README.md](./README.md) · Optional MCP wrapper: [../mcp-servers/agent-dispatch/setup.md](../mcp-servers/agent-dispatch/setup.md)

> [!IMPORTANT]
> Routing has two axes: **role** picks the agent (the task type), **tier** picks the provider + model (the power). Agents declare a `tier`, never a model id — model ids live only in `[capability]` in `config/roster.toml`. When new models ship, edit that one table; no code changes.

## Mechanisms

| Mechanism | Command | Use when |
| :--- | :--- | :--- |
| **Synchronous** | `ask` | A quick question / sub-task where you need the answer now. |
| **Asynchronous** | `handoff` → `worker` → `collect` | Delegating a whole sub-project; the caller moves on and collects later. |
| **Autonomous** | `loop` | Iterate a *goal* produce→verify→refine across cold sub-agents until a stop condition is met (no human between rounds). See [The autonomous loop](#the-autonomous-loop). |

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

# Autonomous: iterate a goal produce->verify->refine until a stop condition
python .agents/dispatch.py loop --recipe design-refine \
  --prompt "Build an awwwards hero + nav + footer for X; a11y clean, reduced-motion safe" \
  --cwd deliver/<client>/workflows/<wf>
```

## Roster & routing

Source of truth: [config/roster.toml](./config/roster.toml). Edit freely, then run `routes` to confirm.

**Pick the role — that is the whole decision.** The role is the task *type*, and the task type already implies the model. Reviewing code needs Fable; committing a file does not.

| Tier | Role(s) | Agent | Model | Does |
| :--- | :--- | :--- | :--- | :--- |
| **max** | `review`, `code-review`, `audit`, `bugs` | `claude-review` | Fable | review code, spot bugs + errors |
| **max** | `plan`, `strategy`, `system-improvement` | `claude-plan` | Fable | planning + strategy, internal or client |
| **max** | `design-qa`, `design-review`, `ux-review` | `claude-design-qa` | Fable | review sites, desktop/mobile design errors |
| **heavy** | `design`, `build` | `claude-design` | Opus | new awwwards sites + design systems |
| **heavy** | `design2`, `build2` | `claude2-design` | Opus (personal) | same, 2nd account — concurrent job |
| **heavy** | `automation`, `backend` | `codex-automation` | Codex Sol | local Windows / VPS automations, backend |
| **heavy** | `motion`, `animation`, `remotion` | `claude-motion` | Opus | Remotion animations |
| **standard** | `site-update`, `media` | `claude-site` | Sonnet | update an existing site; images/video (higgsfield, magnific) |
| **standard** | `scrape`, `data` | `codex-scrape` | gpt-5.5 | data scraping |
| **lite** | `docs`, `vcs`, `commit`, `token-opt`, `linking` | `pi-lite` | GLM 5.2 (pi / Z.ai) | directive updates, commits, token optimization |
| **lite** | `docs2`, `vcs2`, `commit2`, `token-opt2`, `linking2` | `opencode-lite` | GLM 5.2 (opencode / Z.ai plan) | same, 2nd concurrent lite job |

## Capability tiers

A tier maps **(tier, provider) → model + reasoning effort**. It is the only place model ids live.

| Difficulty | Tier | Claude | Codex | Pi | Opencode |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1–3 | lite | — | — | `zai/glm-5.2` | `zai-coding-plan/glm-5.2` |
| 4–6 | standard | Sonnet | gpt-5.5, reasoning *medium* | — | — |
| 7–9 | heavy | **Opus** | gpt-5.6-sol, reasoning *high* | — | — |
| 10 | max | **Fable** | — | — | — |

Two GLM 5.2 workers exist because they run on different CLIs and quotas — `pi-lite` and `opencode-lite` can process two lite jobs concurrently, the same way `claude` / `claude2` do.

> [!WARNING]
> **Opencode has two provider families and only one is paid for.** `zai-coding-plan/*` works (your Z.ai coding plan). `opencode/*` is the opencode "zen" gateway and the workspace has **no payment method**, so every gateway call fails with `No payment method`. That gateway is the only route to `deepseek-v4-*`. Nothing routes to it, and opencode is deliberately absent from standard/heavy/max so an opencode agent escalates to Claude rather than failing. To use Deepseek, add billing at opencode.ai and switch `[capability.lite.opencode]` to `opencode/deepseek-v4-pro`.

**Provider switching.** A tier lists the providers it supports. If an agent's provider is absent from the tier, the tier's `default_provider` wins — the call *switches provider*. That is how "max is Fable-only" holds even for a Codex-backed role:

```bash
python .agents/dispatch.py ask --role backend --diff 10 --prompt "..."  # codex -> Claude Fable
python .agents/dispatch.py ask --role review  --diff 2  --prompt "..."  # claude -> Pi GLM 5.2
```

The switch is recorded in the run log as `switched_from`.

### Difficulty is an override, not a required step

- **Omit `--diff` by default.** The role carries its own tier; the common case needs no rating. Only pass `--diff` when *this instance* differs from what its role usually implies (e.g. `--role backend --diff 10` for a backend task big enough to deserve Fable).
- **Don't guess a number.** If unsure, omit it and trust the role. (This replaces the old self-assessment rule: routing by task type made per-call rating unnecessary.)
- **Why bucket 1–10 into 4 tiers:** no provider has 10 real capability tiers — the scale is a human vocabulary, the tiers are the real model/effort steps.
- **Precedence:** `--model` > tier (`--diff`, else the agent's own) > the agent's pinned `model`.

## Accounts

Claude runs on two accounts: **team** (default, `~/.claude`) and **personal** Max (`~/.claude-account-b`, via `CLAUDE_CONFIG_DIR`). Same binary, isolated config dirs, so two Claude jobs can run concurrently on separate quotas.

```bash
python .agents/dispatch.py ask --role design --account personal --prompt "..."
```

`--account` only affects Claude providers; on any other provider it is ignored with a warning. The `design2` / `build2` roles are a shortcut to the same thing (`claude2-design`).

## The autonomous loop

`ask` and `handoff` are **one-shot**. The `loop` mechanism gives the system a **goal** and iterates **produce → verify → refine** across cold sub-agents until a stop condition is met — the classic generate/evaluate/refine cycle, mapped onto the roster as a **cheap producer + an expensive judge on different providers** (or the reverse).

```bash
# By recipe (the common case) — Opus builds, Fable QAs, until a11y + polish pass
python .agents/dispatch.py loop --recipe design-refine \
  --prompt "Build the Giovanni home hero + nav + footer; a11y clean, reduced-motion safe" \
  --cwd deliver/giovanni-serrano/workflows/07-webflow-build

# By explicit roles — producer + judge chosen per task
python .agents/dispatch.py loop --role design --verify-role design-qa --max-iter 6 \
  --prompt "polish the Clifton siding page until it is a11y-clean" --cwd <wf>

# Self-terminating (single strong agent, no judge) — must pass --until sentinel
python .agents/dispatch.py loop --role plan --until sentinel \
  --prompt "sharpen this migration plan until it is airtight"
```

**How state crosses the cold boundary.** Every iteration is a fresh cold process that inherits none of the previous round's conversation. Three layers carry state forward:

1. **The workspace is the primary state.** The product lives as files under `--cwd`; each round reads the current files, improves them, writes back. The driver just keeps aiming every iteration at the same `--cwd`.
2. **The ledger** (`ledger.md`) — cross-iteration memory the driver rebuilds and prepends into every producer prompt: the running Remaining list plus the verifier's feedback from the last round. This is what turns N cold processes into one coherent effort.
3. **The structured verdict** — each producer/verifier ends its reply with a fenced ```json``` block the driver parses. Parsing is tolerant (last block wins, nested braces and prose survive); an unparseable verdict is treated as "not done / no feedback", never a crash.

> **Never trust self-report alone.** `"done": true` from the producer is a *hint*; the authoritative stop is the **verifier**. Self-report is only authoritative when the loop runs `--until sentinel` explicitly.

### Recipes

Roles encode task *type*; **recipes** (`[loops.*]` in `roster.toml`) encode a loop *shape*, so a common loop is one word. Explicit `loop` flags override any recipe field. `routes` prints each recipe with its resolved producer/verifier → provider/model.

| Recipe | Producer | Verifier | Until | Shape |
| :--- | :--- | :--- | :--- | :--- |
| `design-refine` | `design` (Opus) | `design-qa` (Fable) | verifier | Opus builds fast, Fable judges hard |
| `bug-hunt` | `backend` (Codex Sol) | `review` (Fable) | verifier | Codex patches, Fable confirms the bug is gone |
| `doc-tighten` | `docs` (GLM) | `review` (Fable) | verifier | GLM iterates cheaply, Fable gates once |
| `plan-sharpen` | `plan` (Fable) | *(none)* | sentinel | single strong agent, self-terminating |

### Stopping conditions

The loop **must** stop — there is no unbounded mode. Evaluated after each iteration:

| Condition | Trigger | Final status |
| :--- | :--- | :--- |
| **verifier** (default with a judge) | judge returns `approved: true`, or `score ≥ pass_score` | `approved` |
| **sentinel** | producer emits `<<LOOP_DONE>>` or `"done": true` (only under `--until sentinel`) | `self-reported` |
| **no-progress** (always-on safety) | workspace fingerprint unchanged for `stall_limit` rounds while unapproved | `stalled` |
| **max-iter** | iteration count hits `--max-iter` (clamped to the ceiling) | `exhausted` |
| **budget-sec** | cumulative wall-clock ≥ `--budget-sec` (checked before each round) | `budget-exhausted` |
| **error** | producer/verifier raises beyond `error_tolerance` retries | `error` |

The **no-progress fingerprint** prefers `git status --porcelain` + `git diff --stat` + `HEAD` when `--cwd` is a git work tree (catches staged/unstaged/untracked edits and mid-loop commits); otherwise a hash of tracked files' size+mtime. Two unparseable verifier verdicts in a row degrade the stop to max-iter behaviour (so a broken judge can't spin the loop).

### Safety & cost

The loop **multiplies** cost (N iterations × up to 2 agents), so the guards are first-class:

- **Hard caps.** `--max-iter` clamps to `settings.loop.max_iter_ceiling`; `--budget-sec` to `budget_sec_ceiling`. Global defaults + ceilings live under `[settings.loop]` in `roster.toml`.
- **Iterations are siblings, not nested.** The driver does **not** bump `AGENT_DISPATCH_DEPTH` per iteration (each producer/verifier spawns at depth+1 like a normal `ask`), so a 6-iter loop never trips `max_depth`.
- **No loop-of-loops.** A separate `AGENT_DISPATCH_IN_LOOP` guard means a sub-agent *inside* a loop cannot start its own loop (it may still `ask` normally). The flag is restored on exit, so a long-lived caller isn't left poisoned.
- **Bypass permission mode + its structural gate.** A loop has no human between rounds, so each cold producer/verifier runs in the provider's **permission-bypass mode** (`bypass_args` in `roster.toml`: `--dangerously-skip-permissions` for Claude and `approval_policy=never` + a `workspace-write` sandbox for Codex — both verified; pi/opencode/gemini carry **unverified** best-guess flags, flagged as TODO in `roster.toml`, so autonomous loops on those providers are not yet trustworthy) — otherwise the headless agent stalls on the first tool-approval prompt and never edits the workspace. Because that is dangerous, it is fenced by a **structural safety gate**, not a mere toggle: bypass ENGAGES only when `--cwd` is a real directory **strictly inside an allowlisted root** (the repo root plus `[settings.loop].bypass_roots`) and **never the root itself**. If the gate isn't met — no `--cwd`, an out-of-tree `--cwd`, or the repo root — bypass is **withheld** and the round runs permission-gated (it may stall, surfacing the misconfiguration as a `stalled` stop rather than damage). Default-on; force off with `--no-bypass`. The gate is enforced inside `run_agent` itself, so no caller can obtain an unsandboxed bypass.
- **Mutating actions still gated — three layers, because bypass removes the interactive gate.** The workspace gate above confines *file writes* to `--cwd`, but a bypassed Claude agent's shell is otherwise unfenced (only Codex keeps an OS sandbox), so `git push` / deploy / email from inside the folder need separate defenses: (1) the loop **refuses to drive an inherently-mutating role** — `vcs`, `commit`, `deploy`, `publish`, `launch`, `release` (`LOOP_MUTATING_ROLES`) are rejected as producer or verifier, so no auto-commit or deploy-in-a-loop; (2) a **never-mutate guardrail** (`LOOP_GUARDRAIL`) is prepended to every producer/verifier prompt, forbidding publish/deploy/delete/DNS/billing/email/`git commit`/`git push` and any write outside the workspace. Loops produce files only; every mutating step stays human-gated.
- **Run logs.** Each round writes `runs/<loop-id>-iterNN-{produce,verify}.json` (argv, duration, rc, truncated stderr, verdict, `bypass` flag) — the same no-secrets rule as `ask`.
- Notifies **once** on a terminal status (not per round; `--no-notify` respected).

### State & file layout

Each loop owns a directory (contents transient, like `runs/` — persist a specific one with `git add -f`):

```
.agents/loops/<loop-id>/
  state.json          # authoritative loop state (rewritten after every step)
  ledger.md           # cross-iteration memory injected into each producer prompt
  iter-001-produce.md # raw producer stdout for the round
  iter-001-verify.md  # raw verifier stdout for the round
  result.md           # final synthesized report (written on any terminal status)
```

`state.json` is rewritten after **every** step, so a crash/Ctrl-C loses at most the in-flight sub-agent run — the groundwork for the resumable async/VPS model (a later phase).

> **Status:** the **sync** loop + recipes + `routes` LOOPS section are live (Phases 1–2). The **async/VPS** continuation model (`--async`, worker `loop-step`, `--resume`, `--stop`), the MCP `loop` tools, and the `@dispatch loop …` trigger phrase are **not yet implemented** (Phases 3–4).

## Contract

- **Request in, answer out.** A spawned agent is a fresh process — it does **not** inherit the caller's conversation. Always give it: a focused prompt, and (usually) `--cwd` set to the relevant workflow folder.
- **Working directory matters.** `--cwd` should point at the workflow folder so the sub-agent (a) reads the right directive `.md` for context filtering, and (b) is bound by that folder's `mcp-access.md` (see [mcp-servers/ACCESS_MODEL.md](../mcp-servers/ACCESS_MODEL.md)).
- **The answer is the sub-agent's stdout.** For `ask`, stdout is the reply. Pass `--json` for a `{ok, agent, answer, meta}` envelope.

## Safety & cost

- **Recursion guard:** depth is tracked via the `AGENT_DISPATCH_DEPTH` env var. Default `max_depth = 3` (config) prevents an agent → agent → agent runaway. A chain that exceeds it is refused, not spawned.
- **Timeouts:** default `timeout_sec = 900` (config); override per call with `--timeout`.
- **Cost:** booting a full agent is heavier than a raw API call. Use `ask` for things needing reasoning + tools + file edits; for trivial lookups prefer a direct API call.
- **Run logs:** each `ask`/`worker` run records lightweight JSON in `runs/` (argv, duration, returncode, truncated stderr). No secrets are logged.

## Notifications

When an agent finishes a task (`ask` or `worker`), `dispatch.py` can show a **desktop notification** so you don't have to watch the terminal.

- **Enabled by default.** Set `notifications.enabled = false` in `roster.toml` to silence everything globally.
- **Per-task silence:** pass `--no-notify` to `ask` or `handoff` to suppress the notification for that one call.
- **Sound:** configurable via `notifications.sound = true|false` in `roster.toml`.

### Platform support

| Platform | Mechanism | Setup required |
| :--- | :--- | :--- |
| **Windows** (local) | PowerShell UWP `ToastNotification` API | Nothing — built into Win10+ |
| **Linux** (VPS) | `notify-send` (libnotify) | `sudo apt install -y libnotify-bin` |
| **macOS** | `terminal-notifier` or `osascript` | `brew install terminal-notifier` (optional, falls back to built-in) |
| **Headless** (no display) | Prints to stderr | Nothing — auto-detected via `$DISPLAY`/`$WAYLAND_DISPLAY` |

Notifications never cause the caller to crash — all failures are silently caught and fall back to stderr.

### Notifications outside dispatch

If you run an agent CLI directly (`claude`, `codex`, `pi`) without going through `dispatch.py`, you won't get a notification automatically. Two ways to add them:

**A — One-shot wrapper** (`scripts/run-and-notify.py`):

```bash
# Prefix any command to get a toast on completion
python scripts/run-and-notify.py -- claude -p "Write a Flask app"
python scripts/run-and-notify.py -- codex exec "Refactor this"
python scripts/run-and-notify.py -- npm run build
```

Shows the exit status, duration, and first 200 chars of stderr on failure. A PowerShell function is provided for convenience: `run-and-notify claude -p "..."`.

**B — Bell character in interactive agents** (WezTerm users):

Configure WezTerm to turn terminal bell into a desktop toast in `~/.wezterm.lua`:

```lua
config.notify = "Toast"
config.audible_bell = "SystemBeep"  -- still hear it
```

Then tell the interactive agent to end long responses with a bell character (`\a` / `echo` `-e` `"\a"`). The agent can do this itself if you include in your system prompt:

```
When you finish a long-running task, output a bell character (\x07) so the terminal notifies the user.
```

## Cross-platform

### Windows (local)
All four CLIs are npm globals on PATH; `dispatch.py` runs them through `cmd.exe` to resolve the `.cmd`/`.bat` shims. The prompt is **piped via stdin**, never the command line, for providers that declare `prompt_stdin = true` in `roster.toml` (Claude and Codex today — Codex reads stdin via its `-` argument). This is mandatory on Windows: a `.cmd` shim runs through `cmd.exe`, which **truncates a multi-line argv element at the first newline**, so a prompt passed as an argument silently loses everything after line one. Providers without `prompt_stdin` (pi/opencode/gemini) still take the prompt as an argument and are therefore safe only for single-line prompts until they are converted. No special setup beyond the CLIs themselves.

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
# Claude (design) asks Codex (automation) for a snippet
python .agents/dispatch.py ask --role backend --prompt "Flask route that proxies Webflow webhooks" --json

# Codex (automation) asks Fable to review the code it just generated
python .agents/dispatch.py ask --role review --cwd . --prompt "Review this webhook handler for bugs"

# Any agent delegates a big doc pass and moves on
TID=$(python .agents/dispatch.py handoff --role docs --prompt "Reduce README.md tokens by 50%, keep meaning")
```

### Chaining (a task that changes model mid-flight)

A dispatched sub-agent can dispatch again, up to `max_depth = 3`. That is how one task uses several models without the caller orchestrating every step — a `design` agent (Opus) builds the page, hands the review to `review` (Fable), then hands the commit to `vcs` (GLM):

```bash
# inside the design sub-agent
python .agents/dispatch.py ask  --role review --prompt "Review the page I just built at <path>: <what it does>"
python .agents/dispatch.py ask  --role vcs    --prompt "Commit <paths> with a conventional message: <what changed>"
```

Two constraints make or break this:

- **Every hop is a cold process.** The sub-agent inherits none of the caller's conversation — only the prompt and `--cwd`. Re-state everything it needs. This, not the depth limit, is the real cost of chaining.
- **Depth is capped at 3** (`AGENT_DISPATCH_DEPTH`); a deeper chain is refused, not spawned.

## Optional: the MCP wrapper

`mcp-servers/agent-dispatch/server.py` exposes the same engine as MCP tools (`ask`, `handoff`, `collect`, `status`, `routes`) so an MCP client can call them natively instead of shelling out. Registration: [../mcp-servers/agent-dispatch/setup.md](../mcp-servers/agent-dispatch/setup.md). The `dispatch.py` CLI is the universal core — the MCP server is sugar. Access profile: [../mcp-servers/profiles/agent-dispatch.md](../mcp-servers/profiles/agent-dispatch.md) (`global` utility). The dispatch server holds no platform grants; sub-agents it spawns still follow the active folder's `mcp-access.md`.

## File layout

```
.agents/
  dispatch.py            # executor (stdlib only)
  test_dispatch.py       # offline resolution tests — run after any roster edit
  test_loop.py           # offline loop-driver control-logic tests
  config/roster.toml     # providers + named agents + tiers + settings + [loops.*]
  inbox/                 # async handoff: pending/running/done task JSON
  outbox/                # async handoff: finished answers (.md)
  runs/                  # per-run logs (lightweight JSON)
  loops/                 # per-loop state: <loop-id>/{state.json,ledger.md,iter-*.md,result.md}
```

**After editing the roster or a recipe, run the tests.** They spawn no agents (subprocess/`run_agent` is stubbed), so they are instant and free:

```bash
python .agents/test_dispatch.py     # asserts role->agent, tier->model, provider switching
python .agents/test_loop.py         # asserts loop control logic: carry-forward, stop rules,
                                    # ceiling clamp, malformed tolerance, recipe resolution, guards
```

They pin resolved model ids on purpose: an inverted tier and a silently-dropped `--diff` have both shipped here before, and neither is visible from the config alone.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md §4](../SYSTEM_RULES.md). Commit `dispatch.py`, `test_dispatch.py`, `test_loop.py`, `config/`, `DISPATCH.md`, `README.md`, and the queue `.gitignore` markers. The `inbox/`/`outbox/`/`runs/`/`loops/` contents are transient artifacts (each dir's `.gitignore` ignores them) — persist a finished/interesting one with `git add -f`, never secrets. Never commit provider login tokens, cookies, or API keys; those live outside this repo at runtime.

## Infrastructure

- **Hosting**: Hostinger VPS (Ubuntu 24.04 LTS) + local Windows workstation — identical dispatcher behaviour on both.
- **Runtime**: Python 3.11+ (stdlib only — uses `tomllib`). Provider CLIs installed per machine.
