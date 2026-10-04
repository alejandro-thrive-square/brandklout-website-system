"""Finish an Elfsight Google Reviews widget over CDP: template -> source -> name -> publish.

  uv run python elfsight_widget.py --widget <uuid> --query "Name, City ST" --expect "7901 Jones Branch" \
      --name "Dr. Nahlah - Google Reviews"

Runs in its own background tab (browser-harness), no screenshots, no model. It never opens
/widget/create itself: create the widget once, then point this at its id, so a retry can never
make a duplicate. Every step waits for the text it expects and fails loudly otherwise.
"""

import argparse
import json
import re
import time

from browser_harness.admin import ensure_daemon
from browser_harness.helpers import cdp

CR = chr(13)

p = argparse.ArgumentParser()
p.add_argument("--widget", required=True, help="widget uuid, or new to create exactly one")
p.add_argument("--query", required=True, help="text for the Business Name and Address search")
p.add_argument("--expect", required=True, help="substring the chosen result's address must contain")
p.add_argument("--name", required=True)
p.add_argument("--keep-open", action="store_true")
a = p.parse_args()

ensure_daemon()
if a.widget == "new":
    # The ONLY place a widget is created. Print its id at once, so any retry resumes it by id.
    tab = cdp("Target.createTarget", url="https://dash.elfsight.com/widget/create/google-reviews",
              background=True)["targetId"]
    end = time.time() + 40
    while time.time() < end:
        url = next((t["url"] for t in cdp("Target.getTargets")["targetInfos"] if t["targetId"] == tab), "")
        m = re.search(r"/widget/([0-9a-f-]{36})", url)
        if m:
            a.widget = m.group(1)
            break
        time.sleep(0.5)
    if a.widget == "new":
        raise SystemExit("create page never produced a widget id; check the dashboard before retrying")
    print(f"created    {a.widget}", flush=True)
else:
    tab = cdp("Target.createTarget", url=f"https://dash.elfsight.com/widget/{a.widget}", background=True)["targetId"]
top = cdp("Target.attachToTarget", targetId=tab, flatten=True)["sessionId"]
cdp("DOM.enable", session_id=top)
cdp("Page.enable", session_id=top)
FRAME_TARGET = {}
cdp("Emulation.setFocusEmulationEnabled", session_id=top, enabled=True)


def ev(session, js):
    r = cdp("Runtime.evaluate", session_id=session, expression=js, returnByValue=True, awaitPromise=True)
    if r.get("exceptionDetails"):
        raise RuntimeError(json.dumps(r["exceptionDetails"])[:300])
    return r.get("result", {}).get("value")


def frame_session(timeout=30):
    end = time.time() + timeout
    while time.time() < end:
        for t in cdp("Target.getTargets")["targetInfos"]:
            if t["type"] == "iframe" and t.get("parentFrameId") == tab and "elfsightcdn" in t["url"]:
                sid = cdp("Target.attachToTarget", targetId=t["targetId"], flatten=True)["sessionId"]
                FRAME_TARGET[sid] = t["targetId"]
                return sid
        time.sleep(0.5)
    raise RuntimeError("editor iframe never appeared")


def wait_text(session, needle, timeout=30):
    end = time.time() + timeout
    while time.time() < end:
        try:
            if ev(session, f"document.body && document.body.innerText.includes({json.dumps(needle)})"):
                return True
        except RuntimeError:
            pass
        time.sleep(0.4)
    return False


# Find the element with exactly this text and return its centre (viewport coordinates of its document).
FIND_TEXT = """(t => { const els=[...document.querySelectorAll('button,a,[role=button],div,span')]
  .filter(e=>e.innerText && e.innerText.trim()===t && e.offsetParent!==null);
  const e=els.sort((x,y)=>x.querySelectorAll('*').length-y.querySelectorAll('*').length)[0];
  if(!e) return null; const h=e.closest('button,a,[role=button]')||e; h.scrollIntoView({block:'center'});
  const r=h.getBoundingClientRect(); return {x:r.x+r.width/2, y:r.y+r.height/2}; })"""


def offset(session):
    """Where a frame session's viewport sits on the page (0,0 for the top document)."""
    if session == top:
        return 0, 0
    cdp("DOM.getDocument", session_id=top, depth=0)
    owner = cdp("DOM.getFrameOwner", session_id=top, frameId=FRAME_TARGET[session])
    quad = cdp("DOM.getBoxModel", session_id=top, backendNodeId=owner["backendNodeId"])["model"]["content"]
    return quad[0], quad[1]


def click_at(session, pt):
    """Real mouse press/release on the top-level page, at a point inside `session`'s document."""
    if not pt:
        return False
    ox, oy = offset(session)
    for t in ("mouseMoved", "mousePressed", "mouseReleased"):
        cdp("Input.dispatchMouseEvent", session_id=top, type=t, x=pt["x"] + ox, y=pt["y"] + oy,
            button="left" if t != "mouseMoved" else "none", clickCount=1)
    return True


def click_text(session, text):
    return click_at(session, ev(session, FIND_TEXT + "(" + json.dumps(text) + ")"))


def say(*m):
    print(*m, flush=True)


