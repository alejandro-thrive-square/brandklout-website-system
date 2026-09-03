# -*- coding: utf-8 -*-
"""
Rebuild the All-on-X landing page to Arvada parity.

  python3 build_v2.py wipe        remove every top-level element from the page
  python3 build_v2.py structure   insert the 14 sections (CSS on the first call)
  python3 build_v2.py embeds      insert videos, slider, FAQ accordion, marquee, GHL form
  python3 build_v2.py verify      re-read every embed's code and report empties
  python3 build_v2.py all         wipe -> structure -> embeds -> verify

One section per whtml call: a single bad CSS rule aborts a whole call (RUNBOOK gotcha 6).
"""
import json, sys, time
sys.path.insert(0, ".")
import content as C
import content_v2 as V
from build import call, get_body_element
from fix_landing_2 import SLIDER_CODE

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

PAGE = C.PAGE_LANDING
SITE = C.SITE


# --------------------------------------------------------------------------- tree
def tree(depth=-1, retries=6):
    last = None
    for attempt in range(retries):
        try:
            d = call("data_element_tool", {"siteId": SITE, "pageId": PAGE,
                     "actions": [{"label": "tree", "get_all_elements": {"depth": depth}}]})
            res = d["actions"][0]["result"] if "actions" in d else d.get("result")
            if res is None:
                raise KeyError(f"no result in {list(d.keys())}")
            node = res[0] if isinstance(res, list) else res
            return node.get("data", node)
        except Exception as e:
            last = e
            wait = 5 * (attempt + 1)
            print(f"   tree retry {attempt + 1}/{retries} in {wait}s: {str(e)[:90]}")
            time.sleep(wait)
    raise RuntimeError(f"tree failed: {last}")


def collect(node, style, out):
    """Depth-first, document order: every element carrying `style`."""
    if style in (node.get("styleNames") or []):
        out.append(node["id"])
    for ch in node.get("children", []) or []:
        collect(ch, style, out)
    return out


def slots(style):
    return collect(tree(), style, [])


# --------------------------------------------------------------------------- wipe
def wipe():
    root = tree(depth=1)
    children = root.get("children", []) or []
    if not children:
        print("  page already empty")
        return
    actions = [{"label": f"rm-{ch['id']['element'][:8]}",
                "remove_element": {"id": {"component": PAGE, "element": ch["id"]["element"]}}}
               for ch in children]
    for i in range(0, len(actions), 5):
        d = call("data_element_tool", {"siteId": SITE, "pageId": PAGE, "actions": actions[i:i + 5]})
        res = d["actions"] if "actions" in d else [d]
        for r in res:
            rr = r[0] if isinstance(r, list) else r
            print("    rm:", rr.get("status"))
        time.sleep(1)
    print(f"  removed {len(actions)} top-level elements")


# --------------------------------------------------------------------------- structure
def structure(start=0):
    body = get_body_element(PAGE)
    print("  body:", body["element"][:12])
    for i, (label, html, _css) in enumerate(V.LANDING_V2):
        if i < start:
            continue
        action = {"build_label": f"{i:02d}-{label}", "parent_element_id": body,
                  "creation_position": "append", "html": html.strip()}
        if i == start:
            action["css"] = V.CSS_V2
        d = call("data_whtml_builder", {
            "siteId": SITE, "pageId": PAGE,
            "context": "Rebuilding the Stone Dental Implant Center All-on-X ad landing page to match the Arvada reference structure",
            "actions": [action]})
        res = d["actions"] if "actions" in d else [d]
        rr = res[0][0] if isinstance(res[0], list) else res[0]
        status = rr.get("status")
        print(f"    {i:02d}-{label}: {status}")
        if status not in ("success", "partial_success"):
            print("      ", json.dumps(rr)[:700])
            raise SystemExit(f"aborting at {label}")
        msg = rr.get("message") or ""
        if msg:
            print("      note:", msg[:130])
        for w in (rr.get("data") or {}).get("warnings", []) or []:
            print("      warn:", w.get("code"), "-", (w.get("message") or "")[:110])
        time.sleep(1.5)


# --------------------------------------------------------------------------- embeds
def make_embed(parent_id, code, label):
    d = call("data_element_builder", {
        "siteId": SITE, "pageId": PAGE,
        "context": "Adding a self-contained embed (video, comparison slider, FAQ accordion or credential marquee) to the All-on-X landing page",
        "actions": [{"build_label": label, "parent_element_id": parent_id,
                     "creation_position": "append", "element_schema": {"type": "HtmlEmbed"}}]})
    res = d["actions"] if "actions" in d else [d]
    rr = res[0][0] if isinstance(res[0], list) else res[0]
    if rr.get("status") != "success":
        print("      create FAILED:", json.dumps(rr)[:400])
        return None
    eid = rr["data"]["id"]["element"]
    d2 = call("data_element_settings_tool", {
        "siteId": SITE, "pageId": PAGE,
        "actions": [{"label": f"code-{label}", "set_settings": {"operations": [{
            "element_id": {"component": PAGE, "element": eid},
            "settings": [{"key": "code", "static_text": {"value": code}}]}]}}]})
    blob2 = json.dumps(d2)
    ok = '"success"' in blob2 and "error" not in blob2.lower()
    print(f"    {label}: created {eid[:10]} code={'ok' if ok else blob2[:200]}")
    return eid


