# -*- coding: utf-8 -*-
"""Rebuild: wipe page bodies and re-insert all sections with corrected copy."""
import json, sys
sys.path.insert(0, ".")
import content as C
from build import call, get_body_element, build_page
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

PAGES = {
    "landing": (C.PAGE_LANDING, C.LANDING),
    "consult": (C.PAGE_CONSULT, C.CONSULT),
    "thankyou": (C.PAGE_THANKYOU, C.THANKYOU),
}

def wipe(page_id):
    body = get_body_element(page_id)
    d = call("data_element_tool", {
        "siteId": C.SITE, "pageId": page_id,
        "actions": [{"label": "tree", "get_all_elements": {"depth": 1}}],
    })
    res = d["actions"][0]["result"] if "actions" in d else d["result"]
    node = res[0] if isinstance(res, list) else res
    data = node.get("data", node)
    children = data.get("children", [])
    if not children:
        print(f"  page {page_id}: already empty")
        return
    actions = []
    for ch in children:
        eid = ch["id"]["element"]
        actions.append({"label": f"rm-{eid[:8]}", "remove_element": {"id": {"component": page_id, "element": eid}}})
    for i in range(0, len(actions), 5):
        d2 = call("data_element_tool", {"siteId": C.SITE, "pageId": page_id, "actions": actions[i:i+5]})
        res2 = d2["actions"] if "actions" in d2 else [d2]
        for r in res2:
            rr = r[0] if isinstance(r, list) else r
            print("    rm:", rr.get("status"))
    print(f"  removed {len(actions)} elements")

if __name__ == "__main__":
    which = sys.argv[1] if len(sys.argv) > 1 else "all"
    targets = PAGES if which == "all" else {which: PAGES[which]}
    for name, (pid, secs) in targets.items():
        print(f"=== {name}: wipe")
        wipe(pid)
        print(f"=== {name}: rebuild ({len(secs)} sections)")
        build_page(pid, secs)
