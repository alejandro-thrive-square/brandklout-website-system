#!/usr/bin/env python3
"""
Webzite cross-provider agent dispatcher.

Lets ANY agent runtime (Claude Code, Codex, pi, Gemini) trigger another
provider's agent headlessly and read back the answer. Cross-platform:
identical behaviour on Windows (local) and Ubuntu (Hostinger VPS).

Mechanisms
----------
  ask       Synchronous  — run a provider agent now, print its answer.        (quick answer)
  handoff   Asynchronous — drop a task in inbox/, get a task id.              (delegate sub-project)
  worker    Process inbox tasks (--once for cron/systemd, --watch to loop).
  loop      Autonomous  — iterate a goal produce->verify->refine to a stop.   (self-refining)
  collect   Read a finished task's answer.
  status    Show inbox/outbox state.
  routes    Print the roster + role -> default-agent routing.
  doctor    Verify each provider CLI is installed on this machine.

Zero external dependencies (Python 3.11+ stdlib). Config: .agents/config/roster.toml

See DISPATCH.md for the full contract, routing table, and platform notes.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import platform
import re
import shutil
import subprocess
import sys
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path

try:
    import tomllib  # py311+ stdlib
except ModuleNotFoundError:  # pragma: no cover
    sys.exit("dispatch.py requires Python 3.11+ (tomllib). Found: " + sys.version)

# Sub-agent output is UTF-8; Windows consoles default to cp1252 and would raise
# UnicodeEncodeError when we print an answer containing e.g. '->' arrows or smart
# quotes. Force UTF-8 with replacement so printing a reply can never crash dispatch.
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):  # non-reconfigurable stream (e.g. piped/captured)
        pass

# --------------------------------------------------------------------------- paths
AGENTS_DIR = Path(__file__).resolve().parent          # .../.agents
REPO_ROOT = AGENTS_DIR.parent                          # repo root
sys.path.insert(0, str(REPO_ROOT))                     # so `from scripts.notify import ...` works

from scripts.notify import notify
CONFIG_PATH = AGENTS_DIR / "config" / "roster.toml"
INBOX = AGENTS_DIR / "inbox"
OUTBOX = AGENTS_DIR / "outbox"
RUNS = AGENTS_DIR / "runs"
LOOPS = AGENTS_DIR / "loops"
for d in (INBOX, OUTBOX, RUNS, LOOPS):
    d.mkdir(parents=True, exist_ok=True)


# --------------------------------------------------------------------------- config
def load_config() -> dict:
    if not CONFIG_PATH.exists():
        sys.exit(f"Config not found: {CONFIG_PATH}")
    with CONFIG_PATH.open("rb") as fh:
        return tomllib.load(fh)


def resolve_agent(cfg: dict, *, agent: str | None, role: str | None) -> tuple[str, dict]:
    agents = cfg.get("agents", {})
    if agent:
        if agent not in agents:
            sys.exit(f"Unknown agent '{agent}'. Known: {', '.join(agents) or '(none)'}")
        return agent, agents[agent]
    if role:
        for name, spec in agents.items():          # file order is preserved by tomllib
            if role in (spec.get("roles") or []):
                return name, spec
        sys.exit(f"No agent tagged with role '{role}'. Run `routes` to see the roster.")
    sys.exit("Provide --agent NAME or --role ROLE.")


# --------------------------------------------------------------------------- runner
def build_argv(provider: dict, prompt: str, model: str | None, extra_args: list[str]) -> list[str]:
    base = provider.get("command") or []
    n_prompt = sum(tok == "{prompt}" for tok in base)
    if provider.get("prompt_stdin"):
        # Prompt is fed via stdin (run_agent), NOT the command line. This is the
        # ONLY reliable way to pass a multi-line prompt to an npm .cmd shim on
        # Windows: a newline in an argv element is truncated by cmd.exe/batch at
        # the first line, so `command` must carry no {prompt} token.
        if n_prompt:
            raise ValueError(
                f"provider has prompt_stdin=true so its command must NOT contain a "
                f"{{prompt}} token (the prompt is piped via stdin): {base}")
        argv = list(base)
    else:
        if n_prompt != 1:
            raise ValueError(f"provider command must contain exactly one {{prompt}} token: {base}")
        argv = [tok.replace("{prompt}", prompt) for tok in base]
    if model:
        for tok in provider.get("model_args") or []:
            argv.append(tok.replace("{model}", model))
    for tok in (extra_args or []):
        argv.append(tok)
    return argv


# ----------------------------------------------------------------- capability routing
def _parse_range(r: str) -> tuple[int, int]:
    r = str(r).strip()
    if "-" in r:
        lo, hi = r.split("-", 1)
        return int(lo), int(hi)
    v = int(r)
    return v, v


def tier_for_difficulty(cfg: dict, diff: int) -> str | None:
    ranges = (cfg.get("capability") or {}).get("ranges") or {}
    for tier, r in ranges.items():               # file order preserved by tomllib
        lo, hi = _parse_range(r)
        if lo <= diff <= hi:
            return tier
    return None


def known_tiers(cfg: dict) -> list[str]:
    cap = cfg.get("capability") or {}
    return [k for k, v in cap.items() if k != "ranges" and isinstance(v, dict)]


def resolve_tier_spec(cfg: dict, tier: str, provider: str) -> tuple[str, str | None, list[str]]:
    """(provider, model, extra_args) for a tier.

    A tier lists the providers it supports. When `provider` is not one of them
    the tier's `default_provider` wins — that is the provider SWITCH (e.g. a
    codex agent at `max` has no codex entry, so it lands on Claude/Fable).
    """
    cap = cfg.get("capability") or {}
    tspec = cap.get(tier)
    if not isinstance(tspec, dict):
        raise RuntimeError(f"Unknown capability tier '{tier}'. "
                           f"Known: {', '.join(known_tiers(cfg)) or '(none)'}")
    entry = tspec.get(provider)
    if isinstance(entry, dict):
        return provider, entry.get("model"), list(entry.get("extra_args") or [])
    fallback = tspec.get("default_provider")
    entry = tspec.get(fallback) if fallback else None
    if isinstance(entry, dict):
        return fallback, entry.get("model"), list(entry.get("extra_args") or [])
    raise RuntimeError(
        f"Tier '{tier}' has no entry for provider '{provider}' and no usable "
        f"default_provider. Fix [capability.{tier}] in roster.toml.")


def tier_for_call(cfg: dict, agent: dict, diff: int | None) -> str | None:
    """Which tier applies: --diff wins over the agent's declared tier."""
    if diff is not None:
        if not (1 <= int(diff) <= 10):
            raise RuntimeError(f"Difficulty must be 1-10, got {diff}.")
        tier = tier_for_difficulty(cfg, int(diff))
        if not tier:
            raise RuntimeError(f"No tier covers difficulty {diff}. Check [capability].ranges.")
        return tier
    return agent.get("tier")


# ----------------------------------------------------- bypass permission gate
# An autonomous loop has NO human between rounds, so its cold producer/verifier
# CLIs must run in each provider's permission-bypass mode (roster.toml
# `bypass_args`) or they stall on the first tool-approval prompt and never touch
# the workspace. That capability is dangerous — the agent acts with no approval —
# so it is fenced by a STRUCTURAL gate: bypass is granted ONLY when the sub-agent
# is confined to a real, bounded workspace under an allowlisted root. Fail-safe:
# when the gate is not satisfied the call still runs, just WITHOUT bypass (the
# safe, permission-gated default). The gate withholds the dangerous capability;
# it never fabricates an unsafe one.

