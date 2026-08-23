"""Flatten a Webflow get_all_elements dump into a list of editable text nodes.

Usage: python extract_text_nodes.py <dump.txt> <page_slug> [out.json]

Emits one record per String node with the parent element (the thing set_text
targets), the parent's style names, and the ancestor style chain -- the chain is
what reveals duplicated desktop/mobile subtrees.
"""
import json
import sys


def load(path):
    raw = open(path, encoding="utf-8").read()
    doc = json.loads(raw)
    return doc["result"][0]["data"]


def walk(node, chain, out):
    """chain: list of (type, styleNames, element_id) from Body down to node's parent."""
    ntype = node.get("type")
    if ntype == "String":
        parent = chain[-1] if chain else None
        out.append(
            {
                "text": node.get("textContent", ""),
                "string_id": node["id"]["element"],
                "parent_id": parent[2] if parent else None,
                "parent_type": parent[0] if parent else None,
                "parent_styles": parent[1] if parent else [],
                "ancestor_styles": [s for (_t, styles, _e) in chain for s in styles],
                "in_component": any(t == "ComponentInstance" for (t, _s, _e) in chain),
                "visible": node.get("settings", {}).get("visibility", True),
            }
        )
        return
    child_chain = chain + [
        (ntype, node.get("styleNames", []), node["id"]["element"])
    ]
    for child in node.get("children", []) or []:
        walk(child, child_chain, out)


def main():
    dump_path, slug = sys.argv[1], sys.argv[2]
    out_path = sys.argv[3] if len(sys.argv) > 3 else None

    root = load(dump_path)
    nodes = []
    walk(root, [], nodes)
    for n in nodes:
        n["page"] = slug

    # flag likely mobile-variant subtrees
    for n in nodes:
        n["mobile_variant"] = any(
            "mobile" in s.lower() for s in n["ancestor_styles"]
        )

    if out_path:
        with open(out_path, "w", encoding="utf-8") as fh:
            json.dump(nodes, fh, ensure_ascii=False, indent=1)

    texts = {}
    for n in nodes:
        texts.setdefault(n["text"].strip(), []).append(n)
    dupes = {t: v for t, v in texts.items() if len(v) > 1 and len(t) > 40}

    print(f"{slug}: {len(nodes)} text nodes, {len(dupes)} duplicated long strings")
    for t, v in dupes.items():
        tags = ",".join("mobile" if x["mobile_variant"] else "desktop" for x in v)
        print(f"  x{len(v)} [{tags}] {t[:90]}")


if __name__ == "__main__":
    main()
