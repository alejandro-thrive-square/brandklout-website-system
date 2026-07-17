#!/usr/bin/env python3
"""Offline control-logic tests for the autonomous `loop` driver in dispatch.py.

No agent is ever spawned: `run_agent` is stubbed to return canned producer /
verifier stdout, and `workspace_fingerprint` is stubbed where a test needs to
drive stall detection. We assert the DRIVER's decisions — carry-forward, the
stop conditions, ceiling clamps, malformed-verdict tolerance, recipe resolution,
and the depth / no-loop-of-loops guards — not any model behaviour.

    python .agents/test_loop.py

Exit 0 = all pass. Run after any edit to the loop driver or [loops.*] recipes.
"""
from __future__ import annotations

import contextlib
import io
import json
import os
import shutil
import tempfile
from argparse import Namespace
from pathlib import Path

import sys
sys.path.insert(0, str(Path(__file__).resolve().parent))
import dispatch  # noqa: E402

FAILURES: list[str] = []


def check(label, got, want):
    ok = got == want
    if not ok:
        FAILURES.append(f"{label}: got {got!r}, want {want!r}")
    print(f"  {'PASS' if ok else 'FAIL'}  {label:56} -> {got!r}")


# --------------------------------------------------------------------------- stubs
cfg = dispatch.load_config()

PROMPTS: list[tuple[str, str]] = []       # (role, prompt) per call, in order
CALLS = {"producer": 0, "verifier": 0}
ENVSEEN: list[dict] = []
BYPASSSEEN: list = []                       # the `bypass` kwarg each run_agent saw
Q_PROD: list = []                          # queued producer stdout (else DEFAULT)
Q_VER: list = []                           # queued verifier stdout (else DEFAULT)

DEFAULT_PROD = 'work.\n```json\n{"done": false, "summary": "did stuff", "remaining": ["x"]}\n```'
DEFAULT_VER = 'checked.\n```json\n{"approved": false, "score": 40, "blocking": ["nope"]}\n```'
RAISE = object()                            # sentinel: make the fake raise RuntimeError


def _reset():
    PROMPTS.clear(); ENVSEEN.clear(); Q_PROD.clear(); Q_VER.clear(); BYPASSSEEN.clear()
    CALLS["producer"] = CALLS["verifier"] = 0


def fake_run_agent(cfg, name, agent, prompt, **kw):
    role = "verifier" if "You are the VERIFIER" in prompt else "producer"
    PROMPTS.append((role, prompt))
    CALLS[role] += 1
    BYPASSSEEN.append(kw.get("bypass"))
    ENVSEEN.append({"DEPTH": os.environ.get("AGENT_DISPATCH_DEPTH"),
                    "IN_LOOP": os.environ.get("AGENT_DISPATCH_IN_LOOP")})
    q = Q_VER if role == "verifier" else Q_PROD
    out = q.pop(0) if q else (DEFAULT_VER if role == "verifier" else DEFAULT_PROD)
    if out is RAISE:
        raise RuntimeError(f"stubbed {role} failure")
    return out, "", 0, {"duration_s": 0.0, "agent": name}


dispatch.run_agent = fake_run_agent

# Isolate all loop artifacts to a throwaway dir (no repo pollution).
_TMP = Path(tempfile.mkdtemp(prefix="loop-test-"))
dispatch.LOOPS = _TMP / "loops"; dispatch.LOOPS.mkdir()
dispatch.RUNS = _TMP / "runs"; dispatch.RUNS.mkdir()


def mkargs(**over) -> Namespace:
    base = dict(role=None, agent=None, prompt="GOAL", recipe=None,
                verify_role=None, verify_agent=None, until=None,
                max_iter=None, pass_score=None, budget_sec=None,
                cwd=None, diff=None, account=None,
                verify_diff=None, verify_account=None,
                timeout=None, no_notify=True, json=True)
    base.update(over)
    return Namespace(**base)


def run_loop(**over):
    """Run cmd_loop with json output captured; return (rc, envelope)."""
    _reset()
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        rc = dispatch.cmd_loop(mkargs(**over), cfg)
    text = buf.getvalue().strip()
    env = json.loads(text) if text else {}
    return rc, env


def prod_prompts():
    return [p for (r, p) in PROMPTS if r == "producer"]


# --------------------------------------------------------------------------- tests
print("\n--- json-block extraction is tolerant (last block wins, nesting + prose OK)")
check("clean fenced block", dispatch.extract_json_block('```json\n{"a": 1}\n```'), {"a": 1})
check("last block wins",
      dispatch.extract_json_block('```json\n{"n": 1}\n```\ntext\n```json\n{"n": 2}\n```'),
      {"n": 2})
check("nested braces survive",
      dispatch.extract_json_block('```json\n{"approved": true, "meta": {"x": 1}}\n```'),
      {"approved": True, "meta": {"x": 1}})
check("bare trailing object (no fence)",
      dispatch.extract_json_block('rambling...\n{"done": true}'), {"done": True})