def bypass_roots(cfg: dict) -> list[Path]:
    """Directories under which permission-bypass may operate. The repo root is
    always included; extra ABSOLUTE roots may be listed in [settings.loop].bypass_roots."""
    roots = [REPO_ROOT]
    extra = ((cfg.get("settings") or {}).get("loop") or {}).get("bypass_roots") or []
    for r in extra:
        try:
            roots.append(Path(os.path.expanduser(str(r))).resolve())
        except (OSError, ValueError, TypeError):
            continue
    return roots


def bypass_workspace_ok(cwd: Path | None, cfg: dict) -> tuple[bool, str]:
    """Structural safety gate for permission-bypass mode. Returns (allowed, reason).

    Bypass is allowed only when --cwd is a real directory that lives STRICTLY
    inside an allowlisted root (a proper subfolder, never the root itself). A
    bypass agent aimed at the repo root could rewrite dispatch.py / roster.toml /
    .env; an unset or out-of-tree --cwd has no bounded blast radius at all. Both
    are refused so the dangerous capability only ever runs in a scoped sandbox.
    """
    if cwd is None:
        return False, "no --cwd workspace given (bypass needs a bounded sandbox folder)"
    cwd = Path(cwd)
    if not cwd.exists() or not cwd.is_dir():
        return False, f"--cwd '{cwd}' is not an existing directory"
    try:
        cwd_r = cwd.resolve()
    except (OSError, ValueError):
        return False, f"--cwd '{cwd}' could not be resolved"
    roots = bypass_roots(cfg)
    for root in roots:
        if cwd_r == root:
            return False, (f"--cwd is the root '{root}' itself — too broad for bypass; "
                           "point it at a workflow subfolder")
        try:
            cwd_r.relative_to(root)
            return True, f"confined to '{cwd_r}' under '{root}'"
        except ValueError:
            continue
    return False, (f"--cwd '{cwd_r}' is outside every allowlisted bypass root "
                   f"({', '.join(str(r) for r in roots)})")


def run_agent(cfg: dict, agent_name: str, agent: dict, prompt: str,
              *, cwd: Path | None, timeout: int,
              model_override: str | None = None, difficulty: int | None = None,
              account: str | None = None, bypass: bool = False,
              ) -> tuple[str, str, int, dict]:
    """Run the provider CLI headlessly. Returns (stdout, stderr, returncode, meta).

    `bypass` requests permission-bypass mode (autonomous loops). It is applied
    only when the structural safety gate (`bypass_workspace_ok`) passes AND the
    resolved provider declares `bypass_args`; otherwise the call runs
    permission-gated. run_agent enforces the gate itself so no caller can obtain
    an unsandboxed bypass.
    """
    settings = cfg.get("settings", {})
    max_depth = int(settings.get("max_depth", 3))
    depth = int(os.environ.get("AGENT_DISPATCH_DEPTH", "0"))
    if depth >= max_depth:
        raise RuntimeError(
            f"Recursion guard: AGENT_DISPATCH_DEPTH={depth} >= max_depth={max_depth}. "
            "An agent chain is too deep — refusing to spawn another sub-agent.")

    provider_name = agent.get("provider")
    eff_model = agent.get("model")                      # legacy: agents may pin a model
    eff_extra = list(agent.get("extra_args") or [])

    # Tier resolves (provider, model, extra_args). May switch provider — that is
    # how "max is Fable-only" holds even for a codex-backed role.
    # Precedence: --model > tier (--diff, else the agent's own) > agent's model.
    tier = tier_for_call(cfg, agent, difficulty)
    switched_from = None
    if tier:
        new_provider, t_model, t_extra = resolve_tier_spec(cfg, tier, provider_name)
        if new_provider != provider_name:
            switched_from = provider_name
            provider_name = new_provider
        if t_model:
            eff_model = t_model
        if t_extra:
            eff_extra = t_extra
    if model_override:
        eff_model = model_override

    # Personal (Max) account runs the same claude binary under its own config dir.
    if account and provider_name in ("claude", "claude2"):
        provider_name = "claude2" if account == "personal" else "claude"
    elif account:
        print(f"[dispatch] --account ignored: agent '{agent_name}' resolved to provider "
              f"'{provider_name}' (accounts only apply to claude).", file=sys.stderr)

    providers = cfg.get("providers", {})
    provider = providers.get(provider_name)
    if not provider:
        raise RuntimeError(f"Agent '{agent_name}' resolved to unknown provider "
                           f"'{provider_name}'. Known: {', '.join(providers)}")

    # ---- BYPASS PERMISSION MODE (gated) -----------------------------------
    # Apply the provider's bypass_args ONLY when explicitly requested (loops) AND
    # the structural safety gate passes AND the provider declares them. Any miss
    # falls back to the safe permission-gated mode with a clear reason on stderr.
    bypass_applied = False
    if bypass:
        ok, reason = bypass_workspace_ok(cwd, cfg)
        b_args = list(provider.get("bypass_args") or [])
        if ok and b_args:
            eff_extra = [*eff_extra, *b_args]
            bypass_applied = True
        elif not ok:
            print(f"[dispatch] permission-bypass DENIED by safety gate: {reason} — "
                  f"running permission-gated.", file=sys.stderr)
        else:
            print(f"[dispatch] permission-bypass requested but provider '{provider_name}' "
                  f"declares no bypass_args in roster.toml — running permission-gated.",
                  file=sys.stderr)

    argv = build_argv(provider, prompt, eff_model, eff_extra)
    exe = argv[0]
    resolved = shutil.which(exe)
    if not resolved:
        raise RuntimeError(
            f"Provider CLI '{exe}' is not installed on this machine. "
            f"Install it, then re-run. See `python {Path(__file__).name} doctor`.")
    argv = [resolved, *argv[1:]]   # absolute path: PATH safety + npm .cmd shims

    env = os.environ.copy()
    for k, v in (provider.get("env") or {}).items():     # e.g. CLAUDE_CONFIG_DIR (account isolation)
        env[k] = os.path.expanduser(str(v))
    env["AGENT_DISPATCH_DEPTH"] = str(depth + 1)
    env["AGENT_DISPATCH_AGENT"] = agent_name
    env["AGENT_DISPATCH_ROLE"] = ",".join(agent.get("roles") or [])
    env["AGENT_DISPATCH_ACCOUNT"] = account or ""

    # Providers with prompt_stdin get the prompt piped to stdin; the argv then
    # carries only flags (no newlines), so cmd.exe/batch can't truncate it. Others
    # keep the prompt as an argv element (safe only for single-line prompts).
    use_stdin = bool(provider.get("prompt_stdin"))
    stdin_text = prompt if use_stdin else None

    is_windows = platform.system() == "Windows"
    started = time.time()
    try:
        if is_windows:
            # Global npm CLIs are .cmd/.bat shims; cmd.exe resolves & runs them.
            # The prompt travels via stdin (prompt_stdin providers), so the quoted
            # command line here is newline-free and safe.
            proc = subprocess.run(
                subprocess.list2cmdline(argv),
                shell=True,
                cwd=str(cwd) if cwd else None,
                input=stdin_text,
                capture_output=True, text=True,
                encoding="utf-8", errors="replace",
                timeout=timeout or None, env=env,
            )
        else:
            proc = subprocess.run(
                argv,
                cwd=str(cwd) if cwd else None,
                input=stdin_text,
                capture_output=True, text=True,
                encoding="utf-8", errors="replace",
                timeout=timeout or None, env=env,
            )
    except subprocess.TimeoutExpired:
        raise RuntimeError(f"Provider '{exe}' timed out after {timeout}s.")
    meta = {"agent": agent_name, "provider": provider_name, "model": eff_model,
            "tier": tier, "switched_from": switched_from,
            "difficulty": difficulty, "account": account, "argv": argv,
            "bypass": bypass_applied,
            "duration_s": round(time.time() - started, 1),
            "depth": depth, "cwd": str(cwd) if cwd else None}
    return proc.stdout or "", proc.stderr or "", proc.returncode, meta