try:
    frame = frame_session()
    # ── template ──────────────────────────────────────────────────────────
    end = time.time() + 30
    while time.time() < end:
        txt = ev(frame, "document.body ? document.body.innerText : ''") or ""
        if "Select a template" in txt or "Connect Source" in txt or "REVIEWS" in txt:
            break
        time.sleep(0.5)
    if "Select a template" in txt:
        if not click_text(frame, 'Continue with this template'):
            raise RuntimeError("no 'Continue with this template' button")
        say("template   Carousel (default) continued")
        frame = frame_session()
    # ── source ────────────────────────────────────────────────────────────
    state = ev(frame, "document.body.innerText")
    if "Connect Source" not in state and a.expect.lower() in state.lower():
        say("source     already connected")
    else:
        if not wait_text(frame, "Connect Source"):
            raise RuntimeError("Connect Source panel never showed")
        pt = ev(frame, """(() => { const i=[...document.querySelectorAll('input')].find(x=>x.offsetParent!==null);
          if(!i) return null; const r=i.getBoundingClientRect(); return {x:r.x+r.width/2, y:r.y+r.height/2}; })()""")
        ok = click_at(frame, pt)
        if not ok:
            raise RuntimeError("no search input")
        cdp("Input.insertText", session_id=frame, text=a.query)
        if not click_text(frame, 'Search'):
            raise RuntimeError("no Search button")
        say(f"search     {a.query!r}")
        # A result row reads "<name> <address>, USA <rating> (<count>)"; the echo of the typed
        # query must never match (clicking it resets the search).
        pick = """((want, query) => { const rows=[...document.querySelectorAll('*')].filter(e=>e.children.length<=8 &&
            e.innerText && e.innerText.toLowerCase().includes(want) && e.offsetParent!==null &&
            /USA|\\(\\d[\\d,]*\\)/.test(e.innerText) && !e.innerText.toLowerCase().includes(query) &&
            !e.querySelector('input') && !e.closest('label') && (() => {
              // only what is really on screen: a hidden live region carries the same text
              const b=e.getBoundingClientRect(); if(!b.width||!b.height) return false;
              const t=document.elementFromPoint(b.x+b.width/2, b.y+b.height/2); return !!t && e.contains(t); })());
          if(!rows.length) return null;
          const r=rows.sort((x,y)=>x.innerText.length-y.innerText.length)[0];
          const hit=r.closest('[role=option],li,button,a')||r;
          const b=hit.getBoundingClientRect();
          return {label:hit.innerText.replace(/\\s+/g,' ').slice(0,160), x:b.x+b.width/2, y:b.y+b.height/2}; })"""
        label = None
        end = time.time() + 20
        while time.time() < end and not label:
            hit = ev(frame, pick + f"({json.dumps(a.expect.lower())}, {json.dumps(a.query.lower())})")
            if hit:
                label = hit["label"]
                click_at(frame, hit)
            time.sleep(0.6)
        if not label:
            others = ev(frame, "document.body.innerText.slice(0,600)")
            raise RuntimeError(f"no result containing {a.expect!r}. Page: {others!r}")
        say(f"picked     {label}")
        if not wait_text(frame, "REVIEWS", 30):
            raise RuntimeError("source did not connect (no REVIEWS list)")
        src = ev(frame, "document.body.innerText.slice(0,400)")
        if a.expect.lower().split()[0] not in src.lower():
            raise RuntimeError(f"connected source does not show {a.expect!r}: {src!r}")
        say("source     connected")
    # ── name ──────────────────────────────────────────────────────────────
    title = ev(top, "document.title")
    if not title.startswith(a.name):
        click_at(top, ev(top, """(() => { const h=[...document.querySelectorAll('header *')].find(e=>e.children.length===0 &&
            /Google Reviews|Untitled/.test(e.innerText||'')); if(!h) return null; const r=h.getBoundingClientRect();
            return {x:r.x+r.width/2, y:r.y+r.height/2}; })()"""))
        time.sleep(0.6)
        ok = ev(top, """(() => { const i=[...document.querySelectorAll('header input, input')].find(x=>x.offsetParent!==null);
            if(!i) return false; i.focus(); i.select(); return true; })()""")
        if not ok:
            raise RuntimeError("rename field did not open")
        cdp("Input.insertText", session_id=top, text=a.name)
        # Enter must carry text CR (chr 13), or the rename field never commits.
        cdp("Input.dispatchKeyEvent", session_id=top, type="keyDown", key="Enter", code="Enter", text=CR,
            unmodifiedText=CR, windowsVirtualKeyCode=13, nativeVirtualKeyCode=13)
        cdp("Input.dispatchKeyEvent", session_id=top, type="keyUp", key="Enter", code="Enter",
            windowsVirtualKeyCode=13, nativeVirtualKeyCode=13)
        end = time.time() + 10
        while time.time() < end and not ev(top, "document.title").startswith(a.name):
            time.sleep(0.4)
        if not ev(top, "document.title").startswith(a.name):
            raise RuntimeError(f"rename did not land: {ev(top, 'document.title')!r}")
    say(f"name       {a.name}")
    # ── publish ───────────────────────────────────────────────────────────
    if click_text(top, 'Publish'):
        say("publish    clicked")
    if not wait_text(top, "Published", 20):
        raise RuntimeError("never showed Published")
    say("publish    Published")
    print(json.dumps({"ok": True, "widget": a.widget, "name": a.name}), flush=True)
except Exception as e:  # report and leave the tab for inspection
    print(json.dumps({"ok": False, "widget": a.widget, "error": str(e)}), flush=True)
    a.keep_open = True
finally:
    if not a.keep_open:
        cdp("Target.closeTarget", targetId=tab)
