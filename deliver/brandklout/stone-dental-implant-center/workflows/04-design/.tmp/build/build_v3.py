# -*- coding: utf-8 -*-
"""
Apply the three post-review fixes. Surgical: nothing outside the named blocks is touched.

  python3 build_v3.py faq       landing: swap the FAQ embed for real, editable elements
  python3 build_v3.py consult   consult: append the missing closing CTA / proof section
  python3 build_v3.py thankyou  thank-you: replace "what happens next" and the FAQ
  python3 build_v3.py all
"""
import json, sys, time
sys.path.insert(0, ".")
import content as C
import content_v2 as V
import content_v3 as W
from build import call
from build_v2 import tree, make_embed

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
SITE = C.SITE


def page_tree(page_id, depth=-1, retries=6):
    last = None
    for attempt in range(retries):
        try:
            d = call("data_element_tool", {"siteId": SITE, "pageId": page_id,
                     "actions": [{"label": "tree", "get_all_elements": {"depth": depth}}]})
            res = d["actions"][0]["result"] if "actions" in d else d.get("result")
            if res is None:
                raise KeyError(str(list(d.keys())))
            node = res[0] if isinstance(res, list) else res
            return node.get("data", node)
        except Exception as e:
            last = e
            w = 5 * (attempt + 1)
            print(f"   tree retry {attempt+1}/{retries} in {w}s: {str(e)[:80]}")
            time.sleep(w)
    raise RuntimeError(f"tree failed: {last}")


def index_styles(root):
    idx = {}

    def walk(n):
        for sn in (n.get("styleNames") or []):
            idx.setdefault(sn, []).append(n)
        for ch in n.get("children", []) or []:
            walk(ch)
    walk(root)
    return idx


def text_of(node):
    out = []

    def walk(n):
        if n.get("type") == "String":
            out.append(n.get("textContent") or "")
        for ch in n.get("children", []) or []:
            walk(ch)
    walk(node)
    return " ".join(" ".join(out).split())


def insert(page_id, html, css, anchor_id, position, label, context):
    action = {"build_label": label, "parent_element_id": anchor_id,
              "creation_position": position, "html": html.strip()}
    if css:
        action["css"] = css
    d = call("data_whtml_builder", {"siteId": SITE, "pageId": page_id,
             "context": context, "actions": [action]})
    res = d["actions"] if "actions" in d else [d]
    rr = res[0][0] if isinstance(res[0], list) else res[0]
    st = rr.get("status")
    print(f"    insert {label}: {st}")
    if st not in ("success", "partial_success"):
        print("      ", json.dumps(rr)[:500])
        return None
    for w in (rr.get("data") or {}).get("warnings", []) or []:
        print("      warn:", w.get("code"), "-", (w.get("message") or "")[:100])
    return rr["data"]["id"]


def remove(page_id, element_id, label):
    d = call("data_element_tool", {"siteId": SITE, "pageId": page_id,
             "actions": [{"label": f"rm-{label}", "remove_element": {
                 "id": {"component": page_id, "element": element_id}}}]})
    print(f"    remove {label}: ok")
    return d


# --------------------------------------------------------------------------- 1. landing FAQ
def fix_faq(page_id=None, items=None, mount_style="axon-faq_slot", tag="landing"):
    """Replace the FAQ HtmlEmbed with real elements + a copy-free behaviour embed."""
    page_id = page_id or C.PAGE_LANDING
    items = items or W.LANDING_FAQ
    idx = index_styles(page_tree(page_id))
    slots = idx.get(mount_style, [])
    if not slots:
        print(f"  {mount_style} not found on {tag}")
        return
    slot = slots[0]

    # drop whatever is inside the slot (the old embed)
    for ch in list(slot.get("children", []) or []):
        remove(page_id, ch["id"]["element"], f"{tag}-old-faq-child")
        time.sleep(1)

    print(f"  {tag}: inserting {len(items)} real FAQ items")
    insert(page_id, W.faq_html(items), W.CSS_V3, slot["id"], "append",
           f"{tag}-faq-elements",
           "Rebuilding the FAQ as real, editable Webflow elements instead of an HTML embed")
    time.sleep(2)

    # behaviour-only embed (no copy inside), appended after the list
    idx2 = index_styles(page_tree(page_id))
    lists = idx2.get("axon-fq_list", [])
    if not lists:
        print("  axon-fq_list not found, cannot attach behaviour")
        return
    parent = idx2[mount_style][0]
    make_embed_on(page_id, parent["id"], W.FAQ_BEHAVIOUR, f"{tag}-faq-behaviour")