# --------------------------------------------------------------------------- tasks
def new_task_id(role_or_agent: str) -> str:
    slug = "".join(c.lower() if c.isalnum() else "-" for c in role_or_agent).strip("-")[:24] or "task"
    return f"{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}-{slug}-{uuid.uuid4().hex[:6]}"


def task_path(tid: str) -> Path:
    return INBOX / f"{tid}.json"


def read_task(tid: str) -> dict:
    p = task_path(tid)
    if not p.exists():
        sys.exit(f"No such task id: {tid}")
    return json.loads(p.read_text(encoding="utf-8"))


def write_task(task: dict) -> None:
    task_path(task["id"]).write_text(json.dumps(task, indent=2), encoding="utf-8")


# --------------------------------------------------------------------------- commands
def cmd_ask(args, cfg) -> int:
    agent_name, agent = resolve_agent(cfg, agent=args.agent, role=args.role)
    cwd = Path(args.cwd).resolve() if args.cwd else None
    settings = cfg.get("settings", {})
    timeout = int(args.timeout or settings.get("timeout_sec", 900))
    try:
        out, err, rc, meta = run_agent(cfg, agent_name, agent, args.prompt,
                                       cwd=cwd, timeout=timeout,
                                       model_override=args.model, difficulty=args.diff,
                                       account=args.account)
    except RuntimeError as e:
        if args.json:
            print(json.dumps({"ok": False, "error": str(e)}))
        else:
            print(f"[dispatch] error: {e}", file=sys.stderr)
        return 2
    (RUNS / f"{agent_name}-{int(time.time())}.json").write_text(
        json.dumps({**meta, "returncode": rc,
                    "stdout_len": len(out), "stderr": err[-2000:]}, indent=2),
        encoding="utf-8")
    notify_cfg = cfg.get("notifications", {})
    if notify_cfg.get("enabled") and not getattr(args, "no_notify", False):
        status = "OK" if rc == 0 else "FAIL"
        notify(title=f"Agent {agent_name} {status}",
               message=args.prompt[:120],
               sound=notify_cfg.get("sound", True))
    if args.json:
        print(json.dumps({"ok": rc == 0, "agent": agent_name, "answer": out,
                          "stderr": err if rc else "", "meta": meta}))
    else:
        sys.stdout.write(out)
        if not out.endswith("\n"):
            sys.stdout.write("\n")
    return 0 if rc == 0 else 1


def cmd_handoff(args, cfg) -> int:
    target = args.agent or args.role or "task"
    agent_name, agent = resolve_agent(cfg, agent=args.agent, role=args.role)
    tid = new_task_id(target)
    cwd = str(Path(args.cwd).resolve()) if args.cwd else None
    task = {
        "id": tid, "status": "pending",
        "agent": agent_name, "role": args.role, "provider": agent.get("provider"),
        "model": args.model, "difficulty": args.diff, "account": args.account,
        "no_notify": getattr(args, "no_notify", False),
        "prompt": args.prompt, "cwd": cwd, "note": args.note or "",
        "created": datetime.now(timezone.utc).isoformat(),
    }
    write_task(task)
    print(tid)
    return 0


def cmd_worker(args, cfg) -> int:
    settings = cfg.get("settings", {})
    timeout = int(settings.get("timeout_sec", 900))
    while True:
        pending = sorted(
            (p for p in INBOX.glob("*.json")
             if json.loads(p.read_text(encoding="utf-8")).get("status") == "pending"),
            key=lambda p: json.loads(p.read_text(encoding="utf-8")).get("created", ""),
        )
        if not pending:
            if args.once:
                return 0
            time.sleep(args.poll_interval)
            continue
        task = json.loads(pending[0].read_text(encoding="utf-8"))
        task["status"] = "running"
        task["ran_at"] = datetime.now(timezone.utc).isoformat()
        write_task(task)
        agent_name, agent = task["agent"], cfg["agents"][task["agent"]]
        cwd = Path(task["cwd"]) if task.get("cwd") else None
        try:
            out, err, rc, meta = run_agent(cfg, agent_name, agent, task["prompt"],
                                           cwd=cwd, timeout=timeout,
                                           model_override=task.get("model"),
                                           difficulty=task.get("difficulty"),
                                           account=task.get("account"))
            task.update(status="done" if rc == 0 else "error",
                        returncode=rc, answer=out, stderr=err,
                        duration_s=meta["duration_s"],
                        finished_at=datetime.now(timezone.utc).isoformat())
            (OUTBOX / f"{task['id']}.md").write_text(
                f"# Task {task['id']}\n\n_Agent:_ `{agent_name}`  \n_Status:_ {task['status']}\n\n"
                f"## Prompt\n\n{task['prompt']}\n\n## Answer\n\n{out}\n",
                encoding="utf-8")
        except RuntimeError as e:
            task.update(status="error", error=str(e),
                        finished_at=datetime.now(timezone.utc).isoformat())
        write_task(task)
        notify_cfg = cfg.get("notifications", {})
        if notify_cfg.get("enabled") and not task.get("no_notify"):
            status = task.get("status", "?")
            notify(title=f"Task {task['id'][:20]} {status}",
                   message=task.get("prompt", "")[:120],
                   sound=notify_cfg.get("sound", True))
        (RUNS / f"{task['id']}.json").write_text(json.dumps(task, indent=2), encoding="utf-8")
        if args.once:
            return 0 if task["status"] == "done" else 1


def cmd_collect(args, cfg) -> int:
    task = read_task(args.task_id)
    if task.get("status") == "done":
        sys.stdout.write(task.get("answer", ""))
        if not task.get("answer", "").endswith("\n"):
            sys.stdout.write("\n")
        return 0
    print(f"[dispatch] task {args.task_id} status={task.get('status')}", file=sys.stderr)
    return 1


def cmd_status(args, cfg) -> int:
    rows = []
    for p in sorted(INBOX.glob("*.json")):
        t = json.loads(p.read_text(encoding="utf-8"))
        rows.append((t["id"][:34], t.get("status", "?"), t.get("agent", ""), t.get("role", "")))
    if not rows:
        print("Inbox empty.")
    else:
        print(f"{'ID':34}  {'STATUS':8}  {'AGENT':18}  ROLE")
        for r in rows:
            print(f"{r[0]:34}  {r[1]:8}  {r[2]:18}  {r[3]}")
    print(f"\noutbox: {len(list(OUTBOX.glob('*.md')))} finished answers in {OUTBOX}")
    return 0