check("malformed returns None", dispatch.extract_json_block("no json at all"), None)
check("empty returns None", dispatch.extract_json_block(""), None)

print("\n--- carry-forward: iter-2 producer prompt carries iter-1 verifier feedback")
# cwd None -> fingerprint None -> no stall; iter-1 verifier flags a unique defect.
_reset()
Q_VER.append('v.\n```json\n{"approved": false, "score": 30, "blocking": ["CARRYME_123"]}\n```')
buf = io.StringIO()
with contextlib.redirect_stdout(buf):
    dispatch.cmd_loop(mkargs(role="design", verify_role="design-qa", max_iter=3), cfg)
pp = prod_prompts()
check("ran at least 2 producer rounds", len(pp) >= 2, True)
check("iter-2 producer prompt contains iter-1 blocking", "CARRYME_123" in pp[1], True)

print("\n--- stop on approval: verdict approved:true halts before max_iter")
Q_VER_SEQ = [DEFAULT_VER,
             'ok.\n```json\n{"approved": true, "score": 96, "blocking": []}\n```']
_reset(); Q_VER.extend(Q_VER_SEQ)
buf = io.StringIO()
with contextlib.redirect_stdout(buf):
    dispatch.cmd_loop(mkargs(role="design", verify_role="design-qa", max_iter=6), cfg)
env = json.loads(buf.getvalue())
check("status approved", env["status"], "approved")
check("halted at iter 2 (< max 6)", env["iter"], 2)
check("exactly 2 producer calls", CALLS["producer"], 2)

print("\n--- stop on max-iter: judge never approves -> exactly max_iter rounds, exhausted")
rc, env = run_loop(role="design", verify_role="design-qa", max_iter=3)  # verifier default = not approved
check("status exhausted", env["status"], "exhausted")
check("iter == max_iter", env["iter"], 3)
check("producer called max_iter times", CALLS["producer"], 3)

print("\n--- self-report stop: --until sentinel trusts the producer's done:true")
_reset(); Q_PROD.append('done.\n```json\n{"done": true, "summary": "complete"}\n```')
buf = io.StringIO()
with contextlib.redirect_stdout(buf):
    dispatch.cmd_loop(mkargs(role="plan", until="sentinel", max_iter=5), cfg)
env = json.loads(buf.getvalue())
check("status self-reported", env["status"], "self-reported")
check("halted at iter 1", env["iter"], 1)
check("no verifier was called", CALLS["verifier"], 0)

print("\n--- stall stop: identical workspace fingerprint N rounds while unapproved")
_orig_fp = dispatch.workspace_fingerprint
dispatch.workspace_fingerprint = lambda cwd: "SAME"     # never changes
rc, env = run_loop(role="design", until="sentinel", cwd=".", max_iter=6)  # producer never 'done'
dispatch.workspace_fingerprint = _orig_fp
check("status stalled", env["status"], "stalled")
check("stalled at stall_limit (2)", env["iter"], 2)

print("\n--- malformed verdict: non-JSON judge output tolerated, 2x degrades to max-iter stop")
_reset(); Q_VER.extend(["totally not json", "still no json here"])
buf = io.StringIO()
with contextlib.redirect_stdout(buf):
    rc = dispatch.cmd_loop(mkargs(role="design", verify_role="design-qa", max_iter=6), cfg)
env = json.loads(buf.getvalue())
check("did not crash (rc in {0,1})", rc in (0, 1), True)
check("status exhausted (degraded)", env["status"], "exhausted")
check("stop_reason cites unparseable", "unparseable" in (env["stop_reason"] or ""), True)
check("stopped at iter 2", env["iter"], 2)

print("\n--- error tolerance: producer errors past tolerance -> status error")
_reset(); Q_PROD.extend([RAISE, RAISE])   # error_tolerance default = 1, so 2nd error trips it
buf = io.StringIO()
with contextlib.redirect_stdout(buf):
    rc = dispatch.cmd_loop(mkargs(role="design", until="sentinel", max_iter=6), cfg)
env = json.loads(buf.getvalue())
check("status error", env["status"], "error")
check("rc == 1", rc, 1)

print("\n--- ceiling clamp: --max-iter 99 clamps to settings.loop.max_iter_ceiling (10)")
rc, env = run_loop(role="design", until="sentinel", max_iter=99)  # producer never 'done'
check("state max_iter clamped to 10", env["state"]["max_iter"], 10)
check("producer called exactly 10 times", CALLS["producer"], 10)
check("status exhausted", env["status"], "exhausted")

print("\n--- recipe resolution: [loops.*] roles resolve to the intended provider/model")
loops = cfg["loops"]


def role_model(role):
    name, spec = dispatch.resolve_agent(cfg, agent=None, role=role)
    _, m, _ = dispatch.resolve_tier_spec(cfg, spec["tier"], spec["provider"])
    return spec["provider"], m


check("design-refine producer -> Opus", role_model(loops["design-refine"]["producer"]),
      ("claude", "opus"))
check("design-refine verifier -> Fable", role_model(loops["design-refine"]["verifier"]),
      ("claude", "fable"))
