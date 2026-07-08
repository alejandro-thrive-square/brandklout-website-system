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
  collect   Read a finished task's answer.
  status    Show inbox/outbox state.
  routes    Print the roster + role -> default-agent routing.
  doctor    Verify each provider CLI is installed on this machine.

Zero external dependencies (Python 3.11+ stdlib). Config: .agents/config/roster.toml

See DISPATCH.md for the full contract, routing table, and platform notes.
"""
from __future__ import annotations

import argparse
import json
import os
import platform
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

# --------------------------------------------------------------------------- paths
AGENTS_DIR = Path(__file__).resolve().parent          # .../.agents
REPO_ROOT = AGENTS_DIR.parent                          # repo root
CONFIG_PATH = AGENTS_DIR / "config" / "roster.toml"
INBOX = AGENTS_DIR / "inbox"
OUTBOX = AGENTS_DIR / "outbox"
RUNS = AGENTS_DIR / "runs"
for d in (INBOX, OUTBOX, RUNS):
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
    if sum(tok == "{prompt}" for tok in base) != 1:
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


def capability_overrides(cfg: dict, provider: str, diff: int | None) -> tuple[str | None, list[str]]:
    """(model, extra_args) for a difficulty tier on the given provider.
    (None, []) when difficulty is unset or no tier is defined for it."""
    if diff is None:
        return None, []
    if not (1 <= int(diff) <= 10):
        raise RuntimeError(f"Difficulty must be 1-10, got {diff}.")
    tier = tier_for_difficulty(cfg, int(diff))
    if not tier:
        return None, []
    cap_provider = "claude" if provider == "claude2" else provider   # claude2 shares claude tiers
    spec = ((cfg.get("capability") or {}).get(tier) or {}).get(cap_provider) or {}
    return spec.get("model"), list(spec.get("extra_args") or [])


def run_agent(cfg: dict, agent_name: str, agent: dict, prompt: str,
              *, cwd: Path | None, timeout: int,
              model_override: str | None = None, difficulty: int | None = None,
              account: str | None = None) -> tuple[str, str, int, dict]:
    """Run the provider CLI headlessly. Returns (stdout, stderr, returncode, meta)."""
    settings = cfg.get("settings", {})
    max_depth = int(settings.get("max_depth", 3))
    depth = int(os.environ.get("AGENT_DISPATCH_DEPTH", "0"))
    if depth >= max_depth:
        raise RuntimeError(
            f"Recursion guard: AGENT_DISPATCH_DEPTH={depth} >= max_depth={max_depth}. "
            "An agent chain is too deep — refusing to spawn another sub-agent.")

    providers = cfg.get("providers", {})
    provider_name = agent.get("provider")
    # Account override (Claude family only): team -> claude, personal -> claude2.
    if account and provider_name in ("claude", "claude2"):
        provider_name = "claude2" if account == "personal" else "claude"
    elif account:
        print(f"[dispatch] --account ignored: agent '{agent_name}' is provider "
              f"'{provider_name}' (not claude).", file=sys.stderr)
    provider = providers.get(provider_name)
    if not provider:
        raise RuntimeError(f"Agent '{agent_name}' references unknown provider "
                           f"'{provider_name}'. Known: {', '.join(providers)}")

    # Effective model + extra_args.
    # Precedence: --model > --diff tier > agent default. Extra_args: tier wins when diff set.
    cap_model, cap_extra = capability_overrides(cfg, provider_name, difficulty)
    if model_override:
        eff_model = model_override
        eff_extra = cap_extra if difficulty is not None else list(agent.get("extra_args") or [])
    elif difficulty is not None:
        eff_model = cap_model or agent.get("model")
        eff_extra = cap_extra
    else:
        eff_model = agent.get("model")
        eff_extra = list(agent.get("extra_args") or [])
    argv = build_argv(provider, prompt, eff_model, eff_extra)
    exe = argv[0]
    resolved = shutil.which(exe)
    if not resolved:
        raise RuntimeError(
            f"Provider CLI '{exe}' is not installed on this machine. "
            f"Install it, then re-run. See `python {Path(__file__).name} doctor`.")
    argv = [resolved, *argv[1:]]   # absolute path: PATH safety + npm .cmd shims

    env = os.environ.copy()
    for k, v in (provider.get("env") or {}).items():    # e.g. CLAUDE_CONFIG_DIR (account isolation)
        env[k] = os.path.expanduser(str(v))
    env["AGENT_DISPATCH_DEPTH"] = str(depth + 1)
    env["AGENT_DISPATCH_AGENT"] = agent_name
    env["AGENT_DISPATCH_ROLE"] = ",".join(agent.get("roles") or [])
    env["AGENT_DISPATCH_ACCOUNT"] = account or ""

    is_windows = platform.system() == "Windows"
    started = time.time()
    try:
        if is_windows:
            # Global npm CLIs are .cmd/.bat shims; cmd.exe resolves & runs them.
            # list2cmdline safely quotes every arg (including multiline prompts).
            proc = subprocess.run(
                subprocess.list2cmdline(argv),
                shell=True,
                cwd=str(cwd) if cwd else None,
                capture_output=True, text=True,
                timeout=timeout or None, env=env,
            )
        else:
            proc = subprocess.run(
                argv,
                cwd=str(cwd) if cwd else None,
                capture_output=True, text=True,
                timeout=timeout or None, env=env,
            )
    except subprocess.TimeoutExpired:
        raise RuntimeError(f"Provider '{exe}' timed out after {timeout}s.")
    meta = {"agent": agent_name, "provider": provider_name, "model": eff_model,
            "difficulty": difficulty, "account": account, "argv": argv,
            "duration_s": round(time.time() - started, 1),
            "depth": depth, "cwd": str(cwd) if cwd else None}
    return proc.stdout, proc.stderr, proc.returncode, meta


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
        "model": args.model or agent.get("model"), "difficulty": args.diff,
        "account": args.account,
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
    print("AGENTS")
    print(f"  {'NAME':20}  {'PROVIDER':8}  {'MODEL':12}  ROLES")
    for name, spec in agents.items():
        print(f"  {name:20}  {spec.get('provider',''):8}  {str(spec.get('model','')):12}  "
              f"{', '.join(spec.get('roles') or [])}")
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
        print("\nCAPABILITY (difficulty -> tier -> model / effort)")
        print(f"  {'DIFF':6}  {'TIER':9}  {'CLAUDE':14}  {'CODEX':26}  PI")
        for tier, r in (cap.get("ranges") or {}).items():
            cells = []
            for prov in ("claude", "codex", "pi"):
                spec = (cap.get(tier) or {}).get(prov) or {}
                m = spec.get("model", "")
                ea = " ".join(spec.get("extra_args") or [])
                cells.append(f"{m}{' ' + ea if ea else ''}")
            print(f"  {str(r):6}  {tier:9}  {cells[0]:14}  {cells[1]:26}  {cells[2]}")
        print("  (opt-in: add --diff N / diff:N to a call; omit to use the agent's default model)")
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
                     "gemini": "npm i -g @google/gemini-cli"}
            hint = f"  install: {hints.get(exe, '?')}"
            rc = 1
        print(f"  {status} {name:8} -> {exe:10}{hint}")
    print(f"\npython: {sys.executable}")
    print(f"repo:   {REPO_ROOT}")
    print(f"queues: {INBOX}")
    return rc


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
                        help="task difficulty 1-10; routes to a capability tier "
                             "(model + reasoning effort) for this call")
        sp.add_argument("--account", choices=["team", "personal"],
                        help="Claude account: team (default ~/.claude) or personal "
                             "(~/.claude-account-b). Only affects claude agents.")

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
