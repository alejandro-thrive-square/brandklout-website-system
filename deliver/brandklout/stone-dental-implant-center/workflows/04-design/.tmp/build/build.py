# -*- coding: utf-8 -*-
"""Build runner: inserts content.py sections into Webflow pages via whtml builder."""
import json, os, subprocess, sys, time
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "..", "..", "..", ".."))
sys.path.insert(0, ".")
import content as C
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

MCP = ["python3", os.path.join(ROOT, ".tmp", "mcp-call.py")]

def call(tool, args):
    out = subprocess.run(MCP + ["call", tool, json.dumps(args)], capture_output=True, text=True, encoding="utf-8", cwd=ROOT).stdout
    if "status: 200" not in out:
        raise RuntimeError(f"{tool} failed: {out[:600]}")
    body = out.split("status: 200\n", 1)[1].strip()
    try:
        return json.loads(body)
    except json.JSONDecodeError:
        # multiple whitespace-separated JSON objects (one per result item)
        decoder = json.JSONDecoder()
        objs, idx = [], 0
        while idx < len(body):
            while idx < len(body) and body[idx] in " \n\r\t":
                idx += 1
            if idx >= len(body):
                break
            obj, end = decoder.raw_decode(body, idx)
            objs.append(obj)
            idx = end
        # merge label/action envelopes
        merged = {}
        for o in objs:
            if isinstance(o, dict):
                if "actions" in o:
                    merged.setdefault("actions", [])
                    if isinstance(o["actions"], list):
                        merged["actions"].extend(o["actions"])
                    else:
                        merged["actions"].append(o["actions"])
                else:
                    merged.update(o)
        if not merged:
            raise
        return merged

def get_body_element(page_id):
    d = call("data_element_tool", {
        "siteId": C.SITE, "pageId": page_id,
        "actions": [{"label": "root", "get_all_elements": {"depth": 1}}],
    })
    res = d["actions"][0]["result"] if "actions" in d else d["result"]
    node = res[0] if isinstance(res, list) else res
    data = node.get("data", node)
    body = data["id"] if data.get("type") == "Body" else None
    if not body:
        # walk children if present
        def find_body(n):
            if n.get("type") == "Body":
                return n["id"]
            for ch in n.get("children", []):
                r = find_body(ch)
                if r:
                    return r
            return None
        body = find_body(data)
    if not body:
        raise RuntimeError("no body found")
    return body

def build_page(page_id, sections, include_css=True, batch=1, dry=False):
    body = get_body_element(page_id)
    print(f"page {page_id}: body element {body['component']}/{body['element']}")
    actions = []
    for i, (label, html, css) in enumerate(sections):
        payload = {"build_label": f"{i:02d}-{label}", "parent_element_id": body,
                   "creation_position": "append", "html": html.strip()}
        css_full = C.CSS if (include_css and i == 0) else css
        if css_full:
            payload["css"] = css_full
        actions.append(payload)
    if dry:
        for a in actions:
            print("  would insert:", a["build_label"], f"({len(a['html'])}B html, {len(a.get('css',''))}B css)")
        return
    for i in range(0, len(actions), batch):
        chunk = actions[i:i+batch]
        print(f"  batch {i//batch+1}: {[a['build_label'] for a in chunk]}")
        d = call("data_whtml_builder", {
            "siteId": C.SITE, "pageId": page_id,
            "context": "Building the Stone Dental Implant Center All-on-X ad campaign page sections",
            "actions": chunk,
        })
        res = d["actions"] if "actions" in d else [d]
        flat = []
        for r in res:
            if isinstance(r, list):
                flat.extend(r)
            else:
                flat.append(r)
        for r in flat:
            if not isinstance(r, dict):
                print("    raw result:", json.dumps(r)[:300])
                continue
            status = r.get("status")
            data = r.get("data") or {}
            label = data.get("build_label", r.get("label", "?"))
            print(f"    {label}: {status}")
            if status != "success":
                print("      ", json.dumps(r)[:600])
            for w in data.get("warnings", []) or []:
                print("      warn:", w.get("code"), "-", w.get("message", "")[:100])
        time.sleep(1)

if __name__ == "__main__":
    which = sys.argv[1] if len(sys.argv) > 1 else "all"
    dry = "--dry" in sys.argv
    pages = {
        "landing": (C.PAGE_LANDING, C.LANDING),
        "consult": (C.PAGE_CONSULT, C.CONSULT),
        "thankyou": (C.PAGE_THANKYOU, C.THANKYOU),
    }
    if which == "all":
        for name, (pid, secs) in pages.items():
            print(f"=== {name} ({len(secs)} sections)")
            build_page(pid, secs, dry=dry)
    else:
        pid, secs = pages[which]
        print(f"=== {which} ({len(secs)} sections)")
        build_page(pid, secs, dry=dry)
