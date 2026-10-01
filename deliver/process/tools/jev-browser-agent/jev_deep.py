"""Deep perception for Jev Ultrafast, without patching the vendor code.

jev_frames.py taught Jev to read one level of cross-origin iframes. DeepBrowser goes further:
  * every out-of-process iframe at any depth (owner looked up in its parent's own session)
  * open shadow roots and same-origin iframes (deep_snapshot.js walks them)
  * role-less click targets (div cards with a click cursor) and named icon-only buttons
  * a PRESS_ENTER operation, offered only while a text field has focus (Elfsight's rename commits
    on Enter alone)
  * optional `forbid` patterns: matching elements never reach the model, so it cannot click them
  * a hover before every click, for controls that only appear on hover

Use:  import jev_deep; jev_deep.install(forbid=[r"\\bclose\\b", "upgrade"])   # before jev_ultrafast.Agent
"""

import json
import re
import time
from pathlib import Path

from browser_harness.helpers import cdp

import jev_ultrafast.agent as jev_agent
from jev_ultrafast.browser import Browser, StalePage, fingerprint

DEEP = Path(__file__).with_name("deep_snapshot.js").read_text(encoding="utf-8")
DEEP_MARKER = f"(() => {{ const s={DEEP}; return s?.marker ?? null; }})()"
FRAME_BASE = 1_000_000
MIN_FRAME_PX = 40
SETTLE_S = 10
FORBID = []

RESOLVE = """(action => {
  const c=window.__jevDeep, e=c?.nodes.get(action.node);
  const up=n=>n.parentElement || (n.parentNode instanceof ShadowRoot ? n.parentNode.host : null);
  let hidden=false; for (let p=e; p; p=up(p)) if (p.matches?.('[aria-disabled="true"],[inert]')) hidden=true;
  if (!e?.isConnected || hidden || e.matches(':disabled') ||
      !e.checkVisibility({checkOpacity:true,checkVisibilityCSS:true})) return null;
  if (action.kind==='fill' && (e.readOnly || e.getAttribute('aria-readonly')==='true')) return null;
  e.scrollIntoView({block:'nearest',inline:'nearest'});
  const r=e.getBoundingClientRect(), [ox,oy]=c.offset(e), x=r.x+r.width/2+ox, y=r.y+r.height/2+oy;
  if (!r.width || !r.height || x<0 || y<0 || x>=innerWidth || y>=innerHeight) return null;
  if (!c.contains(e,c.hit(x,y))) return null;
  if (action.kind==='select') {
    if (e.tagName!=='SELECT' || ![...e.options].some(o=>o.value===action.value &&
        !o.disabled && !o.closest('optgroup[disabled]'))) return null;
    e.value=action.value;
    e.dispatchEvent(new Event('input',{bubbles:true}));
    e.dispatchEvent(new Event('change',{bubbles:true}));
  }
  return {x,y};
})"""