def cmd_routes(args, cfg) -> int:
    agents = cfg.get("agents", {})
    providers = cfg.get("providers", {})
    print("AGENTS  (tier -> model is resolved from [capability])")
    print(f"  {'NAME':18}  {'PROVIDER':9}  {'TIER':9}  {'MODEL':16}  ROLES")
    for name, spec in agents.items():
        tier = spec.get("tier")
        model = spec.get("model") or ""
        if tier:
            try:
                _, m, _ = resolve_tier_spec(cfg, tier, spec.get("provider", ""))
                model = m or model
            except RuntimeError as e:
                model = f"!! {e}"
        roles = ", ".join(spec.get("roles") or []) or "(unrouted - use --agent)"
        print(f"  {name:18}  {spec.get('provider',''):9}  {str(tier or '-'):9}  "
              f"{str(model):16}  {roles}")
    role_map = {}
    for name, spec in agents.items():
        for r in (spec.get("roles") or []):
            role_map.setdefault(r, name)       # first agent tagged wins
    print("\nROLE -> DEFAULT AGENT")
    for r, name in role_map.items():
        print(f"  {r:20} -> {name}")
    print("\nPROVIDERS")
    for name, spec in providers.items():
        exe = (spec.get("command") or ["?"])[0]
        which = shutil.which(exe)
        print(f"  {name:8}  {exe:10}  {'INSTALLED' if which else 'MISSING':9}  "
              f"({which or 'not on PATH'})")
    cap = cfg.get("capability") or {}
    if cap:
        print("\nCAPABILITY (difficulty -> tier -> provider/model)")
        for tier, r in (cap.get("ranges") or {}).items():
            tspec = cap.get(tier) or {}
            dp = tspec.get("default_provider", "?")
            print(f"  {str(r):5}  {tier:9}  (default provider: {dp})")
            for prov, entry in tspec.items():
                if not isinstance(entry, dict):
                    continue
                ea = " ".join(entry.get("extra_args") or [])
                print(f"           {prov:10} {entry.get('model','')}{'  ' + ea if ea else ''}")
        print("\n  A tier lists the providers it supports. An agent whose provider is absent")
        print("  from the tier SWITCHES to that tier's default provider - e.g. a codex role")
        print("  at max has no codex entry, so it escalates to Claude/Fable.")
        print("  --diff N / diff:N overrides an agent's tier for one call.")

    loops = cfg.get("loops") or {}
    if loops:
        print("\nLOOPS  (recipe -> producer / verifier, each resolved to provider/model)")

        def _resolve_role(role):
            if not role:
                return "-", "-"
            try:
                name, spec = resolve_agent(cfg, agent=None, role=role)
            except SystemExit:
                return f"?{role}", "unrouted"
            tier = spec.get("tier")
            model = spec.get("model") or ""
            if tier:
                try:
                    _, m, _ = resolve_tier_spec(cfg, tier, spec.get("provider", ""))
                    model = m or model
                except RuntimeError as e:
                    model = f"!! {e}"
            return name, str(model)

        for name, r in loops.items():
            pn, pm = _resolve_role(r.get("producer"))
            until = r.get("until") or ("verifier" if r.get("verifier") else "sentinel")
            print(f"  {name:16}  until={until:9}  max_iter={r.get('max_iter', '-')}"
                  f"  pass_score={r.get('pass_score', '-')}")
            print(f"       producer  {str(r.get('producer') or '-'):14} -> {pn} / {pm}")
            if r.get("verifier"):
                vn, vm = _resolve_role(r.get("verifier"))
                print(f"       verifier  {str(r.get('verifier')):14} -> {vn} / {vm}")
            else:
                print(f"       verifier  {'(none)':14}    self-terminating (--until sentinel)")
    return 0


def cmd_doctor(args, cfg) -> int:
    providers = cfg.get("providers", {})
    print("Provider CLI check (this machine):")
    rc = 0
    for name, spec in providers.items():
        exe = (spec.get("command") or ["?"])[0]
        which = shutil.which(exe)
        status = "OK   " if which else "MISS "
        hint = ""
        if not which:
            hints = {"claude": "npm i -g @anthropic-ai/claude-code",
                     "codex": "npm i -g @openai/codex",
                     "pi": "npm i -g @earendil-works/pi-coding-agent",
                     "opencode": "npm i -g opencode-ai  (see opencode.ai)",
                     "gemini": "npm i -g @google/gemini-cli"}
            hint = f"  install: {hints.get(exe, '?')}"
            rc = 1
        print(f"  {status} {name:8} -> {exe:10}{hint}")
    print(f"\npython: {sys.executable}")
    print(f"repo:   {REPO_ROOT}")
    print(f"queues: {INBOX}")
    return rc


# --------------------------------------------------------------------------- loop
# An autonomous loop gives the system a GOAL and iterates produce -> verify ->
# refine across COLD sub-agents until a stop condition is met. The driver is the
# only thing that persists across iterations; each producer/verifier call is a
# fresh cold process (exactly like `ask`). State crosses the cold boundary via
# three layers: the workspace under --cwd (primary state), a ledger.md prepended
# into every producer prompt (cross-iteration memory), and a small fenced-JSON
# verdict the driver parses to decide when to stop. See the loop plan + DISPATCH.md.

LOOP_SENTINEL = "<<LOOP_DONE>>"
LOOP_TERMINAL = {"approved", "self-reported", "stalled", "exhausted",
                 "budget-exhausted", "error", "cancelled"}
_FENCE_RE = re.compile(r"```(?:\w+)?[ \t]*\r?\n?(.*?)```", re.DOTALL)

# A loop runs its sub-agents in permission-BYPASS mode (roster `bypass_args`), so
# the harness's interactive gate is gone — a bypassed agent's shell is unfenced
# (only Codex keeps an OS sandbox). The workspace-root gate confines file writes
# under --cwd but does NOT stop network/VCS side effects (git push, deploy,
# email) run from inside that folder. Two structural controls cover that vector:
#   1. LOOP_MUTATING_ROLES — the loop refuses to DRIVE an inherently-mutating
#      producer/verifier (no auto-commit, no deploy-in-a-loop).
#   2. LOOP_GUARDRAIL — prepended to every producer/verifier prompt, forbidding
#      the mutating commands outright. Soft control, but the primary one for a
#      bypassed Claude agent whose Bash is otherwise unfenced.
# Mutating actions stay human-gated even inside an autonomous loop.
LOOP_MUTATING_ROLES = {"vcs", "commit", "vcs2", "commit2",
                       "deploy", "publish", "launch", "release"}
LOOP_GUARDRAIL = (
    "## Unattended-safety guardrail (READ FIRST)\n"
    "You are running UNATTENDED in permission-bypass mode inside an automated "
    "loop — there is no human to approve anything. You may ONLY read and edit "
    "files inside the workspace below. You must NEVER run publish, deploy, "
    "release, DNS, billing, email, `git commit`, `git push`, or delete commands, "
    "and never touch files outside the workspace. Produce files only; leave every "
    "such action for a human. If the goal seems to require one, stop and say so in "
    "your summary instead of doing it.\n\n"
)