check("bug-hunt producer -> Codex Sol", role_model(loops["bug-hunt"]["producer"]),
      ("codex", "gpt-5.6-sol"))
check("doc-tighten producer -> GLM (pi)", role_model(loops["doc-tighten"]["producer"]),
      ("pi", "zai/glm-5.2"))
check("plan-sharpen is self-terminating (no verifier)", "verifier" not in loops["plan-sharpen"], True)

print("\n--- recipe drives a real run; explicit flag overrides the recipe")
rc, env = run_loop(recipe="design-refine")     # producer=design, verifier=design-qa, max_iter=6
check("recipe set producer role", env["state"]["producer"]["role"], "design")
check("recipe set verifier role", env["state"]["verifier"]["role"], "design-qa")
check("recipe set max_iter 6", env["state"]["max_iter"], 6)
rc, env = run_loop(recipe="design-refine", max_iter=2)  # explicit flag wins
check("explicit --max-iter overrides recipe", env["state"]["max_iter"], 2)

print("\n--- depth semantics: iterations are siblings (DEPTH not inflated); IN_LOOP set + restored")
_before = os.environ.get("AGENT_DISPATCH_IN_LOOP")
_reset(); Q_VER.append('```json\n{"approved": true, "score": 99}\n```')
buf = io.StringIO()
with contextlib.redirect_stdout(buf):
    dispatch.cmd_loop(mkargs(role="design", verify_role="design-qa", max_iter=6), cfg)
depths = {e["DEPTH"] for e in ENVSEEN}
inloop = {e["IN_LOOP"] for e in ENVSEEN}
check("AGENT_DISPATCH_DEPTH identical across all spawns", len(depths), 1)
check("AGENT_DISPATCH_IN_LOOP=1 during every spawn", inloop, {"1"})
check("IN_LOOP restored to prior value after the loop",
      os.environ.get("AGENT_DISPATCH_IN_LOOP"), _before)

print("\n--- no loop-of-loops: a loop refuses to start inside another loop")
os.environ["AGENT_DISPATCH_IN_LOOP"] = "1"
_reset()
buf = io.StringIO()
with contextlib.redirect_stdout(buf):
    rc = dispatch.cmd_loop(mkargs(role="design", verify_role="design-qa"), cfg)
env = json.loads(buf.getvalue())
os.environ.pop("AGENT_DISPATCH_IN_LOOP", None)
check("nested loop rc == 2", rc, 2)
check("nested loop refused (ok false)", env.get("ok"), False)
check("no sub-agent was spawned", CALLS["producer"], 0)

print("\n--- unbounded is refused: --until verifier with no verifier errors out")
try:
    _reset()
    with contextlib.redirect_stdout(io.StringIO()):
        dispatch.cmd_loop(mkargs(role="design", until="verifier"), cfg)
    check("no-verifier + until verifier rejected", "no error", "SystemExit")
except SystemExit:
    check("no-verifier + until verifier rejected", "SystemExit", "SystemExit")

print("\n--- bypass gate: only a bounded --cwd strictly inside an allowlisted root passes")
REPO = dispatch.REPO_ROOT
check("no --cwd -> denied", dispatch.bypass_workspace_ok(None, cfg)[0], False)
check("repo root itself -> denied (too broad)",
      dispatch.bypass_workspace_ok(REPO, cfg)[0], False)
check("a repo subfolder -> allowed",
      dispatch.bypass_workspace_ok(REPO / ".agents" / "config", cfg)[0], True)
check("nonexistent dir -> denied",
      dispatch.bypass_workspace_ok(REPO / "no" / "such" / "dir", cfg)[0], False)
check("out-of-tree dir -> denied", dispatch.bypass_workspace_ok(_TMP, cfg)[0], False)

print("\n--- bypass threading: default-on engages only when the gate passes")
_WS = str(REPO / ".agents" / "config")           # real subfolder -> gate passes
rc, env = run_loop(role="design", until="sentinel", cwd=_WS, max_iter=6)  # stalls on stable fp
check("state records bypass ON", env["state"]["bypass"], True)
check("run_agent received bypass=True every call", set(BYPASSSEEN), {True})

rc, env = run_loop(role="design", until="sentinel", max_iter=3)  # cwd None -> gate fails
check("no --cwd -> state bypass off", env["state"]["bypass"], False)
check("run_agent received bypass=False (permission-gated)", set(BYPASSSEEN), {False})

rc, env = run_loop(role="design", until="sentinel", cwd=_WS, no_bypass=True, max_iter=3)
check("--no-bypass -> state bypass off even with a valid --cwd", env["state"]["bypass"], False)
check("--no-bypass -> run_agent bypass=False", set(BYPASSSEEN), {False})

# --------------------------------------------------------------------------- teardown
shutil.rmtree(_TMP, ignore_errors=True)
print("\n" + ("ALL PASS" if not FAILURES else f"{len(FAILURES)} FAILURE(S):"))
for f in FAILURES:
    print("  " + f)
sys.exit(1 if FAILURES else 0)
