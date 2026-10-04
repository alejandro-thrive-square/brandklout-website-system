"""Cross-origin iframe support for Jev Ultrafast, without patching the vendor code.

Jev reads one document. Editors such as Elfsight's run inside a cross-origin iframe (an
out-of-process frame, its own CDP target), so Jev saw only the host page and its "Close" button.

FramedBrowser extends jev_ultrafast.browser.Browser:
  * observe: snapshot the main document AND every visible out-of-process iframe with Jev's own
    snapshot.js, then merge them into ONE element table. Frame k's node ids are offset by
    k * 1_000_000 and its element rects by the iframe's position on the page.
  * fresh: checks every document it merged (marker, or the chosen node's guard).
  * act: resolves the observed node inside its own document, hit-tests it there, then clicks with
    real mouse events at page coordinates on the top-level session. Keyboard input follows focus
    into the frame.

Use:  import jev_frames; jev_frames.install()   # before constructing jev_ultrafast.Agent
"""

import json
import sys
import time

from browser_harness.helpers import cdp

import jev_ultrafast.agent as jev_agent
from jev_ultrafast.browser import MARKER, READ_STATE, Browser, StalePage, browser_operation, fingerprint

FRAME_BASE = 1_000_000
MIN_FRAME_PX = 40

# Same checks as the vendor's executor: connected, enabled, visible, on screen, not covered.
RESOLVE = """(action => {
  const e=window.__jevFast?.nodes.get(action.node);
  if (!e?.isConnected || e.matches(':disabled') || e.closest('[aria-disabled="true"],[inert]') ||
      !e.checkVisibility({checkOpacity:true,checkVisibilityCSS:true})) return null;
  if (action.kind==='fill' && (e.readOnly || e.getAttribute('aria-readonly')==='true')) return null;
  e.scrollIntoView({block:'nearest',inline:'nearest'});
  const r=e.getBoundingClientRect(), x=r.x+r.width/2, y=r.y+r.height/2;
  if (!r.width || !r.height || x<0 || y<0 || x>=innerWidth || y>=innerHeight) return null;
  if (!e.contains(document.elementFromPoint(x,y))) return null;
  if (action.kind==='select') {
    if (e.tagName!=='SELECT' || ![...e.options].some(o=>o.value===action.value &&
        !o.disabled && !o.closest('optgroup[disabled]'))) return null;
    e.value=action.value;
    e.dispatchEvent(new Event('input',{bubbles:true}));
    e.dispatchEvent(new Event('change',{bubbles:true}));
  }
  return {x,y};
})"""


# Icon-only controls have no accessible name, so snapshot.js labels them by role ("button").
# Describe them from what they draw and what they sit under: class / icon names, then the nearest
# visible heading-like text above. Words only, never selectors.
HINT = r"""(nodes => nodes.map(id => {
  const e=window.__jevFast?.nodes.get(id); if (!e) return '';
  const WORDS=new RegExp(['search|magnif|filter|sort|close|cross|delete|trash|remove|edit|pencil|add',
    'plus|more|dots|menu|kebab|back|arrow|prev|next|settings|gear|drag|copy|duplicate|upload',
    'download|expand|collapse|chevron|check|info|help|refresh|reload|eye|hide|show'].join('|'),'gi');
  const attrs=['class','data-testid','data-icon','name','href','xlink:href'];
  const bag=[e,...e.querySelectorAll('*')].slice(0,12).map(n=>
    [...attrs.map(a=>n.getAttribute(a)||''), n.querySelector?.('title')?.textContent||''].join(' ')).join(' ');
  const hits=[...new Set((bag.match(WORDS)||[]).map(w=>w.toLowerCase()))].slice(0,3);
  let ctx='', p=e;
  for (let i=0; i<4 && p && !ctx; i++) {
    p=p.parentElement;
    const t=[...(p?.children||[])].filter(c=>c!==e && !c.contains(e)).map(c=>c.innerText?.trim()||'')
      .find(t=>t && t.length<40);
    if (t) ctx=t.split('\n')[0];
  }
  return [hits.join('/'), ctx].filter(Boolean).join(' · ');
}))"""


