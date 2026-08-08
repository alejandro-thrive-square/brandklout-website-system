"""Serialize the paste_01 XscpData payload back to per-section HTML for the
Webflow MCP data_whtml_builder (headless "API paste").

Why from the PAYLOAD and not the source: the site already holds the styles the
manual clipboard paste created, and Webflow matches styles by NAME. The payload
records the post-conversion class STACKS (e.g. a button is
[imp-a-2, imp-btn, imp-btn-gold], not the source's [imp-btn, imp-btn-gold]),
so serializing the payload reproduces stacks that resolve to the existing
combos instead of minting new/forked styles.

HtmlEmbed nodes cannot ride WHTML (their v holds <style>/<script>), so each
becomes a `<div data-embed-slot="N">` placeholder; embeds.json records the code,
classes and script flag needed to swap real HtmlEmbeds in afterwards.

Output: .tmp/page-implants/whtml/section_NN_<name>.html + embeds.json
Regenerate with:  python .tmp/payload_to_whtml.py
"""
import io, json, os, re, html as H

here = os.path.dirname(os.path.abspath(__file__))
folder = os.path.join(here, "page-implants")
outdir = os.path.join(folder, "whtml")
os.makedirs(outdir, exist_ok=True)

raw = io.open(os.path.join(folder, "paste_01_page_implants.html"), encoding="utf-8").read()
d = json.loads(re.search(r'<script type="application/json"[^>]*>(.*?)</script>', raw, re.S).group(1))
nodes = {n["_id"]: n for n in d["payload"]["nodes"]}
styles = {s["_id"]: s["name"] for s in d["payload"]["styles"]}

children_of = {c for n in d["payload"]["nodes"] for c in n.get("children", [])}
roots = [n for n in d["payload"]["nodes"] if n["_id"] not in children_of]
assert len(roots) == 1, roots
root = roots[0]

VOID = {"img", "br", "hr", "input", "source"}
embeds = []


def ser(nid):
    n = nodes[nid]
    if n.get("text"):
        return H.escape(n["v"], quote=False)
    if n.get("type") == "HtmlEmbed":
        slot = len(embeds)
        embeds.append({
            "slot": slot,
            "classes": [styles[c] for c in n.get("classes", [])],
            "script": bool(n.get("data", {}).get("embed", {}).get("meta", {}).get("script")),
            "v": n["v"],
        })
        return '<div data-embed-slot="%d"></div>' % slot
    tag = n["tag"]
    a = []
    cls = [styles[c] for c in n.get("classes", [])]
    if cls:
        a.append('class="%s"' % " ".join(cls))
    attr = n.get("data", {}).get("attr", {}) or {}
    if attr.get("id"):
        a.append('id="%s"' % attr["id"])
    if n.get("type") == "Image":
        a.append('src="%s"' % H.escape(attr.get("src", ""), quote=True))
        a.append('alt="%s"' % H.escape(attr.get("alt", ""), quote=True))
        if attr.get("loading") and attr["loading"] != "eager":
            a.append('loading="%s"' % attr["loading"])
    if n.get("type") == "Link":
        link = n.get("data", {}).get("link", {})
        if link.get("url"):
            a.append('href="%s"' % H.escape(link["url"], quote=True))
    for x in n.get("data", {}).get("xattr", []) or []:
        a.append('%s="%s"' % (x["name"], H.escape(x["value"], quote=True)))
    open_tag = "<%s%s>" % (tag, (" " + " ".join(a)) if a else "")
    if tag in VOID:
        return open_tag
    inner = "".join(ser(c) for c in n.get("children", []))
    return "%s%s</%s>" % (open_tag, inner, tag)


sections = []
for i, cid in enumerate(root["children"], 1):
    n = nodes[cid]
    name = (styles[n["classes"][0]] if n.get("classes") else n["tag"]).replace("imp-", "")
    fn = "section_%02d_%s.html" % (i, re.sub(r"[^\w-]", "", name))
    html_out = ser(cid)
    io.open(os.path.join(outdir, fn), "w", encoding="utf-8", newline="\n").write(html_out)
    sections.append({"file": fn, "root_class": " ".join(styles[c] for c in n.get("classes", [])),
                     "tag": n["tag"], "chars": len(html_out),
                     "slots": [int(m) for m in re.findall(r'data-embed-slot="(\d+)"', html_out)]})

json.dump({"root_class": " ".join(styles[c] for c in root.get("classes", [])),
           "sections": sections, "embeds": embeds},
          io.open(os.path.join(outdir, "embeds.json"), "w", encoding="utf-8"),
          indent=1, ensure_ascii=False)

print("root:", " ".join(styles[c] for c in root.get("classes", [])))
for s in sections:
    print("%-38s %6d chars  tag=%-7s slots=%s" % (s["file"], s["chars"], s["tag"], s["slots"]))
print(len(embeds), "embeds ->", [(e["slot"], e["classes"], "script" if e["script"] else "style/other") for e in embeds])