# key -> (container style, ordinal among that style, code)
def embed_plan():
    return [
        ("hero-video",   "axon-hero_media",  0, V.EMBEDS["hero-video"]),
        ("ghl-form",     "axon-form_embed",  0, C.CONSULT_IFRAME),
        ("story-wide",   "axon-vid_slot",    0, V.EMBEDS["story-wide"]),
        ("story-v1",     "axon-vid_slot",    1, V.EMBEDS["story-v1"]),
        ("story-v2",     "axon-vid_slot",    2, V.EMBEDS["story-v2"]),
        ("story-v3",     "axon-vid_slot",    3, V.EMBEDS["story-v3"]),
        ("story-v4",     "axon-vid_slot",    4, V.EMBEDS["story-v4"]),
        ("story-v5",     "axon-vid_slot",    5, V.EMBEDS["story-v5"]),
        ("story-v6",     "axon-vid_slot",    6, V.EMBEDS["story-v6"]),
        ("story-o1",     "axon-vid_slot",    7, V.EMBEDS["story-o1"]),
        ("story-o2",     "axon-vid_slot",    8, V.EMBEDS["story-o2"]),
        ("doctor-video", "axon-doc_media",   0, V.EMBEDS["doctor-video"]),
        ("process-video","axon-doc_media",   1, V.EMBEDS["process-video"]),
        ("final-video",  "axon-final_media", 0, V.EMBEDS["final-video"]),
        ("faq",          "axon-faq_slot",    0, V.faq_code()),
        ("marks",        "axon-marks_slot",  0, V.marks_code()),
    ]


def has_embed_child(node):
    return any(ch.get("type") == "HtmlEmbed" for ch in (node.get("children", []) or []))


def embeds(only=None):
    """One tree fetch, then every slot resolved from it. Idempotent: a slot that
    already holds an HtmlEmbed is skipped."""
    root = tree()
    index = {}

    def walk(n):
        for sn in (n.get("styleNames") or []):
            index.setdefault(sn, []).append(n)
        for ch in n.get("children", []) or []:
            walk(ch)
    walk(root)

    for style in ("axon-hero_media", "axon-form_embed", "axon-vid_slot",
                  "axon-doc_media", "axon-final_media", "axon-faq_slot",
                  "axon-marks_slot", "axon-ba_shell"):
        print(f"  {style}: {len(index.get(style, []))} slot(s)")

    for label, style, idx, code in embed_plan():
        if only and label not in only:
            continue
        found = index.get(style, [])
        if idx >= len(found):
            print(f"    {label}: SLOT MISSING ({style}#{idx})")
            continue
        node = found[idx]
        if has_embed_child(node):
            print(f"    {label}: already has an embed, skipping")
            continue
        make_embed(node["id"], code, label)
        time.sleep(1.5)

    # slider goes into the inner block of axon-ba_shell
    if only and "ba-slider" not in only:
        return
    shells = index.get("axon-ba_shell", [])
    if not shells:
        print("    ba-slider: axon-ba_shell MISSING")
        return
    kids = shells[0].get("children", []) or []
    target_node = kids[0] if kids else shells[0]
    if has_embed_child(target_node):
        print("    ba-slider: already has an embed, skipping")
        return
    make_embed(target_node["id"], SLIDER_CODE, "ba-slider")


# --------------------------------------------------------------------------- verify
def read_code(eid):
    return call("data_element_settings_tool", {"siteId": SITE, "pageId": PAGE,
                "actions": [{"label": "read", "get_settings": {
                    "type": "all_raw_settings",
                    "element_id": {"component": PAGE, "element": eid["element"]}}}]})


def verify():
    root = tree()
    found = []

    def walk(n, path):
        here = path + [",".join(n.get("styleNames") or []) or n.get("type", "?")]
        if n.get("type") == "HtmlEmbed":
            found.append((n["id"], " > ".join(p for p in here[-3:] if p)))
        for ch in n.get("children", []) or []:
            walk(ch, here)
    walk(root, [])
    print(f"  {len(found)} HtmlEmbed elements on the page")

    empties = []
    for eid, where in found:
        node = None
        for attempt in range(6):
            try:
                d = read_code(eid)
                res = d["actions"][0]["result"] if "actions" in d else d.get("result")
                if res is None:
                    raise KeyError(str(list(d.keys())))
                node = res[0] if isinstance(res, list) else res
                if node.get("data") is None:
                    raise KeyError("no data")
                break
            except Exception as e:
                print(f"      retry {attempt + 1}: {str(e)[:70]}")
                time.sleep(5 * (attempt + 1))
        if node is None:
            print(f"    {eid['element'][:12]}  READ-FAILED  {where[:52]}")
            continue
        _unused = ("data_element_settings_tool", {"siteId": SITE, "pageId": PAGE,
                 "actions": []})
        matches = (node.get("data") or {}).get("matches", [])
        code = next((m.get("value") or "" for m in matches if m.get("key") == "code"), "")
        n = len(code)
        kind = ("youtube" if "youtube.com" in code else
                "vimeo" if "player.vimeo" in code else
                "ghl-form" if "leadconnectorhq" in code else
                "faq" if "sfaq" in code else
                "marquee" if "smk__" in code else
                "slider" if "axon-ba2" in code else "?")
        print(f"    {eid['element'][:12]}  {'ok   ' if n else 'EMPTY'} {n:>6}B  {kind:<9} {where[:52]}")
        if not n:
            empties.append((eid, where))
        time.sleep(2.0)
    print(f"  {len(empties)} embed(s) empty")
    return empties


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "all"
    start = int(sys.argv[2]) if len(sys.argv) > 2 else 0
    steps = ["wipe", "structure", "embeds", "verify"] if cmd == "all" else [cmd]
    for s in steps:
        print(f"=== {s}")
        if s == "structure":
            structure(start)
        elif s == "embeds":
            only = set(sys.argv[2:]) or None
            embeds(only)
        else:
            {"wipe": wipe, "verify": verify}[s]()