class DeepBrowser(Browser):
    forbid = []

    def __init__(self, url):
        self.frame_sessions = {}
        super().__init__(url)
        self.call("DOM.enable")
        self.call("Page.enable")

    # ── documents: the tab plus every out-of-process iframe, at any depth ──────
    def _frame_ids(self, session):
        tree = cdp("Page.getFrameTree", session_id=session)["frameTree"]
        ids, stack = set(), [tree]
        while stack:
            f = stack.pop()
            ids.add(f["frame"]["id"])
            stack.extend(f.get("childFrames", []))
        return ids

    def _documents(self):
        view = self.evaluate("[innerWidth, innerHeight]") or [1120, 780]
        docs = [dict(session=self.session, x=0, y=0, w=view[0], h=view[1],
                     frames=self._frame_ids(self.session) | {self.target})]
        pending = [t for t in cdp("Target.getTargets")["targetInfos"] if t["type"] == "iframe"]
        progress = True
        while pending and progress:
            progress = False
            for t in list(pending):
                parent = next((d for d in docs if t.get("parentFrameId") in d["frames"]), None)
                if parent is None:
                    continue
                pending.remove(t)
                progress = True
                try:
                    cdp("DOM.enable", session_id=parent["session"])
                    owner = cdp("DOM.getFrameOwner", session_id=parent["session"], frameId=t["targetId"])
                    quad = cdp("DOM.getBoxModel", session_id=parent["session"],
                               backendNodeId=owner["backendNodeId"])["model"]["content"]
                except RuntimeError:
                    continue
                x, y = parent["x"] + quad[0], parent["y"] + quad[1]
                # Clip to the parent's visible window.
                x1 = min(x + quad[2] - quad[0], parent["x"] + parent["w"])
                y1 = min(y + quad[5] - quad[1], parent["y"] + parent["h"])
                x0, y0 = max(x, parent["x"]), max(y, parent["y"])
                if x1 - x0 < MIN_FRAME_PX or y1 - y0 < MIN_FRAME_PX:
                    continue
                session = self.frame_sessions.get(t["targetId"])
                if session is None:
                    session = cdp("Target.attachToTarget", targetId=t["targetId"], flatten=True)["sessionId"]
                    self.frame_sessions[t["targetId"]] = session
                try:
                    frames = self._frame_ids(session)
                except RuntimeError:
                    frames = {t["targetId"]}
                # The frame's own viewport starts at (x, y); w/h is what shows through its ancestors.
                docs.append(dict(session=session, x=x, y=y, w=x1 - x, h=y1 - y, clip=(x0, y0, x1, y1),
                                 frames=frames | {t["targetId"]}))
        return docs

    def _eval(self, session, expression):
        response = cdp("Runtime.evaluate", session_id=session, expression=expression, returnByValue=True)
        if response.get("exceptionDetails"):
            raise StalePage("Document changed during evaluation")
        return response.get("result", {}).get("value")

    # ── observe ─────────────────────────────────────────────────────────────
    def observe(self, screenshot=True):
        # Hold the observation while nothing is actionable or a visible frame is still blank:
        # Jev picks BLOCKED over WAIT on an empty table.
        deadline = time.monotonic() + SETTLE_S
        while True:
            try:
                page = self._observe(screenshot)
            except StalePage:
                if time.monotonic() > deadline:
                    raise
                time.sleep(0.1)
                continue
            ready = any("node" in a for a in page["actions"]) and not page["_blank_frames"]
            if ready or time.monotonic() > deadline:
                return page
            time.sleep(0.4)

    def _observe(self, screenshot):
        docs, actions, guards, texts, markers = [], [], {}, [], []
        controls, blank, focus = [], 0, False
        for k, d in enumerate(self._documents()):
            try:
                info = self._eval(d["session"], DEEP)
            except RuntimeError:
                info = None
            if k == 0:
                if info is None:
                    raise StalePage("Document is navigating")
                main = info
            if not info or not (info["text"] or any("node" in a for a in info["actions"])):
                blank += 1
                continue
            base = k * FRAME_BASE
            docs.append(dict(session=d["session"], base=base, x=d["x"], y=d["y"], marker=info["marker"]))
            markers.append(info["marker"])
            focus = focus or info["focus_editable"]
            x0, y0, x1, y1 = d.get("clip", (0, 0, d["w"], d["h"]))
            for a in info["actions"]:
                if "node" not in a:
                    if k == 0:
                        controls.append(a)
                    continue
                r = a["rect"]
                cx, cy = r["x"] + r["w"] / 2 + d["x"], r["y"] + r["h"] / 2 + d["y"]
                if not (x0 <= cx < x1 and y0 <= cy < y1):
                    continue
                actions.append({**a, "node": a["node"] + base,
                                "rect": {**r, "x": r["x"] + d["x"], "y": r["y"] + d["y"]}})
            for node, guard in info["guards"].items():
                guards[str(int(node) + base)] = guard
            texts.append(info["text"])
        if self.forbid:
            actions = [a for a in actions if not any(re.search(p, a["label"], re.I) for p in self.forbid)]
        actions = actions[:250]
        for i, a in enumerate(actions):
            a["id"] = f"e{i + 1}"
        if focus:
            controls.insert(0, {"id": "press_enter", "kind": "key", "key": "Enter",
                                "label": "Press Enter in the focused text field (saves or submits what was typed)"})
        # Frames first: on a vendor dashboard the editor iframe is where the work is.
        text = "\n".join(t for t in texts[1:] + texts[:1] if t)[:6000]
        page = {**main, "text": text, "actions": actions + controls, "guards": guards,
                "marker": markers, "_docs": docs, "_blank_frames": blank}
        page["fingerprint"] = fingerprint(page)
        if screenshot:
            page["screenshot"] = self.call("Page.captureScreenshot", format="jpeg", quality=72)["data"]
        return page

    # ── freshness ───────────────────────────────────────────────────────────
    def _doc_for(self, page, node):
        return max((d for d in page["_docs"] if d["base"] <= node), key=lambda d: d["base"])

    def fresh(self, page, action=None):
        try:
            if action is not None and action["kind"] in {"click", "select"}:
                node = action["node"]
                doc = self._doc_for(page, node)
                local = node - doc["base"]
                guard = self._eval(doc["session"],
                                   f"(() => {{ const c=window.__jevDeep; return c?c.guard(c.nodes.get({local})):null; }})()")
                return guard == page["guards"].get(str(node))
            return all(self._eval(d["session"], DEEP_MARKER) == d["marker"] for d in page["_docs"])
        except (StalePage, RuntimeError):
            return False

    # ── act ─────────────────────────────────────────────────────────────────
    def _mouse(self, x, y):
        self.call("Input.dispatchMouseEvent", type="mouseMoved", x=x, y=y)
        time.sleep(0.05)
        for event in ("mousePressed", "mouseReleased"):
            self.call("Input.dispatchMouseEvent", type=event, x=x, y=y, button="left", clickCount=1)

    def act(self, action, page, text=None):
        if not self.fresh(page, action):
            raise StalePage("Page changed since this decision. Observe again.")
        kind = action["kind"]
        self.after_input = None
        if kind == "wait":
            time.sleep(0.4)
        elif kind == "scroll":
            self.call("Input.dispatchMouseEvent", type="mouseWheel", x=560, y=420, deltaX=0, deltaY=action["delta"])
        elif kind == "key":
            # Elfsight's rename field commits only on a key event that carries the CR text.
            common = dict(key="Enter", code="Enter", windowsVirtualKeyCode=13, nativeVirtualKeyCode=13)
            self.call("Input.dispatchKeyEvent", type="keyDown", text="\r", **common)
            self.call("Input.dispatchKeyEvent", type="keyUp", **common)
        else:
            node = action["node"]
            doc = self._doc_for(page, node)
            local = {**action, "node": node - doc["base"]}
            target = self._eval(doc["session"], RESOLVE + "(" + json.dumps(local) + ")")
            if target is None:
                if kind == "select":
                    raise RuntimeError("Dropdown execution was not confirmed; inspect before retrying.")
                raise StalePage("Target changed or is covered. Observe again.")
            if kind != "select":
                self._mouse(target["x"] + doc["x"], target["y"] + doc["y"])
                if kind == "fill":
                    self.call("Input.dispatchKeyEvent", type="keyDown", key="a", code="KeyA", modifiers=2,
                              commands=["selectAll"])
                    self.call("Input.dispatchKeyEvent", type="keyUp", key="a", code="KeyA", modifiers=2)
                    self.call("Input.insertText", text=text)
        time.sleep(0.2)  # let the UI react before the next observation
        return {"executed": action["id"]}

    def close(self):
        for session in self.frame_sessions.values():
            try:
                cdp("Target.detachFromTarget", sessionId=session)
            except RuntimeError:
                pass
        self.frame_sessions = {}
        super().close()