def make_embed_on(page_id, parent_id, code, label):
    d = call("data_element_builder", {"siteId": SITE, "pageId": page_id,
             "context": "Adding a behaviour-only embed (open/close script for the editable FAQ). It contains no copy.",
             "actions": [{"build_label": label, "parent_element_id": parent_id,
                          "creation_position": "append",
                          "element_schema": {"type": "HtmlEmbed"}}]})
    res = d["actions"] if "actions" in d else [d]
    rr = res[0][0] if isinstance(res[0], list) else res[0]
    if rr.get("status") != "success":
        print("      embed create FAILED:", json.dumps(rr)[:300])
        return None
    eid = rr["data"]["id"]["element"]
    d2 = call("data_element_settings_tool", {"siteId": SITE, "pageId": page_id,
              "actions": [{"label": f"code-{label}", "set_settings": {"operations": [{
                  "element_id": {"component": page_id, "element": eid},
                  "settings": [{"key": "code", "static_text": {"value": code}}]}]}}]})
    ok = '"success"' in json.dumps(d2)
    print(f"    {label}: embed {eid[:10]} code={'ok' if ok else 'CHECK'}")
    return eid


# --------------------------------------------------------------------------- 2. consult CTA
def fix_consult():
    page_id = C.PAGE_CONSULT
    root = page_tree(page_id)
    idx = index_styles(root)
    if idx.get("axon-qz_proof"):
        print("  consult CTA already present, skipping")
        return
    kids = root.get("children", []) or []
    footer = None
    for ch in kids:
        if "axon-footer" in (ch.get("styleNames") or []):
            footer = ch
    if not footer:
        print("  footer not found; appending to body instead")
        insert(page_id, W.S_CONSULT_CTA, W.CSS_V3, root["id"], "append",
               "consult-cta", "Adding the closing CTA section the consultation page was missing")
        return
    insert(page_id, W.S_CONSULT_CTA, W.CSS_V3, footer["id"], "before",
           "consult-cta",
           "Adding the closing CTA / proof section the consultation page was missing, cloned from the Arvada reference")


# --------------------------------------------------------------------------- 3. thank-you
def fix_thankyou():
    page_id = C.PAGE_THANKYOU
    root = page_tree(page_id)
    kids = root.get("children", []) or []
    print(f"  thank-you has {len(kids)} top-level blocks:")
    for i, ch in enumerate(kids):
        print(f"    [{i}] {','.join(ch.get('styleNames') or []) or ch.get('type')}  :: {text_of(ch)[:70]}")

    expect_i = faq_i = None
    for i, ch in enumerate(kids):
        t = text_of(ch)
        if "What to Expect" in t or "what happens next" in t.lower():
            expect_i = i
        if "Common Questions" in t or "Any Questions" in t:
            faq_i = i
    if expect_i is None or faq_i is None:
        print(f"  could not locate sections (expect={expect_i}, faq={faq_i}); aborting")
        return
    print(f"  replacing block {expect_i} (what happens next) and {faq_i} (FAQ)")

    # expect: insert new after the old, then remove the old
    new_expect = insert(page_id, W.S_TY_EXPECT, W.CSS_V3, kids[expect_i]["id"], "after",
                        "ty-expect",
                        "Replacing the thank-you page 'what happens next' section with the Arvada structure and Stone's own content")
    if not new_expect:
        return
    time.sleep(1.5)
    remove(page_id, kids[expect_i]["id"]["element"], "old-expect")
    time.sleep(2)

    # faq: same dance, re-reading the tree because indices shifted
    root2 = page_tree(page_id)
    kids2 = root2.get("children", []) or []
    old_faq = None
    for ch in kids2:
        t = text_of(ch)
        if "Common Questions" in t:
            old_faq = ch
    if not old_faq:
        print("  old FAQ block not found on re-read; aborting FAQ swap")
        return
    new_faq = insert(page_id, W.S_TY_FAQ, W.CSS_V3, old_faq["id"], "after", "ty-faq",
                     "Replacing the thank-you page FAQ with an editable accordion carrying Stone's own questions")
    if not new_faq:
        return
    time.sleep(1.5)
    remove(page_id, old_faq["id"]["element"], "old-faq")
    time.sleep(2)

    # now mount the editable FAQ items into the new section
    fix_faq(page_id=page_id, items=W.TY_FAQ, mount_style="axon-fq_slotmount", tag="thankyou")


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "all"
    steps = ["faq", "consult", "thankyou"] if cmd == "all" else [cmd]
    for s in steps:
        print(f"=== {s}")
        {"faq": fix_faq, "consult": fix_consult, "thankyou": fix_thankyou}[s]()