def _salvage_object(text: str) -> dict | None:
    """Return the LAST top-level balanced {...} in `text` parsed as a dict, else None."""
    if not text:
        return None
    last = None
    depth = 0
    start = None
    for i, ch in enumerate(text):
        if ch == "{":
            if depth == 0:
                start = i
            depth += 1
        elif ch == "}" and depth > 0:
            depth -= 1
            if depth == 0 and start is not None:
                last = text[start:i + 1]
    if last:
        try:
            val = json.loads(last)
            return val if isinstance(val, dict) else None
        except (json.JSONDecodeError, ValueError):
            return None
    return None


def extract_json_block(text: str) -> dict | None:
    """Tolerantly extract the last structured verdict from an agent's stdout.

    Prefers the content of the LAST fenced code block; falls back to the last
    balanced {...} anywhere in the text. Returns None if nothing parses — the
    driver treats that as "no structured feedback", never a crash.
    """
    if not text:
        return None
    bodies = [m.group(1) for m in _FENCE_RE.finditer(text)]
    for body in reversed(bodies):
        val = _salvage_object(body)
        if val is not None:
            return val
    return _salvage_object(text)


def workspace_fingerprint(cwd: Path | None) -> str | None:
    """Cheap fingerprint of the workspace, to detect no-progress stalls.

    Prefers `git status --porcelain` + `git diff --stat` + HEAD when cwd is a git
    work tree (precise: catches staged/unstaged/untracked edits and mid-loop
    commits). Falls back to a hash of each file's (path, size, mtime). Returns
    None when there is no workspace to sample — the caller then skips stall
    detection (a text-only loop has no files to fingerprint).
    """
    if not cwd:
        return None
    cwd = Path(cwd)
    if not cwd.exists():
        return None
    try:
        inside = subprocess.run(
            ["git", "-C", str(cwd), "rev-parse", "--is-inside-work-tree"],
            capture_output=True, text=True, timeout=30)
        if inside.returncode == 0 and inside.stdout.strip() == "true":
            porcelain = subprocess.run(
                ["git", "-C", str(cwd), "status", "--porcelain"],
                capture_output=True, text=True, timeout=60)
            stat = subprocess.run(
                ["git", "-C", str(cwd), "diff", "--stat"],
                capture_output=True, text=True, timeout=60)
            head = subprocess.run(
                ["git", "-C", str(cwd), "rev-parse", "HEAD"],
                capture_output=True, text=True, timeout=30)
            blob = f"{porcelain.stdout}\x00{stat.stdout}\x00{head.stdout}"
            return hashlib.sha256(blob.encode("utf-8", "replace")).hexdigest()[:16]
    except (OSError, subprocess.SubprocessError):
        pass
    h = hashlib.sha256()
    for p in sorted(cwd.rglob("*")):
        if p.is_file() and ".git" not in p.parts:
            try:
                st = p.stat()
                h.update(f"{p}:{st.st_size}:{int(st.st_mtime)}\x00".encode("utf-8", "replace"))
            except OSError:
                continue
    return h.hexdigest()[:16]


def loop_settings(cfg: dict) -> dict:
    """[settings.loop] with safe defaults — the global ceilings a loop can't exceed."""
    s = (cfg.get("settings") or {}).get("loop") or {}
    return {
        "max_iter_ceiling": int(s.get("max_iter_ceiling", 10)),
        "budget_sec_ceiling": int(s.get("budget_sec_ceiling", 10800)),
        "default_max_iter": int(s.get("default_max_iter", 6)),
        "default_pass_score": int(s.get("default_pass_score", 90)),
        "stall_limit": int(s.get("stall_limit", 2)),
        "error_tolerance": int(s.get("error_tolerance", 1)),
        "notify_each": bool(s.get("notify_each", False)),
    }


def resolve_recipe(cfg: dict, name: str) -> dict:
    loops = cfg.get("loops") or {}
    if name not in loops:
        sys.exit(f"Unknown loop recipe '{name}'. Known: {', '.join(loops) or '(none)'}. "
                 "Run `routes` to see recipes.")
    return loops[name]


def render_ledger(state: dict) -> str:
    """Build the cross-iteration memory injected into every producer prompt.

    Deterministic function of `state` (so a resumed loop rebuilds it identically):
    the latest producer-reported Remaining list + a chronological history of every
    round's producer summary and verifier verdict/blocking defects.
    """
    lines = ["# Loop ledger", "",
             f"**Goal:** {state['prompt']}", "",
             f"_Loop {state['id']} · entering iteration {state['iter']} "
             f"of at most {state['max_iter']}._", ""]
    hist = state.get("history") or []
    latest_remaining: list = []
    for h in hist:
        if isinstance(h.get("remaining"), list):
            latest_remaining = h["remaining"]
    lines.append("## Remaining (open items)")
    if latest_remaining:
        lines += [f"- {item}" for item in latest_remaining]
    else:
        lines.append("- (none reported yet — infer the work from the goal)")
    lines.append("")
    lines.append("## History (oldest first — build on this, do not restart)")
    if not hist:
        lines.append("_No iterations yet — this is round 1._")
    for h in hist:
        n = h["iter"]
        if h.get("error"):
            lines.append(f"### Iteration {n} — ERROR")
            lines.append(str(h["error"]))
            continue
        lines.append(f"### Iteration {n} — producer")
        lines.append(h.get("produced") or "(no summary)")
        v = h.get("verdict")
        if v is not None:
            lines.append(f"### Iteration {n} — verifier "
                         f"(approved: {v.get('approved')}, score: {v.get('score')})")
            blocking = v.get("blocking") or []
            if blocking:
                lines += [f"- {b}" for b in blocking]
            else:
                lines.append("- (no blocking defects listed)")
        elif h.get("verify_raw"):
            lines.append(f"### Iteration {n} — verifier (verdict was unparseable)")
            lines.append(str(h["verify_raw"])[:800])
    return "\n".join(lines) + "\n"


def build_producer_prompt(state: dict, ledger_text: str) -> str:
    cwd = state.get("cwd") or "(no workspace path was given — work in the current directory)"
    return (
        LOOP_GUARDRAIL +
        f"You are the PRODUCER in an autonomous improvement loop (iteration "
        f"{state['iter']} of at most {state['max_iter']}). Every round is a fresh "
        f"process; the ledger below is your only memory of prior rounds.\n\n"
        f"## Goal\n{state['prompt']}\n\n"
        f"## Workspace\n{cwd}\n"
        f"Read the CURRENT state of the workspace first, then make the single most "
        f"valuable improvement toward the goal this round. Prior rounds' work is real "
        f"— build on it, never restart from scratch.\n\n"
        f"## Ledger (cross-iteration memory — the verifier feedback here is authoritative)\n"
        f"{ledger_text}\n"
        f"## Required output\n"
        f"Do the work (edit the files in the workspace), THEN end your reply with a "
        f"single fenced JSON block and nothing after it:\n"
        f"```json\n"
        f'{{"done": false, "summary": "<what you changed this round>", '
        f'"remaining": ["<still-open item>", "..."]}}\n'
        f"```\n"
        f'Set "done": true only when you believe the goal is fully met (a verifier '
        f"may still reject it). You may also emit the literal token "
        f"{LOOP_SENTINEL} to signal completion."
    )


