#!/usr/bin/env python3
"""Plan a static Webflow section to CMS conversion.

This reads source HTML, extracts repeated items from one section, and writes
reviewable CMS collection, import, and binding-plan artifacts. It does not call
Webflow or mutate the site.
"""

from __future__ import annotations

import argparse
import json
import re
from dataclasses import dataclass, field
from html.parser import HTMLParser
from pathlib import Path
from typing import Iterable


@dataclass
class Node:
    tag: str
    attrs: dict[str, str] = field(default_factory=dict)
    children: list["Node"] = field(default_factory=list)
    text_parts: list[str] = field(default_factory=list)
    parent: "Node | None" = None

    def classes(self) -> list[str]:
        return [c for c in self.attrs.get("class", "").split() if c]

    def text(self) -> str:
        parts = list(self.text_parts)
        for child in self.children:
            child_text = child.text()
            if child_text:
                parts.append(child_text)
        return normalize_space(" ".join(parts))


class TreeParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.root = Node("document")
        self.stack = [self.root]

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        node = Node(tag=tag.lower(), attrs={k: v or "" for k, v in attrs}, parent=self.stack[-1])
        self.stack[-1].children.append(node)
        if tag.lower() not in {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}:
            self.stack.append(node)

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        for i in range(len(self.stack) - 1, 0, -1):
            if self.stack[i].tag == tag:
                del self.stack[i:]
                return

    def handle_data(self, data: str) -> None:
        if data.strip():
            self.stack[-1].text_parts.append(data)


