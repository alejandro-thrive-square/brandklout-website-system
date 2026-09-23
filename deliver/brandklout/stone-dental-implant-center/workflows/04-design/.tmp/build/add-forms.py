# -*- coding: utf-8 -*-
"""Re-insert GHL consultation form embeds into landing + consultation pages."""
import json, sys
sys.path.insert(0, ".")
import content as C
from build import call
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

FORM_IFRAME = (
    '<iframe title="Stone Dental Implant Center Consultation Request" '
    f'src="{C.GHL_FORM}" style="width:100%;height:560px;border:none;border-radius:8px" '
    'loading="lazy" scrolling="auto"></iframe>'
)

def find_embed(page_id):
    d = call("data_element_tool", {
        "siteId": C.SITE, "pageId": page_id,
        "actions": [{"label": "find", "query_elements": {"queries": [
            {"element_filter": {"style": "axon-form_embed"}, "children_depth": 0}]}}],
    })
    res = d["actions"][0]["result"] if "actions" in d else d["result"]
    node = res[0] if isinstance(res, list) else res

    def find_matches(o):
        if isinstance(o, dict):
            if "matches" in o and isinstance(o["matches"], list):
                return o["matches"]
            for v in o.values():
                r = find_matches(v)
                if r is not None:
                    return r
        elif isinstance(o, list):
            for v in o:
                r = find_matches(v)
                if r is not None:
                    return r
        return None

    ms = find_matches(node)
    return ms[0]["id"] if ms else None

def add_form(page_id):
    parent = find_embed(page_id)
    if not parent:
        print(f"page {page_id}: form_embed container NOT FOUND")
        return
    d = call("data_element_builder", {
        "siteId": C.SITE, "pageId": page_id,
        "context": "Adding the practice consultation form embed to the All-on-X ad page",
        "actions": [{"build_label": "ghl-form", "parent_element_id": parent,
                     "creation_position": "append", "element_schema": {"type": "HtmlEmbed"}}],
    })
    res = d["actions"] if "actions" in d else [d]
    rr = res[0][0] if isinstance(res[0], list) else res[0]
    embed_id = rr["data"]["id"]["element"]
    print(f"  embed created: {embed_id} ({rr.get('status')})")
    d2 = call("data_element_settings_tool", {
        "siteId": C.SITE, "pageId": page_id,
        "actions": [{
            "label": "set-code",
            "set_settings": {
                "operations": [{
                    "element_id": {"component": page_id, "element": embed_id},
                    "settings": [{"key": "code", "static_text": {"value": FORM_IFRAME}}]
                }]
            }
        }],
    })
    res2 = d2["actions"][0] if "actions" in d2 else d2
    print("  code set:", json.dumps(res2)[:160])

if __name__ == "__main__":
    for name, pid in [("landing", C.PAGE_LANDING), ("consult", C.PAGE_CONSULT)]:
        print(f"=== {name}")
        add_form(pid)