def build_verifier_prompt(state: dict, producer_summary: str) -> str:
    cwd = state.get("cwd") or "(no workspace path was given)"
    return (
        LOOP_GUARDRAIL +
        f"You are the VERIFIER (judge) in an autonomous improvement loop. Be strict "
        f"— you are the quality gate, and self-reports are not trustworthy.\n\n"
        f"## Goal the producer is working toward\n{state['prompt']}\n\n"
        f"## Workspace to inspect\n{cwd}\n\n"
        f"## The producer's self-report this round\n{producer_summary or '(none)'}\n\n"
        f"Independently inspect the ACTUAL workspace — do not trust the self-report. "
        f"Decide whether the goal is fully met. Passing score is {state['pass_score']}/100.\n\n"
        f"## Required output\n"
        f"End your reply with a single fenced JSON block and nothing after it:\n"
        f"```json\n"
        f'{{"approved": false, "score": 0, "blocking": ["<specific defect the producer '
        f'must fix next round>", "..."]}}\n'
        f"```\n"
        f"List EVERY blocking defect concretely — each becomes the producer's next "
        f'instruction. Set "approved": true only when nothing blocks shipping.'
    )


def _write_iter_log(loop_id: str, n: int, phase: str, payload: dict) -> None:
    try:
        (RUNS / f"{loop_id}-iter{n:02d}-{phase}.json").write_text(
            json.dumps(payload, indent=2, default=str), encoding="utf-8")
    except OSError:
        pass


def _render_result(state: dict) -> str:
    lines = [f"# Loop {state['id']} — {state['status'].upper()}", "",
             f"- **Goal:** {state['prompt']}"]
    p = state.get("producer") or {}
    lines.append(f"- **Producer:** {p.get('agent')} (role {p.get('role')})")
    if state.get("verifier"):
        v = state["verifier"]
        lines.append(f"- **Verifier:** {v.get('agent')} (role {v.get('role')})")
    lines.append(f"- **Until rule:** {state['until']}")
    lines.append(f"- **Iterations:** {state['iter']} of max {state['max_iter']}")
    lines.append(f"- **Stopped because:** {state.get('stop_reason')}")
    lines.append(f"- **Elapsed:** {state.get('elapsed_sec')}s")
    lines.append(f"- **Bypass permission mode:** {'ON' if state.get('bypass') else 'off'}")
    if state.get("cwd"):
        lines.append(f"- **Workspace:** {state['cwd']}")
    lines += ["", "## Iteration log"]
    for h in state.get("history") or []:
        v = h.get("verdict")
        if v is not None:
            tag = f" · verdict approved={v.get('approved')} score={v.get('score')}"
        elif h.get("verify_raw"):
            tag = " · verdict UNPARSEABLE"
        elif h.get("error"):
            tag = f" · ERROR"
        else:
            tag = ""
        lines.append(f"### Iteration {h['iter']}{tag}")
        lines.append(h.get("produced") or h.get("error") or "(no producer summary)")
        if v and v.get("blocking"):
            lines.append("Blocking:")
            lines += [f"- {b}" for b in v["blocking"]]
    return "\n".join(lines) + "\n"