def normalize_space(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def slugify(value: str) -> str:
    value = value.lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-") or "section"


def parse_selector(selector: str) -> tuple[str | None, str | None, str | None]:
    selector = selector.strip()
    if selector.startswith("."):
        return None, selector[1:], None
    if selector.startswith("#"):
        return None, None, selector[1:]
    if "." in selector:
        tag, class_name = selector.split(".", 1)
        return tag.lower(), class_name, None
    return selector.lower(), None, None


def matches(node: Node, selector: str) -> bool:
    tag, class_name, node_id = parse_selector(selector)
    if tag and node.tag != tag:
        return False
    if class_name and class_name not in node.classes():
        return False
    if node_id and node.attrs.get("id") != node_id:
        return False
    return True


def walk(node: Node) -> Iterable[Node]:
    yield node
    for child in node.children:
        yield from walk(child)


def find_first(node: Node, selector: str) -> Node | None:
    return next((candidate for candidate in walk(node) if matches(candidate, selector)), None)


def find_all(node: Node, selector: str) -> list[Node]:
    return [candidate for candidate in walk(node) if matches(candidate, selector)]


def class_field_name(class_name: str, prefix: str) -> str:
    name = class_name
    if prefix and name.startswith(prefix + "_"):
        name = name[len(prefix) + 1 :]
    return slugify(name.replace("-", "_")).replace("-", "_")


def infer_prefix(item_selector: str) -> str:
    _, class_name, _ = parse_selector(item_selector)
    if not class_name:
        return ""
    return class_name.split("_", 1)[0]


def first_heading(item: Node) -> str:
    for heading in ["h1", "h2", "h3", "h4", "h5", "h6"]:
        node = find_first(item, heading)
        if node:
            return node.text()
    return ""


def extract_item(item: Node, index: int, prefix: str) -> dict:
    record: dict[str, object] = {"sort_order": index}

    if item.tag == "a" and item.attrs.get("href"):
        record["url"] = item.attrs["href"]
    else:
        link = find_first(item, "a")
        if link and link.attrs.get("href"):
            record["url"] = link.attrs["href"]

    image = find_first(item, "img")
    if image:
        record["image"] = image.attrs.get("src", "")
        record["image_alt"] = image.attrs.get("alt", "")

    heading = first_heading(item)
    if heading:
        record["name"] = heading

    seen_fields = set(record)
    ignored = {"row", "card", "item", "list", "preview", "preview_img", "arrow", "row_main"}
    for node in walk(item):
        for class_name in node.classes():
            if not prefix or not class_name.startswith(prefix + "_"):
                continue
            field_name = class_field_name(class_name, prefix)
            if field_name in ignored or field_name in seen_fields:
                continue
            value = node.text()
            if value:
                record[field_name] = value
                seen_fields.add(field_name)

    if "name" not in record:
        text = item.text()
        if text:
            record["name"] = text[:80]
    if record.get("title") == record.get("name"):
        del record["title"]

    meta = str(record.get("meta", ""))
    parts = [normalize_space(part) for part in re.split(r"[·|]", meta) if normalize_space(part)]
    if len(parts) >= 1 and "service" not in record:
        record["service"] = parts[0]
    if len(parts) >= 2 and "location" not in record:
        record["location"] = parts[1]
    if len(parts) >= 3 and "year" not in record:
        record["year"] = parts[2]

    return record


def field_type(name: str, values: list[object]) -> str:
    if name == "image":
        return "Image"
    if name.endswith("_alt"):
        return "PlainText"
    if name in {"url", "link", "href"}:
        return "Link"
    if name == "sort_order":
        return "Number"
    sample = " ".join(str(v) for v in values if v)
    if len(sample) > 180 and name not in {"name", "title", "meta"}:
        return "RichText"
    return "PlainText"


def make_collection_plan(collection: str, items: list[dict]) -> dict:
    field_names = sorted({key for item in items for key in item.keys()})
    preferred = ["name", "sort_order", "url", "image", "image_alt", "index", "title", "meta", "service", "location", "year"]
    ordered = [name for name in preferred if name in field_names]
    ordered.extend(name for name in field_names if name not in ordered)
    fields = []
    for name in ordered:
        values = [item.get(name, "") for item in items]
        fields.append({
            "name": name.replace("_", " ").title(),
            "slug": name,
            "type": field_type(name, values),
            "required": name == "name",
        })
    return {"collection": collection, "slug": slugify(collection), "fields": fields}


def make_binding_plan(section_selector: str, item_selector: str, collection: str, items: list[dict], prefix: str) -> dict:
    fields = {key for item in items for key in item.keys()}
    bindings = []
    if "url" in fields:
        bindings.append({"selector": item_selector, "property": "link", "field": "url"})
    if "image" in fields:
        bindings.append({"selector": f".{prefix}_thumb" if prefix else "img", "property": "image", "field": "image"})
    if "image_alt" in fields:
        bindings.append({"selector": f".{prefix}_thumb" if prefix else "img", "property": "alt", "field": "image_alt"})
    if "name" in fields:
        bindings.append({"selector": f".{prefix}_title" if prefix else "h3", "property": "text", "field": "name"})
    for candidate in ["index", "meta"]:
        if candidate in fields:
            bindings.append({"selector": f".{prefix}_{candidate}", "property": "text", "field": candidate})
    return {
        "sectionSelector": section_selector,
        "repeatedItemSelector": item_selector,
        "collection": collection,
        "cmsListPlacement": "Replace static repeated items with one CMS Collection List using the first item as the template.",
        "preserveAttributes": ["data-* animation hooks", "existing classes", "existing link block structure"],
        "bindings": bindings,
    }


def write_readme(path: Path, section_selector: str, item_selector: str, collection: str, item_count: int) -> None:
    path.write_text(
        "\n".join([
            f"# CMS Section Conversion - {collection}",
            "",
            f"- Section selector: `{section_selector}`",
            f"- Repeated item selector: `{item_selector}`",
            f"- Extracted items: `{item_count}`",
            "",
            "## Review Order",
            "1. Review `cms-collection-plan.json`.",
            "2. Review `cms-import.json` for content accuracy.",
            "3. Confirm the target Webflow site, page, section, collection name, and fields.",
            "4. Create/update the Webflow CMS collection.",
            "5. Import items.",
            "6. Replace the static repeated item block with a CMS Collection List.",
            "7. Bind fields using `cms-binding-plan.json`.",
            "8. Verify staging and run QA before deleting static fallbacks.",
            "",
            "## Version Control",
            "Follows the root-level version control rules in `SYSTEM_RULES.md`. Commit lightweight artifacts only.",
            "",
            "## Infrastructure",
            "- **Hosting**: Hostinger VPS",
            "- **OS**: Ubuntu 24.04 LTS",
            "",
        ]),
        encoding="utf-8",
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Plan static section to CMS conversion.")
    parser.add_argument("--html", required=True, help="Source HTML file.")
    parser.add_argument("--section-selector", required=True, help="Section selector, e.g. .section_projects.")
    parser.add_argument("--item-selector", required=True, help="Repeated item selector, e.g. .projects_row.")
    parser.add_argument("--collection", required=True, help="CMS collection name.")
    parser.add_argument("--slug", help="Output folder slug.")
    parser.add_argument("--out-dir", default="workflows/07-webflow-build/.tmp/cms-section-conversion", help="Artifact output root.")
    args = parser.parse_args()

    source = Path(args.html)
    html = source.read_text(encoding="utf-8")
    tree = TreeParser()
    tree.feed(html)

    section = find_first(tree.root, args.section_selector)
    if not section:
        raise SystemExit(f"Section not found: {args.section_selector}")

    repeated = find_all(section, args.item_selector)
    if not repeated:
        raise SystemExit(f"No repeated items found: {args.item_selector}")

    prefix = infer_prefix(args.item_selector)
    items = [extract_item(item, i + 1, prefix) for i, item in enumerate(repeated)]
    collection_plan = make_collection_plan(args.collection, items)
    binding_plan = make_binding_plan(args.section_selector, args.item_selector, args.collection, items, prefix)

    out_dir = Path(args.out_dir) / (args.slug or slugify(args.collection))
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "cms-collection-plan.json").write_text(json.dumps(collection_plan, indent=2), encoding="utf-8")
    (out_dir / "cms-import.json").write_text(json.dumps({"collection": args.collection, "items": items}, indent=2), encoding="utf-8")
    (out_dir / "cms-binding-plan.json").write_text(json.dumps(binding_plan, indent=2), encoding="utf-8")
    write_readme(out_dir / "README.md", args.section_selector, args.item_selector, args.collection, len(items))

    print(f"Wrote CMS conversion plan for {len(items)} items to {out_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
