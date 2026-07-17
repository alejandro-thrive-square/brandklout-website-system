#!/usr/bin/env python3
"""Resolution tests for dispatch.py — no agents are spawned (subprocess is stubbed).

Guards the routing contract in config/roster.toml:
  - role  -> agent            (task type picks the specialist)
  - tier  -> provider + model (power; --diff overrides the agent's own tier)
  - a tier that lacks the agent's provider SWITCHES provider

These are cheap and offline. Run after any roster edit:

    python .agents/test_dispatch.py

Exit code 0 = all pass. Model IDS are asserted on purpose: an inverted tier
(the heavy/max Fable-Opus swap) and a silently-dropped --diff have both shipped
here before, and neither is visible without pinning the resolved model.
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import dispatch  # noqa: E402

captured: dict = {}
FAILURES: list[str] = []


class _FakeProc:
    stdout, stderr, returncode = "stubbed", "", 0


def _fake_run(cmd, **kw):
    captured["cmd"] = cmd
    captured["env"] = kw.get("env") or {}
    captured["input"] = kw.get("input")
    return _FakeProc()


dispatch.subprocess.run = _fake_run                 # never spawn a real agent
dispatch.shutil.which = lambda exe: f"/fake/{exe}"  # pretend every CLI is installed

cfg = dispatch.load_config()


def resolve(role, diff=None, account=None, model=None):
    """Resolve a call the way `ask` would, and return its meta."""
    name, agent = dispatch.resolve_agent(cfg, agent=None, role=role)
    _, _, _, meta = dispatch.run_agent(cfg, name, agent, "p", cwd=None, timeout=10,
                                       difficulty=diff, account=account, model_override=model)
    return meta


def check(label, got, want):
    if got != want:
        FAILURES.append(f"{label}: got {got!r}, want {want!r}")
    print(f"  {'PASS' if got == want else 'FAIL'}  {label:52} -> {got}")


print("\n--- role picks the agent; the agent's tier picks the model (no --diff)")
m = resolve("review");      check("review (max)", (m["provider"], m["model"]), ("claude", "fable"))
m = resolve("plan");        check("plan (max)", (m["provider"], m["model"]), ("claude", "fable"))
m = resolve("design");      check("design (heavy)", (m["provider"], m["model"]), ("claude", "opus"))
m = resolve("backend");     check("backend (heavy)", (m["provider"], m["model"]), ("codex", "gpt-5.6-sol"))
m = resolve("site-update"); check("site-update (standard)", (m["provider"], m["model"]), ("claude", "sonnet"))
m = resolve("docs");        check("docs (lite)", (m["provider"], m["model"]), ("pi", "zai/glm-5.2"))
m = resolve("docs2");       check("docs2 (lite, 2nd worker)",
                                  (m["provider"], m["model"]), ("opencode", "zai-coding-plan/glm-5.2"))

print("\n--- tier ordering: Fable outranks Opus (heavy=opus, max=fable)")
m = resolve("design", diff=8);  check("diff 8  -> heavy/opus", (m["tier"], m["model"]), ("heavy", "opus"))
m = resolve("design", diff=10); check("diff 10 -> max/fable", (m["tier"], m["model"]), ("max", "fable"))

print("\n--- provider switch: a tier without the agent's provider re-routes")
m = resolve("backend", diff=10)
check("codex role @ max -> Claude Fable", (m["provider"], m["model"]), ("claude", "fable"))
check("  switch recorded", m["switched_from"], "codex")
m = resolve("review", diff=2)
check("claude role @ lite -> Pi GLM", (m["provider"], m["model"]), ("pi", "zai/glm-5.2"))
m = resolve("docs", diff=10)
check("pi role @ max -> Claude Fable", (m["provider"], m["model"]), ("claude", "fable"))

print("\n--- opencode never reaches the unbilled gateway (no 'No payment method')")
for tier_diff, label in ((5, "standard"), (8, "heavy"), (10, "max")):
    m = resolve("docs2", diff=tier_diff)
    check(f"opencode @ {label} -> switches off opencode", m["provider"], "claude")
m = resolve("docs2", diff=2)
check("opencode @ lite stays on the paid Z.ai plan",
      m["model"].startswith("zai-coding-plan/"), True)
check("  no gateway 'opencode/' model is ever routed",
      not any(str((cfg["capability"].get(t) or {}).get("opencode", {}).get("model", ""))
              .startswith("opencode/") for t in dispatch.known_tiers(cfg)), True)

print("\n--- reasoning effort follows the tier")
resolve("backend", diff=5)
check("codex @ standard -> medium", "model_reasoning_effort=medium" in captured["cmd"], True)
resolve("backend", diff=8)
check("codex @ heavy    -> high", "model_reasoning_effort=high" in captured["cmd"], True)

print("\n--- accounts: personal isolates CLAUDE_CONFIG_DIR")
m = resolve("design", account="personal")
check("--account personal -> claude2", m["provider"], "claude2")
check("  config dir redirected + ~ expanded",
      "~" not in captured["env"].get("CLAUDE_CONFIG_DIR", "~")
      and captured["env"].get("CLAUDE_CONFIG_DIR", "").endswith(".claude-account-b"), True)
m = resolve("design", account="team")
check("--account team -> claude", m["provider"], "claude")
resolve("design")
check("no --account -> team dir untouched",
      "claude-account-b" not in captured["env"].get("CLAUDE_CONFIG_DIR", ""), True)

print("\n--- precedence: --model beats the tier")
m = resolve("design", diff=10, model="haiku")
check("--model haiku overrides max", m["model"], "haiku")

print("\n--- pi models stay fully qualified (a bare id hits the wrong gateway)")
resolve("docs")
check("pi argv carries zai/glm-5.2", "zai/glm-5.2" in captured["cmd"], True)

print("\n--- out-of-range difficulty is refused, not silently defaulted")
for bad in (0, 11, -1):
    try:
        resolve("design", diff=bad)
        check(f"diff {bad} rejected", "no error", "RuntimeError")
    except RuntimeError:
        check(f"diff {bad} rejected", "RuntimeError", "RuntimeError")

print("\n--- multi-line prompt delivery: stdin providers keep the prompt OFF the")
print("    command line (a newline in an argv element is truncated by cmd.exe)")
ML = "## Header\nline two with the real task\n`backticks` {braces}\nact now"
name, agent = dispatch.resolve_agent(cfg, agent=None, role="design")   # claude, prompt_stdin
dispatch.run_agent(cfg, name, agent, ML, cwd=None, timeout=10)
cmdline = dispatch.subprocess.list2cmdline(captured["cmd"]) if isinstance(captured["cmd"], list) else str(captured["cmd"])
check("stdin provider: prompt NOT on the command line", "line two with the real task" in cmdline, False)
check("stdin provider: full multi-line prompt piped via stdin", captured["input"], ML)
check("stdin provider: newline survives (not truncated)", "\n" in (captured["input"] or ""), True)

name_c, agent_c = dispatch.resolve_agent(cfg, agent=None, role="backend")  # codex, prompt_stdin
dispatch.run_agent(cfg, name_c, agent_c, ML, cwd=None, timeout=10)
check("codex reads stdin: '-' sentinel present, prompt piped",
      ("-" in captured["cmd"]) and captured["input"] == ML, True)

# A prompt_stdin provider whose command still carries {prompt} is a config error.
try:
    dispatch.build_argv({"prompt_stdin": True, "command": ["x", "{prompt}"]}, "p", None, [])
    check("prompt_stdin + {prompt} token is rejected", "no error", "ValueError")
except ValueError:
    check("prompt_stdin + {prompt} token is rejected", "ValueError", "ValueError")

print("\n" + ("ALL PASS" if not FAILURES else f"{len(FAILURES)} FAILURE(S):"))
for f in FAILURES:
    print("  " + f)
sys.exit(1 if FAILURES else 0)