def cmd_loop(args, cfg) -> int:
    # No loop-of-loops: a sub-agent spawned inside a loop cannot itself start one.
    # (It may still `ask` normally — the depth guard applies as usual.)
    if os.environ.get("AGENT_DISPATCH_IN_LOOP") == "1":
        msg = ("Loop guard: this process is already running inside a loop "
               "(AGENT_DISPATCH_IN_LOOP=1). Nested loops are refused.")
        if getattr(args, "json", False):
            print(json.dumps({"ok": False, "error": msg}))
        else:
            print(f"[loop] {msg}", file=sys.stderr)
        return 2

    lset = loop_settings(cfg)
    recipe = resolve_recipe(cfg, args.recipe) if args.recipe else {}

    # Producer (required) and verifier (optional) route through the UNCHANGED
    # resolve_agent + run_agent, so the loop is cross-provider and tier-aware for free.
    prod_role = args.role or recipe.get("producer")
    if not args.agent and not prod_role:
        sys.exit("loop: a producer is required — pass --role/--agent or --recipe NAME.")
    producer_name, producer = resolve_agent(cfg, agent=args.agent, role=prod_role)

    ver_role = args.verify_role or recipe.get("verifier")
    verifier_name = verifier = None
    if args.verify_agent or ver_role:
        verifier_name, verifier = resolve_agent(cfg, agent=args.verify_agent, role=ver_role)

    # Structural gate: a loop must not DRIVE an inherently-mutating role in bypass
    # mode (no auto-commit, no deploy-in-a-loop). Bypass removes the interactive
    # confirmation, so this refusal is the only thing standing in for it.
    for who, spec in (("producer", producer), ("verifier", verifier)):
        if spec and (set(spec.get("roles") or []) & LOOP_MUTATING_ROLES):
            bad = ", ".join(sorted(set(spec.get("roles") or []) & LOOP_MUTATING_ROLES))
            sys.exit(f"loop: refusing to run — the {who} is a mutating role ({bad}). "
                     "Autonomous loops produce files only; commit/deploy stay human-gated.")

    until = args.until or recipe.get("until") or ("verifier" if verifier else "sentinel")
    if until not in ("verifier", "sentinel"):
        sys.exit(f"loop: --until must be 'verifier' or 'sentinel' (got {until!r}). "
                 "no-progress / max-iter / budget are always-on safety stops.")
    if until == "verifier" and not verifier:
        sys.exit("loop: --until verifier needs a verifier (--verify-role/--verify-agent or a "
                 "recipe that names one). For a self-terminating loop use --until sentinel.")

    max_iter = int(args.max_iter or recipe.get("max_iter") or lset["default_max_iter"])
    max_iter = max(1, min(max_iter, lset["max_iter_ceiling"]))
    pass_score = int(args.pass_score if args.pass_score is not None
                     else recipe.get("pass_score", lset["default_pass_score"]))
    budget_sec = args.budget_sec if args.budget_sec is not None else recipe.get("budget_sec")
    if budget_sec is not None:
        budget_sec = max(1, min(int(budget_sec), lset["budget_sec_ceiling"]))
    stall_limit = int(recipe.get("stall_limit", lset["stall_limit"]))
    error_tolerance = int(recipe.get("error_tolerance", lset["error_tolerance"]))

    settings = cfg.get("settings", {})
    timeout = int(getattr(args, "timeout", None) or settings.get("timeout_sec", 900))
    cwd = Path(args.cwd).resolve() if args.cwd else None

    # ---- BYPASS PERMISSION MODE (the autonomy layer) ----------------------
    # Default-ON for loops (a loop has no human to approve each tool call), but it
    # only ENGAGES when the structural safety gate passes. --no-bypass forces the
    # safe permission-gated mode. Gate failure withholds bypass; it never aborts
    # the loop — the producers just run gated (and will likely stall, surfacing
    # the misconfiguration as a `stalled` stop rather than damage).
    want_bypass = (bool((settings.get("loop") or {}).get("bypass", True))
                   and not getattr(args, "no_bypass", False))
    gate_ok, gate_reason = bypass_workspace_ok(cwd, cfg)
    bypass = want_bypass and gate_ok

    loop_id = new_task_id(prod_role or args.agent or "loop")
    ldir = LOOPS / loop_id
    ldir.mkdir(parents=True, exist_ok=True)

    now = datetime.now(timezone.utc).isoformat()
    state = {
        "id": loop_id, "status": "running",
        "producer": {"agent": producer_name, "role": prod_role,
                     "diff": args.diff, "account": args.account},
        "verifier": ({"agent": verifier_name, "role": ver_role,
                      "diff": args.verify_diff, "account": args.verify_account}
                     if verifier else None),
        "until": until, "recipe": args.recipe,
        "prompt": args.prompt, "cwd": str(cwd) if cwd else None,
        "max_iter": max_iter, "iter": 0,
        "budget_sec": budget_sec, "elapsed_sec": 0,
        "pass_score": pass_score, "stall_limit": stall_limit,
        "error_tolerance": error_tolerance,
        "bypass": bypass,
        "history": [], "stop_reason": None,
        "created": now, "updated": now,
    }

    def save_state():
        state["updated"] = datetime.now(timezone.utc).isoformat()
        (ldir / "state.json").write_text(json.dumps(state, indent=2), encoding="utf-8")

    def log(msg):
        if not getattr(args, "json", False):
            print(f"[loop {loop_id[:24]}] {msg}", file=sys.stderr)

    started = time.time()

    def elapsed():
        return round(time.time() - started, 1)

    if bypass:
        log(f"bypass permission mode ON — {gate_reason}")
    elif want_bypass:
        log(f"bypass permission mode WITHHELD by safety gate ({gate_reason}); producers run "
            f"permission-gated and may stall — pass --cwd a workflow subfolder to enable autonomy")
    else:
        log("bypass permission mode OFF (--no-bypass); producers run permission-gated")

    save_state()

    # Iterations are SIBLINGS, not nested: do NOT bump AGENT_DISPATCH_DEPTH here
    # (run_agent already does +1 per spawn, so a 6-iter loop would otherwise trip
    # max_depth). Mark the loop for the no-loop-of-loops guard; restore on exit so
    # a long-lived caller (or the test suite) isn't left poisoned.
    _prev_in_loop = os.environ.get("AGENT_DISPATCH_IN_LOOP")
    os.environ["AGENT_DISPATCH_IN_LOOP"] = "1"
    stall_streak = 0
    malformed = 0
    errors = 0
    last_fp = workspace_fingerprint(cwd)   # baseline before any producer runs
    try:
        while True:
            if budget_sec is not None and elapsed() >= budget_sec:
                state["status"] = "budget-exhausted"
                state["stop_reason"] = f"wall-clock {elapsed()}s >= budget {budget_sec}s"
                break
            if state["iter"] >= max_iter:
                state["status"] = "exhausted"
                state["stop_reason"] = f"reached max_iter={max_iter} without a passing stop"
                break

            state["iter"] += 1
            n = state["iter"]
            entry = {"iter": n, "produced": None, "verdict": None,
                     "fingerprint": None, "duration_s": 0}

            # ---- PRODUCE -------------------------------------------------------
            ledger_text = render_ledger(state)
            (ldir / "ledger.md").write_text(ledger_text, encoding="utf-8")
            log(f"iter {n}/{max_iter}: producer({producer_name})...")
            try:
                out, err, rc, meta = run_agent(
                    cfg, producer_name, producer, build_producer_prompt(state, ledger_text),
                    cwd=cwd, timeout=timeout, difficulty=args.diff, account=args.account,
                    bypass=bypass)
            except RuntimeError as e:
                errors += 1
                entry["error"] = f"producer: {e}"
                state["history"].append(entry)
                save_state()
                _write_iter_log(loop_id, n, "produce", {"error": str(e)})
                log(f"iter {n}: producer error ({e}); {errors}/{error_tolerance} tolerated")
                if errors > error_tolerance:
                    state["status"] = "error"
                    state["stop_reason"] = f"producer error beyond tolerance: {e}"
                    break
                continue
            (ldir / f"iter-{n:03d}-produce.md").write_text(out, encoding="utf-8")
            entry["duration_s"] = meta.get("duration_s", 0)
            p_verdict = extract_json_block(out) or {}
            entry["produced"] = (p_verdict.get("summary")
                                 or (out.strip()[:500] if out.strip() else "(no output)"))
            if isinstance(p_verdict.get("remaining"), list):
                entry["remaining"] = p_verdict["remaining"]
            producer_done = bool(p_verdict.get("done")) or (LOOP_SENTINEL in out)
            _write_iter_log(loop_id, n, "produce",
                            {**meta, "returncode": rc, "verdict": p_verdict,
                             "stderr": err[-1000:]})

            # ---- SELF-REPORT stop (authoritative only under --until sentinel) --
            if until == "sentinel" and producer_done:
                state["history"].append(entry)
                state["status"] = "self-reported"
                state["stop_reason"] = "producer reported done (<<LOOP_DONE>>/\"done\":true)"
                save_state()
                break

            # ---- VERIFY --------------------------------------------------------
            if verifier:
                log(f"iter {n}/{max_iter}: verifier({verifier_name})...")
                try:
                    vout, verr, vrc, vmeta = run_agent(
                        cfg, verifier_name, verifier,
                        build_verifier_prompt(state, entry["produced"]),
                        cwd=cwd, timeout=timeout,
                        difficulty=args.verify_diff, account=args.verify_account,
                        bypass=bypass)
                except RuntimeError as e:
                    errors += 1
                    entry["verify_raw"] = f"verifier error: {e}"
                    state["history"].append(entry)
                    save_state()
                    _write_iter_log(loop_id, n, "verify", {"error": str(e)})
                    log(f"iter {n}: verifier error ({e}); {errors}/{error_tolerance} tolerated")
                    if errors > error_tolerance:
                        state["status"] = "error"
                        state["stop_reason"] = f"verifier error beyond tolerance: {e}"
                        break
                    continue
                (ldir / f"iter-{n:03d}-verify.md").write_text(vout, encoding="utf-8")
                entry["duration_s"] = round(entry["duration_s"] + vmeta.get("duration_s", 0), 1)
                verdict = extract_json_block(vout)
                _write_iter_log(loop_id, n, "verify",
                                {**vmeta, "returncode": vrc, "verdict": verdict,
                                 "stderr": verr[-1000:]})
                if verdict is None:
                    malformed += 1
                    entry["verify_raw"] = vout.strip()[:800]
                    log(f"iter {n}: verifier verdict unparseable ({malformed}x)")
                    if malformed >= 2:
                        state["history"].append(entry)
                        state["status"] = "exhausted"
                        state["stop_reason"] = ("verifier returned unparseable verdicts "
                                                f"{malformed}x — degraded to a max-iter stop")
                        save_state()
                        break
                    # counts as not-approved; fall through to the progress check
                else:
                    entry["verdict"] = verdict
                    approved = bool(verdict.get("approved"))
                    score = verdict.get("score")
                    if not approved and isinstance(score, (int, float)) and score >= pass_score:
                        approved = True
                    if approved:
                        state["history"].append(entry)
                        state["status"] = "approved"
                        state["stop_reason"] = (f"verifier approved (score={score})"
                                                if score is not None else "verifier approved")
                        save_state()
                        break

            # ---- NO-PROGRESS safety stop --------------------------------------
            fp = workspace_fingerprint(cwd)
            entry["fingerprint"] = fp
            if fp is not None and last_fp is not None and fp == last_fp:
                stall_streak += 1
            else:
                stall_streak = 0
            last_fp = fp
            state["elapsed_sec"] = elapsed()
            state["history"].append(entry)
            save_state()
            if fp is not None and stall_streak >= stall_limit:
                state["status"] = "stalled"
                state["stop_reason"] = (f"workspace fingerprint unchanged for "
                                        f"{stall_streak} consecutive rounds while unapproved")
                break

        state["elapsed_sec"] = elapsed()
        save_state()
    finally:
        if _prev_in_loop is None:
            os.environ.pop("AGENT_DISPATCH_IN_LOOP", None)
        else:
            os.environ["AGENT_DISPATCH_IN_LOOP"] = _prev_in_loop

    result_md = _render_result(state)
    (ldir / "result.md").write_text(result_md, encoding="utf-8")

    notify_cfg = cfg.get("notifications", {})
    if notify_cfg.get("enabled") and not getattr(args, "no_notify", False):
        notify(title=f"Loop {loop_id[:20]} {state['status'].upper()}",
               message=(state.get("stop_reason") or "")[:120],
               sound=notify_cfg.get("sound", True))

    ok = state["status"] in ("approved", "self-reported")
    if getattr(args, "json", False):
        print(json.dumps({"ok": ok, "loop_id": loop_id, "status": state["status"],
                          "iter": state["iter"], "stop_reason": state["stop_reason"],
                          "result": result_md, "state": state}))
    else:
        sys.stdout.write(result_md)
        if not result_md.endswith("\n"):
            sys.stdout.write("\n")
    return 0 if ok else 1