class FramedBrowser(Browser):
    def __init__(self, url):
        self.frame_sessions = {}
        super().__init__(url)
        self.call("DOM.enable")
        self.call("Page.enable")

    # ── frames ──────────────────────────────────────────────────────────────
    def _frames(self):
        """Visible out-of-process iframes of this tab: [(session, x, y, w, h, url)]."""
        # An out-of-process frame is NOT in Page.getFrameTree until something attaches to it;
        # Target.getTargets lists it, with parentFrameId naming the frame that owns it.
        tree = self.call("Page.getFrameTree")["frameTree"]
        owners, stack = {self.target}, [tree]
        while stack:
            f = stack.pop()
            owners.add(f["frame"]["id"])
            stack.extend(f.get("childFrames", []))
        oopifs = [t for t in cdp("Target.getTargets")["targetInfos"]
                  if t["type"] == "iframe" and t.get("parentFrameId") in owners]
        frames = []
        for t in oopifs:
            try:
                owner = self.call("DOM.getFrameOwner", frameId=t["targetId"])
                quad = self.call("DOM.getBoxModel", backendNodeId=owner["backendNodeId"])["model"]["content"]
            except RuntimeError:
                continue  # detached or hidden owner
            x, y = quad[0], quad[1]
            w, h = quad[2] - quad[0], quad[5] - quad[1]
            if w < MIN_FRAME_PX or h < MIN_FRAME_PX:
                continue
            session = self.frame_sessions.get(t["targetId"])
            if session is None:
                session = cdp("Target.attachToTarget", targetId=t["targetId"], flatten=True)["sessionId"]
                self.frame_sessions[t["targetId"]] = session
            frames.append((session, x, y, w, h, t["url"]))
        return frames

    def _eval(self, session, expression):
        response = cdp("Runtime.evaluate", session_id=session, expression=expression, returnByValue=True)
        if response.get("exceptionDetails"):
            raise StalePage("Document changed during evaluation")
        return response.get("result", {}).get("value")

    def _hint(self, session, actions):
        bare = [a for a in actions if "node" in a and a["label"] == a.get("role")]
        if not bare:
            return
        try:
            hints = self._eval(session, HINT + "(" + json.dumps([a["node"] for a in bare]) + ")")
        except (StalePage, RuntimeError):
            return
        for a, h in zip(bare, hints or []):
            if h:
                a["label"] = f"{a['label']} [{h}]"

    # ── observe ─────────────────────────────────────────────────────────────
    def observe(self, screenshot=True):
        page = super().observe(screenshot=screenshot)
        self._hint(self.session, page["actions"])
        docs = [dict(session=self.session, base=0, x=0, y=0, marker=page["marker"])]
        actions = [a for a in page["actions"] if "node" in a]
        controls = [a for a in page["actions"] if "node" not in a]
        texts = [page["text"]]
        for k, (session, fx, fy, fw, fh, furl) in enumerate(self._frames(), start=1):
            try:
                info = self._eval(session, READ_STATE)
            except (StalePage, RuntimeError):
                continue
            if not info:
                continue
            self._hint(session, info["actions"])
            base = k * FRAME_BASE
            docs.append(dict(session=session, base=base, x=fx, y=fy, marker=info["marker"]))
            for a in info["actions"]:
                if "node" not in a:
                    continue
                r = a["rect"]
                # Only what is visible through the iframe's window on the page.
                if r["x"] + r["w"] / 2 > fw or r["y"] + r["h"] / 2 > fh:
                    continue
                actions.append({**a, "node": a["node"] + base,
                                "rect": {**r, "x": r["x"] + fx, "y": r["y"] + fy}})
            for node, guard in info["guards"].items():
                page["guards"][str(int(node) + base)] = guard
            texts.append(info["text"])
        actions = actions[:250]
        for i, a in enumerate(actions):
            a["id"] = f"e{i + 1}"
        page["actions"] = actions + controls
        page["text"] = "\n".join(t for t in texts if t)[:6000]
        page["_docs"] = docs
        page["fingerprint"] = fingerprint(page)
        return page

    # ── freshness ───────────────────────────────────────────────────────────
    def _doc_for(self, page, node):
        return max((d for d in page["_docs"] if d["base"] <= node), key=lambda d: d["base"])

    def fresh(self, page, action=None):
        docs = page.get("_docs")
        if not docs:
            return super().fresh(page, action)
        try:
            if action is not None and action["kind"] in {"click", "select"}:
                node = action["node"]
                if type(node) is not int:
                    return False
                doc = self._doc_for(page, node)
                local = node - doc["base"]
                expression = f"(() => {{ const c=window.__jevFast; return c?c.guard(c.nodes.get({local})):null; }})()"
                guard = self._eval(doc["session"], expression)
                return guard == page["guards"].get(str(node))
            return all(self._eval(d["session"], MARKER) == d["marker"] for d in docs)
        except (StalePage, RuntimeError):
            return False

    # ── act ─────────────────────────────────────────────────────────────────
    def act(self, action, page, text=None):
        if not page.get("_docs"):
            return super().act(action, page, text)
        if not self.fresh(page, action):
            raise StalePage("Page changed since this decision. Observe again.")
        kind = action["kind"]
        self.after_input = None
        if kind == "wait":
            time.sleep(0.3)
            return {"executed": action["id"]}
        if kind == "scroll":
            return browser_operation({"operation": "act", "session": self.session, "action": action, "text": text})
        node = action["node"]
        doc = self._doc_for(page, node)
        local = {**action, "node": node - doc["base"]}
        target = self._eval(doc["session"], RESOLVE + "(" + json.dumps(local) + ")")
        if target is None:
            if kind == "select":
                raise RuntimeError("Dropdown execution was not confirmed; inspect before retrying.")
            raise StalePage("Target changed or is covered. Observe again.")
        if kind != "select":
            x, y = target["x"] + doc["x"], target["y"] + doc["y"]
            for event in ("mousePressed", "mouseReleased"):
                self.call("Input.dispatchMouseEvent", type=event, x=x, y=y, button="left", clickCount=1)
            if kind == "fill":
                mod = 4 if sys.platform == "darwin" else 2
                self.call("Input.dispatchKeyEvent", type="keyDown", key="a", code="KeyA", modifiers=mod,
                          commands=["selectAll"])
                self.call("Input.dispatchKeyEvent", type="keyUp", key="a", code="KeyA", modifiers=mod)
                self.call("Input.insertText", text=text)
        time.sleep(0.15)  # let the frame's UI react before the next observation
        return {"executed": action["id"]}

    def close(self):
        for session in self.frame_sessions.values():
            try:
                cdp("Target.detachFromTarget", sessionId=session)
            except RuntimeError:
                pass
        self.frame_sessions = {}
        super().close()


def install():
    """Make every jev_ultrafast.Agent built after this call use FramedBrowser."""
    jev_agent.Browser = FramedBrowser
