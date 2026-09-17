# -*- coding: utf-8 -*-
"""Final pass: slider embed into existing shell + gallery + office sections."""
import json, sys, time
sys.path.insert(0, ".")
import content as C
from build import call
from fix_landing_2 import NEW_CSS, gallery_section, office_section, SLIDER_CODE
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

PAGE = C.PAGE_LANDING


def get_children():
    for attempt in range(3):
        try:
            d = call("data_element_tool", {"siteId": C.SITE, "pageId": PAGE,
                "actions": [{"label": "tree", "get_all_elements": {"depth": -1}}]})
            res = d["actions"][0]["result"] if "actions" in d else d["result"]
            node = res[0] if isinstance(res, list) else res
            return node.get("data", node).get("children", [])
        except Exception as e:
            print("  tree retry:", str(e)[:90])
            time.sleep(3)
    raise RuntimeError("tree failed")


def find_section(inner_style):
    children = get_children()
    for ch in children:
        sigs = set()
        def walk(e):
            for c in (e.get("styleNames") or []):
                sigs.add(c)
            for c in e.get("children", []):
                walk(c)
        walk(ch)
        if inner_style in sigs:
            return ch["id"]
    return None


def insert(html, css, anchor_id, position):
    action = {"build_label": "section", "parent_element_id": anchor_id,
              "creation_position": position, "html": html.strip()}
    if css:
        action["css"] = css
    d = call("data_whtml_builder", {"siteId": C.SITE, "pageId": PAGE,
        "context": "Restoring Livewell-equivalent sections to the Stone All-on-X landing page",
        "actions": [action]})
    res = d["actions"] if "actions" in d else [d]
    rr = res[0][0] if isinstance(res[0], list) else res[0]
    print("   insert:", rr.get("status"))
    if rr.get("status") != "success":
        print("    ", json.dumps(rr)[:400])
        return None
    return rr["data"]["id"]["element"]


def add_embed(parent_id, code):
    d = call("data_element_builder", {"siteId": C.SITE, "pageId": PAGE,
        "context": "Adding the before-after comparison slider embed to the landing page",
        "actions": [{"build_label": "ba-slider", "parent_element_id": parent_id,
                     "creation_position": "append", "element_schema": {"type": "HtmlEmbed"}}]})
    res = d["actions"] if "actions" in d else [d]
    rr = res[0][0] if isinstance(res[0], list) else res[0]
    embed_id = rr["data"]["id"]["element"]
    print("   slider embed:", rr.get("status"))
    d2 = call("data_element_settings_tool", {"siteId": C.SITE, "pageId": PAGE,
        "actions": [{
            "label": "set-code",
            "set_settings": {
                "operations": [{
                    "element_id": {"component": PAGE, "element": embed_id},
                    "settings": [{"key": "code", "static_text": {"value": code}}]
                }]
            }
        }]})
    res2 = d2["actions"][0] if "actions" in d2 else d2
    rr2 = res2[0] if isinstance(res2, list) else res2
    print("   slider code:", rr2.get("status"))


if __name__ == "__main__":
    # 1. slider embed into the shell's unnamed Block (section 3, index 3)
    children = get_children()
    shell = children[3]
    slot = None
    for c in shell.get("children", []):
        for cc in c.get("children", []):
            if not cc.get("styleNames"):
                slot = cc["id"]
    assert slot, "shell slot block not found"
    sigs = set()
    def walk(e):
        for c in (e.get("styleNames") or []):
            sigs.add(c)
        for c in e.get("children", []):
            walk(c)
    walk(shell)
    if "axon-ba2" not in sigs:
        print("1. slider embed into", slot["element"][:12])
        add_embed(slot, SLIDER_CODE)
    else:
        print("1. slider already embedded, skipping")

    # 2. gallery after process
    print("2. gallery section")
    process = find_section("axon-steps_grid")
    assert process, "process not found"
    g = insert(gallery_section, NEW_CSS, process, "after")
    assert g, "gallery insert failed"

    # 3. office after gallery
    print("3. office section")
    time.sleep(2)
    gallery_sec = find_section("axon-gallery-grid")
    assert gallery_sec, "gallery section not found after insert"
    o = insert(office_section, None, gallery_sec, "after")
    assert o, "office insert failed"
    print("all done")