LOOP = 4  # the same action this many times in a row is a loop, not progress
WAITS = 8  # this many WAITs in a row: the page is not going to change


_field_context = jev_agent.field_context
TASK = {"text": None}


def _task_field_context(goal, action, page, history):
    """The text helper sees the whole task as its only source of values; the decision model does not.

    A step such as "Click Search" carries no value, and the helper then typed the page's own
    placeholder example ("Brooklyn Museum, New York...") into Elfsight's search. Giving the whole task
    to the decision model instead made it skip steps (2026-10-01).
    """
    context = _field_context(goal, action, page, history)
    if TASK["text"]:
        context["goal"] = (f"{goal}\nValues to type come ONLY from this task, never from page examples "
                           f"or placeholders: {TASK['text']}")
    return context


jev_agent.field_context = _task_field_context


def drive(agent, goals, limit_s=150, patience=2, on_state=None, task=None):
    """Run ordered sub-goals on one Agent (one tab). Returns the final status.

    * Each goal is a short step with its own stopping point; DONE moves to the next goal.
    * The same action LOOP times in a row stops the run as "loop".
    * BLOCKED is retried `patience` times after a pause: Jev picks BLOCKED on loading screens.
    * A malformed model reply (TypeSafe, or an empty text-helper value) is retried once; nothing
      was executed when either is raised.
    """
    started = time.perf_counter()
    TASK["text"] = task or " ".join(goals)
    for i in range(len(goals)):
        state = agent.state
        state.update(goal=goals[i], status="ready")
        tries, bad_replies = 0, 0
        while True:
            try:
                for snapshot in agent.run():
                    if on_state:
                        on_state(snapshot)
                    last = [(h["kind"], h["action"]) for h in state["history"][-LOOP:]]
                    if len(last) == LOOP and len(set(last)) == 1 and last[0][0] != "wait":
                        return "loop"
                    # Waiting forever is a loop too: 2026-10-01 burned all 60 steps on WAIT + Search
                    # for results that never came.
                    waits = [h["kind"] for h in state["history"][-WAITS:]]
                    if len(waits) == WAITS and set(waits) == {"wait"}:
                        return "stalled"
                    if time.perf_counter() - started > limit_s:
                        raise TimeoutError(f"over {limit_s}s")
            except ValueError as exc:
                retryable = "Invalid TypeSafe response" in str(exc) or "Text helper returned" in str(exc)
                if not retryable or bad_replies:
                    raise
                bad_replies += 1
                state["status"] = "ready"
                continue
            if state["status"] == "done":
                break
            if tries >= patience:
                return state["status"]
            tries += 1
            time.sleep(1.5)
            state["page"] = agent.browser.observe(screenshot=agent.screenshots)
            state["status"] = "ready"
    return "done"


def install(forbid=None):
    """Make every jev_ultrafast.Agent built after this call use DeepBrowser."""
    DeepBrowser.forbid = list(forbid or [])
    jev_agent.Browser = DeepBrowser