# --------------------------------------------------------------------------- cli
def main() -> int:
    p = argparse.ArgumentParser(prog="dispatch.py", description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)

    def add_target(sp):
        g = sp.add_mutually_exclusive_group(required=True)
        g.add_argument("--agent", help="named agent from roster (overrides --role)")
        g.add_argument("--role", help="role tag; resolves to first matching agent")
        sp.add_argument("--prompt", required=True, help="the task prompt for the sub-agent")
        sp.add_argument("--cwd", help="working directory for the sub-agent "
                                      "(use the relevant workflow folder so its mcp-access.md applies)")
        sp.add_argument("--model", help="override the agent's model for this call")
        sp.add_argument("--diff", type=int, metavar="N",
                        help="task difficulty 1-10; overrides the agent's tier for this call "
                             "(may switch provider — see `routes`)")
        sp.add_argument("--account", choices=["team", "personal"],
                        help="Claude account: team (default ~/.claude) or personal "
                             "(~/.claude-account-b). Only affects claude agents.")
        sp.add_argument("--no-notify", action="store_true",
                        help="suppress desktop notification for this task (overrides config)")

    sp = sub.add_parser("ask", help="synchronous: run a provider agent, print its answer")
    add_target(sp)
    sp.add_argument("--timeout", type=int, help="seconds (default from config)")
    sp.add_argument("--json", action="store_true", help="emit a JSON envelope")
    sp.set_defaults(func=cmd_ask)

    sp = sub.add_parser("handoff", help="async: drop a task in the inbox, get a task id")
    add_target(sp)
    sp.add_argument("--note", help="optional human note")
    sp.set_defaults(func=cmd_handoff)

    sp = sub.add_parser("worker", help="process inbox tasks")
    g = sp.add_mutually_exclusive_group()
    g.add_argument("--once", action="store_true", help="process one pending task, then exit")
    g.add_argument("--watch", action="store_true", help="loop forever (poll)")
    sp.add_argument("--poll-interval", type=int, default=5)
    sp.set_defaults(func=cmd_worker)

    sp = sub.add_parser("loop", help="autonomous: iterate a goal produce->verify->refine to a stop")
    g = sp.add_mutually_exclusive_group()
    g.add_argument("--agent", help="PRODUCER: named agent (overrides --role)")
    g.add_argument("--role", help="PRODUCER: role tag (the agent that does the work each round)")
    sp.add_argument("--prompt", required=True, help="the GOAL to iterate toward")
    sp.add_argument("--recipe", help="load a [loops.NAME] preset (explicit flags override it)")
    sp.add_argument("--verify-role", dest="verify_role",
                    help="JUDGE role: decides 'approved' each round (omit for a self-terminating loop)")
    sp.add_argument("--verify-agent", dest="verify_agent", help="JUDGE named agent (overrides --verify-role)")
    sp.add_argument("--until", choices=["verifier", "sentinel"],
                    help="stop rule: verifier-approved (default with a judge) or producer self-report")
    sp.add_argument("--max-iter", dest="max_iter", type=int,
                    help="hard iteration cap (clamped to settings.loop.max_iter_ceiling)")
    sp.add_argument("--pass-score", dest="pass_score", type=int,
                    help="verifier score >= this also counts as approved")
    sp.add_argument("--budget-sec", dest="budget_sec", type=int,
                    help="aggregate wall-clock cap across all iterations (clamped to ceiling)")
    sp.add_argument("--cwd", help="workspace for producer + verifier (the primary carried state)")
    sp.add_argument("--diff", type=int, metavar="N", help="difficulty tier override for the PRODUCER")
    sp.add_argument("--account", choices=["team", "personal"], help="Claude account for the PRODUCER")
    sp.add_argument("--verify-diff", dest="verify_diff", type=int, metavar="N",
                    help="difficulty tier override for the JUDGE only")
    sp.add_argument("--verify-account", dest="verify_account", choices=["team", "personal"],
                    help="Claude account for the JUDGE only")
    sp.add_argument("--timeout", type=int, help="per-call seconds (default from config)")
    sp.add_argument("--no-bypass", dest="no_bypass", action="store_true",
                    help="disable permission-BYPASS mode: producers/verifiers run "
                         "permission-gated (safe, but they may stall on tool prompts). "
                         "Bypass is default-on but only engages inside a bounded --cwd.")
    sp.add_argument("--no-notify", action="store_true", help="suppress the terminal-status notification")
    sp.add_argument("--json", action="store_true", help="emit a JSON envelope instead of result.md")
    sp.set_defaults(func=cmd_loop)

    sp = sub.add_parser("collect", help="print the answer for a finished task id")
    sp.add_argument("task_id")
    sp.set_defaults(func=cmd_collect)

    sp = sub.add_parser("status", help="show inbox/outbox state")
    sp.set_defaults(func=cmd_status)

    sp = sub.add_parser("routes", help="print roster + role->agent routing")
    sp.set_defaults(func=cmd_routes)

    sp = sub.add_parser("doctor", help="verify provider CLIs are installed")
    sp.set_defaults(func=cmd_doctor)

    args = p.parse_args()
    cfg = load_config()
    return args.func(args, cfg)


if __name__ == "__main__":
    raise SystemExit(main())
