import json, os, re
HERE = os.path.dirname(os.path.abspath(__file__))
HOME = os.path.join(HERE, "..", "home")
T = json.load(open(os.path.join(HERE, "..", "..", ".tmp", "bugherd", "tasks.json"), encoding="utf-8"))
def page(u):
    p = u.strip("/") or "index"
    return os.path.join(HOME, "index.html") if p == "index" else os.path.join(HOME, p, "index.html")
for t in T:
    if t["status"] in ("done", "closed") or t["local_task_id"] < 188: continue
    html = str((t.get("selector_info") or {}).get("html") or "")
    d = re.sub(r"\s+", " ", t["description"])
    m = re.search(r'/uploads/[^"]*?-([a-z0-9-]+?)-(?:\d+)\.webp"', html)
    loc = ""
    if m or "ar-veil" in html:
        s = open(page(t["url"]), encoding="utf-8").read()
        if "ar-veil" in html:
            loc = "HERO " + re.search(r'uploads/([a-z0-9-]+?)-\d+\.webp', s[s.index('id="arrival"'):]).group(1)
        else:
            key = m.group(1)
            secs = []
            for mm in re.finditer(r'uploads/' + re.escape(key) + r'-\d+\.webp"', s):
                a = s.rfind('<section class="ch', 0, mm.start())
                secs.append(re.search(r'id="([^"]+)"', s[a:a+300]).group(1))
            loc = f"{key} in {sorted(set(secs))}"
    print(f"#{t['local_task_id']} {t['url']} | {loc} | {d[:90]}")
